<template>
  <div class="sz-root" :class="{ 'sz-mobile-chat': activeLead && isMobile }">

    <!-- ═══ SIDEBAR ═══ -->
    <div class="sz-sidebar" :class="{ 'sz-sidebar--hidden': activeLead && isMobile }">
      <div class="sz-sidebar-header">
        <h1 class="sz-sidebar-title">SlacZap</h1>
        <div class="sz-search-wrap">
          <svg class="sz-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="search" class="sz-search" placeholder="Buscar" />
        </div>
      </div>

      <div class="sz-list" ref="listEl">
        <div v-if="loading" class="sz-placeholder">
          <div v-for="n in 5" :key="n" class="sz-skeleton">
            <div class="sz-skeleton-avatar"></div>
            <div class="sz-skeleton-lines">
              <div class="sz-skeleton-line sz-skeleton-line--name"></div>
              <div class="sz-skeleton-line sz-skeleton-line--msg"></div>
            </div>
          </div>
        </div>
        <p v-else-if="!filteredChats.length" class="sz-empty-list">
          {{ search ? 'Nenhum resultado' : 'Nenhuma conversa ainda' }}
        </p>
        <button v-for="c in filteredChats" :key="c.lead.id"
          class="sz-item" :class="{ 'sz-item--active': activeLead?.id === c.lead.id }"
          @click="openChat(c.lead)">
          <div class="sz-avatar-wrap">
            <div class="sz-avatar" :style="{ background: avatarColor(c.lead.nome) }">
              {{ initials(c.lead.nome) }}
            </div>
          </div>
          <div class="sz-item-body">
            <div class="sz-item-row">
              <span class="sz-item-name">{{ c.lead.nome }}</span>
              <span class="sz-item-time">{{ fmtTime(c.lastAt) }}</span>
            </div>
            <div class="sz-item-row">
              <span class="sz-item-preview">
                <span v-if="c.lastDirecao === 'enviado'" class="sz-checkmark">✓ </span>{{ c.lastMsg }}
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- ═══ CHAT ═══ -->
    <div class="sz-chat" v-if="activeLead">

      <!-- Header -->
      <div class="sz-chat-header">
        <button v-if="isMobile" class="sz-back-btn" @click="closeChat" aria-label="Voltar">
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
            <path d="M9 1L1.5 8.5L9 16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="sz-back-label">Contatos</span>
        </button>
        <div class="sz-chat-avatar" :style="{ background: avatarColor(activeLead.nome) }">
          {{ initials(activeLead.nome) }}
        </div>
        <div class="sz-chat-meta">
          <span class="sz-chat-name">{{ activeLead.nome }}</span>
          <span class="sz-chat-status">{{ activeLead.telefone }}</span>
        </div>
        <div class="sz-chat-toolbar">
          <span class="sz-etapa-badge" :style="{ background: etapaColor(activeLead.etapa) + '20', color: etapaColor(activeLead.etapa) }">
            {{ etapaLabel(activeLead.etapa) }}
          </span>
          <button class="sz-toolbar-btn" @click="irCRM" title="Abrir no CRM" aria-label="Abrir no CRM">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div class="sz-messages" ref="messagesEl">
        <div v-if="loadingMsgs" class="sz-msgs-loading">
          <div class="sz-typing"><span></span><span></span><span></span></div>
        </div>
        <template v-else>
          <p v-if="!waMsgs.length" class="sz-no-msgs">
            Nenhuma mensagem ainda.<br>Diga olá! 👋
          </p>
          <template v-for="(group, gi) in msgGroups" :key="gi">
            <div class="sz-time-sep">{{ group.label }}</div>
            <div v-for="(m, mi) in group.msgs" :key="m.id"
              class="sz-bubble-wrap" :class="m.direcao === 'enviado' ? 'sz-bubble-wrap--out' : 'sz-bubble-wrap--in'">
              <div class="sz-bubble"
                :class="[
                  m.direcao === 'enviado' ? 'sz-bubble--out' : 'sz-bubble--in',
                  mi === group.msgs.length - 1 ? (m.direcao === 'enviado' ? 'sz-bubble--tail-out' : 'sz-bubble--tail-in') : '',
                  mi < group.msgs.length - 1 ? 'sz-bubble--stacked' : ''
                ]">
                <span class="sz-bubble-text">{{ m.mensagem }}</span>
                <span class="sz-bubble-footer">
                  <span class="sz-bubble-time">{{ fmtHour(m.data) }}</span>
                  <span v-if="m.direcao === 'enviado'" class="sz-bubble-check">✓✓</span>
                </span>
              </div>
            </div>
          </template>
        </template>
      </div>

      <!-- Composer -->
      <div class="sz-composer">
        <div class="sz-composer-inner">
          <button class="sz-composer-btn" aria-label="Anexo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          </button>
          <div class="sz-input-wrap">
            <textarea
              v-model="novaMsg"
              ref="inputEl"
              class="sz-input"
              placeholder="iMessage"
              rows="1"
              @keydown.enter.exact.prevent="enviar"
              @input="autoResize"
              aria-label="Mensagem"
            />
          </div>
          <Transition name="sz-send">
            <button v-if="novaMsg.trim()" class="sz-send-btn" @click="enviar" :disabled="enviando" aria-label="Enviar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
            <button v-else class="sz-mic-btn" aria-label="Áudio">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Empty state (desktop) -->
    <div class="sz-empty-chat" v-else-if="!isMobile">
      <div class="sz-empty-icon">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity=".18"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <p class="sz-empty-title">Suas Mensagens</p>
      <p class="sz-empty-sub">Selecione uma conversa</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted, inject, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWaStore } from '@/stores/wa'
