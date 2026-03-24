<template>
  <div v-if="auth.loading" class="loading-screen">
    <div class="spinner"></div>
    <p>Carregando SLAC...</p>
  </div>

  <router-view v-else />

  <!-- Toast global -->
  <Transition name="toast-anim">
    <div v-if="toast.show" class="toast-global" :class="`toast--${toast.type}`">
      <svg v-if="toast.type==='ok'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      <svg v-else-if="toast.type==='error'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {{ toast.message }}
    </div>
  </Transition>

  <!-- Saving indicator -->
  <Transition name="saving-anim">
    <div v-if="saving" class="saving-global">
      <div class="spinner" style="width:13px;height:13px;border-width:1.5px"></div>
      Salvando...
    </div>
  </Transition>
</template>

<script setup>
import { onMounted, onUnmounted, provide, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { sb } from '@/lib/supabase'

const auth = useAuthStore()
const { initTheme } = useTheme()

const toast = ref({ show: false, message: '', type: 'ok' })
let toastTimer = null
function showToast(message, type = 'ok') {
  toast.value = { show: true, message, type }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value.show = false }, 2800)
}
provide('toast', showToast)

const saving = ref(false)
let savingTimer = null
function showSaving() {
  saving.value = true
  clearTimeout(savingTimer)
  savingTimer = setTimeout(() => { saving.value = false }, 12000)
}
function hideSaving() {
  clearTimeout(savingTimer)
  saving.value = false
}
provide('saving', { showSaving, hideSaving })

async function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    try {
      const { data, error } = await sb.auth.getSession()
      if (error || !data.session) { await auth.logout(); return }
      await sb.auth.refreshSession()
    } catch (e) { console.warn('Erro ao renovar sessão:', e) }
  }
}

onMounted(async () => {
  initTheme()
  await auth.init()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})
onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style>
.loading-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: var(--bg-base);
  color: var(--text-tertiary);
  font-family: var(--font-body);
  font-size: .9rem;
}

/* Toast */
.toast-global {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: .625rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: .875rem 1.25rem;
  font-family: var(--font-body);
  font-size: .875rem;
  color: var(--text-primary);
  box-shadow: var(--shadow-lg);
  min-width: 240px;
  max-width: 360px;
}
.toast--ok    { border-left: 3px solid var(--accent); color: var(--accent); }
.toast--ok    .toast-global { color: var(--text-primary); }
.toast--error { border-left: 3px solid var(--status-danger); }
.toast--warn  { border-left: 3px solid var(--status-warning); }
.toast--ok svg    { color: var(--accent); flex-shrink:0; }
.toast--error svg { color: var(--status-danger); flex-shrink:0; }
.toast--warn svg  { color: var(--status-warning); flex-shrink:0; }

/* Saving */
.saving-global {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  z-index: 9998;
  display: flex;
  align-items: center;
  gap: .5rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  padding: .4rem .875rem;
  font-family: var(--font-body);
  font-size: .8rem;
  color: var(--text-tertiary);
  box-shadow: var(--shadow-md);
}

/* Transitions */
.toast-anim-enter-active, .toast-anim-leave-active { transition: all 200ms ease; }
.toast-anim-enter-from { opacity: 0; transform: translateX(12px); }
.toast-anim-leave-to   { opacity: 0; transform: translateX(12px); }

.saving-anim-enter-active, .saving-anim-leave-active { transition: opacity 200ms ease; }
.saving-anim-enter-from, .saving-anim-leave-to { opacity: 0; }
</style>
