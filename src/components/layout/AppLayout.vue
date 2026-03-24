<template>
  <div class="layout" :class="{ 'sb-col': collapsed }">

    <aside class="sidebar">
      <!-- Topo: logo clicável para colapsar -->
      <div class="sb-top">
        <button class="sb-logo-btn" @click="toggle" :title="collapsed ? 'Expandir menu' : 'Recolher menu'">
          <img src="/logo.png" alt="SLAC" class="sb-logo-img" />
        </button>
      </div>

      <!-- Nav -->
      <nav class="sb-nav">
        <div class="sb-group">
          <span class="sb-group-label">Principal</span>
          <button v-for="item in mainNav" :key="item.path"
            class="sb-item" :class="{ active: route.path === item.path }"
            @click="go(item.path)" :title="item.label"
          >
            <span class="sb-icon" v-html="item.icon"></span>
            <span class="sb-label">{{ item.label }}</span>
          </button>
        </div>
        <div class="sb-group">
          <span class="sb-group-label">Ferramentas</span>
          <button class="sb-item" :class="{ active: route.path === '/prospeccao' }"
            @click="go('/prospeccao')" title="Prospecção"
          >
            <span class="sb-icon" v-html="icons.prospeccao"></span>
            <span class="sb-label">Prospecção</span>
          </button>
        </div>
      </nav>

      <!-- Footer -->
      <div class="sb-footer">
        <button class="sb-item" @click="toggleTheme" :title="isDark ? 'Modo claro' : 'Modo escuro'">
          <span class="sb-icon">
            <svg v-if="isDark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </span>
          <span class="sb-label">{{ isDark ? 'Modo claro' : 'Modo escuro' }}</span>
        </button>

        <div class="sb-user">
          <div class="avatar avatar-sm sb-avatar">{{ userInitial }}</div>
          <div class="sb-user-info">
            <span class="sb-user-name">{{ auth.userName }}</span>
            <span class="sb-pro-badge">PRO</span>
          </div>
        </div>

        <button class="sb-item sb-item--danger" @click="auth.logout()" title="Sair">
          <span class="sb-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span class="sb-label">Sair</span>
        </button>

        <div class="sb-dev">Desenvolvido por Sano Lab</div>
      </div>
    </aside>

    <main class="main">
      <router-view />
    </main>
  </div>

  <!-- MOBILE NAV -->
  <nav class="mobile-nav">
    <button v-for="item in mobileNav" :key="item.path"
      class="mob-item" :class="{ active: route.path === item.path }"
      @click="go(item.path)"
    >
      <span v-html="item.icon"></span>
      <span>{{ item.short }}</span>
    </button>
    <button class="mob-item" @click="toggleTheme">
      <span>
        <svg v-if="isDark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </span>
      <span>Tema</span>
    </button>
  </nav>

  <!-- Modal boas-vindas -->
  <div v-if="showWelcomeModal" class="modal-backdrop">
    <div class="modal" style="max-width:420px;text-align:center">
      <div class="modal-body" style="padding:2rem 1.75rem">
        <div style="font-size:2.5rem;margin-bottom:1rem">👋</div>
        <h2 style="margin-bottom:.5rem">Bem-vindo ao <span style="color:var(--accent)">SLAC</span></h2>
        <p style="margin-bottom:1.5rem">Como você quer ser chamado?<br/>Esse nome aparece no menu.</p>
        <div class="form-group" style="margin-bottom:1rem;text-align:left">
          <input ref="welcomeInput" v-model="welcomeName" class="form-input"
            type="text" placeholder="Seu nome ou apelido" maxlength="40"
            @keydown.enter="saveWelcomeName" />
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;padding:.75rem" @click="saveWelcomeName">
          Entrar no SLAC →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
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

const userInitial = computed(() => (auth.userName || '?').charAt(0).toUpperCase())