import { useLeadsStore, ETAPAS } from '@/stores/leads'
import { useAuthStore } from '@/stores/auth'
import { sb } from '@/lib/supabase'

const router     = useRouter()
const route      = useRoute()
const wa         = useWaStore()
const leads      = useLeadsStore()
const auth       = useAuthStore()
const toast      = inject('toast')

const search      = ref('')
const activeLead  = ref(null)
const waMsgs      = ref([])
const loadingMsgs = ref(false)
const loading     = ref(false)
const novaMsg     = ref('')
const enviando    = ref(false)
const messagesEl  = ref(null)
const inputEl     = ref(null)
const listEl      = ref(null)
const isMobile    = ref(window.innerWidth < 768)

// ── Responsivo ──
function onResize() { isMobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

// ── Cor do avatar por nome (hash) ──
const AVATAR_COLORS = ['#22c55e','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899']
function avatarColor(nome) {
  if (!nome) return AVATAR_COLORS[0]
  let h = 0; for (const c of nome) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function initials(nome) {
  if (!nome) return '?'
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
function etapaColor(etapa) { return ETAPAS.find(e => e.id === etapa)?.color || '#888' }
function etapaLabel(etapa) { return ETAPAS.find(e => e.id === etapa)?.label || etapa }

// ── Formatação de tempo ──
function fmtTime(ts) {
  if (!ts) return ''
  const d = new Date(ts), hoje = new Date()
  const diff = hoje - d
  if (diff < 60000) return 'Agora'
  if (d.toDateString() === hoje.toDateString()) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diff < 7 * 86400000) return d.toLocaleDateString('pt-BR', { weekday: 'short' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
function fmtHour(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
function fmtDateSep(ts) {
  if (!ts) return ''
  const d = new Date(ts), hoje = new Date()
  if (d.toDateString() === hoje.toDateString()) return 'Hoje'
  const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1)
  if (d.toDateString() === ontem.toDateString()) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

// ── Agrupamento de mensagens por dia ──
const msgGroups = computed(() => {
  const groups = []
  let curDate = null, curGroup = null
  for (const m of waMsgs.value) {
    const dateStr = fmtDateSep(m.data)
    if (dateStr !== curDate) {
      curDate = dateStr
      curGroup = { label: dateStr, msgs: [] }
      groups.push(curGroup)
    }
    curGroup.msgs.push(m)
  }
  return groups
})

const filteredChats = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return wa.chats
  return wa.chats.filter(c =>
    c.lead.nome?.toLowerCase().includes(q) || c.lead.telefone?.includes(q)
  )
})

function scrollBottom() {
  nextTick(() => { if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight })
}

function autoResize() {
  if (!inputEl.value) return
  inputEl.value.style.height = 'auto'
  inputEl.value.style.height = Math.min(inputEl.value.scrollHeight, 120) + 'px'
}

async function openChat(lead) {
  activeLead.value = lead
  loadingMsgs.value = true
  const all = await leads.loadConversas(lead.id)
  waMsgs.value = (all || []).filter(c => c.canal === 'whatsapp')
  loadingMsgs.value = false
  scrollBottom()
  nextTick(() => inputEl.value?.focus())
}

function closeChat() { activeLead.value = null }

async function enviar() {
  const txt = novaMsg.value.trim()
  if (!txt || !activeLead.value?.telefone || enviando.value) return
  enviando.value = true
  const optimistic = { id: 'opt_' + Date.now(), direcao: 'enviado', mensagem: txt, data: new Date().toISOString(), canal: 'whatsapp' }
  waMsgs.value.push(optimistic)
  novaMsg.value = ''
  if (inputEl.value) { inputEl.value.style.height = 'auto' }
  scrollBottom()
  try {
    await wa.enviarMensagem(activeLead.value.id, auth.user.id, activeLead.value.telefone, txt)
    await wa.loadChats()
  } catch (e) {
    waMsgs.value = waMsgs.value.filter(m => m.id !== optimistic.id)
    toast('Erro ao enviar: ' + (e?.message || ''), 'err')
  } finally {
    enviando.value = false
  }
}

function irCRM() { router.push('/crm') }

// ── Realtime ──
let realtimeChannel = null
onMounted(async () => {
  loading.value = true
  await wa.loadChats()
  loading.value = false

  const leadId = route.query.lead
  if (leadId) {
    const chat = wa.chats.find(c => c.lead.id === leadId)
    if (chat) openChat(chat.lead)
    else { const lead = leads.leads.find(l => l.id === leadId); if (lead) openChat(lead) }
  }

  realtimeChannel = sb.channel('slaczap-' + auth.user.id)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversas', filter: 'user_id=eq.' + auth.user.id },
      async (payload) => {
        const nova = payload.new
        if (nova.canal !== 'whatsapp') return
        await wa.loadChats()
        if (activeLead.value?.id === nova.lead_id) {
          const exists = waMsgs.value.some(m => m.id === nova.id || (m.id?.startsWith('opt_') && m.mensagem === nova.mensagem))
          if (!exists) { waMsgs.value.push(nova); scrollBottom() }
        }
      })
    .subscribe()
})
onUnmounted(() => { if (realtimeChannel) sb.removeChannel(realtimeChannel) })
</script>

<style scoped>
/* ── Root ── */
.sz-root {
  display: flex;
  height: calc(100vh - 56px);
  overflow: hidden;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-base);
}

/* ── Sidebar ── */
.sz-sidebar {
  width: 320px;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  transition: transform .3s cubic-bezier(.4,0,.2,1);
}
.sz-sidebar-header {
  padding: 1rem 1rem .75rem;
  background: var(--bg-surface);
  position: sticky;
  top: 0;
  z-index: 2;
  border-bottom: 1px solid var(--border-subtle);
}
.sz-sidebar-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: .65rem;
  letter-spacing: -.02em;
}
.sz-search-wrap {
  position: relative;
}
.sz-search-icon {
  position: absolute;
  left: .7rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}
.sz-search {
  width: 100%;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: .5rem .75rem .5rem 2.1rem;
  color: var(--text-primary);
  font-size: .85rem;
  font-family: inherit;
  outline: none;
  transition: background .15s, border-color .15s;
}
.sz-search:focus { background: var(--bg-overlay); border-color: var(--border-default); }
.sz-search::placeholder { color: var(--text-tertiary); }

.sz-list { flex: 1; overflow-y: auto; overflow-x: hidden; }
.sz-list::-webkit-scrollbar { width: 3px; }
.sz-list::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 2px; }

