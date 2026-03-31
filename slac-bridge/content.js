// content.js — MAIN world (roda em web.whatsapp.com)
// Comunica com o background via window.postMessage → bridge.js (ISOLATED) → chrome.runtime
;(function () {
  'use strict'

  // ── Camada de comunicação via postMessage ──
  let _reqId = 0
  const _pending = {}

  window.addEventListener('message', (event) => {
    if (!event.data?.__slacBridge) return
    const msg = event.data

    if ((msg.dir === 'bg-reply' || msg.dir === 'storage-result') && _pending[msg.reqId]) {
      _pending[msg.reqId](msg.dir === 'bg-reply' ? msg.response : msg.result)
      delete _pending[msg.reqId]
    }

    if (msg.dir === 'from-bg') {
      const m = msg.msg
      if (m.type === 'DO_SYNC')        runSync()
      if (m.type === 'TOGGLE_MONITOR') m.active ? startMonitor() : stopMonitor()
    }
  })

  function sendToBg(payload, callback) {
    const reqId = callback != null ? ++_reqId : null
    if (reqId != null) _pending[reqId] = callback
    window.postMessage({ __slacBridge: true, dir: 'to-bg', reqId, payload }, '*')
  }

  function storageGet(key, callback) {
    const reqId = ++_reqId
    _pending[reqId] = callback
    window.postMessage({ __slacBridge: true, dir: 'storage-get', reqId, key }, '*')
  }

  // ── Helpers ──
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

  function labelPorTipo(type) {
    const map = {
      image: '[Imagem]', video: '[Vídeo]',
      audio: '[Áudio]',  ptt:   '[Áudio]',
      document: '[Documento]', sticker: '[Sticker]',
    }
    return map[type] || '[Mídia]'
  }

  async function isSyncPaused() {
    return new Promise(resolve =>
      storageGet('syncPaused', ({ syncPaused }) => resolve(!!syncPaused))
    )
  }

  // ── Aguarda WPP ficar pronto ──
  async function waitForWPP(timeoutMs = 30000) {
    let elapsed = 0
    while (true) {
      if (window.WPP?.webpack?.isReady) return
      if (elapsed >= timeoutMs) throw new Error('WPP timeout após ' + timeoutMs + 'ms')
      await sleep(500)
      elapsed += 500
    }
  }

  // ── SyncQueue ──
  async function runSync() {
    let totalMsgs = 0
    try {
      // Aguarda chats carregarem (WPP pronto ≠ dados carregados)
      let allChats = []
      for (let attempt = 0; attempt < 10; attempt++) {
        allChats = await window.WPP.chat.list({ count: 9999 })
        if (allChats.length > 0) break
        console.log('[SLAC Bridge] Aguardando chats carregarem... tentativa', attempt + 1)
        await sleep(2000)
      }
      console.log('[SLAC Bridge] Sync iniciado —', allChats.length, 'chats encontrados')
      const chats = allChats
        .filter(c => {
          const jid = c.id?._serialized || ''
          return jid.endsWith('@c.us') || jid.endsWith('@s.whatsapp.net') || jid.endsWith('@lid')
        })
        .sort((a, b) => (a.lastReceivedKey?.t || 0) - (b.lastReceivedKey?.t || 0))

      console.log('[SLAC Bridge] Após filtro —', chats.length, 'chats individuais')
      const total = chats.length
      sendToBg({ type: 'SYNC_PROGRESS', progress: 0, total, chatName: '' })

      for (let i = 0; i < chats.length; i++) {
        while (await isSyncPaused()) await sleep(500)

        const chat   = chats[i]
        const chatId = chat.id._serialized
        const name   = chat.contact?.name || chat.contact?.pushname || chatId

        sendToBg({ type: 'SYNC_PROGRESS', progress: i + 1, total, chatName: name })

        try {
          const msgs = await window.WPP.chat.getMessages(chatId, { count: 9999, direction: 'before' })

          // Resolve telefone: @lid usa Multi-Device, busca o número real via contato
          let phone = chatId.replace('@c.us', '').replace('@s.whatsapp.net', '').replace('@lid', '')
          if (chatId.endsWith('@lid')) {
            try {
              const contact = await window.WPP.contact.get(chatId)
              const raw = contact?.phone || contact?.formattedUser || ''
              if (raw) {
                const cleaned = String(raw).replace(/\D/g, '').replace(/^55/, '').slice(-11)
                if (cleaned && cleaned.length >= 8) phone = cleaned
              }
            } catch {}

            // Fallback: extrai telefone do id._serialized das mensagens
            // Formato: "fromMe_JID_msgId" onde JID pode ser "554788157140@c.us"
            // Mais confiável que WPP.contact.get() para @lid
            const lidId = chatId.replace('@lid', '')
            if (phone === lidId) { // resolução falhou — phone ainda é o ID interno do @lid
              for (const msg of (msgs || [])) {
                const serial = msg.id?._serialized || ''
                const parts  = serial.split('_')
                if (parts.length >= 3) {
                  const jid = parts[1] || ''
                  if (jid.endsWith('@c.us') || jid.endsWith('@s.whatsapp.net')) {
                    const candidate = jid
                      .replace('@c.us', '').replace('@s.whatsapp.net', '')
                      .replace(/^55/, '')
                    if (candidate.length >= 8 && candidate !== lidId) {
                      phone = candidate
                      break
                    }
                  }
                }
              }
            }
          } else {
            phone = phone.replace(/^55/, '')
          }
          const rows  = []

          for (const msg of (msgs || [])) {
            if (!msg.id) continue
            const fromMe = msg.id?.fromMe ?? msg.fromMe ?? false
            rows.push({
              id:           'wa_' + (msg.id?._serialized || msg.id),
              user_id:      null,
              canal:        'whatsapp',
              direcao:      fromMe ? 'enviado' : 'recebido',
              mensagem:     msg.body || labelPorTipo(msg.type),
              data:         new Date((msg.t || Date.now() / 1000) * 1000).toISOString(),
              telefone:     phone,
              status:       fromMe ? 'sent' : 'received',
              contato_nome: name,
            })
          }

          for (let j = 0; j < rows.length; j += 50) {
            const batch = rows.slice(j, j + 50)
            await new Promise(resolve =>
              sendToBg({ type: 'SAVE_MSGS', msgs: batch }, resolve)
            )
            totalMsgs += batch.length
          }
        } catch (e) {
          console.warn('[SLAC Bridge] Erro ao processar chat', chatId, ':', e.message)
        }

        await sleep(300)
      }
    } catch (e) {
      console.error('[SLAC Bridge] Erro no sync:', e.message)
    }

    sendToBg({ type: 'SYNC_DONE', msgCount: totalMsgs })
  }

  // ── IntegrityMonitor ──
  let observer = null

  function scheduleCheck(rawId) {
    if (!rawId) return
    const parts  = rawId.split('_')
    if (parts.length < 3) return
    const fromMe = parts[0] === 'true'
    const jid    = parts[1]
    const waId   = parts.slice(2).join('_')

    if (!jid.endsWith('@c.us') && !jid.endsWith('@s.whatsapp.net') && !jid.endsWith('@lid')) return

    setTimeout(() => {
      sendToBg({
        type:     'CHECK_INTEGRITY',
        id:       'wa_' + waId,
        telefone: jid.replace('@c.us', '').replace('@s.whatsapp.net', '').replace('@lid', '').replace(/^55/, ''),
        direcao:  fromMe ? 'enviado' : 'recebido',
      })
    }, 5000)
  }

  function startMonitor() {
    if (observer) return
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue
          const el = node.querySelector('[data-id]') || (node.dataset?.id ? node : null)
          if (el) scheduleCheck(el.dataset.id)
        }
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    console.log('[SLAC Bridge] Monitor de integridade ativo')
  }

  function stopMonitor() {
    if (!observer) return
    observer.disconnect()
    observer = null
    console.log('[SLAC Bridge] Monitor de integridade desativado')
  }

  // ── Boot ──
  async function boot() {
    try {
      await waitForWPP()
      sendToBg({ type: 'WPP_READY' })
      console.log('[SLAC Bridge] WPP pronto')

      storageGet('monitorActive', ({ monitorActive }) => {
        if (monitorActive) startMonitor()
      })
    } catch (e) {
      sendToBg({ type: 'WPP_TIMEOUT' })
      console.error('[SLAC Bridge]', e.message)
    }
  }

  if (document.readyState === 'complete') boot()
  else window.addEventListener('load', boot)
})()
