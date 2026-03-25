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
          <div v-if="itemStatuses(c.lead).length" class="sz-item-status-bar"
            :style="{ background: itemStatuses(c.lead)[0].color }"></div>
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
          <button class="sz-toolbar-btn" @click="exportarConversa" title="Exportar conversa" aria-label="Exportar conversa">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button class="sz-toolbar-btn" @click="openContact" title="Informações do contato" aria-label="Informações do contato">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </button>
          <button class="sz-toolbar-btn" @click="irCRM" title="Abrir no CRM" aria-label="Abrir no CRM">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
        </div>
      </div>

      <!-- Status bar -->
      <div v-if="leadStatus.length" class="sz-chat-status-bar">
        <div v-for="s in leadStatus" :key="s.type" class="sz-status-chip"
          :style="{ background: s.color + '18', color: s.color, borderLeft: '2.5px solid ' + s.color }">
          {{ s.label }}<span v-if="s.date" class="sz-status-date"> · {{ s.date }}</span>
        </div>
      </div>

      <!-- Messages -->
      <div class="sz-messages" ref="messagesEl">
        <div v-if="loadingMsgs" class="sz-msgs-loading">
          <div class="sz-typing"><span></span><span></span><span></span></div>
        </div>
        <template v-else>
          <p v-if="!waMsgs.length" class="sz-no-msgs">Nenhuma mensagem ainda.<br>Diga olá! 👋</p>
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

      <!-- File preview -->
      <div v-if="selectedFile" class="sz-file-preview">
        <div class="sz-file-preview-inner">
          <img v-if="selectedFile.tipo === 'image'" :src="selectedFile.dataUrl" class="sz-preview-img" />
          <div v-else class="sz-preview-file-info">
            <svg v-if="selectedFile.tipo === 'document'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            <span class="sz-preview-fname">{{ selectedFile.nome }}</span>
          </div>
          <input v-if="selectedFile.tipo !== 'audio'" v-model="fileCaption"
            class="sz-preview-caption" placeholder="Legenda (opcional)" />
        </div>
        <button class="sz-preview-remove" @click="selectedFile = null; fileCaption = ''" aria-label="Remover arquivo">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Composer -->
      <div class="sz-composer">
        <div class="sz-composer-inner">
          <div class="sz-attach-wrap">
            <button class="sz-composer-btn" :class="{ 'sz-composer-btn--open': showAttachMenu }"
              @click.stop="toggleAttachMenu" aria-label="Anexar arquivo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" class="sz-attach-icon">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </button>
            <Transition name="sz-attach">
              <div v-if="showAttachMenu" class="sz-attach-menu" @click.stop>
                <button class="sz-attach-item" @click="triggerFile('image')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  Imagem
                </button>
                <button class="sz-attach-item" @click="triggerFile('document')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Documento
                </button>
                <button class="sz-attach-item" @click="triggerFile('audio')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                  Áudio
                </button>
              </div>
            </Transition>
            <input ref="fileInputImg"   type="file" accept="image/*" style="display:none" @change="e => onFileSelected(e, 'image')" />
            <input ref="fileInputDoc"   type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip" style="display:none" @change="e => onFileSelected(e, 'document')" />
            <input ref="fileInputAudio" type="file" accept="audio/*" style="display:none" @change="e => onFileSelected(e, 'audio')" />
          </div>

          <div class="sz-input-wrap">
            <textarea v-model="novaMsg" ref="inputEl" class="sz-input" placeholder="iMessage"
              rows="1" @keydown.enter.exact.prevent="enviar" @input="autoResize" aria-label="Mensagem" />
          </div>

          <Transition name="sz-send">
            <button v-if="novaMsg.trim() || selectedFile" class="sz-send-btn" @click="enviar" :disabled="enviando" aria-label="Enviar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
            <button v-else class="sz-mic-btn" aria-label="Áudio">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
          </Transition>
        </div>
      </div>

      <!-- Contact panel overlay -->
      <Transition name="sz-panel-bg">
        <div v-if="showContact" class="sz-panel-bg" @click="showContact = false"></div>
      </Transition>

      <!-- Contact panel -->
      <Transition name="sz-panel">
        <div v-if="showContact" class="sz-contact-panel">
          <div class="sz-cp-header">
            <h2 class="sz-cp-title">Contato</h2>
            <button class="sz-cp-close" @click="showContact = false" aria-label="Fechar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="sz-cp-body">
            <!-- Identity -->
            <div class="sz-cp-identity">
              <div class="sz-cp-avatar" :style="{ background: avatarColor(activeLead.nome) }">{{ initials(activeLead.nome) }}</div>
              <div>
                <p class="sz-cp-name">{{ activeLead.nome }}</p>
                <span class="badge" :style="{ background: etapaColor(activeLead.etapa) + '22', color: etapaColor(activeLead.etapa) }">
                  {{ etapaLabel(activeLead.etapa) }}
                </span>
              </div>
            </div>

            <!-- Contato -->
            <div class="sz-cp-section">
              <p class="sz-cp-section-title">Contato</p>
              <div class="sz-cp-field" v-if="activeLead.telefone">
                <span class="sz-cp-label">Telefone</span>
                <span class="sz-cp-value">{{ activeLead.telefone }}</span>
              </div>
              <div class="sz-cp-field" v-if="activeLead.email">
                <span class="sz-cp-label">Email</span>
                <span class="sz-cp-value">{{ activeLead.email }}</span>
              </div>
              <div class="sz-cp-field" v-if="activeLead.empresa">
                <span class="sz-cp-label">Empresa</span>
                <span class="sz-cp-value">{{ activeLead.empresa }}</span>
              </div>
              <div class="sz-cp-field" v-if="activeLead.origem">
                <span class="sz-cp-label">Origem</span>
                <span class="sz-cp-value">{{ activeLead.origem }}</span>
              </div>
            </div>

            <!-- CRM -->
            <div class="sz-cp-section">
              <p class="sz-cp-section-title">CRM</p>
              <div class="sz-cp-field" v-if="activeLead.proximo_followup">
                <span class="sz-cp-label">Próximo follow-up</span>
                <span class="sz-cp-value" :style="{ color: new Date(activeLead.proximo_followup) <= new Date() ? '#e8a838' : 'var(--text-primary)' }">
                  {{ new Date(activeLead.proximo_followup).toLocaleDateString('pt-BR') }}
                </span>
              </div>
              <div class="sz-cp-field" v-if="activeLead.relead_data">
                <span class="sz-cp-label">Relead agendado</span>
                <span class="sz-cp-value" style="color:#8b5cf6">
                  {{ new Date(activeLead.relead_data).toLocaleDateString('pt-BR') }}
                </span>
              </div>
              <div class="sz-cp-field" v-if="activeLead.valor">
                <span class="sz-cp-label">Valor</span>
                <span class="sz-cp-value">{{ fmtValor(activeLead.valor) }}</span>
              </div>
              <div class="sz-cp-field" v-if="activeLead.obs">
                <span class="sz-cp-label">Observações</span>
                <span class="sz-cp-value sz-cp-obs">{{ activeLead.obs }}</span>
              </div>
            </div>

            <!-- Work -->
            <div class="sz-cp-section" v-if="leadWorkItems.length">
              <p class="sz-cp-section-title">Work</p>
              <div v-for="item in leadWorkItems" :key="item.id" class="sz-cp-work-item">
                <div class="sz-cp-work-header">
                  <span class="sz-cp-work-service">{{ item.servico }}</span>
                  <span class="sz-cp-work-badge" :class="'sz-cp-work-badge--' + item.status">
                    {{ item.status === 'ativo' ? 'Em andamento' : 'Concluído' }}
                  </span>
                </div>
                <div v-if="item.tarefas?.length" class="sz-cp-work-progress">
                  <div class="sz-cp-progress-bar">
                    <div class="sz-cp-progress-fill" :style="{ width: (item.tarefas.filter(t => t.feito).length / item.tarefas.length * 100) + '%' }"></div>
                  </div>
                  <span class="sz-cp-progress-text">{{ item.tarefas.filter(t => t.feito).length }}/{{ item.tarefas.length }}</span>
                </div>
              </div>
            </div>

            <div class="sz-cp-actions">
              <button class="btn btn-primary btn-sm" style="width:100%" @click="irCRM(); showContact = false">
                Abrir no CRM
              </button>
            </div>
          </div>
        </div>
      </Transition>
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
import { ref, computed, nextTick, onMounted, onUnmounted, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWaStore } from '@/stores/wa'
import { useLeadsStore, ETAPAS } from '@/stores/leads'
import { useAuthStore } from '@/stores/auth'
import { useWorkStore } from '@/stores/work'
import { sb } from '@/lib/supabase'

