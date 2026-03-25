<template>
  <div class="layout" :class="{ collapsed }">
    <aside class="sidebar">

      <div class="sb-top">
        <button class="sb-logo-btn" @click="toggle">
          <img src="/logo.png" alt="SLAC" class="sb-logo" />
        </button>
      </div>

      <nav class="sb-nav">
        <div class="sb-section">
          <p class="sb-section-label">Principal</p>
          <button v-for="item in mainNav" :key="item.path"
            class="sb-item" :class="{ active: route.path === item.path }"
            @click="go(item.path)" :title="item.label">
            <span class="sb-icon" v-html="item.icon"></span>
            <span class="sb-text">{{ item.label }}</span>
          </button>
        </div>
        <div class="sb-section">
          <p class="sb-section-label">Ferramentas</p>
          <button class="sb-item" :class="{ active: route.path === '/prospeccao' }"
            @click="go('/prospeccao')" title="Prospecção">
            <span class="sb-icon" v-html="icons.search"></span>
            <span class="sb-text">Prospecção</span>
          </button>
          <button class="sb-item" :class="{ active: route.path === '/slaczap' }"
            @click="go('/slaczap')" title="SlacZap">
            <span class="sb-icon" v-html="icons.slaczap"></span>
            <span class="sb-text">SlacZap</span>
          </button>
          <button class="sb-item" :class="{ active: route.path === '/contatos' }"
            @click="go('/contatos')" title="Contatos">
            <span class="sb-icon" v-html="icons.contatos"></span>
            <span class="sb-text">Contatos</span>
          </button>
          <button class="sb-item" :class="{ active: route.path === '/work' }"
            @click="go('/work')" title="Work">
            <span class="sb-icon" v-html="icons.work"></span>
            <span class="sb-text">Work</span>
          </button>
          <button v-if="auth.isAdmin" class="sb-item" :class="{ active: route.path === '/logs' }"
            @click="go('/logs')" title="Logs">
            <span class="sb-icon" v-html="icons.logs"></span>
            <span class="sb-text">Logs</span>
          </button>
        </div>
      </nav>

      <div class="sb-footer">
        <!-- Theme pill + by Sano na mesma linha -->
        <div class="theme-row">
          <div class="theme-pill">
            <button class="theme-opt" :class="{ active: isDark }"
              @click="isDark ? null : toggleTheme()" title="Modo escuro">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>
            <button class="theme-opt" :class="{ active: !isDark }"
              @click="!isDark ? null : toggleTheme()" title="Modo claro">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            </button>
          </div>
          <span class="sb-by">by Sano Lab ©</span>
        </div>
      </div>
    </aside>

    <div class="main-wrapper">
      <header class="topbar">
        <div class="topbar-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="searchQuery" class="topbar-input" type="text"
            placeholder="Pesquisar..." @keydown.enter="runSearch" @input="onSearchInput" />
          <kbd v-if="!searchQuery" class="topbar-kbd">⌘K</kbd>
          <button v-else class="topbar-clear" @click="searchQuery = ''; searchResults = []">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div v-if="searchResults.length" class="search-dropdown">
            <button v-for="r in searchResults" :key="r.path" class="search-result"
              @click="go(r.path); searchQuery = ''; searchResults = []">
              <span class="sr-icon" v-html="r.icon"></span>
              <div class="sr-info">
                <span class="sr-label">{{ r.label }}</span>
                <span class="sr-desc">{{ r.desc }}</span>
              </div>
            </button>
          </div>
        </div>
        <div class="topbar-right">
          <div class="user-menu" ref="userMenuRef">
            <button class="user-avatar" @click="userMenuOpen = !userMenuOpen" :title="auth.userName">
              {{ userInitial }}
            </button>
            <Transition name="menu-pop">
              <div v-if="userMenuOpen" class="user-dropdown">
                <div class="user-dropdown-header">
                  <span class="ud-name">{{ auth.userName }}</span>
                  <span class="ud-role" :class="`ud-role--${auth.role}`">{{ auth.roleLabel }}</span>
                </div>
                <div class="ud-divider"></div>
                <button class="ud-item" @click="go('/configuracoes'); userMenuOpen = false">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  Configurações
                </button>
                <button class="ud-item" @click="handleUndo" :class="{ 'ud-undo-active': leads.undoStack.length }">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                  Desfazer
                  <span v-if="leads.undoStack.length" class="ud-undo-badge">{{ leads.undoStack.length }}</span>
                </button>
                <button class="ud-item" @click="showUpdates = true; userMenuOpen = false">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  Atualizações
                </button>
                <button class="ud-item ud-danger" @click="handleLogout">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sair
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </header>
      <main class="main"><router-view /></main>
    </div>
  </div>

  <nav class="mobile-nav">
    <button v-for="item in mobileNav" :key="item.path"
      class="mob-item" :class="{ active: route.path === item.path }" @click="go(item.path)">
      <span v-html="item.icon"></span>
      <span>{{ item.short }}</span>
    </button>
    <button class="mob-item" @click="toggleTheme">
      <span><svg v-if="isDark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/></svg><svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></span>
      <span>Tema</span>
    </button>
  </nav>

  <!-- Modal boas-vindas de volta -->
  <Teleport to="body">
    <Transition name="wb-modal">
      <div v-if="showWelcomeBack" class="wb-backdrop" @click.self="showWelcomeBack = false" @keydown.esc="showWelcomeBack = false">
        <div class="wb-card">
          <button class="wb-close" @click="showWelcomeBack = false">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <div class="wb-header">
            <span class="wb-label">Bem-vindo de volta</span>
            <h2 class="wb-name">{{ auth.userName }}</h2>
            <span class="wb-date">{{ wbDate }}</span>
          </div>

          <div class="wb-stats">
            <div class="wb-stat">
              <span class="wb-stat-val" style="color:var(--status-info)">{{ wbStats.total }}</span>
              <span class="wb-stat-label">Leads</span>
            </div>
            <div class="wb-stat">
              <span class="wb-stat-val" :style="{ color: wbStats.fuHoje > 0 ? 'var(--status-warning)' : 'var(--text-secondary)' }">{{ wbStats.fuHoje }}</span>
              <span class="wb-stat-label">Follow-ups</span>
            </div>
            <div class="wb-stat">
              <span class="wb-stat-val" style="color:var(--accent)">{{ wbStats.fechados }}</span>
              <span class="wb-stat-label">Fechados</span>
            </div>
          </div>

          <div class="wb-row wb-row--accent">
            <span class="wb-row-label">Receita do mês</span>
            <span class="wb-row-val" style="color:var(--accent)">{{ wbStats.recMes }}</span>
          </div>
          <div class="wb-row">
            <span class="wb-row-label">Pipeline</span>
            <span class="wb-row-val">{{ wbStats.pipe }}</span>
          </div>

          <button class="btn btn-primary wb-btn" @click="showWelcomeBack = false">
            Ir ao Dashboard
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <div v-if="showWelcomeModal" class="modal-backdrop">
    <div class="modal" style="max-width:400px;text-align:center">
      <div class="modal-body" style="padding:2rem 1.5rem">
        <div style="font-size:2rem;margin-bottom:.75rem">👋</div>
        <h2 style="margin-bottom:.375rem">Bem-vindo ao <span style="color:var(--accent)">SLAC</span></h2>
        <p style="margin-bottom:1.25rem;font-size:.875rem">Como quer ser chamado?</p>
        <input ref="welcomeInput" v-model="welcomeName" class="form-input" type="text"
          placeholder="Seu nome" maxlength="40" @keydown.enter="saveWelcomeName" style="margin-bottom:.75rem" />
        <button class="btn btn-primary" style="width:100%;justify-content:center" @click="saveWelcomeName">Entrar →</button>
      </div>
    </div>
  </div>

  <!-- Modal de Atualizações -->
  <Teleport to="body">
    <Transition name="wb-modal">
      <div v-if="showUpdates" class="wb-backdrop" @click.self="showUpdates = false" @keydown.esc="showUpdates = false">
        <div class="upd-card">
          <button class="wb-close" @click="showUpdates = false">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <div class="upd-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <div>
              <h2 class="upd-title">Atualizações</h2>
              <span class="upd-sub">SLAC — Sano Lab Advanced CRM</span>
            </div>
          </div>

          <div class="upd-list">

            <div class="upd-version">
              <div class="upd-ver-header">
                <span class="upd-badge upd-badge--new">v1.3</span>
                <span class="upd-date">Março 2026</span>
              </div>
              <p class="upd-ver-title">SlacZap — Integração WhatsApp</p>
              <ul class="upd-items">
                <li>Chat ao vivo com leads via WhatsApp (Z-API)</li>
                <li>Gravação e envio de áudio direto no browser</li>
                <li>Envio de imagens, documentos e arquivos de áudio</li>
                <li>Painel de contato com dados CRM + Work + status</li>
                <li>Indicadores visuais de follow-up, relead e work ativo</li>
                <li>Exportar conversa em .txt</li>
                <li>Painel Contatos com acesso rápido ao chat</li>
                <li>Notificações push diárias de follow-up</li>
                <li>Painel de Logs (admin) com diagnóstico em tempo real</li>
              </ul>
            </div>

            <div class="upd-version">
              <div class="upd-ver-header">
                <span class="upd-badge">v1.2</span>
                <span class="upd-date">Fevereiro 2026</span>
              </div>
              <p class="upd-ver-title">Work, Mapa & Melhorias</p>
              <ul class="upd-items">
                <li>Módulo Work: gestão de serviços por cliente com tarefas</li>
                <li>Mapa mental de objetivos por categoria (ok/em andamento/futuro)</li>
                <li>Relead automático: reagenda leads perdidos</li>
                <li>Desfazer ações no CRM (undo stack)</li>
                <li>Boas-vindas de volta com resumo do período ausente</li>
              </ul>
            </div>

            <div class="upd-version">
              <div class="upd-ver-header">
                <span class="upd-badge">v1.1</span>
                <span class="upd-date">Janeiro 2026</span>
              </div>
              <p class="upd-ver-title">Financeiro & Recorrências</p>
              <ul class="upd-items">
                <li>Gestão de recorrências mensais com controle de pagamento</li>
                <li>Fechamento de negócio com cálculo de parcelas</li>
                <li>Gráficos de receita e despesas por período</li>
                <li>Tema claro/escuro com persistência</li>
                <li>PWA: instale o SLAC como app no celular</li>
              </ul>
            </div>

            <div class="upd-version">
              <div class="upd-ver-header">
                <span class="upd-badge">v1.0</span>
                <span class="upd-date">Dezembro 2025</span>
              </div>
              <p class="upd-ver-title">Lançamento inicial</p>
              <ul class="upd-items">
                <li>CRM com kanban de leads (6 etapas) e follow-up</li>
                <li>Prospecção: importar CSV + modo foco fullscreen</li>
                <li>Dashboard com KPIs e gráficos</li>
                <li>Busca global por leads e páginas</li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <ConfigModal v-model="configOpen" />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLeadsStore } from '@/stores/leads'
