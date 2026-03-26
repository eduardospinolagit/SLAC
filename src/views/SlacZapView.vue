<template>
  <div class="sz-root" :class="{ 'sz-mobile-chat': activeLead && isMobile }">

    <!-- ═══ CONEXÃO ═══ -->
    <div v-if="!wa.connected" class="sz-connect-overlay">
      <div v-if="wa.hasQr && wa.qrImage" class="sz-qr-wrap">
        <p class="sz-qr-title">Conectar WhatsApp</p>
        <p class="sz-qr-sub">Abra o WhatsApp no celular → <strong>Dispositivos conectados</strong> → Escanear QR Code</p>
        <img :src="wa.qrImage" class="sz-qr-img" alt="QR Code WhatsApp" />
      </div>
      <div v-else class="sz-connecting">
        <div class="sz-spinner"></div>
        <p class="sz-connecting-title">Aguardando servidor...</p>
        <p class="sz-connecting-hint">Certifique-se de que o app <strong>SLAC WhatsApp</strong> está rodando na bandeja do sistema</p>
      </div>
    </div>

    <!-- ═══ SIDEBAR ═══ -->
    <div class="sz-sidebar" :class="{ 'sz-sidebar--hidden': activeLead && isMobile }">
      <div class="sz-sidebar-header">
        <div class="sz-sidebar-title-row">
          <h1 class="sz-sidebar-title">SlacZap</h1>
          <button class="sz-disconnect-btn" @click="wa.disconnect()" title="Desconectar WhatsApp" aria-label="Desconectar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64A9 9 0 1 1 5.64 5.64"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
          </button>
        </div>
        <div class="sz-search-wrap">
          <svg class="sz-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="search" class="sz-search" placeholder="Buscar" />
        </div>
      </div>

      <div class="sz-list" ref="listEl">
        <div v-if="loading" class="sz-placeholder">
          <div v-for="n in 5" :key="n" class="sz-skeleton">
            <div class="sz-skeleton-avatar"></div>
            <div class="sz-skeleton-lines">
              <div class="sz-skeleton-line sz-skeleton-line--name"></div>
              <div class="sz-skeleton-line sz-skeleton-line--msg"></div>
            </div>
          </div>
        </div>
        <p v-else-if="!filteredChats.length" class="sz-empty-list">
          {{ search ? 'Nenhum resultado' : 'Nenhuma conversa ainda' }}
        </p>
        <button v-for="c in filteredChats" :key="c.lead.id || c.lead.telefone"
          class="sz-item" :class="{ 'sz-item--active': activeLead?.id === c.lead.id }"
          @click="openChat(c.lead)">
          <div v-if="itemStatuses(c.lead).length" class="sz-item-status-bar"
            :style="{ background: itemStatuses(c.lead)[0].color }"></div>
          <div class="sz-avatar-wrap">
            <div class="sz-avatar" :style="{ background: avatarColor(c.lead.nome) }">
              {{ initials(c.lead.nome) }}
            </div>
          </div>
          <div class="sz-item-body">
            <div class="sz-item-row">
              <span class="sz-item-name">{{ c.lead.nome }}</span>
              <span class="sz-item-time">{{ fmtTime(c.lastAt) }}</span>
            </div>
            <div class="sz-item-row">
              <span class="sz-item-preview">
                <span v-if="c.lastDirecao === 'enviado'" class="sz-checkmark">✓ </span>{{ c.lastMsg }}
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- ═══ CHAT ═══ -->
    <div class="sz-chat" v-if="activeLead">

      <!-- Header -->
      <div class="sz-chat-header">
        <button v-if="isMobile" class="sz-back-btn" @click="closeChat" aria-label="Voltar">
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
            <path d="M9 1L1.5 8.5L9 16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="sz-back-label">Contatos</span>
        </button>
        <div class="sz-chat-avatar" :style="{ background: avatarColor(activeLead.nome) }">
          {{ initials(activeLead.nome) }}
        </div>
        <div class="sz-chat-meta">
          <span class="sz-chat-name">{{ activeLead.nome }}</span>
          <span class="sz-chat-status">{{ activeLead.telefone }}</span>
        </div>
        <div class="sz-chat-toolbar">
          <span class="sz-etapa-badge" :style="{ background: etapaColor(activeLead.etapa) + '20', color: etapaColor(activeLead.etapa) }">
            {{ etapaLabel(activeLead.etapa) }}
          </span>
          <button v-if="activeLead?.id" class="sz-toolbar-btn" @click="configModalOpen = true" title="Configurações do lead" aria-label="Configurações do lead">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>
      </div>

      <!-- Status bar -->
      <div v-if="leadStatus.length" class="sz-chat-status-bar">
        <div v-for="s in leadStatus" :key="s.type" class="sz-status-chip"
          :style="{ background: s.color + '18', color: s.color, borderLeft: '2.5px solid ' + s.color }">
          {{ s.label }}<span v-if="s.date" class="sz-status-date"> · {{ s.date }}</span>
        </div>
      </div>

      <!-- Messages -->
      <div class="sz-messages" ref="messagesEl">
        <div v-if="loadingMsgs" class="sz-msgs-loading">
          <div class="sz-typing"><span></span><span></span><span></span></div>
        </div>
        <template v-else>
          <p v-if="!waMsgs.length" class="sz-no-msgs">Nenhuma mensagem ainda.<br>Diga olá! 👋</p>
          <template v-for="(group, gi) in msgGroups" :key="gi">
            <div class="sz-time-sep">{{ group.label }}</div>
            <div v-for="(m, mi) in group.msgs" :key="m.id"
              class="sz-bubble-wrap" :class="m.direcao === 'enviado' ? 'sz-bubble-wrap--out' : 'sz-bubble-wrap--in'">
              <div class="sz-bubble"
                :class="[
                  m.direcao === 'enviado' ? 'sz-bubble--out' : 'sz-bubble--in',
                  mi === group.msgs.length - 1 ? (m.direcao === 'enviado' ? 'sz-bubble--tail-out' : 'sz-bubble--tail-in') : '',
                  mi < group.msgs.length - 1 ? 'sz-bubble--stacked' : ''
                ]">
                <span class="sz-bubble-text">{{ m.mensagem }}</span>
                <span class="sz-bubble-footer">
                  <span class="sz-bubble-time">{{ fmtHour(m.data) }}</span>
                  <span v-if="m.direcao === 'enviado'" class="sz-bubble-check">✓✓</span>
                </span>
              </div>
            </div>
          </template>
        </template>
      </div>

      <!-- File preview -->
      <div v-if="selectedFile" class="sz-file-preview">
        <div class="sz-file-preview-inner">
          <img v-if="selectedFile.tipo === 'image'" :src="selectedFile.dataUrl" class="sz-preview-img" />
          <div v-else class="sz-preview-file-info">
            <svg v-if="selectedFile.tipo === 'document'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            <span class="sz-preview-fname">{{ selectedFile.nome }}</span>
          </div>
          <input v-if="selectedFile.tipo !== 'audio'" v-model="fileCaption"
            class="sz-preview-caption" placeholder="Legenda (opcional)" />
        </div>
        <button class="sz-preview-remove" @click="selectedFile = null; fileCaption = ''" aria-label="Remover arquivo">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Composer -->
      <div class="sz-composer">

        <!-- Gravando -->
        <div v-if="isRecording" class="sz-recording-bar">
          <button class="sz-rec-cancel" @click="cancelRecording" aria-label="Cancelar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div class="sz-rec-center">
            <span class="sz-rec-dot"></span>
            <div class="sz-rec-waves">
              <span v-for="n in 8" :key="n" class="sz-rec-wave"></span>
            </div>
            <span class="sz-rec-time">{{ fmtDuration(recTime) }}</span>
          </div>
          <button class="sz-rec-stop" @click="stopRecording" aria-label="Parar gravação">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
          </button>
        </div>

        <!-- Preview de áudio gravado -->
        <div v-else-if="audioBlob" class="sz-audio-preview-bar">
          <audio ref="audioEl" :src="audioUrl" style="display:none"
            @play="isPlaying = true" @pause="isPlaying = false" @ended="isPlaying = false; audioProgress = 0"
            @timeupdate="audioProgress = audioEl?.duration ? (audioEl.currentTime / audioEl.duration * 100) : 0" />
          <button class="sz-ap-cancel" @click="cancelRecording" aria-label="Descartar">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <button class="sz-ap-play" @click="toggleAudioPlay" :aria-label="isPlaying ? 'Pausar' : 'Reproduzir'">
            <svg v-if="isPlaying" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
          <div class="sz-ap-track">
            <div class="sz-ap-progress" :style="{ width: audioProgress + '%' }"></div>
          </div>
          <span class="sz-ap-dur">{{ fmtDuration(recTime) }}</span>
          <button class="sz-ap-send" @click="sendAudio" aria-label="Enviar áudio">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>

        <!-- Normal -->
        <div v-else class="sz-composer-inner">
          <div class="sz-attach-wrap">
            <button class="sz-composer-btn" :class="{ 'sz-composer-btn--open': showAttachMenu }"
              @click.stop="toggleAttachMenu" aria-label="Anexar arquivo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" class="sz-attach-icon">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </button>
            <Transition name="sz-attach">
              <div v-if="showAttachMenu" class="sz-attach-menu" @click.stop>
                <button class="sz-attach-item" @click="triggerFile('image')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  Imagem
                </button>
                <button class="sz-attach-item" @click="triggerFile('document')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Documento
                </button>
                <button class="sz-attach-item" @click="triggerFile('audio')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Arquivo de áudio
                </button>
              </div>
            </Transition>
            <input ref="fileInputImg"   type="file" accept="image/*" style="display:none" @change="e => onFileSelected(e, 'image')" />
            <input ref="fileInputDoc"   type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip" style="display:none" @change="e => onFileSelected(e, 'document')" />
            <input ref="fileInputAudio" type="file" accept="audio/*" style="display:none" @change="e => onFileSelected(e, 'audio')" />
          </div>

          <div class="sz-input-wrap">
            <textarea v-model="novaMsg" ref="inputEl" class="sz-input" placeholder="iMessage"
              rows="1" @keydown.enter.exact.prevent="enviar" @input="autoResize" aria-label="Mensagem" />
          </div>

          <Transition name="sz-send">
            <button v-if="novaMsg.trim() || selectedFile" class="sz-send-btn" @click="enviar" :disabled="enviando" aria-label="Enviar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
            <button v-else class="sz-mic-btn" @click="startRecording" aria-label="Gravar áudio">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
          </Transition>
        </div>
      </div>

    </div>

    <!-- ═══ CONFIG MODAL ═══ -->
    <Transition name="sz-fade">
      <div v-if="configModalOpen" class="sz-modal-overlay" @click.self="configModalOpen = false"
        role="dialog" aria-label="Configurações do lead">
        <div class="sz-modal">
          <button class="sz-modal-close" @click="configModalOpen = false" aria-label="Fechar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <nav class="sz-modal-nav">
            <button class="sz-modal-nav-item" :class="{ 'sz-modal-nav-item--active': activeSection === 'contato' }" @click="activeSection = 'contato'" title="Contato">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </button>
            <button class="sz-modal-nav-item" :class="{ 'sz-modal-nav-item--active': activeSection === 'anotacoes' }" @click="activeSection = 'anotacoes'" title="Anotações">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/><polyline points="15 3 15 9 21 9"/></svg>
            </button>
            <button class="sz-modal-nav-item" :class="{ 'sz-modal-nav-item--active': activeSection === 'followup' }" @click="activeSection = 'followup'" title="Follow-up">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="16" cy="16" r="3"/><path d="M16 14.5V16l1 1"/></svg>
            </button>
            <button class="sz-modal-nav-item" :class="{ 'sz-modal-nav-item--active': activeSection === 'financeiro' }" @click="activeSection = 'financeiro'" title="Financeiro">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </button>
            <button class="sz-modal-nav-item" :class="{ 'sz-modal-nav-item--active': activeSection === 'analise' }" @click="activeSection = 'analise'" title="Análise IA">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/></svg>
            </button>
          </nav>

          <div class="sz-modal-body">

            <!-- Seção: Contato -->
            <div v-if="activeSection === 'contato'">
              <p class="sz-modal-section-title">Contato</p>
              <div v-if="activeCrmLead" class="sz-modal-grid">
                <div class="form-group">
                  <label class="form-label">Nome</label>
                  <input class="form-input" :value="activeCrmLead.nome" @blur="e => saveField('nome', e.target.value)" />
                </div>
                <div class="form-group">
                  <label class="form-label">Telefone</label>
                  <input class="form-input" :value="activeCrmLead.telefone" @blur="e => saveField('telefone', e.target.value)" />
                </div>
                <div class="form-group">
                  <label class="form-label">Email</label>
                  <input class="form-input" :value="activeCrmLead.email" @blur="e => saveField('email', e.target.value)" />
                </div>
                <div class="form-group">
                  <label class="form-label">Empresa</label>
                  <input class="form-input" :value="activeCrmLead.empresa" @blur="e => saveField('empresa', e.target.value)" />
                </div>
                <div class="form-group">
                  <label class="form-label">Etapa</label>
                  <select class="form-select" :value="activeCrmLead.etapa" @change="e => saveField('etapa', e.target.value)">
                    <option v-for="et in ETAPAS" :key="et.id" :value="et.id">{{ et.label }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Valor Estimado (R$)</label>
                  <input class="form-input" type="number" :value="activeCrmLead.valor_estimado"
                    @blur="e => saveField('valor_estimado', e.target.value ? Number(e.target.value) : null)" />
                </div>
                <div class="form-group">
                  <label class="form-label">Origem</label>
                  <input class="form-input" :value="activeCrmLead.origem" @blur="e => saveField('origem', e.target.value)" />
                </div>
                <div class="form-group sz-modal-full">
                  <label class="form-label">Observações</label>
                  <textarea class="form-textarea" rows="3" :value="activeCrmLead.obs" @blur="e => saveField('obs', e.target.value)"></textarea>
                </div>
              </div>
              <div class="sz-modal-history">
                <p class="sz-modal-section-title" style="margin-top:20px">Histórico</p>
                <div class="sz-modal-history-row">
                  <span class="sz-modal-history-label">Adicionado em</span>
                  <span class="sz-modal-history-val">{{ activeCrmLead ? new Date(activeCrmLead.created_at).toLocaleDateString('pt-BR') : '—' }}</span>
                </div>
                <div class="sz-modal-history-row">
                  <span class="sz-modal-history-label">Follow-ups realizados</span>
                  <span class="sz-modal-history-val">{{ activeCrmLead?.followup_count ?? 0 }}</span>
                </div>
                <div class="sz-modal-history-row">
                  <span class="sz-modal-history-label">Releads</span>
                  <span class="sz-modal-history-val">{{ activeCrmLead?.relead_data ? '1' : 'Nenhum' }}</span>
                </div>
              </div>
            </div>

            <!-- Seção: Anotações -->
            <div v-else-if="activeSection === 'anotacoes'">
              <p class="sz-modal-section-title">Anotações</p>
              <textarea class="form-textarea sz-anotacoes-textarea" v-model="anotacoesText"
                placeholder="Anote qualquer informação sobre este lead..."
                @input="onAnotacoesInput(anotacoesText)"></textarea>
            </div>

            <!-- Seção: Follow-up -->
            <div v-else-if="activeSection === 'followup'">
              <p class="sz-modal-section-title">Follow-up</p>
              <div style="display:flex;flex-direction:column;gap:12px">
                <div class="form-group">
                  <label class="form-label">Data e hora do próximo follow-up</label>
                  <input type="datetime-local" class="form-input" v-model="followupDate" />
                </div>
                <div class="form-group">
                  <label class="form-label">Contexto</label>
                  <input type="text" class="form-input" v-model="followupObs" placeholder="Ex.: ligar às 14h sobre proposta" />
                </div>
                <button class="btn btn-primary btn-sm" style="width:fit-content" @click="saveFollowup">
                  Salvar follow-up
                </button>
              </div>
            </div>

            <!-- Seção: Financeiro -->
            <div v-else-if="activeSection === 'financeiro'">
              <p class="sz-modal-section-title">Financeiro</p>
              <div class="sz-modal-grid" style="margin-bottom:20px">
                <div class="form-group">
                  <label class="form-label">Pacote</label>
                  <select class="form-select" :value="activeCrmLead?.pacote ?? ''"
                    @change="e => saveField('pacote', e.target.value || null)">
                    <option value="">Não definido</option>
                    <option value="essencial">Essencial — R$ 797</option>
                    <option value="profissional">Profissional — R$ 1.097</option>
                    <option value="completo">Completo — R$ 1.397</option>
                    <option value="personalizado">Personalizado</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Valor do contrato (R$)</label>
                  <input type="number" class="form-input" :value="activeCrmLead?.valor_contrato ?? ''"
                    @blur="e => saveField('valor_contrato', e.target.value ? Number(e.target.value) : null)" />
                </div>
              </div>

              <div style="margin-bottom:20px">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                  <p class="sz-modal-section-title" style="margin:0">Parcelas</p>
                  <button class="btn btn-ghost btn-sm" @click="adicionarParcela">+ Adicionar</button>
                </div>
                <div v-if="!parcelasLocal.length" style="font-size:13px;color:var(--text-tertiary)">
                  Nenhuma parcela cadastrada.
                </div>
                <div v-for="(p, idx) in parcelasLocal.slice().sort((a,b) => a.numero - b.numero)" :key="p.numero" class="sz-parcela-row">
                  <span class="sz-parcela-num">#{{ p.numero }}</span>
                  <input type="number" class="form-input sz-parcela-input" placeholder="Valor"
                    :value="p.valor"
                    @blur="e => { parcelasLocal[idx].valor = e.target.value ? Number(e.target.value) : null; saveParcelas() }" />
                  <input type="date" class="form-input sz-parcela-input"
                    :value="p.vencimento"
                    @blur="e => { parcelasLocal[idx].vencimento = e.target.value || null; saveParcelas() }" />
                  <label class="sz-parcela-pago">
                    <input type="checkbox" :checked="p.pago" @change="togglePago(idx)" />
                    <span>Pago</span>
                  </label>
                </div>
              </div>

              <div>
                <p class="sz-modal-section-title">Transações vinculadas</p>
                <p v-if="!transacoesLead.length" style="font-size:13px;color:var(--text-tertiary)">
                  Nenhuma transação vinculada a este contato.
                </p>
                <div v-for="t in transacoesLead" :key="t.id" class="tx-row">
                  <span class="tx-date">{{ new Date(t.data).toLocaleDateString('pt-BR') }}</span>
                  <span style="flex:1;font-size:13px;color:var(--text-primary)">{{ t.descricao }}</span>
                  <span class="tx-val" :style="{ color: t.tipo === 'receita' ? 'var(--accent)' : 'var(--status-danger)' }">
                    {{ t.tipo === 'receita' ? '+' : '-' }} R$ {{ Number(t.val).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Seção: Análise IA -->
            <div v-else-if="activeSection === 'analise'">
              <p class="sz-modal-section-title">Análise IA</p>

              <div v-if="analisando" style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:32px 0">
                <div class="sz-typing"><span></span><span></span><span></span></div>
                <p style="font-size:13px;color:var(--text-secondary)">Analisando conversa...</p>
              </div>

              <div v-else-if="erroAnalise" style="padding:16px 0">
                <p style="font-size:13px;color:var(--status-danger);margin-bottom:12px">{{ erroAnalise }}</p>
                <button class="btn btn-primary btn-sm" @click="analisarLead">Tentar novamente</button>
              </div>

              <div v-else-if="!activeCrmLead?.analise_ia" style="padding:16px 0">
                <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;line-height:1.5">
                  A IA analisa as últimas mensagens e avalia o potencial deste lead.
                </p>
                <button class="btn btn-primary" @click="analisarLead">Analisar conversa</button>
              </div>

              <div v-else>
                <div style="margin-bottom:20px">
                  <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                    <span style="font-size:12px;color:var(--text-secondary)">Score</span>
                    <span style="font-size:12px;font-weight:600"
                      :style="{ color: activeCrmLead.analise_ia.score > 70 ? 'var(--accent)' : activeCrmLead.analise_ia.score >= 40 ? 'var(--status-warning)' : 'var(--status-danger)' }">
                      {{ activeCrmLead.analise_ia.score }}/100
                    </span>
                  </div>
                  <div style="height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden">
                    <div style="height:100%;border-radius:3px;transition:width 0.3s"
                      :style="{
                        width: activeCrmLead.analise_ia.score + '%',
                        background: activeCrmLead.analise_ia.score > 70 ? 'var(--accent)' : activeCrmLead.analise_ia.score >= 40 ? 'var(--status-warning)' : 'var(--status-danger)'
                      }"></div>
                  </div>
                </div>
                <p style="font-size:13px;color:var(--text-primary);line-height:1.6;margin-bottom:16px">
                  {{ activeCrmLead.analise_ia.resumo }}
                </p>
                <div v-if="activeCrmLead.analise_ia.positivos?.length" style="margin-bottom:14px">
                  <p style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">Pontos positivos</p>
                  <div v-for="p in activeCrmLead.analise_ia.positivos" :key="p" class="sz-analise-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>{{ p }}</span>
                  </div>
                </div>
                <div v-if="activeCrmLead.analise_ia.atencao?.length" style="margin-bottom:16px">
                  <p style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">Pontos de atenção</p>
                  <div v-for="a in activeCrmLead.analise_ia.atencao" :key="a" class="sz-analise-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--status-warning)" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>{{ a }}</span>
                  </div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06)">
                  <span style="font-size:11px;color:var(--text-tertiary)">
                    Gerado em {{ new Date(activeCrmLead.analise_ia.geradoEm).toLocaleString('pt-BR') }}
                  </span>
                  <button class="btn btn-ghost btn-sm" @click="analisarLead">Re-analisar</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Transition>

    <!-- Empty state (desktop) -->
    <div class="sz-empty-chat" v-if="!activeLead && !isMobile">
      <div class="sz-empty-icon">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity=".18"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <p class="sz-empty-title">Suas Mensagens</p>
      <p class="sz-empty-sub">Selecione uma conversa</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWaStore } from '@/stores/wa'
