// supabase/functions/notify-daily/index.ts
// Web Push com criptografia AES-GCM + VAPID ES256 — padrão RFC 8291 / RFC 8292

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VAPID_PUBLIC  = 'BOMZjUrFnkPqyKg6T2rHhXE8xTTNfR33jrgR7OmbNzD5aZSDE9zN2OjN7ELvhJYYsv0DQff7CUapkexxUxb2dPc'
const VAPID_PRIVATE = '6TB0NVCMWfrqetxRu_lneqjy4DisatDaoydUoG9iLHM'
const VAPID_SUBJECT = 'mailto:eduardospinolamkt@gmail.com'

// ── Utils base64url ──────────────────────────────────────────
function b64u(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromb64u(s: string): Uint8Array {
  const pad = '='.repeat((4 - s.length % 4) % 4)
  const std = (s + pad).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(std), c => c.charCodeAt(0))
}

// ── VAPID JWT ────────────────────────────────────────────────
async function vapidJwt(audience: string): Promise<string> {
  const enc = new TextEncoder()
  const header  = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const payload = b64u(enc.encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 43200,
    sub: VAPID_SUBJECT,
  })))

  // Importar chave privada VAPID como PKCS8
  const rawKey = fromb64u(VAPID_PRIVATE)
  // PKCS8 wrapper para P-256 private key (32 bytes)
  const pkcs8 = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00,
    0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07,
    0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20,
    ...rawKey
  ])

  const privateKey = await crypto.subtle.importKey(
    'pkcs8', pkcs8,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  )

  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(`${header}.${payload}`)
  )

  return `${header}.${payload}.${b64u(sig)}`
}

// ── HKDF helper ─────────────────────────────────────────────
async function hkdf(
  salt: Uint8Array,
  ikm: ArrayBuffer,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    key, length * 8
  )
  return new Uint8Array(bits)
}

// ── Criptografia Web Push (RFC 8291 / aes128gcm) ────────────
async function encryptPayload(
  p256dhB64: string,
  authB64: string,
  plaintext: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const enc = new TextEncoder()

  // Chave pública do cliente (uncompressed, 65 bytes)
  const clientPublicKeyBytes = fromb64u(p256dhB64)
  const authSecret           = fromb64u(authB64)

  // Importar chave pública do cliente
  const clientPublicKey = await crypto.subtle.importKey(
    'raw', clientPublicKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false, []
  )

  // Gerar par de chaves efêmero do servidor
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true, ['deriveBits']
  )

  // Exportar chave pública do servidor (65 bytes, uncompressed)
  const serverPublicKeyRaw  = await crypto.subtle.exportKey('raw', serverKeyPair.publicKey)
  const serverPublicKeyBytes = new Uint8Array(serverPublicKeyRaw)

  // ECDH shared secret
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPublicKey },
    serverKeyPair.privateKey, 256
  )

  // Salt aleatório (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // PRK via HKDF (auth secret)
  const prkInfoBytes = new Uint8Array([
    ...enc.encode('WebPush: info\x00'),
    ...clientPublicKeyBytes,
    ...serverPublicKeyBytes
  ])
  const prk = await hkdf(authSecret, sharedSecretBits, prkInfoBytes, 32)

  // Content encryption key (16 bytes)
  const cekInfo = enc.encode('Content-Encoding: aes128gcm\x00')
  const cek = await hkdf(salt, prk, cekInfo, 16)

  // Nonce (12 bytes)
  const nonceInfo = enc.encode('Content-Encoding: nonce\x00')
  const nonce = await hkdf(salt, prk, nonceInfo, 12)

  // Importar CEK para AES-GCM
  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])

  // Padding: adicionar delimitador \x02 ao plaintext
  const plaintextBytes = enc.encode(plaintext)
  const record = new Uint8Array(plaintextBytes.length + 1)
  record.set(plaintextBytes)
  record[plaintextBytes.length] = 0x02 // padding delimiter

  // Encriptar
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    aesKey, record
  )

  // Montar header aes128gcm (salt 16 + rs 4 + keylen 1 + key 65)
  const rs = 4096
  const headerBuf = new Uint8Array(21 + serverPublicKeyBytes.length)
  headerBuf.set(salt, 0)
  new DataView(headerBuf.buffer).setUint32(16, rs, false)
  headerBuf[20] = serverPublicKeyBytes.length
  headerBuf.set(serverPublicKeyBytes, 21)

  // Concatenar header + ciphertext
  const encryptedBytes = new Uint8Array(encrypted)
  const ciphertext = new Uint8Array(headerBuf.length + encryptedBytes.length)
  ciphertext.set(headerBuf)
  ciphertext.set(encryptedBytes, headerBuf.length)

  return { ciphertext, salt, serverPublicKey: serverPublicKeyBytes }
}

