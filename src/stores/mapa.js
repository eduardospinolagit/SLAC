import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sb } from '@/lib/supabase'
import { useAuthStore } from './auth'

const dadosDefault = [
  { id: 'identidade', ico: '🏷', title: 'Identidade & Marca', items: [
    { id: 'i1', title: 'Nome comercial', desc: 'Sano Lab', s: 'ok' },
    { id: 'i2', title: 'Logo', desc: 'Símbolo diamante verde PNG', s: 'ok' },
    { id: 'i3', title: 'Paleta de cores', desc: 'Preto #0a0a0a + Verde #22c55e', s: 'ok' },
    { id: 'i4', title: 'Tipografia', desc: 'Inter definida', s: 'ok' },
    { id: 'i5', title: 'Slogan', desc: 'Frase de posicionamento', s: 'nope' },
    { id: 'i6', title: 'Manual de marca', desc: 'Guia de identidade', s: 'future' },
  ]},
  { id: 'presenca', ico: '🌐', title: 'Presença Digital', items: [
    { id: 'p1', title: 'Landing page', desc: 'sanolab.vercel.app', s: 'ok' },
    { id: 'p2', title: 'Domínio próprio', desc: 'sanolab.com.br', s: 'nope' },
    { id: 'p3', title: 'WhatsApp Business', desc: 'Configurado', s: 'ok' },
    { id: 'p4', title: 'Instagram @sanolab', desc: 'Não criado', s: 'nope' },
    { id: 'p5', title: 'Google Meu Negócio', desc: 'Não criado', s: 'nope' },
    { id: 'p6', title: 'Email profissional', desc: 'contato@sanolab.com.br', s: 'nope' },
    { id: 'p7', title: 'Analytics', desc: 'Vercel Analytics ativo', s: 'ok' },
  ]},
  { id: 'portfolio', ico: '💼', title: 'Portfólio & Cases', items: [
    { id: 'pf1', title: 'Iron House Brusque', desc: 'Case fictício no portfólio', s: 'ok' },
    { id: 'pf2', title: 'Iron House Canaã', desc: 'Prévia enviada — aguardando fechamento', s: 'doing' },
    { id: 'pf3', title: 'Iron House Diego', desc: 'Prévia enviada — aguardando resposta', s: 'doing' },
    { id: 'pf4', title: 'Case salão de beleza', desc: 'Não criado', s: 'nope' },
    { id: 'pf5', title: 'Case pet shop', desc: 'Não criado', s: 'nope' },
    { id: 'pf6', title: 'Depoimentos reais', desc: 'Aguardando primeiros clientes', s: 'nope' },
  ]},
  { id: 'prospeccao', ico: '📱', title: 'Prospecção & Vendas', items: [
    { id: 'pr1', title: 'Lista de leads', desc: 'Google Maps via Apify', s: 'ok' },
    { id: 'pr2', title: 'Script Matador 7 fases', desc: 'Completo', s: 'ok' },
    { id: 'pr3', title: 'Mensagens personalizadas', desc: 'PDF gerado', s: 'ok' },
    { id: 'pr4', title: 'Planilha de controle', desc: 'Excel com funil', s: 'ok' },
    { id: 'pr5', title: 'Disparador WhatsApp', desc: 'Ferramenta semi-automática', s: 'ok' },
    { id: 'pr6', title: 'Rotina de prospecção', desc: 'Em execução', s: 'doing' },
    { id: 'pr7', title: 'Follow-up sistemático', desc: 'Não estruturado', s: 'nope' },
    { id: 'pr8', title: 'Script Instagram DM', desc: 'Não adaptado', s: 'nope' },
  ]},
  { id: 'servicos', ico: '⚙', title: 'Serviços & Entrega', items: [
    { id: 's1', title: 'Sites HTML', desc: 'Domina — entregou Iron House', s: 'ok' },
    { id: 's2', title: 'Template base', desc: 'Criado', s: 'ok' },
    { id: 's3', title: 'SEO on-page', desc: 'Meta tags, título, descrição', s: 'nope' },
    { id: 's4', title: 'Google Meu Negócio', desc: 'Aprendendo', s: 'doing' },
    { id: 's5', title: 'Automação WhatsApp', desc: 'n8n + Z-API — planejado', s: 'future' },
    { id: 's6', title: 'Gestão de tráfego', desc: 'Aprendendo', s: 'doing' },
    { id: 's7', title: 'Processo de entrega', desc: 'Onboarding → aprovação → entrega', s: 'nope' },
    { id: 's8', title: 'Contrato formal', desc: 'Não criado', s: 'nope' },
  ]},
  { id: 'financeiro', ico: '💰', title: 'Financeiro', items: [
    { id: 'f1', title: 'Pacote Essencial R$797', desc: 'Definido', s: 'ok' },
    { id: 'f2', title: 'Pacote Profissional R$1.097', desc: 'Definido', s: 'ok' },
    { id: 'f3', title: 'Pacote Completo R$1.397', desc: 'Definido', s: 'ok' },
    { id: 'f4', title: '50% entrada + 50% entrega', desc: 'Definido', s: 'ok' },
    { id: 'f5', title: 'Recibo/NF', desc: 'Não criado', s: 'nope' },
    { id: 'f6', title: 'Módulo financeiro', desc: 'Ativo com Supabase', s: 'ok' },
    { id: 'f7', title: 'PIX/conta bancária', desc: 'Para recebimentos', s: 'nope' },
    { id: 'f8', title: 'Meta R$2.000/mês', desc: 'Em progresso', s: 'doing' },
  ]},
  { id: 'operacional', ico: '🔧', title: 'Operacional', items: [
    { id: 'o1', title: 'Apify', desc: 'Extrator de leads', s: 'ok' },
    { id: 'o2', title: 'Vercel', desc: 'Hospedagem', s: 'ok' },
    { id: 'o3', title: 'GitHub', desc: 'Controle de versão', s: 'ok' },
    { id: 'o4', title: 'Claude Code', desc: 'Desenvolvimento', s: 'ok' },
    { id: 'o5', title: 'Supabase', desc: 'Banco de dados e auth', s: 'ok' },
    { id: 'o6', title: 'Framer', desc: 'Para demos rápidas', s: 'nope' },
    { id: 'o7', title: 'CRM de clientes', desc: 'Pos-venda', s: 'nope' },
  ]},
  { id: 'crescimento', ico: '📈', title: 'Crescimento & Futuro', items: [
    { id: 'c1', title: 'Agente WhatsApp IA', desc: 'n8n + Z-API', s: 'future' },
    { id: 'c2', title: 'Expansão nichos', desc: 'Restaurantes, clínicas', s: 'future' },
    { id: 'c3', title: 'Indicações', desc: 'Clientes indicando outros', s: 'future' },
    { id: 'c4', title: 'Equipe', desc: 'Outros devs para escalar', s: 'future' },
    { id: 'c5', title: 'LinkedIn', desc: 'Clientes maiores', s: 'future' },
  ]},
]