const router  = useRouter()
const route   = useRoute()
const wa      = useWaStore()
const leads   = useLeadsStore()
const auth    = useAuthStore()
const work    = useWorkStore()
const toast   = inject('toast')

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

// Contact panel
const showContact = ref(false)

// Attachment
const showAttachMenu  = ref(false)
const selectedFile    = ref(null)  // { tipo, nome, dataUrl }
const fileCaption     = ref('')
const fileInputImg    = ref(null)
const fileInputDoc    = ref(null)
const fileInputAudio  = ref(null)

// ── Resize ──
function onResize() { isMobile.value = window.innerWidth < 768 }

// ── Click outside attach menu ──
function onDocClick(e) {
  if (showAttachMenu.value && !e.target.closest('.sz-attach-wrap')) {
    showAttachMenu.value = false
  }
}

// ── Avatar ──
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
function fmtValor(v) {
  return v ? 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''
}

// ── Status indicators ──
function itemStatuses(lead) {
  const s = [], now = new Date()
  if (lead.proximo_followup && new Date(lead.proximo_followup) <= now)
    s.push({ type: 'followup', label: 'Follow-up', color: '#e8a838' })
  if (lead.relead_data && new Date(lead.relead_data) <= now)
    s.push({ type: 'relead', label: 'Relead', color: '#8b5cf6' })
  if (work.leadsComWork.has(lead.id))
    s.push({ type: 'work', label: 'Work', color: '#5b8dee' })
  return s
}