import { useFinStore } from '@/stores/fin'
import { useAppInit } from '@/composables/useAppInit'
import { useTheme } from '@/composables/useTheme'
import ConfigModal from '@/components/layout/ConfigModal.vue'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()
const leads  = useLeadsStore()
const fin    = useFinStore()
const { theme, toggleTheme } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const toast       = inject('toast')
const configOpen  = ref(false)
const showUpdates = ref(false)

const collapsed = ref(localStorage.getItem('slac-sidebar') === 'collapsed')
function toggle() {
  collapsed.value = !collapsed.value
  localStorage.setItem('slac-sidebar', collapsed.value ? 'collapsed' : 'expanded')
}

const userMenuOpen = ref(false)
const userMenuRef  = ref(null)
const userInitial  = computed(() => (auth.userName || '?').charAt(0).toUpperCase())

function handleClickOutside(e) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target)) userMenuOpen.value = false
}
onMounted(() => document.addEventListener('click', handleClickOutside, true))
onUnmounted(() => document.removeEventListener('click', handleClickOutside, true))

async function handleLogout() {
  userMenuOpen.value = false
  router.push('/login')
  await auth.logout()
}

async function handleUndo() {
  if (!leads.undoStack.length) { toast?.('Nada para desfazer', 'warn'); return }
  userMenuOpen.value = false
  await leads.undo()
  toast?.('Alteração desfeita', 'ok')
}