import { useLeadsStore, ETAPAS } from '@/stores/leads'
import { useAuthStore } from '@/stores/auth'
import { useWorkStore } from '@/stores/work'
import { useFinStore } from '@/stores/fin'
import { sb } from '@/lib/supabase'

const router  = useRouter()
const route   = useRoute()
const wa      = useWaStore()
const leads   = useLeadsStore()
const auth    = useAuthStore()
const work    = useWorkStore()
const fin     = useFinStore()
const toast   = inject('toast')

const search      = ref('')
const activeLead  = ref(null)
const waMsgs      = ref([])
const loadingMsgs = ref(false)
const loading     = ref(true)
const novaMsg     = ref('')
const enviando    = ref(false)
const messagesEl  = ref(null)
const inputEl     = ref(null)
const listEl      = ref(null)
const isMobile    = ref(window.innerWidth < 768)

// Config modal
const configModalOpen = ref(false)
const activeSection   = ref('contato')
const analisando      = ref(false)
const erroAnalise     = ref(null)
const followupDate    = ref('')
const followupObs     = ref('')
const parcelasLocal   = ref([])
const anotacoesText   = ref('')
let anotacoesTimer    = null

// Attachment
const showAttachMenu  = ref(false)
const selectedFile    = ref(null)  // { tipo, nome, dataUrl }
const fileCaption     = ref('')
const fileInputImg    = ref(null)
const fileInputDoc    = ref(null)
const fileInputAudio  = ref(null)