const leadStatus = computed(() => {
  if (!activeLead.value) return []
  const lead = activeLead.value
  const s = [], now = new Date()
  if (lead.proximo_followup && new Date(lead.proximo_followup) <= now)
    s.push({ type: 'followup', label: 'Follow-up', color: '#e8a838',
      date: new Date(lead.proximo_followup).toLocaleDateString('pt-BR') })
  if (lead.relead_data && new Date(lead.relead_data) <= now)
    s.push({ type: 'relead', label: 'Relead', color: '#8b5cf6',
      date: new Date(lead.relead_data).toLocaleDateString('pt-BR') })
  if (work.leadsComWork.has(lead.id))
    s.push({ type: 'work', label: 'Work', color: '#5b8dee' })
  return s
})

const leadWorkItems = computed(() =>
  work.items.filter(i => i.lead_id === activeLead.value?.id)
)

// ── Time formatting ──
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

// ── Message groups ──
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

// ── Chat open/close ──
async function openChat(chatLead) {
  // resolve full lead data from store
  activeLead.value = leads.leads.find(l => l.id === chatLead.id) || chatLead
  showContact.value = false
  loadingMsgs.value = true
  const all = await leads.loadConversas(chatLead.id)
  waMsgs.value = (all || []).filter(c => c.canal === 'whatsapp')
  loadingMsgs.value = false
  scrollBottom()
  nextTick(() => inputEl.value?.focus())
}

function closeChat() {
  activeLead.value = null
  showContact.value = false
}

// ── Contact panel ──
async function openContact() {
  if (!work.items.length) await work.load()
  showContact.value = true
}

