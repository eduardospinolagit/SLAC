import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VAPID_PUBLIC  = 'BOMZjUrFnkPqyKg6T2rHhXE8xTTNfR33jrgR7OmbNzD5aZSDE9zN2OjN7ELvhJYYsv0DQff7CUapkexxUxb2dPc'
const VAPID_PRIVATE = '6TB0NVCMWfrqetxRu_lneqjy4DisatDaoydUoG9iLHM'
const VAPID_SUBJECT = 'mailto:eduardospinolamkt@gmail.com'

// ── Utilitários VAPID / Web Push ──────────────────────────────────────────────

function base64UrlDecode(str: string): Uint8Array {
  const padded = str + '==='.slice((str.length + 3) % 4)
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(base64)
  return Uint8Array.from(bin, c => c.charCodeAt(0))
}

function base64UrlEncode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function makeVapidToken(audience: string): Promise<string> {
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const now = Math.floor(Date.now() / 1000)
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({
    aud: audience, exp: now + 3600, sub: VAPID_SUBJECT
  })))

  const keyBytes = base64UrlDecode(VAPID_PRIVATE)
  const key = await crypto.subtle.importKey(
    'pkcs8',
    // Wrap raw EC key in PKCS8 structure for P-256
    (() => {
      const prefix = new Uint8Array([
        0x30,0x41,0x02,0x01,0x00,0x30,0x13,0x06,0x07,0x2a,0x86,0x48,0xce,0x3d,0x02,
        0x01,0x06,0x08,0x2a,0x86,0x48,0xce,0x3d,0x03,0x01,0x07,0x04,0x27,0x30,0x25,
        0x02,0x01,0x01,0x04,0x20
      ])
      const combined = new Uint8Array(prefix.length + keyBytes.length)
      combined.set(prefix); combined.set(keyBytes, prefix.length)
      return combined.buffer
    })(),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  )

  const data = new TextEncoder().encode(`${header}.${payload}`)
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, data)
  return `${header}.${payload}.${base64UrlEncode(sig)}`
}

async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: string): Promise<boolean> {
  const url = new URL(sub.endpoint)
  const audience = `${url.protocol}//${url.host}`
  const jwt = await makeVapidToken(audience)

  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'TTL': '86400',
      'Authorization': `vapid t=${jwt},k=${VAPID_PUBLIC}`,
      'Content-Encoding': 'aes128gcm',
    },
    body: new TextEncoder().encode(payload),
  })
  return res.ok || res.status === 201
}

// ── Handler principal ─────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // Aceita GET (cron) ou POST (manual)
  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const hojeStr = hoje.toISOString().split('T')[0]

  // Busca todas as subscriptions ativas
  const { data: subs } = await sb.from('push_subscriptions').select('*')
  if (!subs?.length) return new Response('Sem subscriptions', { status: 200 })

  let totalEnviados = 0

  for (const sub of subs) {
    const userId = sub.user_id

    // 1. Follow-ups vencidos
    const { data: fuLeads } = await sb
      .from('leads')
      .select('nome, proximo_followup, etapa')
      .eq('user_id', userId)
      .not('etapa', 'in', '("fechado","perdido")')
      .lte('proximo_followup', hojeStr)
      .not('proximo_followup', 'is', null)
      .limit(10)

    // 2. Pagamentos pendentes há mais de 3 dias
    const tresDiasAtras = new Date(hoje)
    tresDiasAtras.setDate(tresDiasAtras.getDate() - 3)
    const { data: pgtos } = await sb
      .from('financeiro')
      .select('descricao, val, data')
      .eq('user_id', userId)
      .eq('tipo', 'entrada')
      .eq('st', 'pendente')
      .lte('data', tresDiasAtras.toISOString().split('T')[0])
      .limit(5)

    // Monta mensagem
    const linhas: string[] = []

    if (fuLeads?.length) {
      linhas.push(`⏰ ${fuLeads.length} follow-up${fuLeads.length > 1 ? 's' : ''} pendente${fuLeads.length > 1 ? 's' : ''}`)
      fuLeads.slice(0, 3).forEach(l => linhas.push(`  • ${l.nome}`))
    }

    if (pgtos?.length) {
      const total = pgtos.reduce((a, p) => a + Number(p.val), 0)
      linhas.push(`💰 R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em pagamentos pendentes`)
    }

    if (!linhas.length) {
      linhas.push('✅ Tudo em dia! Bom trabalho.')
    }

    const body = JSON.stringify({
      title: 'SLAC — Sano Lab',
      body: linhas.join('\n'),
      icon: '/icons/web-app-manifest-192x192.png',
      badge: '/icons/web-app-manifest-192x192.png',
      url: '/',
      tag: 'slac-daily',
    })

    try {
      const ok = await sendPush(sub, body)
      if (ok) totalEnviados++
    } catch (e) {
      console.error('Erro ao enviar push para', sub.endpoint, e)
      // Remove subscription inválida
      await sb.from('push_subscriptions').delete().eq('id', sub.id)
    }
  }

  return new Response(JSON.stringify({ ok: true, enviados: totalEnviados }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