// ── Enviar push ──────────────────────────────────────────────
async function sendPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  notification: { title: string; body: string; url?: string; tag?: string }
): Promise<{ ok: boolean; status: number }> {
  const url      = new URL(sub.endpoint)
  const audience = `${url.protocol}//${url.host}`
  const jwt      = await vapidJwt(audience)

  // Serializar payload como JSON
  const payload = JSON.stringify({
    title: notification.title,
    body:  notification.body,
    icon:  '/icons/web-app-manifest-192x192.png',
    url:   notification.url ?? '/',
    tag:   notification.tag ?? 'slac-push',
  })

  // Criptografar
  const { ciphertext } = await encryptPayload(sub.p256dh, sub.auth, payload)

  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Authorization':     `vapid t=${jwt},k=${VAPID_PUBLIC}`,
      'Content-Encoding':  'aes128gcm',
      'Content-Type':      'application/octet-stream',
      'TTL':               '86400',
      'Urgency':           'normal',
    },
    body: ciphertext,
  })

  console.log(`Push ${sub.endpoint.slice(0, 50)}... → ${res.status}`)
  return { ok: res.ok || res.status === 201, status: res.status }
}

// ── Edge Function entry ──────────────────────────────────────
Deno.serve(async (_req) => {
  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const hoje    = new Date()
  hoje.setHours(0, 0, 0, 0)
  const hojeStr = hoje.toISOString().split('T')[0]

  const { data: subs, error: subErr } = await sb.from('push_subscriptions').select('*')
  if (subErr) return new Response(JSON.stringify({ error: subErr.message }), { status: 500 })
  if (!subs?.length) return new Response(JSON.stringify({ ok: true, enviados: 0, msg: 'Sem subscriptions' }))

  let enviados = 0
  const erros: string[] = []

  for (const sub of subs) {
    const userId = sub.user_id

    // Follow-ups pendentes
    const { data: fuLeads } = await sb
      .from('leads')
      .select('nome')
      .eq('user_id', userId)
      .not('etapa', 'in', '("fechado","perdido")')
      .lte('proximo_followup', hojeStr)
      .not('proximo_followup', 'is', null)
      .limit(5)

    // Pagamentos atrasados (3+ dias)
    const tresDiasAtras = new Date(hoje)
    tresDiasAtras.setDate(tresDiasAtras.getDate() - 3)
    const { data: pgtos } = await sb
      .from('financeiro')
      .select('val')
      .eq('user_id', userId)
      .eq('tipo', 'entrada')
      .eq('st', 'pendente')
      .lte('data', tresDiasAtras.toISOString().split('T')[0])
      .limit(5)

    const linhas: string[] = []
    if (fuLeads?.length) {
      linhas.push(`⏰ ${fuLeads.length} follow-up${fuLeads.length > 1 ? 's' : ''} pendente${fuLeads.length > 1 ? 's' : ''}`)
      fuLeads.slice(0, 3).forEach((l: { nome: string }) => linhas.push(`• ${l.nome}`))
    }
    if (pgtos?.length) {
      const total = pgtos.reduce((a: number, p: { val: number }) => a + Number(p.val), 0)
      linhas.push(`💰 R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a receber`)
    }
    if (!linhas.length) linhas.push('✅ Tudo em dia! Bom trabalho.')

    try {
      const result = await sendPush(sub, {
        title: 'SLAC · Sano Lab',
        body:  linhas.join('\n'),
        url:   '/crm',
        tag:   'slac-daily',
      })
      if (result.ok) {
        enviados++
      } else {
        erros.push(`status ${result.status} para ${sub.endpoint.slice(0, 40)}`)
        // Subscription expirada — limpar
        if (result.status === 410 || result.status === 404) {
          await sb.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    } catch (e) {
      erros.push(`erro: ${String(e)}`)
    }
  }

  return new Response(
    JSON.stringify({ ok: true, enviados, erros, total: subs.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