// Recording
let _mediaRecorder = null
let _audioChunks   = []
let _audioStream   = null
let _recTimer      = null

const isRecording   = ref(false)
const recTime       = ref(0)
const audioBlob     = ref(null)
const audioUrl      = ref(null)
const audioEl       = ref(null)
const isPlaying     = ref(false)
const audioProgress = ref(0)

// ── Resize ──
function onResize() { isMobile.value = window.innerWidth < 768 }

// ── Click outside attach menu ──
function onDocClick(e) {
  if (showAttachMenu.value && !e.target.closest('.sz-attach-wrap')) {
    showAttachMenu.value = false
  }
}

// ── Avatar ──
const AVATAR_COLORS = ['#22c55e','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899']
function avatarColor(nome) {
  if (!nome) return AVATAR_COLORS[0]
  let h = 0; for (const c of nome) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function initials(nome) {
  if (!nome) return '?'
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
function etapaColor(etapa) { return ETAPAS.find(e => e.id === etapa)?.color || '#888' }
function etapaLabel(etapa) { return ETAPAS.find(e => e.id === etapa)?.label || etapa }
function fmtValor(v) {
  return v ? 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''
}

// ── Status indicators ──
function itemStatuses(lead) {
  const s = [], now = new Date()
  if (lead.proximo_followup && new Date(lead.proximo_followup) <= now)
    s.push({ type: 'followup', label: 'Follow-up', color: '#e8a838' })
  if (lead.relead_data && new Date(lead.relead_data) <= now)
    s.push({ type: 'relead', label: 'Relead', color: '#8b5cf6' })
  if (work.leadsComWork.has(lead.id))
    s.push({ type: 'work', label: 'Work', color: '#5b8dee' })
  return s
}

const leadStatus = computed(() => {
  if (!activeLead.value) return []
  const lead = activeLead.value
  const s = [], now = new Date()
  if (lead.proximo_followup && new Date(lead.proximo_followup) <= now)
    s.push({ type: 'followup', label: 'Follow-up', color: '#e8a838',
      date: new Date(lead.proximo_followup).toLocaleDateString('pt-BR') })
  if (lead.relead_data && new Date(lead.relead_data) <= now)
    s.push({ type: 'relead', label: 'Relead', color: '#8b5cf6',
      date: new Date(lead.relead_data).toLocaleDateString('pt-BR') })
  if (work.leadsComWork.has(lead.id))
    s.push({ type: 'work', label: 'Work', color: '#5b8dee' })
  return s
})

const leadWorkItems = computed(() =>
  work.items.filter(i => i.lead_id === activeLead.value?.id)
)

// ── Config Modal ──
const activeCrmLead = computed(() =>
  activeLead.value?.id
    ? leads.leads.find(l => l.id === activeLead.value.id) ?? null
    : null
)

watch([configModalOpen, activeSection], () => {
  if (!configModalOpen.value || !activeCrmLead.value) return
  const l = activeCrmLead.value
  if (activeSection.value === 'followup') {
    followupDate.value = l.proximo_followup ? l.proximo_followup.slice(0, 16) : ''
    followupObs.value  = l.followup_obs ?? ''
  }
  if (activeSection.value === 'financeiro') {
    parcelasLocal.value = JSON.parse(JSON.stringify(l.parcelas ?? []))
  }
  if (activeSection.value === 'anotacoes') {
    anotacoesText.value = l.anotacoes ?? ''
  }
})

watch(activeLead, () => {
  configModalOpen.value = false
  activeSection.value   = 'contato'
  erroAnalise.value     = null
})

function onEscModal(e) { if (e.key === 'Escape') configModalOpen.value = false }
watch(configModalOpen, (val) => {
  if (val) document.addEventListener('keydown', onEscModal)
  else     document.removeEventListener('keydown', onEscModal)
})

function saveField(field, value) {
  if (!activeCrmLead.value || activeCrmLead.value[field] === value) return
  leads.upsert({ id: activeCrmLead.value.id, [field]: value ?? null })
}

function onAnotacoesInput(val) {
  clearTimeout(anotacoesTimer)
  anotacoesTimer = setTimeout(() => {
    if (!activeCrmLead.value) return
    leads.upsert({ id: activeCrmLead.value.id, anotacoes: val || null })
  }, 800)
}

async function saveFollowup() {
  if (!activeCrmLead.value) return
  await leads.upsert({
    id: activeCrmLead.value.id,
    proximo_followup: followupDate.value || null,
    followup_obs: followupObs.value || null,
    followup_count: (activeCrmLead.value.followup_count ?? 0) + 1
  })
  toast('Follow-up salvo', 'ok')
}

const transacoesLead = computed(() => {
  if (!activeCrmLead.value?.nome) return []
  const nome = activeCrmLead.value.nome.toLowerCase()
  return fin.fin
    .filter(t => t.cli?.toLowerCase() === nome)
    .slice(0, 10)
})

function adicionarParcela() {
  parcelasLocal.value.push({
    numero: parcelasLocal.value.length + 1,
    valor: null,
    vencimento: null,
    pago: false
  })
}

function saveParcelas() {
  if (!activeCrmLead.value) return
  leads.upsert({ id: activeCrmLead.value.id, parcelas: parcelasLocal.value })
}

function togglePago(idx) {
  parcelasLocal.value[idx].pago = !parcelasLocal.value[idx].pago
  saveParcelas()
}

async function analisarLead() {
  if (!activeCrmLead.value) return
  analisando.value  = true
  erroAnalise.value = null
  try {
    const msgs = waMsgs.value
      .slice(-50)
      .map(m => ({ direcao: m.direcao, mensagem: (m.mensagem || '').slice(0, 500), data: m.data }))
    const { data, error } = await sb.functions.invoke('analyze-lead', {
      body: { leadId: activeCrmLead.value.id, messages: msgs }
    })
    if (error) throw error
    await leads.upsert({ id: activeCrmLead.value.id, analise_ia: data })
  } catch {
    erroAnalise.value = 'Erro ao analisar. Tente novamente.'
  } finally {
    analisando.value = false
  }
}

// ── Time formatting ──
function fmtTime(ts) {
  if (!ts) return ''
  const d = new Date(ts), hoje = new Date()
  const diff = hoje - d
  if (diff < 60000) return 'Agora'
  if (d.toDateString() === hoje.toDateString()) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diff < 7 * 86400000) return d.toLocaleDateString('pt-BR', { weekday: 'short' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
function fmtHour(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
function fmtDateSep(ts) {
  if (!ts) return ''
  const d = new Date(ts), hoje = new Date()
  if (d.toDateString() === hoje.toDateString()) return 'Hoje'
  const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1)
  if (d.toDateString() === ontem.toDateString()) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

// ── Message groups ──
const msgGroups = computed(() => {
  const groups = []
  let curDate = null, curGroup = null
  for (const m of waMsgs.value) {
    const dateStr = fmtDateSep(m.data)
    if (dateStr !== curDate) {
      curDate = dateStr
      curGroup = { label: dateStr, msgs: [] }
      groups.push(curGroup)
    }
    curGroup.msgs.push(m)
  }
  return groups
})

const filteredChats = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return wa.chats
  return wa.chats.filter(c =>
    c.lead.nome?.toLowerCase().includes(q) || c.lead.telefone?.includes(q)
  )
})

function scrollBottom() {
  nextTick(() => { if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight })
}

function autoResize() {
  if (!inputEl.value) return
  inputEl.value.style.height = 'auto'
  inputEl.value.style.height = Math.min(inputEl.value.scrollHeight, 120) + 'px'
}

// ── Chat open/close ──
async function openChat(chatLead) {
  activeLead.value = chatLead.id
    ? (leads.leads.find(l => l.id === chatLead.id) || chatLead)
    : chatLead
  loadingMsgs.value = true
  const all = chatLead.id
    ? await leads.loadConversas(chatLead.id)
    : await leads.loadConversasByPhone(chatLead.telefone)
  waMsgs.value = (all || []).filter(c => c.canal === 'whatsapp')
  loadingMsgs.value = false
  scrollBottom()
  nextTick(() => inputEl.value?.focus())
  clearInterval(msgPoller)
  msgPoller = setInterval(pollMsgs, 3000)
}

function closeChat() {
  activeLead.value = null
  clearInterval(msgPoller)
  msgPoller = null
}

// ── Recording ──
function fmtDuration(s) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
}

async function startRecording() {
  try {
    _audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    _audioChunks = []
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : 'audio/webm'
    _mediaRecorder = new MediaRecorder(_audioStream, { mimeType })
    _mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) _audioChunks.push(e.data) }
    _mediaRecorder.onstop = () => {
      const blob = new Blob(_audioChunks, { type: mimeType.split(';')[0] })
      audioBlob.value = blob
      audioUrl.value = URL.createObjectURL(blob)
      _audioStream?.getTracks().forEach(t => t.stop())
      _audioStream = null
    }
    _mediaRecorder.start(100)
    isRecording.value = true
    recTime.value = 0
    _recTimer = setInterval(() => { recTime.value++; if (recTime.value >= 120) stopRecording() }, 1000)
  } catch (e) {
    toast('Microfone indisponível: ' + (e?.message || ''), 'error')
  }
}