const icons = {
  dashboard:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
  crm:          `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  financeiro:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  recorrencias: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
  mapa:         `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
  search:       `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  work:         `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>`,
  logs:         `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  slaczap:      `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.43 1.27 4.88L2 22l5.25-1.25A9.95 9.95 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm4.9 14.07c-.2.58-1.19 1.11-1.63 1.18-.44.06-1 .09-1.6-.1-.48-.15-.97-.36-1.45-.53-2.57-1.1-4.07-3.04-4.2-3.18-.12-.17-1.03-1.38-1.03-2.63s.65-1.86.89-2.12c.23-.25.5-.32.67-.32.17 0 .34 0 .48.01.16.01.36-.06.57.43.2.49.7 1.7.76 1.82.06.12.1.26.02.43-.08.16-.12.26-.24.4-.12.14-.26.32-.37.43-.12.12-.25.26-.1.5.14.24.63 1.05 1.36 1.7.94.84 1.73 1.1 1.98 1.22.24.12.39.1.53-.06.14-.16.62-.72.86-.96.24-.25.49-.2.82-.08.33.12 2.07.98 2.42 1.16.35.18.59.27.67.41.09.15.09.85-.11 1.43z"/></svg>`,
  contatos:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
}

const mainNav = [
  { path: '/dashboard',    label: 'Dashboard',    icon: icons.dashboard },
  { path: '/crm',          label: 'CRM',          icon: icons.crm },
  { path: '/financeiro',   label: 'Financeiro',   icon: icons.financeiro },
  { path: '/recorrencias', label: 'Recorrências', icon: icons.recorrencias },

]
const mobileNav = [
  { path: '/dashboard',  short: 'Dash',   icon: icons.dashboard },
  { path: '/crm',        short: 'CRM',    icon: icons.crm },
  { path: '/financeiro', short: 'Fin.',   icon: icons.financeiro },

  { path: '/prospeccao', short: 'Prosp.', icon: icons.search },
  { path: '/work',       short: 'Work',   icon: icons.work },
]

