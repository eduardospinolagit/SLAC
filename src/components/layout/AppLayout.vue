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
                  <span class="ud-role">PRO</span>
                </div>
                <div class="ud-divider"></div>
                <button class="ud-item" @click="go('/configuracoes'); userMenuOpen = false">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  Configurações
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
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppInit } from '@/composables/useAppInit'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()
const { theme, toggleTheme } = useTheme()
const isDark = computed(() => theme.value === 'dark')

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

const icons = {
  dashboard:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
  crm:          `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  financeiro:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  recorrencias: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
  mapa:         `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
  search:       `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
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
}
onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))

// Welcome
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
.sb-section { padding: 0 .5rem; margin-bottom: .625rem; }
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
  width: 100%; padding: .6rem .625rem;
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
.ud-role { font-size: .6rem; font-weight: 700; letter-spacing: .07em; color: var(--accent); text-transform: uppercase; }
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
</style>
