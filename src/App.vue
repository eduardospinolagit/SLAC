<template>
  <div v-if="auth.loading" class="loading-screen">
    <div class="spinner"></div>
    <p>Carregando SLAC...</p>
  </div>

  <router-view v-else />

  <!-- Notificações estilo iOS — pill único com key para forçar re-animação -->
  <Transition name="ios-pill">
    <div v-if="pillVisible" :key="pillKey" class="ios-pill" :class="pillClass">
      <div v-if="saving" class="ios-spinner"></div>
      <template v-else>
        <svg v-if="toast.type==='ok'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <svg v-else-if="toast.type==='error'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </template>
      <span>{{ saving ? 'Salvando' : toast.message }}</span>
    </div>
  </Transition>
</template>

<script setup>
import { computed, onMounted, onUnmounted, provide, ref } from 'vue'
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
  toast.value = { show: true, message, type }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value.show = false }, 2800)
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

// ── Pill computed ──
const pillVisible = computed(() => saving.value || toast.value.show)
const pillClass   = computed(() => saving.value ? 'ios-pill--saving' : `ios-pill--${toast.value.type}`)
const pillKey     = computed(() => saving.value ? 'saving' : `toast-${toast.value.type}-${toast.value.message}`)

// ── Recarregar dados das stores ──
async function reloadData() {
  if (!auth.user) return
  try {
    await Promise.all([fin.load(), leads.load(), mapa.load()])
  } catch (e) {
    console.warn('[SLAC] reload data falhou:', e)
  }
}

// ── Voltar de inativo: refresh token + reload dados ──
let lastHidden = 0
async function handleVisibilityChange() {
  if (document.visibilityState !== 'visible') {
    lastHidden = Date.now()
    return
  }

  const awayMs = Date.now() - lastHidden

  try {
    const { data, error } = await sb.auth.getSession()
    if (error || !data.session) {
      await auth.logout()
      router.push('/login')
      return
    }

    // Sempre renova o token ao voltar
    await sb.auth.refreshSession()

    // Se ficou mais de 2 minutos fora, recarrega os dados
    // (pode ter mudado algo enquanto estava em segundo plano)
    if (awayMs > 2 * 60 * 1000) {
      await reloadData()
    }
  } catch (e) {
    console.warn('[SLAC] visibilitychange erro:', e)
  }
}

onMounted(async () => {
  initTheme()
  await auth.init()
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // Registrar DEPOIS do init para não interferir com o loading
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      if (router.currentRoute.value.path === '/login') {
        router.push('/dashboard')
      }
    }
    if (event === 'SIGNED_OUT') {
      router.push('/login')
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style>
.loading-screen {
  min-height: 100vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 1rem; background: var(--bg-base);
  color: var(--text-tertiary);
  font-family: var(--font-body); font-size: .9rem;
}

.toast-global {
  position: fixed;
  bottom: 1.5rem; right: 1.5rem;
  z-index: 9999;
  display: flex; align-items: center; gap: .625rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: .75rem 1.125rem;
  font-family: var(--font-body); font-size: .875rem;
  color: var(--text-primary);
  box-shadow: var(--shadow-lg);
  min-width: 220px; max-width: 340px;
}
.toast--ok    { border-left: 3px solid var(--accent); }
.toast--ok svg    { color: var(--accent); flex-shrink:0; }
.toast--error { border-left: 3px solid var(--status-danger); }
.toast--error svg { color: var(--status-danger); flex-shrink:0; }
.toast--warn  { border-left: 3px solid var(--status-warning); }
.toast--warn svg  { color: var(--status-warning); flex-shrink:0; }

.saving-global {
  position: fixed;
  bottom: 1.5rem; left: 1.5rem;
  z-index: 9998;
  display: flex; align-items: center; gap: .5rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-left: 3px solid var(--status-info);
  border-radius: var(--radius-lg);
  padding: .75rem 1.125rem;
  font-family: var(--font-body); font-size: .875rem;
  color: var(--text-primary);
  box-shadow: var(--shadow-lg);
}

.toast-anim-enter-active, .toast-anim-leave-active { transition: all 200ms ease; }
.toast-anim-enter-from { opacity: 0; transform: translateY(8px); }
.toast-anim-leave-to   { opacity: 0; transform: translateY(8px); }
</style>
