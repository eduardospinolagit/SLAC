import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ZAPI_INSTANCE     = Deno.env.get('ZAPI_INSTANCE_ID')!
const ZAPI_TOKEN        = Deno.env.get('ZAPI_TOKEN')!
const ZAPI_CLIENT_TOKEN = Deno.env.get('ZAPI_CLIENT_TOKEN')!
const SB_URL            = Deno.env.get('SUPABASE_URL')!
const SB_SERVICE        = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function log(sb: ReturnType<typeof createClient>, level: string, message: string, data?: unknown) {
  try {
    await sb.from('logs').insert({ level, source: 'wa-send', message, data: data ?? null })
  } catch {}
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  const sb = createClient(SB_URL, SB_SERVICE)

  try {
    const body = await req.json()
    const { lead_id, user_id, telefone, mensagem, tipo = 'text', arquivo, arquivo_nome } = body

    await log(sb, 'info', 'wa-send chamado', { lead_id, user_id, tipo, telefone: String(telefone).slice(-4).padStart(String(telefone).length, '*') })

    if (!lead_id || !telefone || !user_id) {
      return json({ error: 'lead_id, user_id e telefone são obrigatórios' }, 400)
    }

    const tel = String(telefone).replace(/\D/g, '')
    const telZapi = tel.startsWith('55') ? tel : '55' + tel
    const base = `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}`

    let zapiUrl: string
    let zapiBody: Record<string, unknown>
    let savedMensagem: string

    if (tipo === 'image') {
      if (!arquivo) return json({ error: 'arquivo é obrigatório para imagem' }, 400)
      zapiUrl = `${base}/send-image`
      zapiBody = { phone: telZapi, image: arquivo, caption: mensagem || '' }
      savedMensagem = mensagem || '[Imagem]'
    } else if (tipo === 'document') {
      if (!arquivo) return json({ error: 'arquivo é obrigatório para documento' }, 400)
      zapiUrl = `${base}/send-document`
      zapiBody = { phone: telZapi, document: arquivo, fileName: arquivo_nome || 'arquivo', caption: mensagem || '' }
      savedMensagem = `[Documento: ${arquivo_nome || 'arquivo'}]`
    } else if (tipo === 'audio') {
      if (!arquivo) return json({ error: 'arquivo é obrigatório para áudio' }, 400)
      zapiUrl = `${base}/send-audio`
      zapiBody = { phone: telZapi, audio: arquivo, ptt: true }
      savedMensagem = '[Áudio]'
    } else {
      if (!mensagem) return json({ error: 'mensagem é obrigatória para texto' }, 400)
      zapiUrl = `${base}/send-text`
      zapiBody = { phone: telZapi, message: mensagem }
      savedMensagem = mensagem
    }

    await log(sb, 'info', 'Chamando Z-API', { tipo, url: zapiUrl.replace(ZAPI_TOKEN, '***'), phone: telZapi })

    const zapiRes = await fetch(zapiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Client-Token': ZAPI_CLIENT_TOKEN },
      body: JSON.stringify(zapiBody),
    })

    const zapiText = await zapiRes.text()
    let zapiData: any = null
    try { zapiData = JSON.parse(zapiText) } catch {}

    if (!zapiRes.ok) {
      await log(sb, 'error', 'Z-API retornou erro', { status: zapiRes.status, body: zapiText })
      return json({ error: 'Falha ao enviar pelo WhatsApp', detail: zapiText }, 502)
    }

    await log(sb, 'info', 'Z-API resposta OK', { status: zapiRes.status, body: zapiData })

    const waMessageId = zapiData?.zaapId || zapiData?.messageId || null

    const { error: dbError } = await sb.from('conversas').insert({
      id: 'wa_out_' + Date.now() + '_' + Math.random().toString(36).slice(2),
      user_id,
      lead_id,
      canal: 'whatsapp',
      direcao: 'enviado',
      mensagem: savedMensagem,
      wa_message_id: waMessageId,
      status: 'sent',
      data: new Date().toISOString(),
    })

    if (dbError) {
      await log(sb, 'error', 'Erro ao salvar conversa no DB', { error: dbError })
      return json({ error: 'Mensagem enviada mas falhou ao salvar' }, 500)
    }

    await log(sb, 'info', 'Conversa salva com sucesso', { wa_message_id: waMessageId })
    return json({ ok: true, wa_message_id: waMessageId })

  } catch (e: any) {
    await log(sb, 'error', 'Exceção não tratada em wa-send', { message: e?.message, stack: e?.stack })
    return json({ error: 'Erro interno: ' + (e?.message || String(e)) }, 500)
  }
})

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app',
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}