export const useMapaStore = defineStore('mapa', () => {
  const dados = ref(JSON.parse(JSON.stringify(dadosDefault)))

  function uid() {
    const auth = useAuthStore()
    if (!auth.user?.id) {
      console.error('[SLAC] uid() chamado sem usuário autenticado. auth.user =', auth.user)
      throw new Error('Usuário não autenticado')
    }
    return auth.user.id
  }

  async function load() {
    const { data, error } = await sb
      .from('configuracoes').select('*')
      .eq('user_id', uid()).eq('chave', 'mapa')
    if (error || !data?.length) { dados.value = JSON.parse(JSON.stringify(dadosDefault)); return }
    dados.value = data[0].valor
  }

  async function save() {
    const { error } = await sb.from('configuracoes').upsert({
      id: uid() + '_mapa',
      user_id: uid(),
      chave: 'mapa',
      valor: dados.value,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })
    if (error) throw error
  }

  async function changeStatus(catId, itemId, status) {
    const cat = dados.value.find(c => c.id === catId)
    if (!cat) return
    const item = cat.items.find(i => i.id === itemId)
    if (!item) return
    item.s = status
    await save()
  }

  async function removeItem(catId, itemId) {
    const cat = dados.value.find(c => c.id === catId)
    if (!cat) return
    cat.items = cat.items.filter(i => i.id !== itemId)
    await save()
  }

  async function addItem(catId, title, desc, status) {
    const cat = dados.value.find(c => c.id === catId)
    if (!cat) return
    cat.items.push({ id: 'u' + Date.now(), title, desc, s: status })
    await save()
  }

  const stats = computed(() => {
    let ok = 0, doing = 0, nope = 0, future = 0, total = 0
    dados.value.forEach(c => c.items.forEach(i => {
      total++
      if (i.s === 'ok') ok++
      else if (i.s === 'doing') doing++
      else if (i.s === 'nope') nope++
      else future++
    }))
    return { ok, doing, nope, future, total }
  })

  return { dados, load, save, changeStatus, removeItem, addItem, stats }
})