.sz-empty-list {
  padding: 3rem 1rem;
  text-align: center;
  color: var(--text-tertiary);
  font-size: .82rem;
}

/* ── Chat item ── */
.sz-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .65rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  transition: background .12s;
  touch-action: manipulation;
  min-height: 64px;
  position: relative;
}
.sz-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 68px;
  right: 0;
  height: 1px;
  background: var(--border-subtle);
}
.sz-item:hover { background: var(--bg-elevated); }
.sz-item:active { background: var(--bg-overlay); }
.sz-item--active { background: rgba(34,197,94,.08); }
.sz-item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--accent);
  border-radius: 0 2px 2px 0;
}

.sz-avatar-wrap { position: relative; flex-shrink: 0; }
.sz-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .8rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.sz-item-body { flex: 1; min-width: 0; }
.sz-item-row { display: flex; justify-content: space-between; align-items: baseline; gap: .5rem; }
.sz-item-name { font-size: .88rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sz-item-time { font-size: .72rem; color: var(--text-tertiary); flex-shrink: 0; }
.sz-item-preview { font-size: .78rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; margin-top: .1rem; }
.sz-checkmark { color: var(--accent); }

/* ── Skeleton ── */
.sz-skeleton { display: flex; gap: .75rem; padding: .65rem 1rem; align-items: center; }
.sz-skeleton-avatar { width: 46px; height: 46px; border-radius: 50%; background: var(--bg-elevated); animation: sz-pulse 1.4s ease-in-out infinite; flex-shrink: 0; }
.sz-skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: .4rem; }
.sz-skeleton-line { height: 11px; border-radius: 6px; background: var(--bg-elevated); animation: sz-pulse 1.4s ease-in-out infinite; }
.sz-skeleton-line--name { width: 55%; }
.sz-skeleton-line--msg { width: 75%; opacity: .6; }
@keyframes sz-pulse { 0%, 100% { opacity: .4 } 50% { opacity: .8 } }