function stopRecording() {
  clearInterval(_recTimer)
  if (_mediaRecorder?.state !== 'inactive') _mediaRecorder?.stop()
  isRecording.value = false
}

function cancelRecording() {
  clearInterval(_recTimer)
  if (_mediaRecorder?.state !== 'inactive') _mediaRecorder?.stop()
  _audioStream?.getTracks().forEach(t => t.stop()); _audioStream = null
  isRecording.value = false
  if (audioUrl.value) { URL.revokeObjectURL(audioUrl.value); audioUrl.value = null }
  audioBlob.value = null; isPlaying.value = false; audioProgress.value = 0
}

function toggleAudioPlay() {
  if (!audioEl.value) return
  if (isPlaying.value) audioEl.value.pause()
  else audioEl.value.play()
}

async function sendAudio() {
  if (!audioBlob.value) return
  const blob = audioBlob.value
  const ext = blob.type.includes('ogg') ? 'ogg' : 'webm'
  const dataUrl = await new Promise(resolve => {
    const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(blob)
  })
  selectedFile.value = { tipo: 'audio', nome: `audio_${Date.now()}.${ext}`, dataUrl }
  if (audioUrl.value) { URL.revokeObjectURL(audioUrl.value); audioUrl.value = null }
  audioBlob.value = null; isPlaying.value = false; audioProgress.value = 0
  await _enviarArquivo()
}

