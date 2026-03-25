import { defineStore } from 'pinia'
import { ref } from 'vue'
import { sb } from '@/lib/supabase'
import { uid } from '@/utils/uid'

export const useWaStore = defineStore('wa', () => {
  const templates  = ref([])
  const config     = ref({ instance_id: '' })
  const scriptBase = ref('')

  async function loadTemplates() {
    const { data, error } = await sb
      .from('wa_templates').select('*')
      .eq('user_id', uid())
      .order('created_at', { ascending: true })
    if (error) { console.error('[wa] loadTemplates:', error); return }
    templates.value = data || []
  }

  async function saveTemplate(t) {
    const row = { ...t, user_id: uid() }
    const { data, error } = await sb
      .from('wa_templates').upsert(row, { onConflict: 'id' })
      .select().single()
    if (error) throw error
    const idx = templates.value.findIndex(x => x.id === data.id)
    if (idx !== -1) templates.value[idx] = data
    else templates.value.push(data)
    return data
  }

  async function deleteTemplate(id) {
    await sb.from('wa_templates').delete().eq('id', id).eq('user_id', uid())
    templates.value = templates.value.filter(t => t.id !== id)
  }

  async function loadConfig() {
    const { data } = await sb
      .from('configuracoes').select('chave, valor')
      .eq('user_id', uid())
      .in('chave', ['wa_config', 'script_base'])
    const waConf = data?.find(r => r.chave === 'wa_config')
    const script = data?.find(r => r.chave === 'script_base')
    config.value.instance_id = waConf?.valor?.instance_id || ''
    scriptBase.value = script?.valor?.texto || ''
  }

  async function saveConfig(instanceId, script) {
    const userId = uid()
    await Promise.all([
      sb.from('configuracoes').upsert({
        id: userId + '_wa_config', user_id: userId,
        chave: 'wa_config', valor: { instance_id: instanceId },
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' }),
      sb.from('configuracoes').upsert({
        id: userId + '_script_base', user_id: userId,
        chave: 'script_base', valor: { texto: script },
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' }),
    ])
    config.value.instance_id = instanceId
    scriptBase.value = script
  }

  async function enviarMensagem(leadId, userId, telefone, mensagem) {
    const { data, error } = await sb.functions.invoke('wa-send', {
      body: { lead_id: leadId, user_id: userId, telefone, mensagem }
    })
    if (error) throw error
    if (!data?.ok) throw new Error(data?.error || 'Falha ao enviar')
    return data
  }

  async function gerarScript(userId, instagram, negocio, cidade) {
    const { data, error } = await sb.functions.invoke('gerar-script', {
      body: { user_id: userId, instagram, negocio, cidade }
    })
    if (error) throw error
    if (!data?.script) throw new Error(data?.error || 'Falha ao gerar script')
    return data.script
  }

  return {
    templates, config, scriptBase,
    loadTemplates, saveTemplate, deleteTemplate,
    loadConfig, saveConfig,
    enviarMensagem, gerarScript,
  }
})