// Search
const searchQuery   = ref('')
const searchResults = ref([])
const allRoutes = [
  { path: '/dashboard',    label: 'Dashboard',    desc: 'KPIs e gráficos',         icon: icons.dashboard },
  { path: '/crm',          label: 'CRM',          desc: 'Kanban e leads',           icon: icons.crm },
  { path: '/financeiro',   label: 'Financeiro',   desc: 'Transações e pagamentos',  icon: icons.financeiro },
  { path: '/recorrencias', label: 'Recorrências', desc: 'Contratos mensais',        icon: icons.recorrencias },

  { path: '/prospeccao',   label: 'Prospecção',   desc: 'Importar e prospectar',    icon: icons.search },
  { path: '/work',         label: 'Work',         desc: 'Serviços em execução',      icon: icons.work },
]

function onSearchInput() {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) { searchResults.value = []; return }
  searchResults.value = allRoutes.filter(r =>
    r.label.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q))
}
function runSearch() {
  if (searchResults.value.length === 1) {
    go(searchResults.value[0].path); searchQuery.value = ''; searchResults.value = []
  }
}
function handleKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); document.querySelector('.topbar-input')?.focus() }
  if (e.key === 'Escape') { searchQuery.value = ''; searchResults.value = []; userMenuOpen.value = false }
  if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
    const active = document.activeElement
    const isEditing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)
    if (!isEditing) { e.preventDefault(); handleUndo() }
  }
}
onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))

// Welcome back modal
const showWelcomeBack = ref(false)

const wbDate = computed(() => {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
})

const wbStats = computed(() => {
  const mesAtual = new Date().toISOString().slice(0, 7)
  const periodo  = fin.calcPeriodo(mesAtual)
  return {
    total:   leads.stats.total,
    fuHoje:  leads.stats.fuHoje,
    fechados: leads.stats.fechados,
    recMes:  fin.fmt(periodo.rec),
    pipe:    fin.fmt(leads.stats.pipe),
  }
})

// Welcome (primeiro acesso — pede nome)
const welcomeInput     = ref(null)
const welcomeName      = ref('')
const showWelcomeModal = ref(false)

onMounted(async () => {
  await useAppInit()
  if (auth.isLoggedIn) {
    const emailPrefix = auth.user?.email?.split('@')[0] || ''
    if (auth.userName === emailPrefix) {
      showWelcomeModal.value = true
      await nextTick()
      welcomeInput.value?.focus()
    } else if (sessionStorage.getItem('slac_show_welcome')) {
      sessionStorage.removeItem('slac_show_welcome')
      showWelcomeBack.value = true
    }
  }
})

async function saveWelcomeName() {
  const nome = welcomeName.value.trim()
  if (!nome) { welcomeInput.value?.focus(); return }
  await auth.saveUserName(nome)
  showWelcomeModal.value = false
}

