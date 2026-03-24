<template>
  <div class="layout" :class="{ 'sidebar-collapsed': collapsed }">
    <!-- SIDEBAR DESKTOP -->
    <aside class="sidebar">

      <!-- Logo + collapse button -->
      <div class="sb-logo">
        <img src="/logo.png" alt="SLAC" />
        <span class="sb-logo-text" v-show="!collapsed">SLAC</span>
        <button class="sb-collapse-btn" @click="collapsed = !collapsed" :title="collapsed ? 'Expandir menu' : 'Recolher menu'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline v-if="!collapsed" points="15 18 9 12 15 6"/>
            <polyline v-else points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      <!-- Nav principal -->
      <nav class="sb-nav">
        <div class="sb-section">
          <span class="sb-label" v-show="!collapsed">Principal</span>

          <button class="sb-item" :class="{ active: route.path === '/dashboard' }" @click="go('/dashboard')" :title="collapsed ? 'Dashboard' : ''">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span v-show="!collapsed">Dashboard</span>
          </button>

          <button class="sb-item" :class="{ active: route.path === '/crm' }" @click="go('/crm')" :title="collapsed ? 'CRM' : ''">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span v-show="!collapsed">CRM</span>
          </button>

          <button class="sb-item" :class="{ active: route.path === '/financeiro' }" @click="go('/financeiro')" :title="collapsed ? 'Financeiro' : ''">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <span v-show="!collapsed">Financeiro</span>
          </button>

          <button class="sb-item" :class="{ active: route.path === '/recorrencias' }" @click="go('/recorrencias')" :title="collapsed ? 'Recorrências' : ''">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            <span v-show="!collapsed">Recorrências</span>
          </button>

          <button class="sb-item" :class="{ active: route.path === '/mapa' }" @click="go('/mapa')" :title="collapsed ? 'Mapa Mental' : ''">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
              <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
            </svg>
            <span v-show="!collapsed">Mapa Mental</span>
          </button>
        </div>

        <div class="sb-section">
          <span class="sb-label" v-show="!collapsed">Ferramentas</span>
          <button class="sb-item" :class="{ active: route.path === '/prospeccao' }" @click="go('/prospeccao')" :title="collapsed ? 'Prospecção' : ''">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            <span v-show="!collapsed">Prospecção</span>
          </button>
        </div>
      </nav>

      <!-- Footer da sidebar -->
      <div class="sb-footer">
        <!-- Toggle de tema -->
        <button class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Modo claro' : 'Modo escuro'">
          <svg v-if="isDark" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <span v-show="!collapsed">{{ isDark ? 'Modo claro' : 'Modo escuro' }}</span>
        </button>

        <!-- Usuário -->
        <div class="sb-user" v-show="!collapsed">
          <div class="avatar avatar-sm">{{ userInitial }}</div>
          <span class="sb-user-name">{{ auth.userName }}</span>
          <span class="badge badge-accent" style="font-size:0.6rem;padding:0.15rem 0.4rem;flex-shrink:0">PRO</span>
        </div>
        <div class="avatar avatar-sm" v-show="collapsed" style="margin:0 auto">{{ userInitial }}</div>

        <button class="sb-logout" @click="auth.logout()" :title="collapsed ? 'Sair' : ''">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span v-show="!collapsed">Sair</span>
        </button>

        <div class="sb-dev" v-show="!collapsed">Desenvolvido por Sano Lab</div>
      </div>
    </aside>

    <!-- MAIN -->
    <main class="main">
      <router-view />
    </main>
  </div>

  <!-- MOBILE NAV -->
  <nav class="mobile-nav">
    <div class="mnav-inner">
      <button class="mob-item" :class="{ active: route.path === '/dashboard' }" @click="go('/dashboard')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
        </svg>
        <span>Dash</span>
      </button>
      <button class="mob-item" :class="{ active: route.path === '/crm' }" @click="go('/crm')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
        </svg>
        <span>CRM</span>
      </button>
      <button class="mob-item" :class="{ active: route.path === '/financeiro' }" @click="go('/financeiro')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        <span>Fin.</span>
      </button>
      <button class="mob-item" :class="{ active: route.path === '/mapa' }" @click="go('/mapa')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
        </svg>
        <span>Mapa</span>
      </button>
      <button class="mob-item" @click="toggleTheme">
        <svg v-if="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
        </svg>
        <span>Tema</span>
      </button>
    </div>
  </nav>

  <!-- Modal boas-vindas -->
  <div v-if="showWelcomeModal" class="modal-backdrop">
    <div class="modal" style="max-width:420px;text-align:center;">
      <div class="modal-body" style="padding:2rem 1.75rem;">
        <div style="font-size:2.5rem;margin-bottom:1rem">👋</div>
        <h2 style="margin-bottom:0.5rem">Bem-vindo ao <span style="color:var(--accent)">SLAC</span></h2>
        <p style="margin-bottom:1.5rem">Como você quer ser chamado?<br/>Esse nome aparece no menu.</p>
        <div class="form-group" style="margin-bottom:1rem;text-align:left">
          <input
            ref="welcomeInput"
            v-model="welcomeName"
            class="form-input"
            type="text"
            placeholder="Seu nome ou apelido"
            maxlength="40"
            @keydown.enter="saveWelcomeName"
          />
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;padding:0.75rem" @click="saveWelcomeName">
          Entrar no SLAC →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppInit } from '@/composables/useAppInit'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const { theme, toggleTheme } = useTheme()