// ── Attachment ──
function toggleAttachMenu() { showAttachMenu.value = !showAttachMenu.value }

function triggerFile(tipo) {
  showAttachMenu.value = false
  if (tipo === 'image') fileInputImg.value?.click()
  else if (tipo === 'document') fileInputDoc.value?.click()
  else fileInputAudio.value?.click()
}

async function onFileSelected(e, tipo) {
  const file = e.target.files?.[0]
  if (!file) return
  e.target.value = ''
  if (file.size > 10 * 1024 * 1024) { toast('Arquivo muito grande (máx 10MB)', 'error'); return }
  const dataUrl = await new Promise(resolve => {
    const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(file)
  })
  selectedFile.value = { tipo, nome: file.name, dataUrl }
}

// ── Send ──
async function enviar() {
  if (enviando.value || !activeLead.value?.telefone) return
  if (selectedFile.value) { await _enviarArquivo(); return }
  const txt = novaMsg.value.trim()
  if (!txt) return
  enviando.value = true
  const opt = { id: 'opt_' + Date.now(), direcao: 'enviado', mensagem: txt, data: new Date().toISOString(), canal: 'whatsapp' }
  waMsgs.value.push(opt)
  novaMsg.value = ''
  if (inputEl.value) inputEl.value.style.height = 'auto'
  scrollBottom()
  try {
    await wa.enviarMensagem(activeLead.value.id, auth.user.id, activeLead.value.telefone, txt)
    await wa.loadChats()
  } catch (e) {
    waMsgs.value = waMsgs.value.filter(m => m.id !== opt.id)
    toast('Erro ao enviar: ' + (e?.message || ''), 'error')
  } finally { enviando.value = false }
}

async function _enviarArquivo() {
  const f = selectedFile.value
  const caption = fileCaption.value
  const labels = { image: '[Imagem]', document: `[Documento: ${f.nome}]`, audio: '[Áudio]' }
  const previewText = caption || labels[f.tipo] || '[Arquivo]'
  const opt = { id: 'opt_' + Date.now(), direcao: 'enviado', mensagem: previewText, data: new Date().toISOString(), canal: 'whatsapp' }
  waMsgs.value.push(opt)
  selectedFile.value = null; fileCaption.value = ''
  enviando.value = true; scrollBottom()
  try {
    await wa.enviarArquivo(activeLead.value.id, auth.user.id, activeLead.value.telefone, f.tipo, f.dataUrl, f.nome, caption)
    await wa.loadChats()
  } catch (e) {
    waMsgs.value = waMsgs.value.filter(m => m.id !== opt.id)
    toast('Erro ao enviar arquivo: ' + (e?.message || ''), 'error')
  } finally { enviando.value = false }
}

function irCRM() { router.push('/crm') }

// ── Realtime ──
let realtimeChannel = null
let statusTimer = null
let msgPoller = null

async function pollMsgs() {
  if (!activeLead.value) return
  const all = activeLead.value.id
    ? await leads.loadConversas(activeLead.value.id)
    : await leads.loadConversasByPhone(activeLead.value.telefone)
  const fresh = (all || []).filter(c => c.canal === 'whatsapp')
  const existingIds = new Set(waMsgs.value.map(m => m.id))
  const added = fresh.filter(m => !existingIds.has(m.id))
  if (added.length) {
    const confirmedTexts = new Set(added.map(m => m.mensagem))
    waMsgs.value = [
      ...waMsgs.value.filter(m => !m.id?.startsWith('opt_') || !confirmedTexts.has(m.mensagem)),
      ...added,
    ].sort((a, b) => new Date(a.data) - new Date(b.data))
    scrollBottom()
  }
}

onMounted(async () => {
  window.addEventListener('resize', onResize)
  document.addEventListener('click', onDocClick, true)

  // Verifica status do servidor local e inicia polling
  await wa.checkStatus()
  statusTimer = setInterval(async () => {
    await wa.checkStatus()
    await wa.loadChats()
  }, 5000)

  loading.value = true
  await Promise.all([wa.loadChats(), work.load()])
  loading.value = false

  const leadId = route.query.lead
  if (leadId) {
    const chat = wa.chats.find(c => c.lead.id === leadId)
    if (chat) openChat(chat.lead)
    else { const lead = leads.leads.find(l => l.id === leadId); if (lead) openChat(lead) }
  }

  realtimeChannel = sb.channel('slaczap-' + auth.user.id)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversas', filter: 'user_id=eq.' + auth.user.id },
      async (payload) => {
        const nova = payload.new
        if (nova.canal !== 'whatsapp') return
        await wa.loadChats()
        const active = activeLead.value
        const isActive = active && (
          (active.id && active.id === nova.lead_id) ||
          (!active.id && nova.telefone && active.telefone &&
            nova.telefone.slice(-8) === active.telefone.replace(/\D/g,'').slice(-8))
        )
        if (isActive) {
          const exists = waMsgs.value.some(m => m.id === nova.id || (m.id?.startsWith('opt_') && m.mensagem === nova.mensagem))
          if (!exists) { waMsgs.value.push(nova); scrollBottom() }
        }
      })
    .subscribe()
})
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  document.removeEventListener('click', onDocClick, true)
  if (realtimeChannel) sb.removeChannel(realtimeChannel)
  clearInterval(statusTimer)
  clearInterval(msgPoller)
  cancelRecording()
})
</script>