/* ── Chat area ── */
.sz-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--bg-base);
  position: relative;
}

/* ── Chat header ── */
.sz-chat-header {
  display: flex;
  align-items: center;
  gap: .65rem;
  padding: .7rem 1rem;
  background: var(--bg-surface);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 10;
  min-height: 56px;
}
.sz-back-btn {
  display: flex;
  align-items: center;
  gap: .3rem;
  border: none;
  background: none;
  color: var(--accent);
  cursor: pointer;
  padding: .5rem .4rem;
  border-radius: 8px;
  min-width: 44px;
  min-height: 44px;
  justify-content: center;
  touch-action: manipulation;
  flex-shrink: 0;
}
.sz-back-label { font-size: .85rem; font-weight: 500; }
.sz-chat-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .73rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.sz-chat-meta { flex: 1; min-width: 0; }
.sz-chat-name { display: block; font-size: .9rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sz-chat-status { font-size: .72rem; color: var(--accent); }
.sz-chat-toolbar { display: flex; align-items: center; gap: .5rem; flex-shrink: 0; }
.sz-etapa-badge { font-size: .68rem; font-weight: 600; padding: .2rem .55rem; border-radius: 20px; white-space: nowrap; }
.sz-toolbar-btn {
  width: 36px; height: 36px; min-width: 36px;
  border: none; background: var(--bg-elevated); border-radius: 50%;
  color: var(--text-secondary); cursor: pointer; display: flex;
  align-items: center; justify-content: center;
  transition: background .15s;
  touch-action: manipulation;
}
.sz-toolbar-btn:hover { background: var(--bg-overlay); color: var(--text-primary); }

/* ── Messages ── */
.sz-messages {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: .75rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  scroll-behavior: smooth;
}
.sz-messages::-webkit-scrollbar { width: 3px; }
.sz-messages::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 2px; }

.sz-msgs-loading { display: flex; justify-content: center; padding: 2rem; }
.sz-no-msgs { text-align: center; color: var(--text-tertiary); font-size: .83rem; padding: 3rem 1rem; line-height: 1.7; }

/* ── Time separator ── */
.sz-time-sep {
  text-align: center;
  font-size: .7rem;
  color: var(--text-tertiary);
  margin: .75rem 0 .5rem;
  font-weight: 500;
  letter-spacing: .03em;
}

