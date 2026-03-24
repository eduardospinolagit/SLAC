import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sb } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useFinStore = defineStore('fin', () => {
  const fin = ref([])
  const pgto = ref({})
  const meta = ref({ val: 2000, desc: '2 clientes Profissional', semanal: 500 })

  const fmt = v => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // Pega o user dinamicamente — nunca fica null por timing
  function uid() {
    const auth = useAuthStore()
    if (!auth.user?.id) {
      console.error('[SLAC] uid() chamado sem usuário autenticado. auth.user =', auth.user)
      throw new Error('Usuário não autenticado')
    }
    return auth.user.id
  }

  async function load() {
    await Promise.all([loadFin(), loadPgto(), loadMeta()])
  }

  async function loadFin() {
    const { data, error } = await sb
      .from('financeiro').select('*')
      .eq('user_id', uid())
      .order('data', { ascending: false })
    if (error) { console.error(error); return }
    fin.value = (data || []).map(r => ({
      id: r.id, tipo: r.tipo, desc: r.descricao, cat: r.cat,
      val: r.val, data: r.data, st: r.st, rec: r.rec, cli: r.cli || '', obs: r.obs || ''
    }))
  }

  async function loadPgto() {
    const { data, error } = await sb.from('pagamentos').select('*').eq('user_id', uid())
    if (error) return
    pgto.value = {}
    ;(data || []).forEach(r => { pgto.value[r.chave] = { st: r.st, data: r.data, obs: r.obs || '' } })
  }

  async function loadMeta() {
    const { data, error } = await sb.from('configuracoes').select('*')
      .eq('user_id', uid()).eq('chave', 'meta').maybeSingle()
    if (error || !data) return
    meta.value = data.valor
  }

  async function upsert(tx) {
    const { error } = await sb.from('financeiro').upsert({
      id: tx.id, user_id: uid(), tipo: tx.tipo, descricao: tx.desc,
      cat: tx.cat, val: tx.val, data: tx.data, st: tx.st, rec: tx.rec, cli: tx.cli, obs: tx.obs
    }, { onConflict: 'id' })
    if (error) throw error
  }

  async function remove(id) {
    const { error } = await sb.from('financeiro').delete().eq('id', id).eq('user_id', uid())
    if (error) throw error
  }

  async function savePgtoEntry(chave, p) {
    const { error } = await sb.from('pagamentos').upsert({
      id: uid() + '_' + chave, user_id: uid(), chave, ...p
    }, { onConflict: 'id' })
    if (error) throw error
  }

  async function saveMeta(m) {
    meta.value = m
    const { error } = await sb.from('configuracoes').upsert({
      id: uid() + '_meta', user_id: uid(),
      chave: 'meta', valor: m, updated_at: new Date().toISOString()
    }, { onConflict: 'id' })
    if (error) throw error
  }

  const mRec = computed(() =>
    Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0')
      return fin.value
        .filter(t => t.tipo === 'entrada' && t.st === 'recebido' && t.data.includes('-' + m + '-'))
        .reduce((a, t) => a + Number(t.val), 0)
    })
  )

  function calcPeriodo(mes = '') {
    const lista = mes ? fin.value.filter(t => t.data && t.data.startsWith(mes)) : fin.value
    const rec = lista.filter(t => t.tipo === 'entrada' && t.st === 'recebido').reduce((a, t) => a + Number(t.val), 0)
    const pend = lista.filter(t => t.tipo === 'entrada' && t.st === 'pendente').reduce((a, t) => a + Number(t.val), 0)
    const sai = lista.filter(t => t.tipo === 'saida').reduce((a, t) => a + Number(t.val), 0)
    const clis = new Set(lista.filter(t => t.tipo === 'entrada' && t.st === 'recebido' && t.cli).map(t => t.cli)).size
    return { rec, pend, sai, lucro: rec - sai, clis, lista }
  }

  function gastosData() {
    const c = {}
    fin.value.filter(t => t.tipo === 'saida').forEach(t => { c[t.cat] = (c[t.cat] || 0) + Number(t.val) })
    return Object.keys(c).length ? { labels: Object.keys(c), vals: Object.values(c) } : { labels: ['Sem despesas'], vals: [0] }
  }

  return { fin, pgto, meta, fmt, load, loadFin, loadPgto, loadMeta, upsert, remove, savePgtoEntry, saveMeta, mRec, calcPeriodo, gastosData }
})