<style scoped>
/* ── Overlay de conexão ── */
@keyframes sz-spin { to { transform: rotate(360deg) } }
@keyframes sz-qr-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,.4) } 50% { box-shadow: 0 0 0 10px rgba(34,197,94,0) } }

.sz-connect-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base);
  z-index: 10;
  animation: sz-fadein .2s ease;
}
.sz-qr-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  padding: 2rem;
}
.sz-qr-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -.02em;
}
.sz-qr-sub {
  font-size: .82rem;
  color: var(--text-secondary);
  max-width: 280px;
  line-height: 1.5;
}
.sz-qr-img {
  width: 220px;
  height: 220px;
  border-radius: 16px;
  border: 3px solid var(--accent);
  animation: sz-qr-pulse 2s ease infinite;
}
.sz-connecting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .75rem;
  text-align: center;
  padding: 2rem;
}
.sz-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--bg-overlay);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: sz-spin .8s linear infinite;
}
.sz-connecting-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}
.sz-connecting-hint {
  font-size: .8rem;
  color: var(--text-secondary);
  max-width: 260px;
  line-height: 1.5;
}

/* ── Sidebar title row ── */
.sz-sidebar-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: .65rem;
}
.sz-disconnect-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  border-radius: 8px;
  cursor: pointer;
  transition: background .12s, color .12s;
}
.sz-disconnect-btn:hover { background: rgba(224,85,85,.12); color: #e05555; }

/* ── Root ── */
@keyframes sz-fadein { from { opacity: 0 } to { opacity: 1 } }

.sz-root {
  position: relative;
  display: flex;
  height: calc(100vh - 56px);
  overflow: hidden;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-base);
  animation: sz-fadein .15s ease;
}

/* ── Sidebar ── */
.sz-sidebar {
  width: 320px;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  transition: transform .3s cubic-bezier(.4,0,.2,1);
}
.sz-sidebar-header {
  padding: 1rem 1rem .75rem;
  background: var(--bg-surface);
  position: sticky;
  top: 0;
  z-index: 2;
  border-bottom: 1px solid var(--border-subtle);
}
.sz-sidebar-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: .65rem;
  letter-spacing: -.02em;
}
.sz-search-wrap { position: relative; }
.sz-search-icon {
  position: absolute; left: .7rem; top: 50%; transform: translateY(-50%);
  color: var(--text-tertiary); pointer-events: none;
}
.sz-search {
  width: 100%;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: .5rem .75rem .5rem 2.1rem;
  color: var(--text-primary);
  font-size: .85rem;
  font-family: inherit;
  outline: none;
  transition: background .15s, border-color .15s;
}
.sz-search:focus { background: var(--bg-overlay); border-color: var(--border-default); }
.sz-search::placeholder { color: var(--text-tertiary); }

.sz-list { flex: 1; overflow-y: auto; overflow-x: hidden; }
.sz-list::-webkit-scrollbar { width: 3px; }
.sz-list::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 2px; }

.sz-empty-list {
  padding: 3rem 1rem; text-align: center;
  color: var(--text-tertiary); font-size: .82rem;
}

/* ── Chat item ── */
.sz-item {
  width: 100%; display: flex; align-items: center; gap: .75rem;
  padding: .65rem 1rem; border: none; background: none;
  cursor: pointer; text-align: left; transition: background .12s;
  touch-action: manipulation; min-height: 64px; position: relative;
}
.sz-item::after {
  content: ''; position: absolute; bottom: 0; left: 68px; right: 0;
  height: 1px; background: var(--border-subtle);
}
.sz-item:hover { background: var(--bg-elevated); }
.sz-item:active { background: var(--bg-overlay); }
.sz-item--active { background: var(--accent-subtle); }
.sz-item--active::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; background: var(--accent); border-radius: 0 2px 2px 0; z-index: 2;
}
.sz-item-status-bar {
  position: absolute; left: 0; top: 6px; bottom: 6px;
  width: 3px; border-radius: 0 2px 2px 0; z-index: 1;
}

.sz-avatar-wrap { position: relative; flex-shrink: 0; }
.sz-avatar {
  width: 46px; height: 46px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .8rem; font-weight: 700; color: #fff; flex-shrink: 0;
}
.sz-item-body { flex: 1; min-width: 0; }
.sz-item-row { display: flex; justify-content: space-between; align-items: baseline; gap: .5rem; }
.sz-item-name { font-size: .88rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sz-item-time { font-size: .72rem; color: var(--text-tertiary); flex-shrink: 0; }
.sz-item-preview { font-size: .78rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; margin-top: .1rem; }
.sz-checkmark { color: var(--accent); }

/* ── Skeleton ── */
.sz-skeleton { display: flex; gap: .75rem; padding: .65rem 1rem; align-items: center; }
.sz-skeleton-avatar { width: 46px; height: 46px; border-radius: 50%; background: var(--bg-elevated); animation: sz-pulse 1.4s ease-in-out infinite; flex-shrink: 0; }
.sz-skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: .4rem; }
.sz-skeleton-line { height: 11px; border-radius: 6px; background: var(--bg-elevated); animation: sz-pulse 1.4s ease-in-out infinite; }
.sz-skeleton-line--name { width: 55%; }
.sz-skeleton-line--msg { width: 75%; opacity: .6; }
@keyframes sz-pulse { 0%, 100% { opacity: .4 } 50% { opacity: .8 } }

/* ── Chat area ── */
.sz-chat {
  flex: 1; display: flex; flex-direction: column;
  min-width: 0; background: var(--bg-base); position: relative;
}

/* ── Chat header ── */
.sz-chat-header {
  display: flex; align-items: center; gap: .65rem;
  padding: .7rem 1rem;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky; top: 0; z-index: 10; min-height: 56px;
}
.sz-back-btn {
  display: flex; align-items: center; gap: .3rem;
  border: none; background: none; color: var(--accent);
  cursor: pointer; padding: .5rem .4rem; border-radius: 8px;
  min-width: 44px; min-height: 44px; justify-content: center;
  touch-action: manipulation; flex-shrink: 0;
}
.sz-back-label { font-size: .85rem; font-weight: 500; }
.sz-chat-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .73rem; font-weight: 700; color: #fff; flex-shrink: 0;
}
.sz-chat-meta { flex: 1; min-width: 0; }
.sz-chat-name { display: block; font-size: .9rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sz-chat-status { font-size: .72rem; color: var(--accent); }
.sz-chat-toolbar { display: flex; align-items: center; gap: .4rem; flex-shrink: 0; }
.sz-etapa-badge { font-size: .68rem; font-weight: 600; padding: .2rem .55rem; border-radius: 20px; white-space: nowrap; }
.sz-toolbar-btn {
  width: 34px; height: 34px; min-width: 34px;
  border: none; background: var(--bg-elevated); border-radius: 50%;
  color: var(--text-secondary); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s; touch-action: manipulation;
}
.sz-toolbar-btn:hover { background: var(--bg-overlay); color: var(--text-primary); }

/* ── Status bar ── */
.sz-chat-status-bar {
  display: flex; flex-wrap: wrap; gap: .35rem;
  padding: .4rem .75rem;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}
.sz-status-chip {
  display: inline-flex; align-items: center; gap: .3rem;
  font-size: .72rem; font-weight: 600;
  padding: .2rem .55rem; border-radius: 20px;
  letter-spacing: .02em;
}
.sz-status-date { font-weight: 400; opacity: .85; }

/* ── Messages ── */
.sz-messages {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  padding: .75rem 1rem 1rem;
  display: flex; flex-direction: column; scroll-behavior: smooth;
}
.sz-messages::-webkit-scrollbar { width: 3px; }
.sz-messages::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 2px; }