/* ── Bubbles ── */
.sz-bubble-wrap {
  display: flex;
  margin-bottom: 2px;
  animation: sz-bubble-in .18s cubic-bezier(.17,.67,.45,1.4);
}
.sz-bubble-wrap--out { justify-content: flex-end; }
.sz-bubble-wrap--in  { justify-content: flex-start; }
@keyframes sz-bubble-in { from { opacity: 0; transform: scale(.88) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.sz-bubble {
  max-width: 72%;
  padding: .5rem .75rem .35rem;
  border-radius: 18px;
  position: relative;
  word-break: break-word;
}
.sz-bubble--out {
  background: var(--accent);
  color: #000;
  border-bottom-right-radius: 18px;
}
.sz-bubble--in {
  background: var(--bg-overlay);
  color: var(--text-primary);
  border-bottom-left-radius: 18px;
}
.sz-bubble--tail-out { border-bottom-right-radius: 4px; }
.sz-bubble--tail-in  { border-bottom-left-radius: 4px; }
.sz-bubble--stacked  { border-radius: 18px; margin-bottom: 1px; }

.sz-bubble-text { font-size: .88rem; line-height: 1.45; display: block; }
.sz-bubble-footer { display: flex; align-items: center; justify-content: flex-end; gap: .25rem; margin-top: .2rem; }
.sz-bubble-time { font-size: .65rem; opacity: .6; }
.sz-bubble--out .sz-bubble-time { color: rgba(0,0,0,.6); }
.sz-bubble-check { font-size: .65rem; color: rgba(0,0,0,.55); }

/* ── Typing indicator ── */
.sz-typing { display: flex; align-items: center; gap: 4px; padding: .6rem .8rem; background: var(--bg-overlay); border-radius: 18px; border-bottom-left-radius: 4px; width: fit-content; }
.sz-typing span { width: 7px; height: 7px; border-radius: 50%; background: var(--text-tertiary); animation: sz-bounce .9s ease-in-out infinite; }
.sz-typing span:nth-child(2) { animation-delay: .15s; }
.sz-typing span:nth-child(3) { animation-delay: .3s; }
@keyframes sz-bounce { 0%, 80%, 100% { transform: scale(.8); opacity: .5; } 40% { transform: scale(1.1); opacity: 1; } }

/* ── Composer ── */
.sz-composer {
  padding: .5rem .75rem;
  padding-bottom: max(.5rem, env(safe-area-inset-bottom));
  background: var(--bg-surface);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--border-subtle);
}
.sz-composer-inner {
  display: flex;
  align-items: flex-end;
  gap: .5rem;
}
.sz-composer-btn, .sz-mic-btn {
  width: 34px; height: 34px; min-width: 34px;
  border-radius: 50%; border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
  transition: all .15s;
  touch-action: manipulation;
  margin-bottom: 2px;
}
.sz-composer-btn { background: var(--bg-elevated); color: var(--text-secondary); }
.sz-composer-btn:hover { background: var(--bg-overlay); }
.sz-mic-btn { background: var(--accent); color: #000; }
.sz-input-wrap { flex: 1; }
.sz-input {
  width: 100%;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 20px;
  padding: .55rem 1rem;
  color: var(--text-primary);
  font-size: .88rem;
  font-family: inherit;
  resize: none;
  outline: none;
  line-height: 1.45;
  transition: border-color .15s, background .15s;
  display: block;
  overflow: hidden;
  max-height: 120px;
}
.sz-input:focus { border-color: var(--accent); background: var(--bg-overlay); }
.sz-input::placeholder { color: var(--text-tertiary); }
.sz-send-btn {
  width: 34px; height: 34px; min-width: 34px;
  border-radius: 50%; border: none;
  background: var(--accent); color: #000;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
  transition: transform .15s, opacity .15s;
  touch-action: manipulation;
  margin-bottom: 2px;
}
.sz-send-btn:hover { transform: scale(1.08); }
.sz-send-btn:active { transform: scale(.94); }
.sz-send-btn:disabled { opacity: .4; }

/* Send button transition */
.sz-send-enter-active, .sz-send-leave-active { transition: all .15s cubic-bezier(.34,1.56,.64,1); }
.sz-send-enter-from { opacity: 0; transform: scale(.4); }
.sz-send-leave-to { opacity: 0; transform: scale(.4); }

/* ── Empty state ── */
.sz-empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .6rem;
  background: var(--bg-base);
}
.sz-empty-icon { margin-bottom: .25rem; }
.sz-empty-title { font-size: 1.1rem; font-weight: 600; color: var(--text-primary); }
.sz-empty-sub { font-size: .83rem; color: var(--text-tertiary); }

/* ── Responsivo ── */
@media (max-width: 767px) {
  .sz-root { position: relative; height: calc(100vh - 56px - 68px); }
  .sz-sidebar { width: 100%; min-width: 0; border-right: none; }
  .sz-sidebar--hidden { display: none; }
  .sz-chat { position: absolute; inset: 0; z-index: 20; }
}
@media (min-width: 768px) {
  .sz-back-btn { display: none; }
}
</style>