function go(path) { router.push(path) }
</script>

<style scoped>
.layout { display:flex; min-height:100vh; background:var(--bg-base); }

/* Sidebar */
.sidebar {
  width: 196px; min-width: 196px;
  background: var(--sidebar-bg);
  display: flex; flex-direction: column;
  height: 100vh; position: sticky; top: 0;
  overflow: hidden; z-index: 50;
  transition: width 250ms ease, min-width 250ms ease;
}
.collapsed .sidebar { width: 52px; min-width: 52px; }

.sb-top {
  display: flex; align-items: center; justify-content: center;
  padding: 1rem .75rem; height: 56px; flex-shrink: 0;
}
.sb-logo-btn {
  background: none; border: none; cursor: pointer; padding: .2rem;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px; -webkit-tap-highlight-color: transparent;
  transition: transform 180ms cubic-bezier(.34,1.56,.64,1);
}
.sb-logo-btn:active { transform: scale(.86); }
.sb-logo { height: 28px; width: auto; display: block; }

.sb-nav { flex: 1; overflow-y: auto; overflow-x: hidden; padding: .75rem 0; }
.sb-section { padding: 0 .5rem; margin-bottom: .625rem; display: flex; flex-direction: column; gap: .25rem; }
.sb-section-label {
  font-size: .6rem; font-weight: 700; letter-spacing: .09em;
  text-transform: uppercase; color: var(--text-tertiary);
  padding: .4rem .5rem .2rem; margin: 0; white-space: nowrap;
  overflow: hidden; opacity: 1; max-height: 26px;
  transition: opacity 180ms ease, max-height 250ms ease, padding 250ms ease;
}
.collapsed .sb-section-label { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; }

.sb-item {
  display: flex; align-items: center; gap: .625rem;
  width: 100%; padding: .75rem .625rem;
  border-radius: 8px; background: transparent; border: none;
  color: var(--text-secondary); font-family: var(--font-body);
  font-size: .825rem; font-weight: 500;
  cursor: pointer; text-align: left; white-space: nowrap; overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  transition: background 100ms ease, color 100ms ease;
}
.sb-item:hover { background: var(--bg-overlay); color: var(--text-primary); }
.sb-item:hover .sb-icon { opacity: .7; }
.sb-item.active { background: var(--accent-subtle); color: var(--accent); font-weight: 600; }
.sb-item.active .sb-icon { opacity: 1; }
.collapsed .sb-item { justify-content: center; padding: .575rem; gap: 0; }

.sb-icon {
  flex-shrink: 0; width: 15px; height: 15px;
  display: flex; align-items: center; justify-content: center;
  opacity: .4; transition: opacity 100ms ease;
}
.collapsed .sb-icon { opacity: .55; }
.collapsed .sb-item:hover .sb-icon,
.collapsed .sb-item.active .sb-icon { opacity: 1; }

.sb-text {
  flex: 1; overflow: hidden; text-overflow: ellipsis;
  opacity: 1; max-width: 140px;
  transition: opacity 180ms ease, max-width 250ms ease;
}
.collapsed .sb-text { opacity: 0; max-width: 0; pointer-events: none; }

/* Footer — sem bordas */
.sb-footer {
  padding: .625rem .5rem .75rem;
  display: flex; flex-direction: column; gap: .375rem; flex-shrink: 0;
}

/* Theme row: pill + by Sano lado a lado */
.theme-row {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .125rem .125rem;
}
/* Colapsado: empilha pill + by Sano verticalmente */
.collapsed .theme-row {
  flex-direction: column;
  align-items: center;
  gap: .375rem;
}