// ── Export ──
function exportarConversa() {
  if (!waMsgs.value.length) { toast('Sem mensagens para exportar', 'warn'); return }
  const lines = [
    `Conversa com ${activeLead.value.nome} (${activeLead.value.telefone})`,
    `Exportado em ${new Date().toLocaleString('pt-BR')}`,
    '─────────────────────────────────', ''
  ]
  for (const m of waMsgs.value) {
    const d = new Date(m.data)
    const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const dia = d.toLocaleDateString('pt-BR')
    lines.push(`[${dia} ${hora}] ${m.direcao === 'enviado' ? 'Você' : activeLead.value.nome}: ${m.mensagem}`)
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `conversa-${activeLead.value.nome.replace(/\s+/g, '_')}.txt`
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
  toast('Conversa exportada', 'ok')
}

// ── Attachment ──
function toggleAttachMenu() { showAttachMenu.value = !showAttachMenu.value }

function triggerFile(tipo) {
  showAttachMenu.value = false
  if (tipo === 'image') fileInputImg.value?.click()
  else if (tipo === 'document') fileInputDoc.value?.click()
  else fileInputAudio.value?.click()
}

async function onFileSelected(e, tipo) {
  const file = e.target.files?.[0]
  if (!file) return
  e.target.value = ''
  if (file.size > 10 * 1024 * 1024) { toast('Arquivo muito grande (máx 10MB)', 'error'); return }
  const dataUrl = await new Promise(resolve => {
    const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(file)
  })
  selectedFile.value = { tipo, nome: file.name, dataUrl }
}

// ── Send ──
async function enviar() {
  if (enviando.value || !activeLead.value?.telefone) return
  if (selectedFile.value) { await _enviarArquivo(); return }
  const txt = novaMsg.value.trim()
  if (!txt) return
  enviando.value = true
  const opt = { id: 'opt_' + Date.now(), direcao: 'enviado', mensagem: txt, data: new Date().toISOString(), canal: 'whatsapp' }
  waMsgs.value.push(opt)
  novaMsg.value = ''
  if (inputEl.value) inputEl.value.style.height = 'auto'
  scrollBottom()
  try {
    await wa.enviarMensagem(activeLead.value.id, auth.user.id, activeLead.value.telefone, txt)
    await wa.loadChats()
  } catch (e) {
    waMsgs.value = waMsgs.value.filter(m => m.id !== opt.id)
    toast('Erro ao enviar: ' + (e?.message || ''), 'error')
  } finally { enviando.value = false }
}

async function _enviarArquivo() {
  const f = selectedFile.value
  const caption = fileCaption.value
  const labels = { image: '[Imagem]', document: `[Documento: ${f.nome}]`, audio: '[Áudio]' }
  const previewText = caption || labels[f.tipo] || '[Arquivo]'
  const opt = { id: 'opt_' + Date.now(), direcao: 'enviado', mensagem: previewText, data: new Date().toISOString(), canal: 'whatsapp' }
  waMsgs.value.push(opt)
  selectedFile.value = null; fileCaption.value = ''
  enviando.value = true; scrollBottom()
  try {
    await wa.enviarArquivo(activeLead.value.id, auth.user.id, activeLead.value.telefone, f.tipo, f.dataUrl, f.nome, caption)
    await wa.loadChats()
  } catch (e) {
    waMsgs.value = waMsgs.value.filter(m => m.id !== opt.id)
    toast('Erro ao enviar arquivo: ' + (e?.message || ''), 'error')
  } finally { enviando.value = false }
}

function irCRM() { router.push('/crm') }

// ── Realtime ──
let realtimeChannel = null
onMounted(async () => {
  window.addEventListener('resize', onResize)
  document.addEventListener('click', onDocClick, true)

  loading.value = true
  await Promise.all([wa.loadChats(), work.load()])
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
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  document.removeEventListener('click', onDocClick, true)
  if (realtimeChannel) sb.removeChannel(realtimeChannel)
})
</script>

<style scoped>
/* ── Root ── */
@keyframes sz-fadein { from { opacity: 0 } to { opacity: 1 } }

.sz-root {
  display: flex;
  height: calc(100vh - 56px);
  overflow: hidden;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-base);
  animation: sz-fadein .15s ease;
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
.sz-search-wrap { position: relative; }
.sz-search-icon {
  position: absolute; left: .7rem; top: 50%; transform: translateY(-50%);
  color: var(--text-tertiary); pointer-events: none;
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
  padding: 3rem 1rem; text-align: center;
  color: var(--text-tertiary); font-size: .82rem;
}

/* ── Chat item ── */
.sz-item {
  width: 100%; display: flex; align-items: center; gap: .75rem;
  padding: .65rem 1rem; border: none; background: none;
  cursor: pointer; text-align: left; transition: background .12s;
  touch-action: manipulation; min-height: 64px; position: relative;
}
.sz-item::after {
  content: ''; position: absolute; bottom: 0; left: 68px; right: 0;
  height: 1px; background: var(--border-subtle);
}
.sz-item:hover { background: var(--bg-elevated); }
.sz-item:active { background: var(--bg-overlay); }
.sz-item--active { background: var(--accent-subtle); }
.sz-item--active::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; background: var(--accent); border-radius: 0 2px 2px 0; z-index: 2;
}
.sz-item-status-bar {
  position: absolute; left: 0; top: 6px; bottom: 6px;
  width: 3px; border-radius: 0 2px 2px 0; z-index: 1;
}

