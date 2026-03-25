import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk'

const APIFY_TOKEN   = Deno.env.get('APIFY_TOKEN')!
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SB_URL        = Deno.env.get('SUPABASE_URL')!
const SB_SERVICE    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  try {
    const { user_id, instagram, negocio, cidade } = await req.json()
    if (!user_id || !negocio) {
      return json({ error: 'user_id e negocio são obrigatórios' }, 400)
    }

    // Busca script_base do usuário
    const sb = createClient(SB_URL, SB_SERVICE)
    const { data: configData } = await sb
      .from('configuracoes')
      .select('valor')
      .eq('user_id', user_id)
      .eq('chave', 'script_base')
      .maybeSingle()
    const scriptBase = configData?.valor?.texto || ''

    // Scraping paralelo: Instagram + Google Maps
    const [igResult, gmResult] = await Promise.allSettled([
      instagram ? buscarInstagram(instagram) : Promise.resolve(null),
      buscarGoogleMaps(negocio, cidade),
    ])

    const igInfo = igResult.status === 'fulfilled' ? igResult.value : null
    const gmInfo = gmResult.status === 'fulfilled' ? gmResult.value : null

    const contexto = montarContexto({ negocio, cidade, instagram, igInfo, gmInfo })

    // Gera script com Claude
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY })
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Você é um especialista em vendas de sites para pequenos negócios locais.

SCRIPT BASE (seu template de prospecção):
${scriptBase || '(sem script base configurado — crie uma abordagem natural e direta)'}

CONTEXTO DO LEAD:
${contexto}

Adapte o script base para este lead específico. Personalize com detalhes reais do negócio deles. Seja direto e natural. Máximo 3 parágrafos curtos. Texto puro, sem asteriscos ou formatação markdown.`
      }]
    })

    const script = msg.content[0].type === 'text' ? msg.content[0].text : ''
    return json({ script })
  } catch (e) {
    console.error('[gerar-script] erro:', e)
    return json({ error: 'Erro ao gerar script' }, 500)
  }
})

async function buscarInstagram(handle: string) {
  const username = handle.replace('@', '')
  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=20`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username] }),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const p = data?.[0]
    if (!p) return null
    return {
      seguidores: p.followersCount,
      bio: p.biography,
      posts: p.postsCount,
      temSite: !!p.externalUrl,
    }
  } catch { return null }
}

async function buscarGoogleMaps(negocio: string, cidade: string) {
  const query = `${negocio} ${cidade || ''}`.trim()
  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=25`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchStringsArray: [query],
          maxCrawledPlacesPerSearch: 1,
          language: 'pt',
        }),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const p = data?.[0]
    if (!p) return null
    return {
      avaliacao: p.totalScore,
      avaliacoes: p.reviewsCount,
      categoria: p.categoryName,
      temSite: !!p.website,
      descricao: p.description,
    }
  } catch { return null }
}

function montarContexto({ negocio, cidade, instagram, igInfo, gmInfo }: {
  negocio: string, cidade: string, instagram: string,
  igInfo: Record<string, unknown> | null,
  gmInfo: Record<string, unknown> | null,
}) {
  const linhas: (string | null)[] = [
    `Negócio: ${negocio}`,
    cidade ? `Cidade: ${cidade}` : null,
  ]
  if (igInfo) {
    linhas.push(`Instagram (@${instagram?.replace('@', '')}): ${igInfo.seguidores} seguidores, ${igInfo.posts} posts`)
    if (igInfo.bio)      linhas.push(`Bio: ${igInfo.bio}`)
    if (!igInfo.temSite) linhas.push('Ponto fraco: não tem site no Instagram')
  } else if (instagram) {
    linhas.push(`Instagram: @${instagram?.replace('@', '')} (dados não disponíveis)`)
  }
  if (gmInfo) {
    linhas.push(`Google Maps: ${gmInfo.avaliacao}⭐ (${gmInfo.avaliacoes} avaliações), categoria: ${gmInfo.categoria}`)
    if (!gmInfo.temSite) linhas.push('Ponto fraco: não tem site no Google Maps')
    if (gmInfo.descricao) linhas.push(`Descrição: ${String(gmInfo.descricao).slice(0, 150)}`)
  }
  return linhas.filter(Boolean).join('\n')
}

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