.theme-pill {
  display: flex; align-items: center;
  background: var(--bg-overlay);
  border: 1px solid var(--border-default);
  border-radius: 99px;
  padding: .2rem;
  gap: .1rem;
  flex-shrink: 0;
}
/* Colapsado: pill empilha os botões verticalmente */
.collapsed .theme-pill {
  flex-direction: column;
  border-radius: 12px;
  padding: .2rem;
}
.theme-opt {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px;
  border-radius: 99px; background: transparent; border: none;
  color: var(--text-tertiary); cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.theme-opt.active { background: var(--bg-elevated); color: var(--accent); box-shadow: 0 1px 3px rgba(0,0,0,.12); }
.theme-opt:not(.active):hover { color: var(--text-primary); }

.sb-by {
  font-size: .6rem; font-weight: 600;
  color: var(--text-tertiary); letter-spacing: .04em;
  white-space: nowrap;
  overflow: hidden;
  max-width: 90px;
  text-overflow: ellipsis;
}
.collapsed .sb-by { display: none; }

/* Main wrapper */
.main-wrapper { flex: 1; min-width: 0; display: flex; flex-direction: column; }

/* Topbar — sem borda inferior */
.topbar {
  display: flex; align-items: center; gap: 1rem;
  padding: 0 1.25rem; height: 56px;
  background: var(--bg-base);
  flex-shrink: 0;
}

.topbar-search {
  flex: 1; position: relative;
  display: flex; align-items: center; gap: .5rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 99px;
  padding: .375rem .875rem;
  max-width: 440px;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.topbar-search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-subtle); }
.topbar-search > svg { flex-shrink: 0; color: var(--text-tertiary); }

.topbar-input {
  flex: 1; background: transparent; border: none; outline: none;
  font-family: var(--font-body); font-size: .875rem;
  color: var(--text-primary); min-width: 0;
}
.topbar-input::placeholder { color: var(--text-tertiary); }

.topbar-kbd {
  font-size: .65rem; color: var(--text-tertiary);
  background: var(--bg-overlay); border: 1px solid var(--border-default);
  border-radius: 5px; padding: .1rem .375rem;
  font-family: var(--font-body); flex-shrink: 0;
}
.topbar-clear {
  display: flex; align-items: center; background: none; border: none;
  cursor: pointer; color: var(--text-tertiary); padding: 0; flex-shrink: 0;
}
.topbar-clear:hover { color: var(--text-primary); }

.search-dropdown {
  position: absolute; top: calc(100% + 6px); left: 0; right: 0;
  background: var(--bg-elevated); border: 1px solid var(--border-default);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
  overflow: hidden; z-index: 200;
}
.search-result {
  display: flex; align-items: center; gap: .75rem;
  width: 100%; padding: .625rem 1rem;
  background: transparent; border: none; border-bottom: 1px solid var(--border-subtle);
  cursor: pointer; text-align: left; transition: background 100ms ease;
}
.search-result:last-child { border-bottom: none; }
.search-result:hover { background: var(--accent-subtle); }
.sr-icon { flex-shrink: 0; color: var(--text-tertiary); opacity: .7; }
.sr-info { display: flex; flex-direction: column; gap: .1rem; }
.sr-label { font-size: .875rem; font-weight: 600; color: var(--text-primary); }
.sr-desc  { font-size: .75rem; color: var(--text-tertiary); }
.search-result:hover .sr-icon { opacity: 1; color: var(--accent); }
.search-result:hover .sr-label { color: var(--accent); }

.topbar-right { display: flex; align-items: center; gap: .5rem; margin-left: auto; }

.user-menu { position: relative; }
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--accent); color: #fff;
  font-family: var(--font-display); font-size: .875rem; font-weight: 700;
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: transform 150ms ease, box-shadow 150ms ease;
}
.user-avatar:hover { transform: scale(1.06); box-shadow: 0 0 0 3px var(--accent-subtle); }

.user-dropdown {
  position: absolute; top: calc(100% + 8px); right: 0;
  min-width: 172px; background: var(--bg-elevated);
  border: 1px solid var(--border-default); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg); overflow: hidden; z-index: 300;
}
.user-dropdown-header { padding: .625rem .875rem .375rem; display: flex; flex-direction: column; gap: .15rem; }
.ud-name { font-size: .875rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; }
.ud-role {
  font-size: .58rem; font-weight: 800; letter-spacing: .1em;
  text-transform: uppercase; border-radius: 6px;
  padding: .2rem .5rem;
}
.ud-role--pro {
  background: linear-gradient(135deg, rgba(34,197,94,.18), rgba(34,197,94,.08));
  color: #4ade80;
  border: 1px solid rgba(34,197,94,.35);
}
.ud-role--elite {
  background: linear-gradient(135deg, rgba(251,191,36,.22), rgba(245,158,11,.08));
  color: #fbbf24;
  border: 1px solid rgba(251,191,36,.4);
  box-shadow: 0 0 8px rgba(251,191,36,.2);
}
.ud-role--admin {
  background: linear-gradient(135deg, rgba(239,68,68,.2), rgba(220,38,38,.08));
  color: #f87171;
  border: 1px solid rgba(239,68,68,.4);
  box-shadow: 0 0 8px rgba(239,68,68,.2);
}
.ud-divider { height: 1px; background: var(--border-default); }
.ud-item {
  display: flex; align-items: center; gap: .5rem;
  width: 100%; padding: .575rem .875rem;
  background: transparent; border: none;
  font-family: var(--font-body); font-size: .8125rem; font-weight: 500;
  color: var(--text-secondary); cursor: pointer; text-align: left;
  transition: background 100ms ease, color 100ms ease;
}
.ud-item:hover { background: var(--accent-subtle); color: var(--accent); }
.ud-danger:hover { background: var(--status-danger-subtle); color: var(--status-danger); }
.ud-undo-active { color: var(--status-warning); }
.ud-undo-active:hover { background: rgba(245,158,11,.1); color: var(--status-warning); }
.ud-undo-badge {
  margin-left: auto; background: var(--status-warning); color: #000;
  font-size: .6rem; font-weight: 700; padding: .1rem .35rem;
  border-radius: 99px; line-height: 1.4;
}

