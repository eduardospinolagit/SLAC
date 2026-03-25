import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ZAPI_INSTANCE = Deno.env.get('ZAPI_INSTANCE_ID')!
const ZAPI_TOKEN    = Deno.env.get('ZAPI_TOKEN')!
const SB_URL        = Deno.env.get('SUPABASE_URL')!
const SB_SERVICE    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  try {
    const { lead_id, user_id, telefone, mensagem } = await req.json()
    if (!lead_id || !telefone || !mensagem || !user_id) {
      return json({ error: 'lead_id, user_id, telefone e mensagem são obrigatórios' }, 400)
    }

    // Normaliza telefone: apenas dígitos, garante DDI 55
    const tel = String(telefone).replace(/\D/g, '')
    const telZapi = tel.startsWith('55') ? tel : '55' + tel

    // Envia pelo Z-API
    const zapiRes = await fetch(
      `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: telZapi, message: mensagem }),
      }
    )

    if (!zapiRes.ok) {
      const err = await zapiRes.text()
      console.error('[wa-send] Z-API erro:', err)
      return json({ error: 'Falha ao enviar pelo WhatsApp', detail: err }, 502)
    }

    const zapiData = await zapiRes.json()
    const waMessageId = zapiData?.zaapId || zapiData?.messageId || null

    // Persiste em conversas
    const sb = createClient(SB_URL, SB_SERVICE)
    const { error: dbError } = await sb.from('conversas').insert({
      id: 'wa_out_' + Date.now() + '_' + Math.random().toString(36).slice(2),
      user_id,
      lead_id,
      canal: 'whatsapp',
      direcao: 'enviado',
      mensagem,
      wa_message_id: waMessageId,
      status: 'sent',
      data: new Date().toISOString(),
    })

    if (dbError) {
      console.error('[wa-send] DB erro:', dbError)
      return json({ error: 'Mensagem enviada mas falhou ao salvar' }, 500)
    }

    return json({ ok: true, wa_message_id: waMessageId })
  } catch (e) {
    console.error('[wa-send] erro:', e)
    return json({ error: 'Erro interno' }, 500)
  }
})

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}
