import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET')!
const SB_URL         = Deno.env.get('SUPABASE_URL')!
const SB_SERVICE     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  // Valida segredo
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== WEBHOOK_SECRET) {
    console.warn('[wa-webhook] secret inválido')
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const payload = await req.json()

    // Ignora mensagens enviadas pelo próprio número
    if (payload.fromMe) {
      return new Response('ok', { status: 200 })
    }

    // Normaliza telefone: remove 55 do início, mantém só dígitos
    const rawPhone = String(payload.phone || '').replace(/\D/g, '')
    const telefone = rawPhone.startsWith('55') ? rawPhone.slice(2) : rawPhone
    const mensagem = payload.text?.message || payload.body || ''
    const waMessageId = payload.messageId || payload.id || null

    if (!telefone || !mensagem) {
      return new Response('ok', { status: 200 })
    }

    const sb = createClient(SB_URL, SB_SERVICE)

    // Busca lead pelo telefone (tenta com e sem 55)
    const { data: encontrados } = await sb
      .from('leads')
      .select('id, user_id')
      .or(`telefone.eq.${telefone},telefone.eq.55${telefone}`)
      .limit(1)

    if (!encontrados?.length) {
      console.log(`[wa-webhook] telefone não encontrado: ${telefone}`)
      return new Response('ok', { status: 200 })
    }

    const lead = encontrados[0]

    // Insere (UNIQUE constraint em wa_message_id previne duplicatas)
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
      console.error('[wa-webhook] erro ao inserir:', error)
    }

    return new Response('ok', { status: 200 })
  } catch (e) {
    console.error('[wa-webhook] erro:', e)
    return new Response('ok', { status: 200 }) // sempre 200 para Z-API não fazer retry
  }
})