.sz-avatar-wrap { position: relative; flex-shrink: 0; }
.sz-avatar {
  width: 46px; height: 46px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .8rem; font-weight: 700; color: #fff; flex-shrink: 0;
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
  flex: 1; display: flex; flex-direction: column;
  min-width: 0; background: var(--bg-base); position: relative;
}

/* ── Chat header ── */
.sz-chat-header {
  display: flex; align-items: center; gap: .65rem;
  padding: .7rem 1rem;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky; top: 0; z-index: 10; min-height: 56px;
}
.sz-back-btn {
  display: flex; align-items: center; gap: .3rem;
  border: none; background: none; color: var(--accent);
  cursor: pointer; padding: .5rem .4rem; border-radius: 8px;
  min-width: 44px; min-height: 44px; justify-content: center;
  touch-action: manipulation; flex-shrink: 0;
}
.sz-back-label { font-size: .85rem; font-weight: 500; }
.sz-chat-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .73rem; font-weight: 700; color: #fff; flex-shrink: 0;
}
.sz-chat-meta { flex: 1; min-width: 0; }
.sz-chat-name { display: block; font-size: .9rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sz-chat-status { font-size: .72rem; color: var(--accent); }
.sz-chat-toolbar { display: flex; align-items: center; gap: .4rem; flex-shrink: 0; }
.sz-etapa-badge { font-size: .68rem; font-weight: 600; padding: .2rem .55rem; border-radius: 20px; white-space: nowrap; }
.sz-toolbar-btn {
  width: 34px; height: 34px; min-width: 34px;
  border: none; background: var(--bg-elevated); border-radius: 50%;
  color: var(--text-secondary); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s; touch-action: manipulation;
}
.sz-toolbar-btn:hover { background: var(--bg-overlay); color: var(--text-primary); }

/* ── Status bar ── */
.sz-chat-status-bar {
  display: flex; flex-wrap: wrap; gap: .35rem;
  padding: .4rem .75rem;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}
.sz-status-chip {
  display: inline-flex; align-items: center; gap: .3rem;
  font-size: .72rem; font-weight: 600;
  padding: .2rem .55rem; border-radius: 20px;
  letter-spacing: .02em;
}
.sz-status-date { font-weight: 400; opacity: .85; }

/* ── Messages ── */
.sz-messages {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  padding: .75rem 1rem 1rem;
  display: flex; flex-direction: column; scroll-behavior: smooth;
}
.sz-messages::-webkit-scrollbar { width: 3px; }
.sz-messages::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 2px; }

.sz-msgs-loading { display: flex; justify-content: center; padding: 2rem; }
.sz-no-msgs { text-align: center; color: var(--text-tertiary); font-size: .83rem; padding: 3rem 1rem; line-height: 1.7; }

