import Anthropic from 'https://esm.sh/@anthropic-ai/sdk'

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  try {
    const { messages } = await req.json()
    if (!messages?.length) {
      return json({ error: 'messages obrigatório' }, 400)
    }

    const conversa = messages
      .map((m: { direcao: string; mensagem: string; data: string }) =>
        `[${m.direcao === 'enviado' ? 'Você' : 'Lead'}] ${m.mensagem}`
      )
      .join('\n')

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY })
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Você é um assistente de vendas da Sano Lab, empresa que cria sites para pequenas empresas.
Pacotes: Essencial R$797, Profissional R$1.097, Completo R$1.397.
Analise a conversa abaixo e retorne APENAS um JSON válido, sem markdown, com os campos:
- score (integer 0-100): probabilidade de fechar negócio
- resumo (string, máximo 2 frases): avaliação geral do lead
- positivos (array de strings, máximo 4 itens): sinais positivos na conversa
- atencao (array de strings, máximo 4 itens): pontos de atenção ou objeções
- geradoEm (string ISO 8601): data/hora atual

Considere score alto (>70) quando o lead demonstra interesse claro, pergunta sobre preços, ou tem necessidade óbvia.
Considere score baixo (<40) quando há objeções fortes, desinteresse ou sem resposta.

CONVERSA:
${conversa}`
      }]
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    const result = JSON.parse(text)
    return json(result)
  } catch (e) {
    console.error('[analyze-lead] erro:', e)
    return json({ error: 'Erro ao analisar' }, 500)
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
