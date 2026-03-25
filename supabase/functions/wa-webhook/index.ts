import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET')!
const SB_URL         = Deno.env.get('SUPABASE_URL')!
const SB_SERVICE     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function log(sb: ReturnType<typeof createClient>, level: string, message: string, data?: unknown) {
  try { await sb.from('logs').insert({ level, source: 'wa-webhook', message, data: data ?? null }) } catch {}
}

Deno.serve(async (req) => {
  const sb = createClient(SB_URL, SB_SERVICE)

  await log(sb, 'info', 'Webhook recebido', { method: req.method })

  try {
    const payload = await req.json()
    await log(sb, 'info', 'Payload recebido', payload)

    if (payload.fromMe) {
      await log(sb, 'info', 'Ignorado — fromMe=true', {})
      return new Response('ok', { status: 200 })
    }

    const rawPhone = String(payload.phone || '').replace(/\D/g, '')
    const telefone = rawPhone.startsWith('55') ? rawPhone.slice(2) : rawPhone
    const mensagem = payload.text?.message || payload.body || ''
    const waMessageId = payload.messageId || payload.id || null

    if (!telefone || !mensagem) {
      await log(sb, 'warn', 'Telefone ou mensagem vazia', { rawPhone, mensagem })
      return new Response('ok', { status: 200 })
    }

    // Busca pelos últimos 8 dígitos para tolerar variações (com/sem 9, com/sem 55)
    const ultimos8 = telefone.slice(-8)
    const { data: encontrados, error: errBusca } = await sb
      .from('leads')
      .select('id, user_id, telefone')
      .ilike('telefone', `%${ultimos8}`)
      .limit(1)

    await log(sb, 'info', 'Busca lead por telefone', {
      buscando: telefone,
      ultimos8,
      encontrados: encontrados?.map(l => l.telefone),
      erro: errBusca?.message || null,
    })

    if (!encontrados?.length) {
      await log(sb, 'warn', 'Telefone não encontrado em leads', { telefone, ultimos8 })
      return new Response('ok', { status: 200 })
    }

    const lead = encontrados[0]
    const { error } = await sb.from('conversas').insert({
      id: 'wa_in_' + Date.now() + '_' + Math.random().toString(36).slice(2),
      user_id: lead.user_id,
      lead_id: lead.id,
      canal: 'whatsapp',
      direcao: 'recebido',
      mensagem,
      wa_message_id: waMessageId,
      status: 'received',
      data: new Date().toISOString(),
    })

    if (error && !error.message?.includes('unique')) {
      await log(sb, 'error', 'Erro ao inserir conversa', { error })
    } else {
      await log(sb, 'info', 'Mensagem recebida salva', { lead_id: lead.id, telefone })
    }

    return new Response('ok', { status: 200 })
  } catch (e: any) {
    await log(sb, 'error', 'Exceção no webhook', { message: e?.message })
    return new Response('ok', { status: 200 })
  }
})
