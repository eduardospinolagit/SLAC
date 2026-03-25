import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sb } from '@/lib/supabase'
import { uid } from '@/utils/uid'

export const ETAPAS = [
  { id: 'contato',    label: 'Contato',      color: '#3b82f6' },
  { id: 'interesse',  label: 'Interesse',    color: '#f59e0b' },
  { id: 'demo',       label: 'Demo enviada', color: '#8b5cf6' },
  { id: 'negociacao', label: 'Negociação',   color: '#f97316' },
  { id: 'fechado',    label: 'Fechado',      color: '#22c55e' },
  { id: 'perdido',    label: 'Perdido',      color: '#555'    },
]

export const useLeadsStore = defineStore('leads', () => {
  const leads        = ref([])
  const conversas    = ref([])
  const undoStack    = ref([])
  const drawerLeadId = ref(null)


  async function load() {
    const { data, error } = await sb
      .from('leads').select('*')
      .eq('user_id', uid())
      .order('created_at', { ascending: false })
    if (error) { console.error(error); return }
    leads.value = data || []
  }

  async function loadConversas(leadId) {
    const { data, error } = await sb
      .from('conversas').select('*')
      .eq('user_id', uid())
      .eq('lead_id', leadId)
      .order('data', { ascending: true })
    if (error) return []
    conversas.value = data || []
    return conversas.value
  }

  // ── Internal (não empurra undo stack) ──
  async function _upsert(payload) {
    const { error } = await sb.from('leads').upsert(
      { ...payload, user_id: uid() },
      { onConflict: 'id' }
    )
    if (error) throw error
    const idx = leads.value.findIndex(l => l.id === payload.id)
    if (idx !== -1) leads.value[idx] = { ...payload, user_id: uid() }
    else leads.value.unshift({ ...payload, user_id: uid() })
  }

  async function _remove(id) {
    leads.value = leads.value.filter(l => l.id !== id)
    sb.from('conversas').delete().eq('lead_id', id).then(() => {})
    sb.from('leads').delete().eq('id', id).eq('user_id', uid()).then(() => {})
  }

  // ── Public (rastreia undo) ──
  async function upsert(payload) {
    const prev = leads.value.find(l => l.id === payload.id)
    undoStack.value.push({ action: 'upsert', prev: prev ? { ...prev } : null, id: payload.id })
    await _upsert(payload)
  }

  async function remove(id) {
    const lead = leads.value.find(l => l.id === id)
    if (lead) undoStack.value.push({ action: 'remove', lead: { ...lead } })
    await _remove(id)
  }

  async function undo() {
    const entry = undoStack.value.pop()
    if (!entry) return
    if (entry.action === 'remove') {
      await _upsert(entry.lead)
    } else if (entry.action === 'upsert') {
      if (entry.prev) await _upsert(entry.prev)   // restaura estado anterior
      else await _remove(entry.id)                 // era novo, desfaz criação
    }
  }

  async function addConversa(leadId, canal, direcao, mensagem) {
    const nova = {
      id: 'c' + Date.now(),
      user_id: uid(),
      lead_id: leadId,
      canal, direcao, mensagem,
      data: new Date().toISOString()
    }
    const { error } = await sb.from('conversas').insert(nova)
    if (error) throw error
    conversas.value.push(nova)
    return nova
  }

  function getById(id) {
    return leads.value.find(l => l.id === id)
  }

  const stats = computed(() => {
    const total = leads.value.length
    const fechados = leads.value.filter(l => l.etapa === 'fechado').length
    const negociando = leads.value.filter(l => l.etapa === 'negociacao' || l.etapa === 'demo').length
    const hoje = new Date()
    const fuHoje = leads.value.filter(l => {
      if (!l.proximo_followup) return false
      const d = new Date(l.proximo_followup)
      return d.toDateString() === hoje.toDateString() || d < hoje
    }).length
    const pipe = leads.value
      .filter(l => l.etapa !== 'perdido')
      .reduce((a, l) => a + Number(l.valor_estimado || 0), 0)
    return { total, fechados, negociando, fuHoje, pipe }
  })

  const followUpsAlerta = computed(() => {
    const hoje = new Date()
    return leads.value.filter(l => {
      if (!l.proximo_followup || l.etapa === 'fechado' || l.etapa === 'perdido') return false
      const d = new Date(l.proximo_followup)
      return d <= hoje
    }).sort((a, b) => new Date(a.proximo_followup) - new Date(b.proximo_followup))
  })

  return { leads, conversas, undoStack, drawerLeadId, load, loadConversas, upsert, remove, undo, addConversa, getById, stats, followUpsAlerta }
})