.menu-pop-enter-active { transition: all 150ms cubic-bezier(.34,1.56,.64,1); }
.menu-pop-leave-active { transition: all 100ms ease; }
.menu-pop-enter-from   { opacity: 0; transform: scale(.92) translateY(-6px); }
.menu-pop-leave-to     { opacity: 0; transform: scale(.96) translateY(-4px); }

.main { flex: 1; min-width: 0; overflow-x: hidden; }

.mobile-nav {
  display: none; position: fixed; bottom: 0; left: 0; right: 0;
  background: var(--sidebar-bg); border-top: 1px solid var(--sidebar-border);
  z-index: 200; padding-bottom: env(safe-area-inset-bottom);
  justify-content: space-around; align-items: center; padding-top: .25rem;
}
.mob-item {
  display: flex; flex-direction: column; align-items: center; gap: .15rem;
  background: none; border: none; color: var(--text-tertiary);
  font-family: var(--font-body); font-size: .6rem; font-weight: 500;
  padding: .375rem .5rem; cursor: pointer; border-radius: 8px;
  transition: color 100ms ease; min-width: 44px;
}
.mob-item.active, .mob-item:hover { color: var(--accent); }

@media (max-width: 768px) {
  .sidebar { display: none; }
  .mobile-nav { display: flex; }
  .main { padding-bottom: 68px; }
}


/* ── Welcome back modal ── */
.wb-backdrop {
  position: fixed; inset: 0; z-index: 9000;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0.35);
}
[data-theme="light"] .wb-backdrop { background: rgba(200, 200, 210, 0.3); }

.wb-card {
  position: relative;
  width: 320px;
  padding: 1.625rem 1.75rem 1.5rem;
  border-radius: 20px;
  background: rgba(18, 18, 18, 0.38);
  backdrop-filter: blur(32px) saturate(180%);
  -webkit-backdrop-filter: blur(32px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 28px 72px rgba(0, 0, 0, 0.55), 0 1px 0 rgba(255, 255, 255, 0.05) inset;
}
[data-theme="light"] .wb-card {
  background: rgba(255, 255, 255, 0.42);
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.9) inset;
}

.wb-close {
  position: absolute; top: 1rem; right: 1rem;
  background: rgba(255,255,255,.06); border: none; border-radius: 50%;
  width: 26px; height: 26px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,.35); transition: background 120ms ease, color 120ms ease;
}
.wb-close:hover { background: rgba(255,255,255,.12); color: rgba(255,255,255,.7); }
[data-theme="light"] .wb-close { background: rgba(0,0,0,.05); color: rgba(0,0,0,.3); }
[data-theme="light"] .wb-close:hover { background: rgba(0,0,0,.1); color: rgba(0,0,0,.6); }

.wb-header { margin-bottom: 1.125rem; }
.wb-label {
  display: block;
  font-size: .65rem; font-weight: 600; letter-spacing: .07em;
  text-transform: uppercase; color: rgba(255,255,255,.38);
  margin-bottom: .25rem;
}
[data-theme="light"] .wb-label { color: rgba(0,0,0,.38); }
.wb-name {
  margin: 0 0 .2rem; font-size: 1.25rem; font-weight: 700;
  color: var(--text-primary); letter-spacing: -.02em;
}
.wb-date { font-size: .72rem; color: rgba(255,255,255,.3); }
[data-theme="light"] .wb-date { color: rgba(0,0,0,.3); }