const isDark = computed(() => theme.value === 'dark')

const collapsed = ref(localStorage.getItem('slac-sidebar') === 'collapsed')
watch(collapsed, v => localStorage.setItem('slac-sidebar', v ? 'collapsed' : 'expanded'))

const userInitial = computed(() => (auth.userName || '?').charAt(0).toUpperCase())

const welcomeInput = ref(null)
const welcomeName = ref('')
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

function go(path) {
  router.push(path)
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-base);
}

/* ── Sidebar colapsável ── */
.sidebar-collapsed .sidebar {
  width: 56px;
  min-width: 56px;
}

.sidebar-collapsed .sidebar .sb-item {
  justify-content: center;
  padding: 0.5rem;
}

.sidebar-collapsed .sidebar .sb-footer {
  align-items: center;
}

.sidebar-collapsed .sidebar .theme-toggle {
  justify-content: center;
  padding: 0.4rem;
}

.sidebar-collapsed .sidebar .sb-logout {
  justify-content: center;
  padding: 0.4rem;
}

.sb-collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: 1px solid var(--border-default);
  color: var(--text-tertiary);
  cursor: pointer;
  flex-shrink: 0;
  margin-left: auto;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}
.sb-collapse-btn:hover {
  background: var(--accent-subtle);
  color: var(--accent);
  border-color: var(--accent);
}

/* ── Sidebar ── */
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 100;
  transition: width 200ms ease, min-width 200ms ease;
  will-change: width;
}

.sb-logo {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 1.125rem 1rem 1rem;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.sb-logo img {
  height: 28px;
  width: auto;
  display: block;
  flex-shrink: 0;
}

.sb-logo-text {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.03em;
}

.sb-nav {
  flex: 1;
  padding: 0.625rem 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sb-section {
  padding: 0 0.5rem;
  margin-bottom: 0.375rem;
}

.sb-label {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  padding: 0.625rem 0.5rem 0.25rem;
  display: block;
}

.sb-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.5rem 0.625rem;
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.sb-item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0.65;
  transition: opacity var(--transition-fast);
}

.sb-item:hover {
  background: var(--accent-subtle);
  color: var(--accent);
}
.sb-item:hover svg { opacity: 1; }

.sb-item.active {
  background: var(--accent-subtle);
  color: var(--accent);
  font-weight: 600;
}
.sb-item.active svg { opacity: 1; }

/* Footer */
.sb-footer {
  padding: 0.75rem;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}

.theme-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.4rem 0.5rem;
  border-radius: var(--radius-md);
  background: var(--bg-overlay);
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.theme-toggle:hover {
  background: var(--accent-subtle);
  color: var(--accent);
  border-color: var(--accent);
}

.sb-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
  padding: 0 0.125rem;
}

.sb-user-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sb-logout {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.4rem 0.5rem;
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  font-family: var(--font-body);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.sb-logout:hover {
  background: var(--status-danger-subtle);
  color: var(--status-danger);
}

.sb-dev {
  font-size: 0.6875rem;
  color: var(--text-tertiary);
  text-align: center;
  opacity: 0.5;
}

/* Main */
.main {
  flex: 1;
  min-width: 0;
  overflow-x: hidden;
}

/* Mobile Nav */
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--sidebar-bg);
  border-top: 1px solid var(--sidebar-border);
  z-index: 200;
  padding-bottom: env(safe-area-inset-bottom);
}

.mnav-inner {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0.25rem 0;
}

.mob-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-family: var(--font-body);
  font-size: 0.65rem;
  font-weight: 500;
  padding: 0.5rem 0.5rem;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: color var(--transition-fast);
  min-width: 48px;
}

.mob-item svg {
  width: 20px;
  height: 20px;
}

.mob-item.active,
.mob-item:hover {
  color: var(--accent);
}

@media (max-width: 768px) {
  .sidebar { display: none; }
  .mobile-nav { display: block; }
  .main { padding-bottom: 70px; }
}
</style>