/* ── Time separator ── */
.sz-time-sep {
  text-align: center; font-size: .7rem; color: var(--text-tertiary);
  margin: .75rem 0 .5rem; font-weight: 500; letter-spacing: .03em;
}

/* ── Bubbles ── */
.sz-bubble-wrap {
  display: flex; margin-bottom: 2px;
  animation: sz-bubble-in .18s cubic-bezier(.17,.67,.45,1.4);
}
.sz-bubble-wrap--out { justify-content: flex-end; }
.sz-bubble-wrap--in  { justify-content: flex-start; }
@keyframes sz-bubble-in { from { opacity: 0; transform: scale(.88) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.sz-bubble {
  max-width: 72%; padding: .5rem .75rem .35rem;
  border-radius: 18px; position: relative; word-break: break-word;
}
.sz-bubble--out { background: var(--accent); color: #000; border-bottom-right-radius: 18px; }
.sz-bubble--in  { background: var(--bg-overlay); color: var(--text-primary); border-bottom-left-radius: 18px; }
.sz-bubble--tail-out { border-bottom-right-radius: 4px; }
.sz-bubble--tail-in  { border-bottom-left-radius: 4px; }
.sz-bubble--stacked  { border-radius: 18px; margin-bottom: 1px; }

.sz-bubble-text { font-size: .88rem; line-height: 1.45; display: block; }
.sz-bubble-footer { display: flex; align-items: center; justify-content: flex-end; gap: .25rem; margin-top: .2rem; }
.sz-bubble-time { font-size: .65rem; opacity: .6; }
.sz-bubble--out .sz-bubble-time { color: rgba(0,0,0,.6); }
.sz-bubble-check { font-size: .65rem; color: rgba(0,0,0,.55); }

/* ── Typing ── */
.sz-typing { display: flex; align-items: center; gap: 4px; padding: .6rem .8rem; background: var(--bg-overlay); border-radius: 18px; border-bottom-left-radius: 4px; width: fit-content; }
.sz-typing span { width: 7px; height: 7px; border-radius: 50%; background: var(--text-tertiary); animation: sz-bounce .9s ease-in-out infinite; }
.sz-typing span:nth-child(2) { animation-delay: .15s; }
.sz-typing span:nth-child(3) { animation-delay: .3s; }
@keyframes sz-bounce { 0%, 80%, 100% { transform: scale(.8); opacity: .5; } 40% { transform: scale(1.1); opacity: 1; } }

/* ── File preview ── */
.sz-file-preview {
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  padding: .55rem .75rem;
  display: flex; align-items: center; gap: .65rem;
}
.sz-file-preview-inner {
  flex: 1; display: flex; align-items: center; gap: .65rem; min-width: 0;
}
.sz-preview-img {
  height: 50px; width: 50px; object-fit: cover; border-radius: 8px; flex-shrink: 0;
}
.sz-preview-file-info {
  display: flex; align-items: center; gap: .45rem; color: var(--text-secondary);
}
.sz-preview-fname {
  font-size: .8rem; color: var(--text-primary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px;
}
.sz-preview-caption {
  flex: 1; background: none; border: none; outline: none;
  color: var(--text-primary); font-size: .84rem; font-family: inherit;
  min-width: 0;
}
.sz-preview-caption::placeholder { color: var(--text-tertiary); }
.sz-preview-remove {
  width: 26px; height: 26px; min-width: 26px; border-radius: 50%;
  border: none; background: var(--bg-overlay); color: var(--text-secondary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background .15s;
}
.sz-preview-remove:hover { background: var(--status-danger); color: #fff; }

/* ── Composer ── */
.sz-composer {
  padding: .5rem .75rem;
  padding-bottom: max(.5rem, env(safe-area-inset-bottom));
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
}
.sz-composer-inner { display: flex; align-items: flex-end; gap: .5rem; }

/* ── Attach menu ── */
.sz-attach-wrap { position: relative; }
.sz-attach-menu {
  position: absolute; bottom: calc(100% + .5rem); left: 0;
  background: var(--bg-elevated); border: 1px solid var(--border-default);
  border-radius: 12px; overflow: hidden; min-width: 152px;
  box-shadow: 0 8px 24px rgba(0,0,0,.2); z-index: 100;
}
.sz-attach-item {
  display: flex; align-items: center; gap: .55rem;
  width: 100%; padding: .6rem .85rem;
  border: none; background: none; color: var(--text-primary);
  font-size: .84rem; font-family: inherit; cursor: pointer; text-align: left;
  transition: background .12s;
}
.sz-attach-item:hover { background: var(--bg-overlay); }
.sz-attach-item + .sz-attach-item { border-top: 1px solid var(--border-subtle); }

.sz-attach-icon { transition: transform .2s cubic-bezier(.34,1.56,.64,1); }
.sz-composer-btn--open .sz-attach-icon { transform: rotate(45deg); }

.sz-composer-btn, .sz-mic-btn {
  width: 34px; height: 34px; min-width: 34px;
  border-radius: 50%; border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; transition: all .15s;
  touch-action: manipulation; margin-bottom: 2px;
}
.sz-composer-btn { background: var(--bg-elevated); color: var(--text-secondary); }
.sz-composer-btn:hover { background: var(--bg-overlay); }
.sz-mic-btn { background: var(--accent); color: #000; }
.sz-input-wrap { flex: 1; }
.sz-input {
  width: 100%; background: var(--bg-elevated); border: 1px solid var(--border-default);
  border-radius: 20px; padding: .55rem 1rem;
  color: var(--text-primary); font-size: .88rem; font-family: inherit;
  resize: none; outline: none; line-height: 1.45;
  transition: border-color .15s, background .15s;
  display: block; overflow: hidden; max-height: 120px;
}
.sz-input:focus { border-color: var(--accent); background: var(--bg-overlay); }
.sz-input::placeholder { color: var(--text-tertiary); }

.sz-send-btn {
  width: 34px; height: 34px; min-width: 34px;
  border-radius: 50%; border: none; background: var(--accent); color: #000;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; transition: transform .15s, opacity .15s;
  touch-action: manipulation; margin-bottom: 2px;
}
.sz-send-btn:hover { transform: scale(1.08); }
.sz-send-btn:active { transform: scale(.94); }
.sz-send-btn:disabled { opacity: .4; }

.sz-send-enter-active, .sz-send-leave-active { transition: all .15s cubic-bezier(.34,1.56,.64,1); }
.sz-send-enter-from { opacity: 0; transform: scale(.4); }
.sz-send-leave-to { opacity: 0; transform: scale(.4); }

.sz-attach-enter-active { transition: all .15s cubic-bezier(.34,1.56,.64,1); }
.sz-attach-leave-active { transition: all .1s ease; }
.sz-attach-enter-from { opacity: 0; transform: scale(.9) translateY(4px); }
.sz-attach-leave-to { opacity: 0; transform: scale(.9) translateY(4px); }

/* ── Contact panel ── */
.sz-panel-bg {
  position: absolute; inset: 0; background: rgba(0,0,0,.35); z-index: 30;
}
.sz-contact-panel {
  position: absolute; top: 0; right: 0; bottom: 0; width: 320px;
  background: var(--bg-surface); border-left: 1px solid var(--border-subtle);
  z-index: 40; display: flex; flex-direction: column; overflow: hidden;
}
.sz-cp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: .85rem 1rem; border-bottom: 1px solid var(--border-subtle); flex-shrink: 0;
}
.sz-cp-title { font-size: .95rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.sz-cp-close {
  width: 28px; height: 28px; border-radius: 50%; border: none;
  background: var(--bg-elevated); color: var(--text-secondary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background .15s;
}
.sz-cp-close:hover { background: var(--bg-overlay); }
.sz-cp-body {
  flex: 1; overflow-y: auto; padding: 1rem;
  display: flex; flex-direction: column; gap: .85rem;
}
.sz-cp-identity {
  display: flex; align-items: center; gap: .75rem;
  padding-bottom: .75rem; border-bottom: 1px solid var(--border-subtle);
}
.sz-cp-avatar {
  width: 48px; height: 48px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .85rem; font-weight: 700; color: #fff; flex-shrink: 0;
}
.sz-cp-name { font-size: .95rem; font-weight: 700; color: var(--text-primary); margin: 0 0 .3rem; }
.sz-cp-section { }
.sz-cp-section-title {
  font-size: .68rem; font-weight: 700; color: var(--text-tertiary);
  text-transform: uppercase; letter-spacing: .06em; margin: 0 0 .4rem;
}
.sz-cp-field {
  display: flex; flex-direction: column; gap: .1rem;
  padding: .3rem 0; border-bottom: 1px solid var(--border-subtle);
}
.sz-cp-field:last-child { border-bottom: none; }
.sz-cp-label { font-size: .7rem; color: var(--text-tertiary); }
.sz-cp-value { font-size: .84rem; color: var(--text-primary); }
.sz-cp-obs { white-space: pre-wrap; line-height: 1.5; font-size: .8rem; }
.sz-cp-work-item {
  background: var(--bg-elevated); border-radius: 10px;
  padding: .6rem .75rem; margin-bottom: .35rem;
}
.sz-cp-work-header {
  display: flex; justify-content: space-between; align-items: center;
  gap: .5rem; margin-bottom: .3rem;
}
.sz-cp-work-service { font-size: .84rem; font-weight: 600; color: var(--text-primary); }
.sz-cp-work-badge {
  font-size: .67rem; font-weight: 600; padding: .15rem .45rem; border-radius: 20px;
  white-space: nowrap;
}
.sz-cp-work-badge--ativo { background: rgba(91,141,238,.15); color: #5b8dee; }
.sz-cp-work-badge--concluido { background: var(--accent-subtle); color: var(--accent); }
.sz-cp-work-progress { display: flex; align-items: center; gap: .5rem; }
.sz-cp-progress-bar {
  flex: 1; height: 4px; background: var(--bg-overlay); border-radius: 4px; overflow: hidden;
}
.sz-cp-progress-fill {
  height: 100%; background: var(--accent); border-radius: 4px; transition: width .3s;
}
.sz-cp-progress-text { font-size: .7rem; color: var(--text-tertiary); white-space: nowrap; }
.sz-cp-actions { padding-top: .25rem; }

/* Panel transitions */
.sz-panel-enter-active { transition: transform .25s cubic-bezier(.4,0,.2,1); }
.sz-panel-leave-active { transition: transform .2s ease; }
.sz-panel-enter-from, .sz-panel-leave-to { transform: translateX(100%); }

.sz-panel-bg-enter-active { transition: opacity .2s; }
.sz-panel-bg-leave-active { transition: opacity .15s; }
.sz-panel-bg-enter-from, .sz-panel-bg-leave-to { opacity: 0; }

/* ── Empty state ── */
.sz-empty-chat {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: .6rem; background: var(--bg-base);
}
.sz-empty-icon { margin-bottom: .25rem; }
.sz-empty-title { font-size: 1.1rem; font-weight: 600; color: var(--text-primary); }
.sz-empty-sub { font-size: .83rem; color: var(--text-tertiary); }

/* ── Responsive ── */
@media (max-width: 767px) {
  .sz-root { position: relative; height: calc(100vh - 56px - 68px); }
  .sz-sidebar { width: 100%; min-width: 0; border-right: none; }
  .sz-sidebar--hidden { display: none; }
  .sz-chat { position: absolute; inset: 0; z-index: 20; }
  .sz-contact-panel {
    left: 0; width: 100%; top: auto; bottom: 0; height: 82dvh;
    border-left: none; border-top: 1px solid var(--border-default);
    border-radius: 16px 16px 0 0;
  }
  .sz-panel-enter-from, .sz-panel-leave-to { transform: translateY(100%); }
}
@media (min-width: 768px) {
  .sz-back-btn { display: none; }
}
</style>
