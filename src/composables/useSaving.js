import { inject } from 'vue'

export function useSaving() {
  const { showSaving, hideSaving } = inject('saving')
  const toast = inject('toast')

  async function run(fn, successMsg = null, errorMsg = 'Erro ao salvar') {
    showSaving()
    try {
      const result = await fn()
      if (successMsg) toast(successMsg, 'ok')
      return result
    } catch (e) {
      // Log detalhado sempre visível
      console.error('[SLAC] Erro ao salvar:')
      console.error('  mensagem:', e?.message)
      console.error('  código:', e?.code)
      console.error('  detalhes:', e?.details)
      console.error('  objeto completo:', e)

      const msg = e?.message || errorMsg
      if (msg.includes('não autenticado') || msg.includes('not authenticated') || msg.includes('JWT')) {
        toast('Sessão expirada — faça login novamente', 'err')
      } else {
        toast(errorMsg + (msg ? ': ' + msg : ''), 'err')
      }
    } finally {
      hideSaving()
    }
  }

  async function runSilent(fn) {
    try {
      return await fn()
    } catch (e) {
      console.error('[SLAC silent] erro:', e)
    }
  }

  return { run, runSilent, showSaving, hideSaving, toast }
}
