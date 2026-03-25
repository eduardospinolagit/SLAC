<template>
  <div v-if="auth.loading" class="loading-screen">
    <div class="spinner"></div>
    <p>Carregando SLAC...</p>
  </div>

  <router-view v-else />

  <Teleport to="body">
    <div v-show="saving" class="ios-pill ios-pill--saving">
      <div class="ios-spinner"></div>
      <span>Salvando</span>
    </div>
    <Transition name="ios-pill">
      <div v-if="toast.show" class="ios-pill" :class="`ios-pill--${toast.type}`">
        <svg v-if="toast.type==='ok'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <svg v-else-if="toast.type==='error'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span>{{ toast.message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted, provide, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFinStore } from '@/stores/fin'
import { useLeadsStore } from '@/stores/leads'
import { useMapaStore } from '@/stores/mapa'
import { useTheme } from '@/composables/useTheme'
import { sb } from '@/lib/supabase'

const auth   = useAuthStore()
const fin    = useFinStore()
const leads  = useLeadsStore()
const mapa   = useMapaStore()
const router = useRouter()
const { initTheme } = useTheme()

// ── Toast ──
const toast = ref({ show: false, message: '', type: 'ok' })
let toastTimer = null
function showToast(message, type = 'ok') {
  clearTimeout(toastTimer)
  // Remove checkmarks do texto — o ícone SVG já representa o estado
  const clean = message.replace(/\s*[✓✗]\s*/g, '').trim()
  toast.value = { show: true, message: clean, type }
  toastTimer = setTimeout(() => { toast.value.show = false }, 2600)
  // Loga erros e warnings no banco
  if (type === 'error' || type === 'err' || type === 'warn') {
    const level = (type === 'warn') ? 'warn' : 'error'
    sb.from('logs').insert({
      user_id: auth.user?.id || null,
      level,
      source: 'frontend',
      message: clean,
      data: { url: window.location.pathname },
    }).then(() => {})
  }
}
provide('toast', showToast)

// ── Saving ──
const saving = ref(false)
let savingTimer = null
function showSaving() {
  saving.value = true
  clearTimeout(savingTimer)
  savingTimer = setTimeout(() => { saving.value = false }, 8000)
}
function hideSaving() {
  clearTimeout(savingTimer)
  saving.value = false
}
provide('saving', { showSaving, hideSaving })

// ── Sessão ──
async function reloadData() {
  if (!auth.user) return
  try { await Promise.all([fin.load(), leads.load(), mapa.load()]) }
  catch (e) { console.warn('[SLAC] reload falhou:', e) }
}

let lastHidden = 0
async function handleVisibilityChange() {
  if (document.visibilityState !== 'visible') { lastHidden = Date.now(); return }
  const awayMs = Date.now() - lastHidden
  try {
    const { data, error } = await sb.auth.getSession()
    if (error || !data.session) { await auth.logout(); router.push('/login'); return }
    await sb.auth.refreshSession()
    if (awayMs > 2 * 60 * 1000) await reloadData()
  } catch (e) { console.warn('[SLAC] visibility erro:', e) }
}

async function user_logout() { await auth.logout(); router.push('/login') }

onMounted(async () => {
  initTheme()
  await auth.init()
  document.addEventListener('visibilitychange', handleVisibilityChange)
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session && router.currentRoute.value.path === '/login') {
      sessionStorage.setItem('slac_show_welcome', '1')
      router.push('/dashboard')
    }
    if (event === 'SIGNED_OUT') router.push('/login')
  })
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style>
/* ── Loading ── */
.loading-screen {
  min-height: 100vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 1rem; background: var(--bg-base);
  color: var(--text-tertiary);
  font-family: var(--font-body); font-size: .9rem;
}

/* ── iOS pill ── */
.ios-pill {
  position: fixed !important;
  top: 1.25rem !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  z-index: 999999 !important;
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .5rem 1.125rem;
  border-radius: 99px;
  font-family: var(--font-body);
  font-size: .8125rem;
  font-weight: 600;
  letter-spacing: -.01em;
  white-space: nowrap;
  pointer-events: none;
  background: rgba(18, 18, 18, 0.38);
  backdrop-filter: blur(32px) saturate(200%);
  -webkit-backdrop-filter: blur(32px) saturate(200%);
  border: 1px solid rgba(255,255,255,.09);
  box-shadow: 0 8px 32px rgba(0,0,0,.45), 0 1px 0 rgba(255,255,255,.05) inset;
  color: #fff;
}

[data-theme="light"] .ios-pill {
  background: rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(32px) saturate(200%);
  -webkit-backdrop-filter: blur(32px) saturate(200%);
  border: 1px solid rgba(255,255,255,.75);
  box-shadow: 0 8px 32px rgba(0,0,0,.1), 0 1px 0 rgba(255,255,255,.9) inset;
  color: #1c1c1e;
}

.ios-pill--ok    svg { color: #30d158; flex-shrink: 0; }
.ios-pill--error svg { color: #ff453a; flex-shrink: 0; }
.ios-pill--warn  svg { color: #ffd60a; flex-shrink: 0; }
.ios-pill--saving    { gap: .625rem; }

[data-theme="light"] .ios-pill--ok    svg { color: #34c759; }
[data-theme="light"] .ios-pill--error svg { color: #ff3b30; }
[data-theme="light"] .ios-pill--warn  svg { color: #ff9f0a; }

.ios-spinner {
  width: 13px; height: 13px; flex-shrink: 0;
  border-radius: 50%;
  border: 1.75px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  animation: ios-spin .65s linear infinite;
}
[data-theme="light"] .ios-spinner {
  border-color: rgba(0,0,0,.15);
  border-top-color: #1c1c1e;
}
@keyframes ios-spin { to { transform: rotate(360deg); } }

/* Animação spring */
.ios-pill-enter-active { transition: all 360ms cubic-bezier(.34,1.56,.64,1); }
.ios-pill-leave-active { transition: all 200ms ease; }
.ios-pill-enter-from   { opacity: 0; transform: translateX(-50%) translateY(-18px) scale(.85) !important; }
.ios-pill-leave-to     { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(.93) !important; }
</style>