.sz-msgs-loading { display: flex; justify-content: center; padding: 2rem; }
.sz-no-msgs { text-align: center; color: var(--text-tertiary); font-size: .83rem; padding: 3rem 1rem; line-height: 1.7; }

/* ── Time separator ── */
.sz-time-sep {
  text-align: center; font-size: .7rem; color: var(--text-tertiary);
  margin: .75rem 0 .5rem; font-weight: 500; letter-spacing: .03em;
}

/* ── Bubbles ── */
.sz-bubble-wrap {
  display: flex; margin-bottom: 2px;
  animation: sz-bubble-in .18s cubic-bezier(.17,.67,.45,1.4);
}
.sz-bubble-wrap--out { justify-content: flex-end; }
.sz-bubble-wrap--in  { justify-content: flex-start; }
@keyframes sz-bubble-in { from { opacity: 0; transform: scale(.88) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.sz-bubble {
  max-width: 72%; padding: .5rem .75rem .35rem;
  border-radius: 18px; position: relative; word-break: break-word;
}
.sz-bubble--out { background: var(--accent); color: #000; border-bottom-right-radius: 18px; }
.sz-bubble--in  { background: var(--bg-overlay); color: var(--text-primary); border-bottom-left-radius: 18px; }
.sz-bubble--tail-out { border-bottom-right-radius: 4px; }
.sz-bubble--tail-in  { border-bottom-left-radius: 4px; }
.sz-bubble--stacked  { border-radius: 18px; margin-bottom: 1px; }

.sz-bubble-text { font-size: .88rem; line-height: 1.45; display: block; }
.sz-bubble-footer { display: flex; align-items: center; justify-content: flex-end; gap: .25rem; margin-top: .2rem; }
.sz-bubble-time { font-size: .65rem; opacity: .6; }
.sz-bubble--out .sz-bubble-time { color: rgba(0,0,0,.6); }
.sz-bubble-check { font-size: .65rem; color: rgba(0,0,0,.55); }

/* ── Typing ── */
.sz-typing { display: flex; align-items: center; gap: 4px; padding: .6rem .8rem; background: var(--bg-overlay); border-radius: 18px; border-bottom-left-radius: 4px; width: fit-content; }
.sz-typing span { width: 7px; height: 7px; border-radius: 50%; background: var(--text-tertiary); animation: sz-bounce .9s ease-in-out infinite; }
.sz-typing span:nth-child(2) { animation-delay: .15s; }
.sz-typing span:nth-child(3) { animation-delay: .3s; }
@keyframes sz-bounce { 0%, 80%, 100% { transform: scale(.8); opacity: .5; } 40% { transform: scale(1.1); opacity: 1; } }

/* ── File preview ── */
.sz-file-preview {
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  padding: .55rem .75rem;
  display: flex; align-items: center; gap: .65rem;
}
.sz-file-preview-inner {
  flex: 1; display: flex; align-items: center; gap: .65rem; min-width: 0;
}
.sz-preview-img {
  height: 50px; width: 50px; object-fit: cover; border-radius: 8px; flex-shrink: 0;
}
.sz-preview-file-info {
  display: flex; align-items: center; gap: .45rem; color: var(--text-secondary);
}
.sz-preview-fname {
  font-size: .8rem; color: var(--text-primary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px;
}
.sz-preview-caption {
  flex: 1; background: none; border: none; outline: none;
  color: var(--text-primary); font-size: .84rem; font-family: inherit;
  min-width: 0;
}
.sz-preview-caption::placeholder { color: var(--text-tertiary); }
.sz-preview-remove {
  width: 26px; height: 26px; min-width: 26px; border-radius: 50%;
  border: none; background: var(--bg-overlay); color: var(--text-secondary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background .15s;
}
.sz-preview-remove:hover { background: var(--status-danger); color: #fff; }

/* ── Composer ── */
.sz-composer {
  padding: .5rem .75rem;
  padding-bottom: max(.5rem, env(safe-area-inset-bottom));
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
}
.sz-composer-inner { display: flex; align-items: flex-end; gap: .5rem; }

/* ── Attach menu ── */
.sz-attach-wrap { position: relative; }
.sz-attach-menu {
  position: absolute; bottom: calc(100% + .5rem); left: 0;
  background: var(--bg-elevated); border: 1px solid var(--border-default);
  border-radius: 12px; overflow: hidden; min-width: 152px;
  box-shadow: 0 8px 24px rgba(0,0,0,.2); z-index: 100;
}
.sz-attach-item {
  display: flex; align-items: center; gap: .55rem;
  width: 100%; padding: .6rem .85rem;
  border: none; background: none; color: var(--text-primary);
  font-size: .84rem; font-family: inherit; cursor: pointer; text-align: left;
  transition: background .12s;
}
.sz-attach-item:hover { background: var(--bg-overlay); }
.sz-attach-item + .sz-attach-item { border-top: 1px solid var(--border-subtle); }

.sz-attach-icon { transition: transform .2s cubic-bezier(.34,1.56,.64,1); }
.sz-composer-btn--open .sz-attach-icon { transform: rotate(45deg); }

.sz-composer-btn, .sz-mic-btn {
  width: 34px; height: 34px; min-width: 34px;
  border-radius: 50%; border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; transition: all .15s;
  touch-action: manipulation; margin-bottom: 2px;
}
.sz-composer-btn { background: var(--bg-elevated); color: var(--text-secondary); }
.sz-composer-btn:hover { background: var(--bg-overlay); }
.sz-mic-btn { background: var(--accent); color: #000; }
.sz-input-wrap { flex: 1; }
.sz-input {
  width: 100%; background: var(--bg-elevated); border: 1px solid var(--border-default);
  border-radius: 20px; padding: .55rem 1rem;
  color: var(--text-primary); font-size: .88rem; font-family: inherit;
  resize: none; outline: none; line-height: 1.45;
  transition: border-color .15s, background .15s;
  display: block; overflow: hidden; max-height: 120px;
}
.sz-input:focus { border-color: var(--accent); background: var(--bg-overlay); }
.sz-input::placeholder { color: var(--text-tertiary); }

.sz-send-btn {
  width: 34px; height: 34px; min-width: 34px;
  border-radius: 50%; border: none; background: var(--accent); color: #000;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; transition: transform .15s, opacity .15s;
  touch-action: manipulation; margin-bottom: 2px;
}
.sz-send-btn:hover { transform: scale(1.08); }
.sz-send-btn:active { transform: scale(.94); }
.sz-send-btn:disabled { opacity: .4; }

.sz-send-enter-active, .sz-send-leave-active { transition: all .15s cubic-bezier(.34,1.56,.64,1); }
.sz-send-enter-from { opacity: 0; transform: scale(.4); }
.sz-send-leave-to { opacity: 0; transform: scale(.4); }

.sz-attach-enter-active { transition: all .15s cubic-bezier(.34,1.56,.64,1); }
.sz-attach-leave-active { transition: all .1s ease; }
.sz-attach-enter-from { opacity: 0; transform: scale(.9) translateY(4px); }
.sz-attach-leave-to { opacity: 0; transform: scale(.9) translateY(4px); }

/* ── Config Modal Glass ── */
.sz-modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 200;
  display: flex; align-items: center; justify-content: center;
}
.sz-modal {
  display: flex;
  width: min(720px, 95vw);
  height: min(560px, 90vh);
  background: rgba(22,22,22,0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  overflow: hidden;
  position: relative;
}
.sz-modal-close {
  position: absolute; top: 12px; right: 12px;
  background: none; border: none; cursor: pointer;
  color: var(--text-tertiary); padding: 4px; border-radius: 4px;
  transition: color 0.15s;
}
.sz-modal-close:hover { color: var(--text-primary); }
.sz-modal-nav {
  width: 64px; flex-shrink: 0;
  border-right: 1px solid rgba(255,255,255,0.06);
  display: flex; flex-direction: column;
  padding: 48px 0 12px; gap: 2px;
}
.sz-modal-nav-item {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 44px;
  background: none; border: none; cursor: pointer;
  color: var(--text-tertiary);
  border-left: 2px solid transparent;
  transition: color 0.15s, background 0.15s;
}
.sz-modal-nav-item:hover { color: var(--text-secondary); background: rgba(255,255,255,0.03); }
.sz-modal-nav-item--active {
  color: var(--accent);
  border-left-color: var(--accent);
  background: var(--accent-subtle);
}
.sz-modal-body {
  flex: 1; overflow-y: auto; padding: 24px;
}
.sz-modal-body::-webkit-scrollbar { width: 4px; }
.sz-modal-body::-webkit-scrollbar-track { background: transparent; }
.sz-modal-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
.sz-modal-section-title {
  font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
  color: var(--text-secondary); text-transform: uppercase;
  margin-bottom: 16px; margin-top: 0;
}
.sz-modal-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
.sz-modal-full { grid-column: 1 / -1; }
.sz-modal-history-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
}
.sz-modal-history-row:last-child { border-bottom: none; }
.sz-modal-history-label { font-size: 12px; color: var(--text-secondary); }
.sz-modal-history-val { font-size: 12px; color: var(--text-primary); font-weight: 500; }
.sz-anotacoes-textarea { width: 100%; min-height: 200px; resize: vertical; box-sizing: border-box; }
.sz-parcela-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.sz-parcela-num { font-size: 12px; color: var(--text-tertiary); min-width: 24px; }
.sz-parcela-input { flex: 1; min-width: 0; }
.sz-parcela-pago {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; color: var(--text-secondary); white-space: nowrap; cursor: pointer;
}
.sz-analise-item {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 13px; padding: 4px 0; color: var(--text-primary);
}
.sz-analise-item svg { flex-shrink: 0; margin-top: 2px; }
/* Fade transition */
.sz-fade-enter-active, .sz-fade-leave-active { transition: opacity 0.15s ease; }
.sz-fade-enter-from, .sz-fade-leave-to { opacity: 0; }
/* Mobile */
@media (max-width: 768px) {
  .sz-modal { width: 100vw; height: 100vh; border-radius: 0; border: none; flex-direction: column; }
  .sz-modal-nav {
    width: 100%; height: 52px; flex-shrink: 0; flex-direction: row;
    border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06);
    padding: 0; overflow-x: auto; overflow-y: hidden; scrollbar-width: none;
  }
  .sz-modal-nav::-webkit-scrollbar { display: none; }
  .sz-modal-nav-item { flex-shrink: 0; width: 52px; height: 100%; border-left: none; border-bottom: 2px solid transparent; }
  .sz-modal-nav-item--active { border-left-color: transparent; border-bottom-color: var(--accent); }
  .sz-modal-body { padding: 16px; }
  .sz-modal-grid { grid-template-columns: 1fr; }
}

/* ── Empty state ── */
.sz-empty-chat {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: .6rem; background: var(--bg-base);
}
.sz-empty-icon { margin-bottom: .25rem; }
.sz-empty-title { font-size: 1.1rem; font-weight: 600; color: var(--text-primary); }
.sz-empty-sub { font-size: .83rem; color: var(--text-tertiary); }

/* ── Recording bar ── */
.sz-recording-bar {
  display: flex; align-items: center; gap: .65rem; padding: .3rem 0; min-height: 42px;
}
.sz-rec-cancel {
  width: 36px; height: 36px; min-width: 36px; border-radius: 50%;
  border: none; background: var(--bg-elevated); color: var(--text-secondary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background .15s; flex-shrink: 0;
}
.sz-rec-cancel:hover { background: var(--bg-overlay); }
.sz-rec-stop {
  width: 36px; height: 36px; min-width: 36px; border-radius: 50%;
  border: none; background: var(--status-danger); color: #fff;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: transform .15s;
}
.sz-rec-stop:hover { transform: scale(1.08); }
.sz-rec-center {
  flex: 1; display: flex; align-items: center; gap: .55rem; min-width: 0;
}
.sz-rec-dot {
  width: 9px; height: 9px; border-radius: 50%;
  background: var(--status-danger); flex-shrink: 0;
  animation: sz-pulse-rec .9s ease-in-out infinite;
}
@keyframes sz-pulse-rec { 0%, 100% { opacity: 1; transform: scale(1) } 50% { opacity: .3; transform: scale(.7) } }
.sz-rec-waves {
  flex: 1; display: flex; align-items: center; gap: 3px; height: 22px;
}
.sz-rec-wave {
  width: 3px; border-radius: 3px; background: var(--status-danger);
  animation: sz-wave .75s ease-in-out infinite;
}
.sz-rec-wave:nth-child(1) { height: 6px;  animation-delay: 0s; }
.sz-rec-wave:nth-child(2) { height: 12px; animation-delay: .1s; }
.sz-rec-wave:nth-child(3) { height: 18px; animation-delay: .2s; }
.sz-rec-wave:nth-child(4) { height: 14px; animation-delay: .15s; }
.sz-rec-wave:nth-child(5) { height: 20px; animation-delay: .05s; }
.sz-rec-wave:nth-child(6) { height: 14px; animation-delay: .25s; }
.sz-rec-wave:nth-child(7) { height: 10px; animation-delay: .1s; }
.sz-rec-wave:nth-child(8) { height: 6px;  animation-delay: .3s; }
@keyframes sz-wave { 0%, 100% { transform: scaleY(.35); opacity: .55 } 50% { transform: scaleY(1); opacity: 1 } }
.sz-rec-time {
  font-size: .88rem; font-weight: 600; color: var(--status-danger);
  font-variant-numeric: tabular-nums; white-space: nowrap;
}

/* ── Audio preview bar ── */
.sz-audio-preview-bar {
  display: flex; align-items: center; gap: .5rem; padding: .3rem 0; min-height: 42px;
}
.sz-ap-cancel {
  width: 34px; height: 34px; min-width: 34px; border-radius: 50%;
  border: none; background: var(--bg-elevated); color: var(--text-secondary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background .15s; flex-shrink: 0;
}
.sz-ap-cancel:hover { background: var(--bg-overlay); }
.sz-ap-play {
  width: 34px; height: 34px; min-width: 34px; border-radius: 50%;
  border: none; background: var(--accent); color: #000;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: transform .15s;
}
.sz-ap-play:hover { transform: scale(1.08); }
.sz-ap-track {
  flex: 1; height: 4px; background: var(--bg-overlay); border-radius: 4px; overflow: hidden;
}
.sz-ap-progress {
  height: 100%; background: var(--accent); border-radius: 4px; transition: width .1s linear;
}
.sz-ap-dur {
  font-size: .78rem; color: var(--text-secondary);
  font-variant-numeric: tabular-nums; white-space: nowrap;
}
.sz-ap-send {
  width: 34px; height: 34px; min-width: 34px; border-radius: 50%;
  border: none; background: var(--accent); color: #000;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: transform .15s;
}
.sz-ap-send:hover { transform: scale(1.08); }

/* ── Responsive ── */
@media (max-width: 767px) {
  .sz-root { position: relative; height: calc(100vh - 56px - 68px); }
  .sz-sidebar { width: 100%; min-width: 0; border-right: none; }
  .sz-sidebar--hidden { display: none; }
  .sz-chat { position: absolute; inset: 0; z-index: 20; }
  .sz-contact-panel {
    left: 0; width: 100%; top: auto; bottom: 0; height: 82dvh;
    border-left: none; border-top: 1px solid var(--border-default);
    border-radius: 16px 16px 0 0;
  }
  .sz-panel-enter-from, .sz-panel-leave-to { transform: translateY(100%); }
}
@media (min-width: 768px) {
  .sz-back-btn { display: none; }
}
</style>
