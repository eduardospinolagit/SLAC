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

  function ackToStatus(ack, fromMe) {
    if (!fromMe) return 'received'
    const n = Number(ack)
    if (n === 0) return 'pending'
    if (n === 1) return 'sent'
    if (n === 2) return 'delivered'
    if (n >= 3) return 'read'
    return 'sent'
  }

  // Tipos que devem ser pulados (sistema, notificações, apagadas)
  const SKIP_TYPES = new Set([
    'revoked', 'protocol', 'ciphertext',
    'e2e_notification', 'notification', 'notification_template',
    'gp2', 'gp2_invite', 'groups_v4_invite_message',
    'call_log', 'ephemeral_setting', 'unknown',
  ])

  function labelPorTipo(type) {
    const map = {
      image: '[Imagem]', video: '[Vídeo]', gif: '[GIF]',
      audio: '[Áudio]',  ptt:  '[Áudio]',
      document: '[Documento]', sticker: '[Sticker]',
      location: '[Localização]', contact: '[Contato]',
      vcard: '[Contato]', multi_vcard: '[Contatos]',
      list: '[Lista]', list_response: '[Resposta]',
      buttons_response: '[Resposta]', template_button_reply: '[Resposta]',
      product: '[Produto]', order: '[Pedido]',
      poll_creation: '[Enquete]', poll_vote: '[Voto]',
    }
    return map[type] || null // null = pular a mensagem
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

          // Resolve telefone real — tenta múltiplas fontes em ordem de confiabilidade
          let phone = chatId.replace('@c.us', '').replace('@s.whatsapp.net', '').replace('@lid', '')

          if (chatId.endsWith('@lid')) {
            const lidId = phone // ID interno @lid — não é telefone real

            function cleanPhone(raw) {
              const d = String(raw || '').replace(/\D/g, '').replace(/^55/, '')
              return (d.length >= 8 && d.length <= 13 && d !== lidId) ? d : null
            }

            // Fonte 1: chat.contact da lista (já carregado em memória)
            // __x_phoneNumber é acessado como contact.phoneNumber (getter do modelo WPP)
            phone = cleanPhone(chat.contact?.phoneNumber)
              || cleanPhone(chat.contact?.phone)
              || cleanPhone(chat.contact?.formattedUser)
              || cleanPhone(chat.contact?.wid?.user)
              || null

            // Fonte 2: WPP.contact.get()
            if (!phone) {
              try {
                const c = await window.WPP.contact.get(chatId)
                phone = cleanPhone(c?.phoneNumber)
                  || cleanPhone(c?.phone)
                  || cleanPhone(c?.formattedUser)
                  || cleanPhone(c?.wid?.user)
                  || null
              } catch {}
            }

            // Fonte 3: JID @c.us dentro do msg.id._serialized ("false_55PHONE@c.us_MSGID")
            if (!phone) {
              for (const msg of (msgs || [])) {
                const parts = (msg.id?._serialized || '').split('_')
                if (parts.length >= 3) {
                  const jid = parts[1] || ''
                  if (jid.endsWith('@c.us') || jid.endsWith('@s.whatsapp.net')) {
                    const p = cleanPhone(jid.replace(/@\w+\.net|@c\.us/g, ''))
                    if (p) { phone = p; break }
                  }
                }
              }
            }

            // Fonte 4: msg.from / msg.author (campos diretos do WPP)
            if (!phone) {
              for (const msg of (msgs || [])) {
                const jid = msg.from || msg.author || ''
                if (typeof jid === 'string' && (jid.includes('@c.us') || jid.includes('@s.whatsapp.net'))) {
                  const p = cleanPhone(jid.replace(/@\w+\.net|@c\.us/g, ''))
                  if (p) { phone = p; break }
                }
              }
            }

            if (!phone) phone = lidId // sem resolução — usa @lid ID como fallback

          } else {
            phone = phone.replace(/^55/, '')
          }
          const rows  = []

          for (const msg of (msgs || [])) {
            if (!msg.id) continue
            // Pula mensagens de sistema e sem conteúdo relevante
            if (SKIP_TYPES.has(msg.type)) continue
            const label = msg.body || labelPorTipo(msg.type)
            if (!label) continue // tipo desconhecido sem body — pula
            const fromMe = msg.id?.fromMe ?? msg.fromMe ?? false
            rows.push({
              id:           'wa_' + (msg.id?._serialized || msg.id),
              user_id:      null,
              canal:        'whatsapp',
              direcao:      fromMe ? 'enviado' : 'recebido',
              mensagem:     label,
              data:         new Date((msg.t || Date.now() / 1000) * 1000).toISOString(),
              telefone:     phone,
              status:       ackToStatus(msg.ack, fromMe),
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