const icons = {
  dashboard:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>`,
  crm:          `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  financeiro:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  recorrencias: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
  mapa:         `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
  prospeccao:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
}

const mainNav = [
  { path: '/dashboard',    label: 'Dashboard',    icon: icons.dashboard },
  { path: '/crm',          label: 'CRM',          icon: icons.crm },
  { path: '/financeiro',   label: 'Financeiro',   icon: icons.financeiro },
  { path: '/recorrencias', label: 'Recorrências', icon: icons.recorrencias },
  { path: '/mapa',         label: 'Mapa Mental',  icon: icons.mapa },
]

const mobileNav = [
  { path: '/dashboard',  short: 'Dash',   icon: icons.dashboard },
  { path: '/crm',        short: 'CRM',    icon: icons.crm },
  { path: '/financeiro', short: 'Fin.',   icon: icons.financeiro },
  { path: '/mapa',       short: 'Mapa',   icon: icons.mapa },
  { path: '/prospeccao', short: 'Prosp.', icon: icons.prospeccao },
]

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
.layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-base);
}

/* ── Sidebar ── */
.sidebar {
  width: 210px;
  min-width: 210px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
  overflow: hidden;
  z-index: 100;
  transition: width 280ms cubic-bezier(.4,0,.2,1), min-width 280ms cubic-bezier(.4,0,.2,1);
}
.sb-col .sidebar { width: 56px; min-width: 56px; }

/* Topo — logo clicável */
.sb-top {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: .875rem .75rem;
  border-bottom: 1px solid var(--border-subtle);
  min-height: 58px;
  flex-shrink: 0;
}

.sb-logo-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: .25rem;
  border-radius: var(--radius-md);
  transition: opacity 150ms ease, transform 150ms ease;
}
.sb-logo-btn:hover { opacity: .75; transform: scale(.95); }
.sb-logo-btn:active { transform: scale(.9); }

.sb-logo-img {
  height: 32px;
  width: auto;
  object-fit: contain;
  display: block;
  /* Animação iOS: pulsa levemente ao clicar */
  transition: transform 280ms cubic-bezier(.34,1.56,.64,1);
}
.sb-col .sb-logo-img { transform: rotate(0deg); }

/* Nav */
.sb-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: .375rem 0;
  display: flex;
  flex-direction: column;
}
.sb-group { padding: 0 .5rem; margin-bottom: .125rem; }
.sb-col .sb-group { padding: 0 .375rem; }

.sb-group-label {
  display: block;
  font-size: .6rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  padding: .4rem .5rem .2rem;
  white-space: nowrap;
  overflow: hidden;
  opacity: 1;
  max-height: 28px;
  transition: opacity 200ms ease, max-height 280ms ease, padding 280ms ease;
}
.sb-col .sb-group-label { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; }

.sb-item {
  display: flex;
  align-items: center;
  gap: .625rem;
  width: 100%;
  padding: .45rem .625rem;
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: .8125rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  transition: background-color 120ms ease, color 120ms ease, padding 280ms ease;
}
.sb-item:hover { background: var(--accent-subtle); color: var(--accent); }
.sb-item:hover .sb-icon { opacity: 1; }
.sb-item.active { background: var(--accent-subtle); color: var(--accent); font-weight: 600; }
.sb-item.active .sb-icon { opacity: 1; }
.sb-item--danger:hover { background: var(--status-danger-subtle); color: var(--status-danger); }
.sb-col .sb-item { justify-content: center; padding: .55rem; gap: 0; }

.sb-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  opacity: .45;
  transition: opacity 120ms ease;
}
.sb-col .sb-icon { opacity: .6; }
.sb-col .sb-item:hover .sb-icon,
.sb-col .sb-item.active .sb-icon { opacity: 1; }

.sb-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 1;
  max-width: 150px;
  transition: opacity 200ms ease, max-width 280ms ease;
}
.sb-col .sb-label { opacity: 0; max-width: 0; pointer-events: none; }

/* Footer */
.sb-footer {
  padding: .375rem .5rem .75rem;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: .125rem;
  flex-shrink: 0;
}

/* Usuário — alinhamento correto */
.sb-user {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .375rem .625rem;
  border-radius: var(--radius-md);
  overflow: hidden;
  min-height: 40px;
}
.sb-col .sb-user { justify-content: center; padding: .375rem; }

.sb-avatar {
  flex-shrink: 0;
  align-self: center;
}

.sb-user-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: .15rem;
  min-width: 0;
  opacity: 1;
  max-width: 150px;
  transition: opacity 200ms ease, max-width 280ms ease;
}
.sb-col .sb-user-info { opacity: 0; max-width: 0; pointer-events: none; }

.sb-user-name {
  font-size: .78rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.sb-pro-badge {
  display: inline-block;
  font-size: .58rem;
  font-weight: 700;
  letter-spacing: .06em;
  background: var(--accent-subtle);
  color: var(--accent);
  border-radius: var(--radius-full);
  padding: .1rem .4rem;
  width: fit-content;
  line-height: 1.4;
}

.sb-dev {
  font-size: .6rem;
  color: var(--text-tertiary);
  text-align: center;
  opacity: .4;
  padding-top: .25rem;
  white-space: nowrap;
  overflow: hidden;
  max-height: 18px;
  transition: opacity 200ms ease, max-height 280ms ease;
}
.sb-col .sb-dev { opacity: 0; max-height: 0; }

/* Main */
.main { flex: 1; min-width: 0; overflow-x: hidden; }

/* Mobile */
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: var(--sidebar-bg);
  border-top: 1px solid var(--sidebar-border);
  z-index: 200;
  padding-bottom: env(safe-area-inset-bottom);
  justify-content: space-around;
  align-items: center;
  padding-top: .25rem;
}
.mob-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .2rem;
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-family: var(--font-body);
  font-size: .6rem;
  font-weight: 500;
  padding: .375rem .5rem;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: color 120ms ease;
  min-width: 44px;
}
.mob-item.active, .mob-item:hover { color: var(--accent); }

@media (max-width: 768px) {
  .sidebar { display: none; }
  .mobile-nav { display: flex; }
  .main { padding-bottom: 70px; }
}
</style>
