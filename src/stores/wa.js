import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { sb } from '@/lib/supabase'
import { uid } from '@/utils/uid'
import { slacLog } from '@/utils/log'

const BASE_URL = 'http://localhost:3001'

export const useWaStore = defineStore('wa', () => {
  const templates   = ref([])
  const config      = ref({ instance_id: '' })
  const scriptBase  = ref('')
  const chats       = ref([]) // [{lead, lastMsg, lastAt, lastDirecao}]

  // ── Contagem de não lidas (global — persiste no localStorage) ──
  const unreadCounts = reactive(JSON.parse(localStorage.getItem('slac-unread-counts') || '{}'))

  function _persistUnread() {
    localStorage.setItem('slac-unread-counts', JSON.stringify({ ...unreadCounts }))
  }
  function storeIncrementUnread(key) {
    if (!key) return
    unreadCounts[key] = (unreadCounts[key] || 0) + 1
    _persistUnread()
  }
  function storeClearUnread(key) {
    if (!key) return
    delete unreadCounts[key]
    _persistUnread()
  }
  function storeClearAllUnread() {
    Object.keys(unreadCounts).forEach(k => delete unreadCounts[k])
    _persistUnread()
  }
  function storeSetUnread(key, n) {
    if (!key) return
    if (n <= 0) delete unreadCounts[key]
    else unreadCounts[key] = n
    _persistUnread()
  }
  function storeSetAllUnread(obj) {
    Object.keys(unreadCounts).forEach(k => delete unreadCounts[k])
    Object.assign(unreadCounts, obj)
    _persistUnread()
  }

  // Lê lastSeen do localStorage (não reativo, mas lido em cada recomputação)
  function _getLastSeen() {
    try { return JSON.parse(localStorage.getItem('slac-last-seen') || '{}') } catch { return {} }
  }

  // totalUnread: contadores explícitos (Realtime) + fallback por timestamp de lastSeen + chats
  // Isso garante que o badge funciona mesmo sem Realtime — basta loadChats() ser chamado
  const totalUnread = computed(() => {
    const lastSeen = _getLastSeen()
    let total = 0
    for (const c of chats.value) {
      const key = c.lead?.id || c.lead?.telefone || ''
      if (!key) continue
      // Contador explícito (via Realtime ou fetchUnreadCounts)
      if ((unreadCounts[key] || 0) > 0) { total++; continue }
      // Fallback por timestamp: última msg recebida é mais nova que o lastSeen
      if (c.lastDirecao !== 'recebido') continue
      const seen = lastSeen[key]
      if (seen && c.lastAt && c.lastAt > seen) total++
    }
    return total
  })

  const notifChats = computed(() => {
    const lastSeen = _getLastSeen()
    return chats.value
      .map(c => {
        const key = c.lead?.id || c.lead?.telefone || ''
        if (!key) return null
        let unread = unreadCounts[key] || 0
        if (!unread && c.lastDirecao === 'recebido') {
          const seen = lastSeen[key]
          if (seen && c.lastAt && c.lastAt > seen) unread = 1
        }
        return unread > 0 ? { lead: c.lead, lastMsg: c.lastMsg, lastAt: c.lastAt, unread } : null
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt))
  })

  // ── Conexão local ──
  const connected      = ref(false)
  const hasQr          = ref(false)
  const qrImage        = ref(null)       // dark mode (verde sobre preto)
  const qrImageLight   = ref(null)       // light mode (preto sobre branco)
  const serverOnline   = ref(false)
  let _lastTokenSent = 0

  async function sendToken() {
    try {
      const { data: { session } } = await sb.auth.getSession()
      if (!session?.access_token) return
      await fetch(BASE_URL + '/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: session.access_token }),
      })
      _lastTokenSent = Date.now()
    } catch {}
  }

  async function checkStatus() {
    try {
      const r = await fetch(BASE_URL + '/status')
      const d = await r.json()
      serverOnline.value  = true
      const wasConnected  = connected.value
      connected.value     = d.connected
      hasQr.value         = d.hasQr
      qrImage.value       = d.qrImage      || null
      qrImageLight.value  = d.qrImageLight || null
      // Envia JWT ao tray quando conecta ou a cada 45min (antes do token expirar)
      if (d.connected && (!wasConnected || Date.now() - _lastTokenSent > 45 * 60 * 1000)) {
        await sendToken()
      }
    } catch {
      serverOnline.value  = false
      connected.value     = false
      hasQr.value         = false
      qrImage.value       = null
      qrImageLight.value  = null
    }
  }

  async function disconnect() {
    try { await fetch(BASE_URL + '/disconnect', { method: 'POST' }) } catch {}
    connected.value = false
    hasQr.value     = false
    qrImage.value   = null
    slacLog('ZAP-007', 'WhatsApp desconectado')
  }

  async function syncHistory() {
    try {
      await fetch(BASE_URL + '/sync-history', { method: 'POST' })
      // Aguarda o servidor reconectar e processar o histórico antes de recarregar
      await new Promise(r => setTimeout(r, 4000))
    } catch {}
  }

  async function loadChats() {
    const { data: convs, error: convErr } = await sb
      .from('conversas')
      .select('lead_id, mensagem, data, direcao, status, telefone, contato_nome')
      .eq('canal', 'whatsapp')
      .eq('user_id', uid())
      .order('data', { ascending: false })
      .limit(200)
    if (convErr || !convs?.length) { if (!convErr) chats.value = []; return }

    const leadMap  = new Map() // lead_id  → última conversa
    const phoneMap = new Map() // telefone → última conversa (sem lead)
    for (const c of convs) {
      if (c.lead_id) { if (!leadMap.has(c.lead_id))   leadMap.set(c.lead_id, c) }
      else if (c.telefone) { if (!phoneMap.has(c.telefone)) phoneMap.set(c.telefone, c) }
    }

    const result = []

    // Contatos com lead no CRM
    if (leadMap.size) {
      const { data: leadsData } = await sb
        .from('leads').select('id, nome, telefone, etapa')
        .in('id', [...leadMap.keys()]).eq('user_id', uid())
      for (const l of (leadsData || [])) {
        const c = leadMap.get(l.id)
        result.push({ lead: l, lastMsg: c?.mensagem || '', lastAt: c?.data || '', lastDirecao: c?.direcao || '', lastStatus: c?.status || 'sent' })
      }
    }

    // Contatos sem lead (inbox direto do WhatsApp)
    for (const [phone, c] of phoneMap) {
      result.push({
        lead: { id: null, nome: c.contato_nome || phone, telefone: phone, etapa: null },
        lastMsg: c.mensagem || '', lastAt: c.data || '', lastDirecao: c.direcao || '', lastStatus: c.status || 'sent',
      })
    }

    chats.value = result.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt))
  }

  async function loadTemplates() {
    const { data, error } = await sb
      .from('wa_templates').select('*')
      .eq('user_id', uid())
      .order('created_at', { ascending: true })
    if (error) { console.error('[wa] loadTemplates:', error); return }
    templates.value = data || []
  }

  async function saveTemplate(t) {
    const row = { ...t, user_id: uid() }
    const { data, error } = await sb
      .from('wa_templates').upsert(row, { onConflict: 'id' })
      .select().single()
    if (error) throw error
    const idx = templates.value.findIndex(x => x.id === data.id)
    if (idx !== -1) templates.value[idx] = data
    else templates.value.push(data)
    slacLog('ZAP-004', `Template salvo: ${t.nome || t.titulo || t.id}`, { id: data.id, nome: t.nome || t.titulo })
    return data
  }

  async function deleteTemplate(id) {
    const tpl = templates.value.find(t => t.id === id)
    await sb.from('wa_templates').delete().eq('id', id).eq('user_id', uid())
    templates.value = templates.value.filter(t => t.id !== id)
    slacLog('ZAP-005', `Template removido: ${tpl?.nome || tpl?.titulo || id}`, { id })
  }

  async function loadConfig() {
    const { data } = await sb
      .from('configuracoes').select('chave, valor')
      .eq('user_id', uid())
      .in('chave', ['wa_config', 'script_base'])
    const waConf = data?.find(r => r.chave === 'wa_config')
    const script = data?.find(r => r.chave === 'script_base')
    config.value.instance_id = waConf?.valor?.instance_id || ''
    scriptBase.value = script?.valor?.texto || ''
  }

  async function saveConfig(instanceId, script) {
    const userId = uid()
    await Promise.all([
      sb.from('configuracoes').upsert({
        id: userId + '_wa_config', user_id: userId,
        chave: 'wa_config', valor: { instance_id: instanceId },
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' }),
      sb.from('configuracoes').upsert({
        id: userId + '_script_base', user_id: userId,
        chave: 'script_base', valor: { texto: script },
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' }),
    ])
    config.value.instance_id = instanceId
    scriptBase.value = script
    slacLog('ZAP-006', 'Configuração WhatsApp salva', { instance_id: instanceId })
  }

  async function enviarArquivo(leadId, userId, telefone, tipo, arquivo, arquivoNome, caption) {
    const endpoint = tipo === 'image' ? '/send-image' : tipo === 'audio' ? '/send-audio' : '/send-document'
    const body = { telefone, lead_id: leadId, user_id: userId }
    if (tipo === 'image')    { body.imagem = arquivo; body.caption = caption || '' }
    else if (tipo === 'audio')    { body.audio = arquivo }
    else                     { body.documento = arquivo; body.nome = arquivoNome; body.mimetype = '' }
    const r = await fetch(BASE_URL + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await r.json()
    if (!r.ok) throw new Error(data.error || 'Falha ao enviar arquivo')
    slacLog('ZAP-002', `Arquivo enviado para ${telefone} (${tipo})`, { lead_id: leadId, telefone, tipo, nome: arquivoNome })
    return data
  }

  async function enviarMensagem(leadId, userId, telefone, mensagem, quoted) {
    const body = { telefone, mensagem, lead_id: leadId, user_id: userId }
    if (quoted?.id) body.quoted_id = quoted.id
    const r = await fetch(BASE_URL + '/send-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await r.json()
    if (!r.ok) throw new Error(data.error || 'Falha ao enviar')
    slacLog('ZAP-001', `Mensagem enviada para ${telefone}`, { lead_id: leadId, telefone, preview: mensagem?.slice(0, 80) })
    return data
  }

  // Última mensagem recebida via Broadcast do tray — SlacZapView faz watch aqui
  const lastWaMsg = ref(null)

  // ── SDR por IA ──
  const sdrConfig = ref({
    enabled: false,
    etapas: ['contato', 'interesse'],
    horaInicio: '08:00',
    horaFim: '18:00',
    diasSemana: [1, 2, 3, 4, 5],
    limiteMsg: 15,
    sempreAtivo: false,
  })
  const sdrChats  = reactive({}) // chatKey → { active, msgCount }
  const sdrLogs   = ref([])      // { chatKey, leadNome, acao, msg, ts }

  function sdrChatKey(lead) {
    return lead?.id ? `lead_${lead.id}` : `phone_${(lead?.telefone || '').replace(/\D/g, '')}`
  }

  function isSdrActive(lead) {
    if (!lead) return false
    if (!sdrConfig.value.enabled) return false
    const key = sdrChatKey(lead)
    return !!sdrChats[key]?.active
  }

  // includeChats=true apenas na carga inicial — o Realtime NÃO deve
  // recarregar sdrChats para evitar race condition (sobrescrever active:true com valor antigo)
  async function loadSdrConfig({ includeChats = true } = {}) {
    const chaves = includeChats ? ['sdr_config', 'sdr_chats'] : ['sdr_config']
    const { data } = await sb
      .from('configuracoes').select('chave, valor')
      .eq('user_id', uid())
      .in('chave', chaves)
    if (!data) return
    const cfgRow   = data.find(r => r.chave === 'sdr_config')
    const chatsRow = data.find(r => r.chave === 'sdr_chats')
    if (cfgRow?.valor)                    Object.assign(sdrConfig.value, cfgRow.valor)
    if (includeChats && chatsRow?.valor)  Object.assign(sdrChats, chatsRow.valor)
  }

  async function saveSdrConfig() {
    const userId = uid()
    await sb.from('configuracoes').upsert({
      id: userId + '_sdr_config', user_id: userId,
      chave: 'sdr_config', valor: { ...sdrConfig.value },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    slacLog('SDR-004', 'Configuração SDR salva', { enabled: sdrConfig.value.enabled })
  }

  async function toggleSdrChat(lead) {
    const key = sdrChatKey(lead)
    const wasActive = !!sdrChats[key]?.active
    if (wasActive) {
      sdrChats[key] = { active: false, msgCount: sdrChats[key].msgCount || 0 }
    } else {
      // Reseta msgCount ao re-ativar — evita desativação imediata por limite antigo
      sdrChats[key] = { active: true, msgCount: 0 }
    }
    const userId = uid()
    await sb.from('configuracoes').upsert({
      id: userId + '_sdr_chats', user_id: userId,
      chave: 'sdr_chats', valor: { ...sdrChats },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    slacLog('SDR-003', `SDR ${wasActive ? 'desativado' : 'ativado'} para chat: ${lead?.nome || key}`, { lead_id: lead?.id, ativo: !wasActive })
  }

  async function sdrIncrementMsg(lead) {
    const key = sdrChatKey(lead)
    if (!sdrChats[key]) return
    sdrChats[key].msgCount = (sdrChats[key].msgCount || 0) + 1
    if (sdrChats[key].msgCount >= sdrConfig.value.limiteMsg) {
      sdrChats[key].active = false
    }
    const userId = uid()
    await sb.from('configuracoes').upsert({
      id: userId + '_sdr_chats', user_id: userId,
      chave: 'sdr_chats', valor: { ...sdrChats },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  }

  function sdrAddLog(entry) {
    sdrLogs.value.unshift({ ...entry, ts: new Date().toISOString() })
    if (sdrLogs.value.length > 100) sdrLogs.value.length = 100
  }

  function sdrIsInHours() {
    if (sdrConfig.value.sempreAtivo) return true
    const now  = new Date()
    const day  = now.getDay() // 0=Dom … 6=Sab
    const dias = sdrConfig.value.diasSemana
    if (!dias.includes(day)) return false
    const [hI, mI] = (sdrConfig.value.horaInicio || '00:00').split(':').map(Number)
    const [hF, mF] = (sdrConfig.value.horaFim    || '23:59').split(':').map(Number)
    const cur = now.getHours() * 60 + now.getMinutes()
    return cur >= hI * 60 + mI && cur <= hF * 60 + mF
  }

  // ── Follow-up Automático ──
  // fuAutoChats: { [chatKey]: { active: bool, horas: number, lastSentAt: string|null } }
  const fuAutoChats = reactive({})

  // ── Opções SLAC Modal (global) ──
  const opcoesSLACOpen = ref(false)
  const slacOptsLead   = ref(null)

  function fuAutoKey(lead) {
    if (!lead) return null
    return lead.id ? `lead_${lead.id}` : `phone_${(lead.telefone||'').replace(/\D/g,'')}`
  }

  function isFuAutoActive(lead) {
    const k = fuAutoKey(lead)
    return !!(k && fuAutoChats[k]?.active)
  }

  async function loadFuAutoConfig() {
    try {
      const { data } = await sb.from('configuracoes').select('valor')
        .eq('user_id', uid()).eq('chave', 'fu_auto_chats').maybeSingle()
      if (data?.valor) Object.assign(fuAutoChats, data.valor)
    } catch {}
  }

  async function saveFuAutoConfig() {
    try {
      const userId = uid()
      await sb.from('configuracoes').upsert({
        id: userId + '_fu_auto_chats', user_id: userId,
        chave: 'fu_auto_chats', valor: { ...fuAutoChats },
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
    } catch {}
  }

  async function toggleFuAutoChat(lead, horas = 4) {
    const k = fuAutoKey(lead)
    if (!k) return
    if (fuAutoChats[k]?.active) {
      fuAutoChats[k] = { active: false, horas, lastSentAt: null }
    } else {
      // Usa timestamp de ativação como baseline para evitar disparo imediato
      // em conversas onde a última mensagem já tem mais tempo que o delay configurado
      fuAutoChats[k] = { active: true, horas, lastSentAt: new Date().toISOString() }
    }
    await saveFuAutoConfig()
  }

  async function setFuAutoHoras(lead, horas) {
    const k = fuAutoKey(lead)
    if (!k) return
    if (!fuAutoChats[k]) fuAutoChats[k] = { active: false, horas, lastSentAt: null }
    else fuAutoChats[k].horas = horas
    await saveFuAutoConfig()
  }

  function markFuAutoSent(lead) {
    const k = fuAutoKey(lead)
    if (!k || !fuAutoChats[k]) return
    fuAutoChats[k].lastSentAt = new Date().toISOString()
    saveFuAutoConfig()
  }

  async function gerarScript(userId, instagram, negocio, cidade) {
    const { data, error } = await sb.functions.invoke('gerar-script', {
      body: { user_id: userId, instagram, negocio, cidade }
    })
    if (error) throw error
    if (!data?.script) throw new Error(data?.error || 'Falha ao gerar script')
    slacLog('ZAP-003', `Script gerado para: ${negocio || instagram || 'lead'}`, { negocio, instagram, cidade })
    return data.script
  }

  return {
    templates, config, scriptBase, chats, lastWaMsg,
    unreadCounts, totalUnread, notifChats,
    storeIncrementUnread, storeClearUnread, storeClearAllUnread, storeSetUnread, storeSetAllUnread,
    connected, hasQr, qrImage, qrImageLight, serverOnline,
    checkStatus, disconnect, sendToken,
    loadTemplates, saveTemplate, deleteTemplate,
    loadConfig, saveConfig, loadChats, syncHistory,
    enviarMensagem, enviarArquivo, gerarScript,
    // SDR
    sdrConfig, sdrChats, sdrLogs,
    sdrChatKey, isSdrActive,
    loadSdrConfig, saveSdrConfig,
    toggleSdrChat, sdrIncrementMsg, sdrAddLog, sdrIsInHours,
    // Follow-up automático
    fuAutoChats, fuAutoKey, isFuAutoActive,
    loadFuAutoConfig, toggleFuAutoChat, setFuAutoHoras, markFuAutoSent,
    // Opções SLAC Modal
    opcoesSLACOpen, slacOptsLead,
  }
})
