import { useFinStore } from '@/stores/fin'
import { useLeadsStore } from '@/stores/leads'
import { useMapaStore } from '@/stores/mapa'
import { useWorkStore } from '@/stores/work'
import { useAuthStore } from '@/stores/auth'
import { useWaStore } from '@/stores/wa'
import { sb } from '@/lib/supabase'

let initializedForUser = null
let realtimeChannel = null
let waPollingTimer = null

export async function useAppInit() {
  const auth = useAuthStore()
  const fin = useFinStore()
  const leads = useLeadsStore()
  const mapa = useMapaStore()
  const work = useWorkStore()
  const wa = useWaStore()

  if (!auth.user) return
  if (initializedForUser === auth.user.id) return
  initializedForUser = auth.user.id

  // Carrega dados em paralelo (WA com try/catch pois servidor pode estar offline)
  await Promise.all([
    fin.load(),
    leads.load(),
    mapa.load(),
    work.load(),
    wa.checkStatus().catch(() => {}),
    wa.loadChats().catch(() => {}),
  ])

  // Polling WA global (a cada 30s para manter chats e status atualizados)
  if (waPollingTimer) clearInterval(waPollingTimer)
  waPollingTimer = setInterval(async () => {
    try { await wa.checkStatus() } catch {}
    try { await wa.loadChats() } catch {}
  }, 30000)

  // Realtime — chamado diretamente (sem composable) para evitar problema de contexto Vue
  if (realtimeChannel) {
    sb.removeChannel(realtimeChannel)
  }

  realtimeChannel = sb.channel('slac-db-' + auth.user.id)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'financeiro',
      filter: 'user_id=eq.' + auth.user.id
    }, () => fin.load())
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'leads',
      filter: 'user_id=eq.' + auth.user.id
    }, () => leads.load())
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'configuracoes',
      filter: 'user_id=eq.' + auth.user.id
    }, () => { fin.loadMeta(); mapa.load(); wa.loadSdrConfig().catch(() => {}) })
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'conversas',
      filter: 'user_id=eq.' + auth.user.id
    }, async (payload) => {
      const nova = payload.new
      if (nova.lead_id === leads.drawerLeadId) {
        leads.conversas.push(nova)
      }
      // Notificações WA globais (funciona mesmo sem o SlacZap aberto)
      if (nova.canal === 'whatsapp' && nova.direcao === 'recebido') {
        const key = nova.lead_id || nova.telefone || ''
        wa.storeIncrementUnread(key)
        try { await wa.loadChats() } catch {}
      }
    })
    .subscribe()

  // BroadcastChannel: recebe leads da aba de Prospecção
  try {
    const bc = new BroadcastChannel('slac_crm')
    bc.onmessage = (e) => {
      if (e.data?.type === 'lead_novo') leads.load()
    }
  } catch {}
}
