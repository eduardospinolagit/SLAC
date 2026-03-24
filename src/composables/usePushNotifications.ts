import { ref } from 'vue'
import { sb } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const VAPID_PUBLIC = 'BOMZjUrFnkPqyKg6T2rHhXE8xTTNfR33jrgR7OmbNzD5aZSDE9zN2OjN7ELvhJYYsv0DQff7CUapkexxUxb2dPc'

export function usePushNotifications() {
  const auth = useAuthStore()
  const status = ref<'idle' | 'loading' | 'granted' | 'denied'>('idle')

  function isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  }

  async function getSubscriptionStatus(): Promise<'granted' | 'denied' | 'idle'> {
    if (!isSupported()) return 'denied'
    if (Notification.permission === 'granted') {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      return sub ? 'granted' : 'idle'
    }
    if (Notification.permission === 'denied') return 'denied'
    return 'idle'
  }

  async function subscribe(): Promise<boolean> {
    if (!isSupported()) return false
    if (!auth.user) return false

    status.value = 'loading'

    try {
      // Pede permissão
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        status.value = 'denied'
        return false
      }

      // Registra service worker
      const reg = await navigator.serviceWorker.ready

      // Cancela subscription antiga se existir
      const oldSub = await reg.pushManager.getSubscription()
      if (oldSub) await oldSub.unsubscribe()

      // Cria nova subscription
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC)
      })

      const subJson = sub.toJSON()

      // Salva no Supabase
      const { error } = await sb.from('push_subscriptions').upsert({
        user_id: auth.user.id,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth,
      }, { onConflict: 'user_id,endpoint' })

      if (error) throw error

      status.value = 'granted'
      return true
    } catch (e) {
      console.error('[Push] Erro ao registrar:', e)
      status.value = 'idle'
      return false
    }
  }

  async function unsubscribe(): Promise<void> {
    if (!isSupported()) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        if (auth.user) {
          await sb.from('push_subscriptions')
            .delete()
            .eq('user_id', auth.user.id)
            .eq('endpoint', sub.endpoint)
        }
      }
      status.value = 'idle'
    } catch (e) {
      console.error('[Push] Erro ao cancelar:', e)
    }
  }

  return { status, isSupported, subscribe, unsubscribe, getSubscriptionStatus }
}

// Converte VAPID key de base64url para Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map(char => char.charCodeAt(0)))
}