.wb-stats {
  display: grid; grid-template-columns: 1fr 1fr 1fr;
  gap: .5rem; margin-bottom: .625rem;
}
.wb-stat {
  display: flex; flex-direction: column; align-items: center; gap: .15rem;
  background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.07);
  border-radius: 12px; padding: .625rem .375rem;
}
[data-theme="light"] .wb-stat {
  background: rgba(0,0,0,.04); border-color: rgba(0,0,0,.07);
}
.wb-stat-val { font-size: 1.125rem; font-weight: 700; line-height: 1; }
.wb-stat-label { font-size: .6rem; color: rgba(255,255,255,.35); }
[data-theme="light"] .wb-stat-label { color: rgba(0,0,0,.38); }

.wb-row {
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.06);
  border-radius: 10px; padding: .5rem .75rem; margin-bottom: .5rem;
}
[data-theme="light"] .wb-row { background: rgba(0,0,0,.04); border-color: rgba(0,0,0,.07); }
.wb-row--accent { background: rgba(34,197,94,.07); border-color: rgba(34,197,94,.15); }
[data-theme="light"] .wb-row--accent { background: rgba(34,197,94,.07); border-color: rgba(34,197,94,.2); }
.wb-row-label { font-size: .68rem; color: rgba(255,255,255,.38); }
[data-theme="light"] .wb-row-label { color: rgba(0,0,0,.4); }
.wb-row-val { font-size: .875rem; font-weight: 600; color: var(--text-primary); }

.wb-btn { width: 100%; justify-content: center; gap: .5rem; margin-top: .875rem; }

/* Animação — apenas opacidade */
.wb-modal-enter-active { transition: opacity 280ms ease; }
.wb-modal-leave-active { transition: opacity 180ms ease; }
.wb-modal-enter-from   { opacity: 0; }
.wb-modal-leave-to     { opacity: 0; }

/* ── Modal Atualizações ── */
.upd-card {
  position: relative;
  width: 440px;
  max-width: calc(100vw - 2rem);
  max-height: 82vh;
  border-radius: 20px;
  background: rgba(18,18,18,.42);
  backdrop-filter: blur(32px) saturate(180%);
  -webkit-backdrop-filter: blur(32px) saturate(180%);
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 28px 72px rgba(0,0,0,.55), 0 1px 0 rgba(255,255,255,.05) inset;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
[data-theme="light"] .upd-card {
  background: rgba(255,255,255,.5);
  border: 1px solid rgba(255,255,255,.8);
  box-shadow: 0 20px 60px rgba(0,0,0,.12), 0 1px 0 rgba(255,255,255,.9) inset;
}
.upd-header {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: 1.4rem 1.5rem 1rem;
  flex-shrink: 0;
  color: var(--accent);
  border-bottom: 1px solid rgba(255,255,255,.07);
}
[data-theme="light"] .upd-header { border-bottom-color: rgba(0,0,0,.06); }
.upd-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.upd-sub {
  font-size: .72rem;
  color: var(--text-tertiary);
}
.upd-list {
  overflow-y: auto;
  padding: .75rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.upd-list::-webkit-scrollbar { width: 3px; }
.upd-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 2px; }
.upd-version { }
.upd-ver-header {
  display: flex;
  align-items: center;
  gap: .55rem;
  margin-bottom: .35rem;
}
.upd-badge {
  font-size: .7rem;
  font-weight: 700;
  padding: .18rem .55rem;
  border-radius: 20px;
  background: rgba(255,255,255,.08);
  color: var(--text-secondary);
  letter-spacing: .04em;
}
.upd-badge--new {
  background: rgba(34,197,94,.18);
  color: var(--accent);
}
.upd-date {
  font-size: .72rem;
  color: var(--text-tertiary);
}
.upd-ver-title {
  font-size: .88rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 .45rem;
}
.upd-items {
  margin: 0;
  padding: 0 0 0 1.1rem;
  display: flex;
  flex-direction: column;
  gap: .28rem;
  list-style: none;
}
.upd-items li {
  font-size: .8rem;
  color: var(--text-secondary);
  line-height: 1.5;
  position: relative;
}
.upd-items li::before {
  content: '·';
  position: absolute;
  left: -1rem;
  color: var(--text-tertiary);
}
</style>
