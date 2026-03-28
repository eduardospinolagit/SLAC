<template>
  <div class="sz-root" :class="{ 'sz-mobile-chat': activeLead && isMobile }">

    <!-- ═══ CONEXÃO ═══ -->
    <div v-if="!wa.connected" class="sz-connect-overlay">
      <div v-if="wa.hasQr && qrSrc" class="sz-qr-wrap">
        <p class="sz-qr-title">Conectar WhatsApp</p>
        <p class="sz-qr-sub">Abra o WhatsApp no celular → <strong>Dispositivos conectados</strong> → Escanear QR Code</p>
        <img :src="qrSrc" class="sz-qr-img" alt="QR Code WhatsApp" />
      </div>
      <div v-else-if="wa.serverOnline" class="sz-connecting">
        <div class="sz-spinner"></div>
        <p class="sz-connecting-title">Iniciando WhatsApp...</p>
        <p class="sz-connecting-hint">Servidor conectado — aguardando sessão do WhatsApp</p>
      </div>
      <div v-else class="sz-connecting">
        <div class="sz-spinner"></div>
        <p class="sz-connecting-title">Aguardando servidor...</p>
        <p class="sz-connecting-hint">Certifique-se de que o app <strong>SLAC WhatsApp</strong> está rodando na bandeja do sistema</p>
      </div>
    </div>

    <!-- ═══ SIDEBAR ═══ -->
    <div class="sz-sidebar" :class="{ 'sz-sidebar--hidden': activeLead && isMobile }">

      <!-- Header -->
      <div class="sz-sidebar-header">
        <div class="sz-sidebar-title-row">
          <div class="sz-title-group">
            <h1 class="sz-sidebar-title">SlacZap</h1>
            <div class="sz-account-wrap">
              <button class="sz-account-tag" @click.stop="accountDropOpen = !accountDropOpen" :title="activeAccount?.nome || 'Conta'">
                <span>{{ activeAccount?.nome || 'Conta' }}</span>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <Transition name="sz-attach">
                <div v-if="accountDropOpen" class="sz-account-menu" @click.stop>
                  <div v-for="acc in waAccounts" :key="acc.id"
                    class="sz-account-item" :class="{ 'sz-account-item--active': acc.id === activeAccountId }"
                    @click="switchAccount(acc.id)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span>{{ acc.nome }}</span>
                    <svg v-if="acc.id === activeAccountId" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="sz-account-check"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
          <div class="sz-sidebar-actions">
            <button class="sz-action-btn" @click="novaConversaOpen = true" title="Nova Conversa" aria-label="Nova conversa">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="sz-action-btn" @click="configGeralOpen = true" title="Configurações Gerais do SlacZap" aria-label="Configurações gerais">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
            <div class="sz-opcoes-wrap">
              <button class="sz-action-btn" @click.stop="opcoesGeralOpen = !opcoesGeralOpen" title="Opções" aria-label="Opções gerais">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="19" r="1.2" fill="currentColor"/></svg>
              </button>
              <Transition name="sz-attach">
                <div v-if="opcoesGeralOpen" class="sz-opcoes-menu" @click.stop>
                  <button class="sz-opcoes-item" @click="editarConta">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Editar conta
                  </button>
                  <button class="sz-opcoes-item" @click="adicionarConta">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Adicionar conta
                  </button>
                  <div class="sz-opcoes-sep"></div>
                  <button class="sz-opcoes-item" @click="togglePerdidosFilter">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    {{ chatFilter === 'perdidos' ? 'Voltar ao início' : 'Leads Perdidos' }}
                  </button>
                  <button class="sz-opcoes-item" @click="marcarTodasLidas">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    Marcar todas como lidas
                  </button>
                  <button class="sz-opcoes-item" @click="abrirImportarConversa">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Importar conversa
                  </button>
                  <div class="sz-opcoes-sep"></div>
                  <button class="sz-opcoes-item sz-opcoes-item--danger" @click="desconectarWA">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Desconectar
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- Pesquisa -->
        <div class="sz-search-wrap">
          <svg class="sz-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="search" class="sz-search" placeholder="Pesquisar conversas e contatos" />
        </div>

        <!-- Filtros -->
        <div class="sz-filter-tabs">
          <button class="sz-filter-tab" :class="{ 'sz-filter-tab--active': chatFilter === 'tudo' }" @click="chatFilter = 'tudo'">Tudo</button>
          <button class="sz-filter-tab" :class="{ 'sz-filter-tab--active': chatFilter === 'nao-lidas' }" @click="chatFilter = 'nao-lidas'">Não Lidas</button>
          <button class="sz-filter-tab" :class="{ 'sz-filter-tab--active': chatFilter === 'followup' }" @click="chatFilter = 'followup'">Follow-up</button>

          <button class="sz-filter-tab" :class="{ 'sz-filter-tab--active': chatFilter === 'relead' }" @click="chatFilter = 'relead'">Relead</button>
          <button class="sz-filter-tab" :class="{ 'sz-filter-tab--active': chatFilter === 'work' }" @click="chatFilter = 'work'">Work</button>
        </div>
      </div>

      <!-- Lista -->
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
        <template v-else>
          <p v-if="!filteredChats.length && !searchLeads.length" class="sz-empty-list">
            {{ search ? 'Nenhum resultado' : 'Nenhuma conversa ainda' }}
          </p>

          <!-- Resultados de contatos/CRM na busca -->
          <template v-if="search && searchLeads.length">
            <div class="sz-list-section">Contatos</div>
            <div v-for="l in searchLeads" :key="'sl-' + l.id"
              class="sz-item" @click="openChat(l)" role="button" tabindex="0">
              <div class="sz-item-content">
                <div class="sz-avatar-wrap">
                  <div class="sz-avatar" :style="{ background: avatarColor(l.nome) }">{{ initials(l.nome) }}</div>
                </div>
                <div class="sz-item-body">
                  <div class="sz-item-row">
                    <span class="sz-item-name">{{ l.nome }}</span>
                    <span class="sz-etapa-badge sz-etapa-badge--sm" :style="{ background: etapaColor(l.etapa) + '20', color: etapaColor(l.etapa) }">{{ etapaLabel(l.etapa) }}</span>
                  </div>
                  <div class="sz-item-row">
                    <span class="sz-item-preview">{{ l.telefone || l.empresa || 'Sem telefone' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- FIXADAS -->
          <template v-if="pinnedChats.length">
            <div class="sz-list-section">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
              Fixadas
            </div>
            <div v-for="c in pinnedChats" :key="'pin-' + (c.lead.id || c.lead.telefone)"
              class="sz-item" :class="{ 'sz-item--active': activeLead?.id === c.lead.id }"
              role="button" tabindex="0"
              @click="openChat(c.lead)" @keydown.enter.prevent="openChat(c.lead)">
              <div class="sz-item-content">
                <div class="sz-avatar-wrap">
                  <div class="sz-avatar" :style="{ background: avatarColor(c.lead.nome) }">
                    {{ initials(c.lead.nome) }}
                  </div>
                </div>
                <div class="sz-item-body">
                  <div class="sz-item-row">
                    <span class="sz-item-name" :class="{ 'sz-item-name--unread': isUnread(c) }">{{ c.lead.nome }}</span>
                    <span class="sz-item-time" :class="{ 'sz-item-time--unread': isUnread(c) }">{{ fmtTime(c.lastAt) }}</span>
                  </div>
                  <div class="sz-item-row">
                    <span class="sz-item-preview" :class="{ 'sz-item-preview--unread': isUnread(c) }">
                      <span v-if="c.lastDirecao === 'enviado'" class="sz-checkmark">✓ </span>{{ c.lastMsg }}
                    </span>
                    <span v-if="isUnread(c)" class="sz-item-unread-badge">
                      {{ getUnreadCount(c) > 99 ? '99+' : getUnreadCount(c) > 0 ? getUnreadCount(c) : '●' }}
                    </span>
                    <span v-else-if="wa.isSdrActive(c.lead)" class="sz-item-sdr-badge" title="SDR ativo">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/></svg>
                    </span>
                  </div>
                </div>
                <div class="sz-item-pin-badge" title="Fixada">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
                </div>
                <button class="sz-item-opts-btn" @click.stop="openItemMenu(c.lead.id || c.lead.telefone, $event)" aria-label="Opções da conversa">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
              </div>
              <div v-if="itemFollowup(c.lead)" class="sz-item-followup-bar">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span>{{ fmtFollowup(itemFollowup(c.lead)) }}</span>
              </div>
              <div v-if="itemRelead(c.lead)" class="sz-item-relead-bar">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                <span>{{ fmtFollowup(itemRelead(c.lead)) }}</span>
              </div>
              <div v-if="itemWork(c.lead)" class="sz-item-work-bar">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                <span>Em execução</span>
              </div>
            </div>
          </template>

          <!-- RECENTES -->
          <template v-if="recentChats.length">
            <div class="sz-list-section" v-if="pinnedChats.length">Recentes</div>
            <div v-for="c in paginatedRecentChats" :key="c.lead.id || c.lead.telefone"
              class="sz-item" :class="{ 'sz-item--active': activeLead?.id === c.lead.id }"
              role="button" tabindex="0"
              @click="openChat(c.lead)" @keydown.enter.prevent="openChat(c.lead)">
              <div class="sz-item-content">
                <div class="sz-avatar-wrap">
                  <div class="sz-avatar" :style="{ background: avatarColor(c.lead.nome) }">
                    {{ initials(c.lead.nome) }}
                  </div>
                </div>
                <div class="sz-item-body">
                  <div class="sz-item-row">
                    <span class="sz-item-name" :class="{ 'sz-item-name--unread': isUnread(c) }">{{ c.lead.nome }}</span>
                    <span class="sz-item-time" :class="{ 'sz-item-time--unread': isUnread(c) }">{{ fmtTime(c.lastAt) }}</span>
                  </div>
                  <div class="sz-item-row">
                    <span class="sz-item-preview" :class="{ 'sz-item-preview--unread': isUnread(c) }">
                      <span v-if="c.lastDirecao === 'enviado'" class="sz-checkmark">✓ </span>{{ c.lastMsg }}
                    </span>
                    <span v-if="isUnread(c)" class="sz-item-unread-badge">
                      {{ getUnreadCount(c) > 99 ? '99+' : getUnreadCount(c) > 0 ? getUnreadCount(c) : '●' }}
                    </span>
                    <span v-else-if="wa.isSdrActive(c.lead)" class="sz-item-sdr-badge" title="SDR ativo">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/></svg>
                    </span>
                  </div>
                </div>
                <button class="sz-item-opts-btn" @click.stop="openItemMenu(c.lead.id || c.lead.telefone, $event)" aria-label="Opções da conversa">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
              </div>
              <div v-if="itemFollowup(c.lead)" class="sz-item-followup-bar">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span>{{ fmtFollowup(itemFollowup(c.lead)) }}</span>
              </div>
              <div v-if="itemRelead(c.lead)" class="sz-item-relead-bar">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                <span>{{ fmtFollowup(itemRelead(c.lead)) }}</span>
              </div>
              <div v-if="itemWork(c.lead)" class="sz-item-work-bar">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                <span>Em execução</span>
              </div>
            </div>
          </template>

          <!-- Sentinel infinite scroll -->
          <div ref="sentinelEl" class="sz-load-sentinel">
            <span v-if="hasMoreChats" class="sz-load-more-hint">Carregando mais...</span>
          </div>
        </template>
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
          <button class="sz-toolbar-btn" :class="{ 'sz-toolbar-btn--active': analysisResult || analysisLoading }"
            @click="analysisOpen = !analysisOpen; if(analysisOpen) openAnalysisModal()" title="Analisar lead com IA">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </button>
          <button v-if="!activeLead?.id" class="sz-toolbar-btn sz-toolbar-btn--save" @click="salvarNoCRM" :title="salvandoCRM ? 'Salvando...' : 'Salvar no CRM'">
            <svg v-if="!salvandoCRM" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="sz-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <span style="font-size:11px;margin-left:4px">Salvar no CRM</span>
          </button>
          <button v-if="activeLead?.id" class="sz-toolbar-btn" @click="openSlacOptsFromToolbar" title="Configurações do lead" aria-label="Configurações do lead">
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
          <div v-if="msgsHasMore" class="sz-load-more-wrap">
            <button class="sz-load-more-btn" @click="loadMoreMsgs" :disabled="loadingMoreMsgs">
              <div v-if="loadingMoreMsgs" class="sz-typing"><span></span><span></span><span></span></div>
              <span v-else>Carregar anteriores</span>
            </button>
          </div>
          <p v-if="!waMsgs.length" class="sz-no-msgs">Nenhuma mensagem ainda.<br>Diga olá! 👋</p>
          <template v-for="(group, gi) in msgGroups" :key="gi">
            <div class="sz-time-sep">{{ group.label }}</div>
            <template v-for="(m, mi) in group.msgs" :key="m.id">
              <div v-if="firstUnreadTs && m.direcao === 'recebido' && m.data > firstUnreadTs && (mi === 0 || group.msgs[mi-1].data <= firstUnreadTs || group.msgs[mi-1].direcao !== 'recebido')" class="sz-unread-divider">
                <span>Não lidas</span>
              </div>
            <div
              class="sz-bubble-wrap" :class="m.direcao === 'enviado' ? 'sz-bubble-wrap--out' : 'sz-bubble-wrap--in'">
              <div class="sz-bubble"
                :class="[
                  m.direcao === 'enviado' ? 'sz-bubble--out' : 'sz-bubble--in',
                  mi === group.msgs.length - 1 ? (m.direcao === 'enviado' ? 'sz-bubble--tail-out' : 'sz-bubble--tail-in') : '',
                  mi < group.msgs.length - 1 ? 'sz-bubble--stacked' : '',
                  (bubbleMedia(m.mensagem)?.type === 'image' || bubbleMedia(m.mensagem)?.type === 'video') ? 'sz-bubble--media' : ''
                ]">
                <!-- imagem -->
                <template v-if="bubbleMedia(m.mensagem)?.type === 'image'">
                  <img :src="bubbleMedia(m.mensagem).url" class="sz-bubble-img" loading="lazy"
                    @load="scrollBottom" @click="lightboxSrc = bubbleMedia(m.mensagem).url" />
                  <div class="sz-bubble-media-footer">
                    <span class="sz-bubble-time">{{ fmtHour(m.data) }}</span>
                    <span v-if="m.direcao === 'enviado'" class="sz-bubble-check" :class="`sz-bubble-check--${m.status || 'sent'}`">
                      <svg v-if="m.status === 'pending'" width="10" height="11" viewBox="0 0 10 11" fill="none"><path d="M1 5.5L4.5 9L9 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      <svg v-else-if="m.status === 'read'" width="16" height="11" viewBox="0 0 16 11" fill="none"><path d="M1 5.5L4.5 9L10 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 5.5L8.5 9L15 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      <svg v-else width="16" height="11" viewBox="0 0 16 11" fill="none"><path d="M1 5.5L4.5 9L10 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 5.5L8.5 9L15 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </span>
                  </div>
                </template>
                <!-- audio -->
                <template v-else-if="bubbleMedia(m.mensagem)?.type === 'audio'">
                  <div class="sz-audio-player" :class="m.direcao === 'enviado' ? 'sz-audio-player--out' : 'sz-audio-player--in'">
                    <audio :ref="el => registerAudio(m.id, el)" :src="bubbleMedia(m.mensagem).url" preload="metadata"
                      @timeupdate="onAudioTimeUpdate(m.id)"
                      @loadedmetadata="onAudioMeta(m.id)"
                      @ended="onAudioEnded(m.id)">
                    </audio>
                    <button class="sz-ap-btn" @click="toggleAudio(m.id)">
                      <svg v-if="!audioState(m.id).playing" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="margin-left:2px"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4" height="16" rx="1"/><rect x="15" y="4" width="4" height="16" rx="1"/></svg>
                    </button>
                    <div class="sz-ap-body">
                      <div class="sz-ap-bar" @click="seekAudio(m.id, $event)">
                        <div class="sz-ap-fill" :style="{ width: bubbleAudioProgress(m.id) + '%' }"></div>
                        <div class="sz-ap-thumb" :style="{ left: bubbleAudioProgress(m.id) + '%' }"></div>
                      </div>
                      <div class="sz-ap-meta">
                        <span class="sz-ap-time">{{ fmtAudioTime(audioState(m.id).playing || audioState(m.id).currentTime > 0 ? audioState(m.id).currentTime : audioState(m.id).duration) }}</span>
                        <span class="sz-ap-check">
                          <span class="sz-bubble-time">{{ fmtHour(m.data) }}</span>
                          <span v-if="m.direcao === 'enviado'" class="sz-bubble-check" :class="`sz-bubble-check--${m.status || 'sent'}`">
                            <svg v-if="m.status === 'pending'" width="10" height="11" viewBox="0 0 10 11" fill="none"><path d="M1 5.5L4.5 9L9 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            <svg v-else-if="m.status === 'read'" width="16" height="11" viewBox="0 0 16 11" fill="none"><path d="M1 5.5L4.5 9L10 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 5.5L8.5 9L15 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            <svg v-else width="16" height="11" viewBox="0 0 16 11" fill="none"><path d="M1 5.5L4.5 9L10 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 5.5L8.5 9L15 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </template>
                <!-- vídeo -->
                <template v-else-if="bubbleMedia(m.mensagem)?.type === 'video'">
                  <video :src="bubbleMedia(m.mensagem).url" controls class="sz-bubble-video" preload="none"></video>
                  <div class="sz-bubble-media-footer">
                    <span class="sz-bubble-time">{{ fmtHour(m.data) }}</span>
                  </div>
                </template>
                <!-- documento -->
                <template v-else-if="bubbleMedia(m.mensagem)?.type === 'document'">
                  <a :href="bubbleMedia(m.mensagem).url" target="_blank" rel="noopener" class="sz-bubble-doc">
                    <div class="sz-bubble-doc-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <span class="sz-bubble-doc-name">{{ bubbleMedia(m.mensagem).filename || 'Documento' }}</span>
                  </a>
                  <span class="sz-bubble-spacer"></span>
                </template>
                <!-- texto normal -->
                <template v-else>
                  <span class="sz-bubble-text">{{ m.mensagem }}<span class="sz-bubble-spacer"></span></span>
                </template>
                <span v-if="!bubbleMedia(m.mensagem) || bubbleMedia(m.mensagem).type === 'document'" class="sz-bubble-footer">
                  <span class="sz-bubble-time">{{ fmtHour(m.data) }}</span>
                  <span v-if="m.direcao === 'enviado'" class="sz-bubble-check" :class="`sz-bubble-check--${m.status || 'sent'}`">
                    <!-- pendente -->
                    <svg v-if="m.status === 'pending'" width="10" height="11" viewBox="0 0 10 11" fill="none">
                      <path d="M1 5.5L4.5 9L9 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <!-- lida — duplo azul -->
                    <svg v-else-if="m.status === 'read'" width="16" height="11" viewBox="0 0 16 11" fill="none">
                      <path d="M1 5.5L4.5 9L10 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M5 5.5L8.5 9L15 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <!-- enviado/entregue — duplo cinza (padrão) -->
                    <svg v-else width="16" height="11" viewBox="0 0 16 11" fill="none">
                      <path d="M1 5.5L4.5 9L10 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M5 5.5L8.5 9L15 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </span>
                <!-- botão de opções -->
                <button class="sz-bubble-menu-btn"
                  :class="m.direcao === 'enviado' ? 'sz-bubble-menu-btn--out' : 'sz-bubble-menu-btn--in'"
                  @click.stop="openMsgMenu(m, $event)" title="Opções">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
              </div>
            </div>
            </template>
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

      <!-- Sugestão IA -->
      <Transition name="sz-ai-slide">
        <div v-if="aiSugestao || aiLoading" class="sz-ai-card">
          <div class="sz-ai-card-header">
            <span class="sz-ai-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="opacity:.9"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
              IA
            </span>
            <span class="sz-ai-card-label">{{ aiModo === 'followup' ? 'Follow-up' : 'Sugestão de resposta' }}</span>
            <div style="flex:1"></div>
            <button class="sz-ai-regen" :disabled="aiLoading" @click="regenerarSugestao" title="Regenerar">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                :style="aiLoading ? 'animation:sz-spin .7s linear infinite' : ''">
                <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </button>
            <button class="sz-ai-close" @click="aiSugestao = ''; aiLoading = false; aiModo = 'resposta'" title="Fechar">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <!-- Seletor de modo -->
          <div class="sz-ai-modo-row">
            <button v-for="m in aiModos" :key="m.id" class="sz-ai-modo-btn" :class="{ active: aiModo === m.id }" @click="selecionarModo(m.id)">
              {{ m.label }}
            </button>
          </div>
          <!-- Seletor de tom -->
          <div class="sz-ai-tom-row">
            <button v-for="t in aiTons" :key="t.id" class="sz-ai-tom-btn" :class="{ active: aiTom === t.id }" @click="selecionarTom(t.id)">
              {{ t.label }}
            </button>
          </div>
          <div v-if="aiLoading" class="sz-ai-loading">
            <span class="sz-ai-dot"></span><span class="sz-ai-dot"></span><span class="sz-ai-dot"></span>
          </div>
          <p v-else class="sz-ai-text">{{ aiSugestao }}</p>
          <button v-if="!aiLoading && aiSugestao" class="sz-ai-usar" @click="usarSugestao">
            Usar resposta
          </button>
        </div>
      </Transition>

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

          <!-- Botão IA -->
          <button v-if="activeLead" class="sz-ai-trigger-btn" :class="{ 'sz-ai-trigger-btn--active': aiSugestao || aiLoading }"
            :disabled="aiLoading" @click="gerarSugestao" title="Sugerir resposta com IA">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
          </button>

          <!-- Ícones esquerda: emoji + clip -->
          <div class="sz-composer-left">
            <div class="sz-emoji-wrap">
              <button class="sz-icon-btn" :class="{ 'sz-icon-btn--open': showEmojiPicker }"
                aria-label="Emoji" title="Emoji" @click.stop="toggleEmojiPicker">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              </button>
              <div v-if="showEmojiPicker" ref="emojiPickerEl" class="sz-emoji-picker" @click.stop></div>
            </div>
            <div class="sz-attach-wrap">
              <button class="sz-icon-btn" :class="{ 'sz-icon-btn--open': showAttachMenu }"
                @click.stop="toggleAttachMenu" aria-label="Anexar" title="Anexar">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="sz-clip-icon"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <Transition name="sz-attach">
                <div v-if="showAttachMenu" class="sz-attach-menu" @click.stop>
                  <button class="sz-attach-icon-btn" @click="triggerFile('media')" title="Imagem/Vídeo">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span>Imagem/Vídeo</span>
                  </button>
                  <button class="sz-attach-icon-btn" @click="triggerFile('document')" title="Documento">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span>Documento</span>
                  </button>
                  <button class="sz-attach-icon-btn" @click="triggerFile('audio')" title="Áudio">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                    <span>Áudio</span>
                  </button>
                  <button class="sz-attach-icon-btn" title="Contato" @click="toast('Em breve', 'warn')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span>Contato</span>
                  </button>
                </div>
              </Transition>
              <input ref="fileInputMedia" type="file" accept="image/*,video/*" style="display:none" @change="e => onFileSelected(e, e.target.files[0]?.type?.startsWith('video') ? 'document' : 'image')" />
              <input ref="fileInputDoc"   type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip" style="display:none" @change="e => onFileSelected(e, 'document')" />
              <input ref="fileInputAudio" type="file" accept="audio/*" style="display:none" @change="e => onFileSelected(e, 'audio')" />
            </div>
          </div>

          <!-- Input -->
          <div class="sz-input-wrap">
            <textarea v-model="novaMsg" ref="inputEl" class="sz-input" placeholder="Digite uma mensagem"
              rows="1" @keydown.enter.exact.prevent="enviar" @input="autoResize" aria-label="Mensagem" />
          </div>

          <!-- Enviar -->
          <button class="sz-send-btn" @click="enviar" :disabled="enviando" aria-label="Enviar">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>

        </div>
      </div>

    </div>

    <!-- ═══ OPÇÕES SLAC ═══ -->
    <Transition name="sz-fade">
      <div v-if="opcoesSLACOpen" class="sz-modal-overlay" @click.self="opcoesSLACOpen = false"
        role="dialog" aria-label="Opções SLAC">
        <div class="sz-modal">

          <!-- Header lead -->
          <div class="sz-modal-header">
            <template v-if="activeCrmLead">
              <div class="sz-modal-lead-avatar" :style="{ background: avatarColor(activeCrmLead.nome) }">
                {{ initials(activeCrmLead.nome) }}
              </div>
              <div class="sz-modal-lead-info">
                <p class="sz-modal-lead-name">{{ activeCrmLead.nome }}</p>
                <p class="sz-modal-lead-phone">{{ activeCrmLead.telefone }}</p>
              </div>
              <span class="sz-etapa-badge" :style="{ background: etapaColor(activeCrmLead.etapa) + '20', color: etapaColor(activeCrmLead.etapa) }">
                {{ etapaLabel(activeCrmLead.etapa) }}
              </span>
            </template>
            <template v-else>
              <p class="sz-modal-lead-name">Opções SLAC</p>
            </template>
            <button class="sz-modal-close" @click="opcoesSLACOpen = false" aria-label="Fechar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Nav horizontal com labels -->
          <nav class="sz-modal-nav">
            <button class="sz-modal-nav-item" :class="{ 'sz-modal-nav-item--active': activeSection === 'contato' }" @click="activeSection = 'contato'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>Contato</span>
            </button>
            <button class="sz-modal-nav-item" :class="{ 'sz-modal-nav-item--active': activeSection === 'anotacoes' }" @click="activeSection = 'anotacoes'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/><polyline points="15 3 15 9 21 9"/></svg>
              <span>Anotações</span>
            </button>
            <button class="sz-modal-nav-item" :class="{ 'sz-modal-nav-item--active': activeSection === 'followup', 'sz-modal-nav-item--sdr': wa.isFuAutoActive(slacOptsLead) }" @click="activeSection = 'followup'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>Follow-up</span>
              <span v-if="wa.isFuAutoActive(slacOptsLead)" class="sz-modal-nav-sdr-dot"></span>
            </button>
            <button class="sz-modal-nav-item" :class="{ 'sz-modal-nav-item--active': activeSection === 'financeiro' }" @click="activeSection = 'financeiro'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              <span>Financeiro</span>
            </button>
            <button class="sz-modal-nav-item" :class="{ 'sz-modal-nav-item--active': activeSection === 'analise' }" @click="activeSection = 'analise'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/></svg>
              <span>Análise IA</span>
            </button>
            <button class="sz-modal-nav-item" :class="{ 'sz-modal-nav-item--active': activeSection === 'sdr', 'sz-modal-nav-item--sdr': wa.isSdrActive(slacOptsLead) }" @click="activeSection = 'sdr'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
              <span>SDR IA</span>
              <span v-if="wa.isSdrActive(slacOptsLead)" class="sz-modal-nav-sdr-dot"></span>
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

              <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--border-subtle)">
                <p class="sz-modal-section-title" style="margin-bottom:12px">Follow-up automático</p>

                <div class="sz-sdr-toggle-row">
                  <div>
                    <p class="sz-sdr-toggle-title">Ativar neste chat</p>
                    <p class="sz-sdr-toggle-sub text-sm text-muted">
                      {{ wa.isFuAutoActive(slacOptsLead)
                        ? 'Enviará follow-up se não houver resposta no prazo'
                        : 'Manda follow-up automático se o lead não responder' }}
                    </p>
                  </div>
                  <button class="sz-sdr-pill" :class="{ 'sz-sdr-pill--on': wa.isFuAutoActive(slacOptsLead) }"
                    @click="handleToggleFuAutoChat()">
                    <span class="sz-sdr-pill-thumb"></span>
                  </button>
                </div>

                <div class="sz-fuauto-config">
                  <div class="form-group">
                    <label class="form-label">Enviar se não responder em</label>
                    <div class="sz-fuauto-horas-row">
                      <select class="form-select" v-model="fuAutoHorasLocal" style="width:auto">
                        <option :value="1">1 hora</option>
                        <option :value="2">2 horas</option>
                        <option :value="3">3 horas</option>
                        <option :value="4">4 horas</option>
                        <option :value="6">6 horas</option>
                        <option :value="8">8 horas</option>
                        <option :value="12">12 horas</option>
                        <option :value="24">24 horas</option>
                      </select>
                      <span class="text-muted text-sm">após a última mensagem enviada</span>
                    </div>
                    <button class="btn btn-primary btn-sm" style="margin-top:8px;width:fit-content" @click="saveFuAutoHoras">Salvar</button>
                  </div>

                  <div v-if="wa.isFuAutoActive(slacOptsLead)" class="sz-sdr-active-info">
                    <div class="sz-sdr-active-row">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Follow-up automático habilitado
                    </div>
                    <div v-if="wa.fuAutoChats[wa.fuAutoKey(slacOptsLead)]?.lastSentAt" class="sz-sdr-active-row">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      Último enviado: {{ fmtDataHora(wa.fuAutoChats[wa.fuAutoKey(slacOptsLead)]?.lastSentAt) }}
                    </div>
                    <div v-if="!wa.scriptBase" class="sz-sdr-active-row sz-sdr-active-row--warn">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
                      Script não configurado — o follow-up usará boas práticas genéricas
                    </div>
                  </div>
                </div>
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
                  <div style="height:6px;background:var(--bg-overlay);border-radius:3px;overflow:hidden">
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
                <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid var(--border-subtle)">
                  <span style="font-size:11px;color:var(--text-tertiary)">
                    Gerado em {{ new Date(activeCrmLead.analise_ia.geradoEm).toLocaleString('pt-BR') }}
                  </span>
                  <button class="btn btn-ghost btn-sm" @click="analisarLead">Re-analisar</button>
                </div>
              </div>
            </div>

            <!-- Seção: SDR IA -->
            <div v-else-if="activeSection === 'sdr'">
              <p class="sz-modal-section-title">SDR por IA</p>

              <div v-if="!wa.sdrConfig.enabled" class="sz-sdr-section-warn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                SDR desativado globalmente. Ative em
                <router-link to="/sdr" @click="opcoesSLACOpen = false" class="sz-sdr-link">SDR IA</router-link>.
              </div>

              <div class="sz-sdr-toggle-row">
                <div>
                  <p class="sz-sdr-toggle-title">Ativar SDR neste chat</p>
                  <p class="sz-sdr-toggle-sub text-sm text-muted">
                    {{ wa.isSdrActive(slacOptsLead)
                      ? 'SDR respondendo automaticamente · ' + (wa.sdrChats[wa.sdrChatKey(slacOptsLead)]?.msgCount || 0) + ' msgs enviadas'
                      : 'O agente responderá mensagens recebidas automaticamente' }}
                  </p>
                </div>
                <button class="sz-sdr-pill" :class="{ 'sz-sdr-pill--on': wa.isSdrActive(slacOptsLead) }"
                  @click="wa.toggleSdrChat(slacOptsLead)" :disabled="!wa.sdrConfig.enabled">
                  <span class="sz-sdr-pill-thumb"></span>
                </button>
              </div>

              <div v-if="wa.isSdrActive(slacOptsLead)" class="sz-sdr-active-info">
                <div class="sz-sdr-active-row">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Respostas automáticas habilitadas
                </div>
                <div class="sz-sdr-active-row">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Horário: {{ wa.sdrConfig.horaInicio }} – {{ wa.sdrConfig.horaFim }}
                </div>
                <div class="sz-sdr-active-row">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/></svg>
                  Limite: {{ wa.sdrConfig.limiteMsg }} mensagens por chat
                </div>
                <div v-if="!wa.sdrIsInHours()" class="sz-sdr-active-row sz-sdr-active-row--warn">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {{ sdrForaMotivo }}
                </div>
                <div v-if="wa.isSdrActive(slacOptsLead) && slacOptsLead?.etapa && !wa.sdrConfig.etapas.includes(slacOptsLead.etapa)" class="sz-sdr-active-row sz-sdr-active-row--warn">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Etapa "{{ slacOptsLead.etapa }}" não configurada no SDR
                </div>
              </div>

            </div>


          </div>
        </div>
      </div>
    </Transition>

    <!-- ═══ EDITAR / ADICIONAR CONTA ═══ -->
    <Transition name="sz-modal-fade">
      <div v-if="contaModalOpen" class="sz-modal-overlay" @click.self="contaModalOpen = false">
        <div class="sz-modal sz-conta-modal">
          <div class="sz-modal-header">
            <p class="sz-modal-lead-name">{{ contaModalMode === 'edit' ? 'Editar conta' : 'Adicionar conta' }}</p>
            <button class="sz-modal-close" @click="contaModalOpen = false">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="sz-conta-body">
            <label class="form-label">Nome da conta</label>
            <input v-model="contaModalNome" class="form-input" placeholder="Ex: Sano Lab, Pessoal..." @keydown.enter="salvarConta" />
            <p class="sz-conta-hint">Este nome aparece na tag ao lado de SlacZap para identificar a conta conectada.</p>
          </div>
          <div class="sz-conta-footer">
            <button v-if="contaModalMode === 'edit' && waAccounts.length > 1" class="btn btn-danger btn-sm" @click="removerConta">Remover</button>
            <div style="flex:1"></div>
            <button class="btn btn-secondary btn-sm" @click="contaModalOpen = false">Cancelar</button>
            <button class="btn btn-primary btn-sm" @click="salvarConta">Salvar</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ═══ IMPORTAR CONVERSA ═══ -->
    <Transition name="sz-modal-fade">
      <div v-if="importModalOpen" class="sz-modal-overlay" @click.self="fecharImportModal" role="dialog" aria-label="Importar Conversa">
        <div class="sz-modal sz-import-modal">
          <div class="sz-modal-header">
            <p class="sz-modal-lead-name">Importar Conversa do WhatsApp</p>
            <button class="sz-modal-close" @click="fecharImportModal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Step 1: Upload -->
          <div v-if="!importParsed" class="sz-import-zone" @click="importFileInput?.click()" @dragover.prevent @drop.prevent="handleImportDrop">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent)"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <p class="sz-import-zone-title">Arraste ou clique para selecionar</p>
            <p class="sz-import-zone-hint">
              <strong>.zip</strong> com mídias ou <strong>.txt</strong> sem mídias<br>
              <span>WhatsApp → Conversa → ⋮ → Exportar conversa</span>
            </p>
            <input ref="importFileInput" type="file" accept=".txt,.zip" style="display:none" @change="handleImportFile" />
          </div>

          <!-- Step 2: Config -->
          <template v-else>
            <div class="sz-import-stats">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span><strong>{{ importMsgs.length }}</strong> mensagens</span>
              <span v-if="importMediaCount > 0" style="color:var(--accent)">· <strong>{{ importMediaCount }}</strong> mídias</span>
              <span class="text-muted" style="margin-left:auto">{{ importSenders.join(' · ') }}</span>
            </div>

            <div class="form-group" style="margin-top:.75rem">
              <label class="form-label">Qual nome é você? <span class="text-muted">(mensagens enviadas por você)</span></label>
              <select v-model="importMeuNome" class="form-select">
                <option value="">— selecione seu nome —</option>
                <option v-for="s in importSenders" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Vincular ao lead <span class="text-muted">(opcional)</span></label>
              <div style="position:relative">
                <input v-model="importLeadSearch" class="form-input" placeholder="Buscar lead por nome ou telefone..."
                  @input="pesquisarImportLead" @focus="pesquisarImportLead" />
                <div v-if="importLeadResults.length" class="sz-import-lead-list">
                  <div v-for="l in importLeadResults" :key="l.id"
                    class="sz-import-lead-item" :class="{ 'sz-import-lead-item--sel': importLead?.id === l.id }"
                    @mousedown.prevent="selecionarImportLead(l)">
                    <div class="sz-avatar" :style="{ background: avatarColor(l.nome), width:'24px', height:'24px', fontSize:'.6rem', flexShrink:0 }">{{ initials(l.nome) }}</div>
                    <div>
                      <div style="font-size:.82rem;font-weight:500">{{ l.nome }}</div>
                      <div style="font-size:.75rem;color:var(--text-secondary)">{{ l.telefone || l.empresa || '—' }}</div>
                    </div>
                    <svg v-if="importLead?.id === l.id" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto;flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                </div>
              </div>
              <div v-if="importLead" class="sz-import-lead-sel">
                <div class="sz-avatar" :style="{ background: avatarColor(importLead.nome), width:'20px', height:'20px', fontSize:'.55rem', flexShrink:0 }">{{ initials(importLead.nome) }}</div>
                <span style="font-size:.8rem">{{ importLead.nome }}</span>
                <button class="sz-import-lead-clear" @click="importLead = null; importLeadSearch = ''">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            <div class="sz-conta-footer">
              <button class="btn btn-secondary btn-sm" @click="resetImport">Voltar</button>
              <div style="flex:1"></div>
              <button class="btn btn-primary btn-sm" :disabled="!importMeuNome || importLoading" @click="doImport">
                <svg v-if="importLoading" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:sz-spin .7s linear infinite"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                {{ importLoading ? importProgress || 'Importando...' : `Importar ${importMsgs.length} mensagens` }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </Transition>

    <!-- ═══ NOVA CONVERSA ═══ -->
    <Transition name="sz-modal-fade">
      <div v-if="novaConversaOpen" class="sz-modal-overlay" @click.self="closeNovaConversa" role="dialog" aria-label="Nova Conversa">
        <div class="sz-modal sz-nova-conversa-modal">
          <!-- Header -->
          <div class="sz-modal-header">
            <div class="sz-modal-header-info">
              <p class="sz-modal-lead-name">Nova Conversa</p>
              <p class="sz-modal-lead-phone">{{ novaConversaTipo === 'grupo' ? 'Selecione contatos para o grupo' : 'Selecione um contato' }}</p>
            </div>
            <div style="display:flex;gap:6px;margin-left:auto;align-items:center;">
              <button class="sz-nc-tipo-btn" :class="{ active: novaConversaTipo === 'contato' }" @click="novaConversaTipo = 'contato'">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Contato
              </button>
              <button class="sz-nc-tipo-btn" :class="{ active: novaConversaTipo === 'grupo' }" @click="novaConversaTipo = 'grupo'">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Grupo
              </button>
            </div>
            <button class="sz-modal-close" @click="closeNovaConversa" aria-label="Fechar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Busca -->
          <div class="sz-nc-search-wrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input v-model="novaConversaSearch" class="sz-nc-search" placeholder="Buscar contato..." autofocus />
          </div>

          <!-- Selecionados (grupo) -->
          <div v-if="novaConversaTipo === 'grupo' && novaConversaSelected.length" class="sz-nc-selected">
            <div v-for="l in novaConversaSelected" :key="l.id" class="sz-nc-chip">
              <div class="sz-nc-chip-avatar" :style="{ background: avatarColor(l.nome) }">{{ initials(l.nome) }}</div>
              <span>{{ l.nome.split(' ')[0] }}</span>
              <button @click="toggleNovaConversaLead(l)">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <!-- Lista de contatos -->
          <div class="sz-nc-list">
            <p v-if="!novaConversaLeads.length" class="sz-nc-empty">Nenhum contato encontrado</p>
            <div v-for="l in novaConversaLeads" :key="l.id"
              class="sz-nc-item"
              :class="{ 'sz-nc-item--selected': novaConversaSelected.some(s => s.id === l.id) }"
              @click="handleNovaConversaClick(l)">
              <div class="sz-nc-avatar" :style="{ background: avatarColor(l.nome) }">{{ initials(l.nome) }}</div>
              <div class="sz-nc-info">
                <span class="sz-nc-name">{{ l.nome }}</span>
                <span class="sz-nc-phone">{{ l.telefone || l.empresa || '—' }}</span>
              </div>
              <div v-if="novaConversaTipo === 'grupo'" class="sz-nc-check" :class="{ 'sz-nc-check--active': novaConversaSelected.some(s => s.id === l.id) }">
                <svg v-if="novaConversaSelected.some(s => s.id === l.id)" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
          </div>

          <!-- Footer grupo -->
          <div v-if="novaConversaTipo === 'grupo' && novaConversaSelected.length" class="sz-nc-footer">
            <input v-model="novaConversaGrupoNome" class="sz-nc-grupo-nome" placeholder="Nome do grupo..." />
            <button class="btn btn-primary btn-sm" @click="criarGrupo" :disabled="!novaConversaGrupoNome.trim()">
              Criar Grupo
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ═══ ITEM MENU DROPDOWN ═══ -->
    <Teleport to="body">
      <Transition name="sz-menu">
        <div v-if="activeItemMenu" class="sz-item-menu-overlay" @click="activeItemMenu = null">
          <div class="sz-item-menu" :style="menuStyle" @click.stop>
            <button class="sz-item-menu-item" @click="openSlacOpts()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Opções SLAC
            </button>
            <button class="sz-item-menu-item" @click="openSlacOpts('contato')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Ver Contato
            </button>
            <button class="sz-item-menu-item" @click="doTogglePin()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
              {{ isMenuLeadPinned ? 'Desafixar' : 'Fixar' }}
            </button>
            <button class="sz-item-menu-item" @click="toggleNaoLido()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>
              {{ isMenuLeadUnread ? 'Marcar como Lido' : 'Marcar como Não Lido' }}
            </button>
            <button class="sz-item-menu-item" @click="desativarNotificacoes()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              Desativar Notificações
            </button>
            <div class="sz-item-menu-sep"></div>
            <button class="sz-item-menu-item sz-item-menu-item--danger" @click="marcarPerdido()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              Lead Perdido
            </button>
            <button class="sz-item-menu-item sz-item-menu-item--danger" @click="apagarConversa()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              Apagar conversa
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Empty state (desktop) -->
    <div class="sz-empty-chat" v-if="!activeLead && !isMobile">
      <div class="sz-empty-icon">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity=".18"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <p class="sz-empty-title">Suas Mensagens</p>
      <p class="sz-empty-sub">Selecione uma conversa</p>
    </div>

  </div>

  <!-- ═══ LIGHTBOX ═══ -->
  <!-- Modal de análise IA -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="analysisOpen" class="modal-backdrop" @click.self="analysisOpen = false">
        <div class="modal sz-analysis-modal">
          <div class="sz-analysis-modal-header">
            <div style="display:flex;align-items:center;gap:.5rem">
              <span class="sz-ai-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Análise IA
              </span>
              <span class="sz-analysis-modal-lead">{{ activeLead?.nome }}</span>
            </div>
            <button class="sz-ai-close" @click="analysisOpen = false">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div v-if="analysisLoading" class="sz-analysis-modal-loading">
            <span class="sz-ai-dot"></span><span class="sz-ai-dot"></span><span class="sz-ai-dot"></span>
            <p style="margin:.75rem 0 0;font-size:.8rem;color:var(--text-tertiary)">Analisando conversa...</p>
          </div>

          <div v-else-if="!analysisResult" class="sz-analysis-modal-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.3"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <p>Nenhuma análise gerada ainda</p>
            <button class="btn btn-primary btn-sm" @click="analisarLeadIA" :disabled="analysisLoading">Gerar análise</button>
          </div>

          <div v-else class="sz-analysis-modal-body">
            <!-- Score -->
            <div class="sz-score-row">
              <div class="sz-score-ring">
                <svg width="88" height="88" viewBox="0 0 88 88">
                  <circle cx="44" cy="44" r="36" fill="none" stroke="var(--bg-overlay)" stroke-width="7"/>
                  <circle cx="44" cy="44" r="36" fill="none" :stroke="scoreColor(analysisResult.score)" stroke-width="7"
                    stroke-linecap="round" stroke-dasharray="226.2"
                    :stroke-dashoffset="226.2 - (226.2 * analysisResult.score / 100)"
                    transform="rotate(-90 44 44)" style="transition:stroke-dashoffset .6s ease"/>
                </svg>
                <span class="sz-score-num" :style="{ color: scoreColor(analysisResult.score) }">{{ analysisResult.score }}</span>
              </div>
              <div class="sz-score-info">
                <p class="sz-score-label" :style="{ color: scoreColor(analysisResult.score) }">{{ scoreLabel(analysisResult.score) }}</p>
                <p class="sz-analysis-resumo">{{ analysisResult.resumo }}</p>
              </div>
            </div>

            <!-- Próximo passo -->
            <div v-if="analysisResult.proximoPasso" class="sz-analysis-next">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              {{ analysisResult.proximoPasso }}
            </div>

            <!-- Positivos + Atenção -->
            <div class="sz-analysis-cols">
              <div v-if="analysisResult.positivos?.length" class="sz-analysis-col">
                <p class="sz-analysis-col-title sz-analysis-col-title--pos">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Positivos
                </p>
                <ul><li v-for="p in analysisResult.positivos" :key="p">{{ p }}</li></ul>
              </div>
              <div v-if="analysisResult.atencao?.length" class="sz-analysis-col">
                <p class="sz-analysis-col-title sz-analysis-col-title--warn">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Atenção
                </p>
                <ul><li v-for="a in analysisResult.atencao" :key="a">{{ a }}</li></ul>
              </div>
            </div>
            <!-- Rodapé -->
            <div class="sz-analysis-footer">
              <span v-if="analysisResult.geradoEm" class="sz-analysis-ts">
                Gerado em {{ new Date(analysisResult.geradoEm).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) }}
              </span>
              <button class="btn btn-secondary btn-sm" :disabled="analysisLoading" @click="analisarLeadIA">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" :style="analysisLoading ? 'animation:sz-spin .7s linear infinite' : ''"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                Gerar nova análise
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Menu de opções da mensagem -->
  <Teleport to="body">
    <Transition name="sz-menu">
      <div v-if="msgMenu.id" class="sz-item-menu-overlay" @click="msgMenu.id = null">
        <div class="sz-item-menu" :style="msgMenu.style" @click.stop>
          <button class="sz-item-menu-item" @click="copiarMensagem()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copiar
          </button>
          <button class="sz-item-menu-item" @click="gerarSugestaoMsg(msgMenu.msg); msgMenu.id = null">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Gerar resposta
          </button>
          <button class="sz-item-menu-item" @click="encaminharMensagem()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 10 20 15 15 20"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/></svg>
            Encaminhar
          </button>
          <div class="sz-item-menu-sep"></div>
          <button class="sz-item-menu-item sz-item-menu-item--danger" @click="apagarMensagem()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Apagar mensagem
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <Teleport to="body">
    <Transition name="sz-lightbox-fade">
      <div v-if="lightboxSrc" class="sz-lightbox" @click.self="lightboxSrc = null">
        <div class="sz-lightbox-toolbar">
          <a :href="lightboxSrc" download="imagem" class="sz-lightbox-dl" title="Baixar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 13 7 8"/><line x1="12" y1="3" x2="12" y2="13"/></svg>
          </a>
          <button class="sz-lightbox-close" @click="lightboxSrc = null">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <img :src="lightboxSrc" class="sz-lightbox-img" @click.stop />
      </div>
    </Transition>
  </Teleport>

</template>

<script setup>
import { ref, computed, watch, reactive, nextTick, onMounted, onUnmounted, inject } from 'vue'
import EmojiData from '@emoji-mart/data'
import { Picker } from 'emoji-mart'
import { useRouter, useRoute } from 'vue-router'
import { useWaStore } from '@/stores/wa'
import { useLeadsStore, ETAPAS } from '@/stores/leads'
import { useAuthStore } from '@/stores/auth'
import { useWorkStore } from '@/stores/work'
import { useFinStore } from '@/stores/fin'
import { sb } from '@/lib/supabase'
import { uid } from '@/utils/uid'
import JSZip from 'jszip'

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
const messagesEl    = ref(null)
const firstUnreadTs = ref(null)  // timestamp da última leitura ao abrir o chat
const inputEl     = ref(null)
const listEl      = ref(null)
const sentinelEl  = ref(null)
const chatsVisible     = ref(20)
const msgsOffset       = ref(0)
const msgsHasMore      = ref(false)
const loadingMoreMsgs  = ref(false)
const isMobile    = ref(window.innerWidth < 768)
const isDarkTheme = ref(document.documentElement.getAttribute('data-theme') !== 'light')

const qrSrc = computed(() => isDarkTheme.value ? wa.qrImage : (wa.qrImageLight || wa.qrImage))

// Config modal
const opcoesSLACOpen  = ref(false)
const activeSection   = ref('contato')
const slacOptsLead    = ref(null)   // lead do modal — independente do chat aberto
const analisando      = ref(false)
const erroAnalise     = ref(null)
const followupDate    = ref('')
const followupObs     = ref('')
const parcelasLocal   = ref([])
const anotacoesText   = ref('')
let anotacoesTimer    = null

// Sidebar — filtros e painéis
const chatFilter       = ref('tudo')
const novaConversaOpen       = ref(false)
const novaConversaTipo       = ref('contato')   // 'contato' | 'grupo'
const novaConversaSearch     = ref('')
const novaConversaSelected   = ref([])
const novaConversaGrupoNome  = ref('')

const novaConversaLeads = computed(() => {
  const q = novaConversaSearch.value.toLowerCase()
  return leads.leads.filter(l =>
    (!q || l.nome?.toLowerCase().includes(q) || l.telefone?.includes(q) || l.empresa?.toLowerCase().includes(q)) &&
    !novaConversaSelected.value.some(s => s.id === l.id)
  ).slice(0, 30)
})

function closeNovaConversa() {
  novaConversaOpen.value     = false
  novaConversaSearch.value   = ''
  novaConversaSelected.value = []
  novaConversaGrupoNome.value = ''
  novaConversaTipo.value     = 'contato'
}

function toggleNovaConversaLead(lead) {
  const idx = novaConversaSelected.value.findIndex(s => s.id === lead.id)
  if (idx >= 0) novaConversaSelected.value.splice(idx, 1)
  else novaConversaSelected.value.push(lead)
}

function handleNovaConversaClick(lead) {
  if (novaConversaTipo.value === 'contato') {
    openChat(lead)
    closeNovaConversa()
  } else {
    toggleNovaConversaLead(lead)
  }
}

function criarGrupo() {
  // Abre chat com o primeiro selecionado como fallback (WhatsApp grupos via API local)
  if (novaConversaSelected.value.length) openChat(novaConversaSelected.value[0])
  closeNovaConversa()
}
const configGeralOpen  = ref(false)
const opcoesGeralOpen  = ref(false)

// ── Contas WhatsApp ──
const waAccounts      = ref(JSON.parse(localStorage.getItem('slac-wa-accounts') || '[{"id":"default","nome":"Minha Conta"}]'))
const activeAccountId = ref(localStorage.getItem('slac-wa-active-account') || 'default')
const activeAccount   = computed(() => waAccounts.value.find(a => a.id === activeAccountId.value) || waAccounts.value[0])
const accountDropOpen = ref(false)
const contaModalOpen  = ref(false)
const contaModalMode  = ref('edit')   // 'edit' | 'add'
const contaModalNome  = ref('')

function saveWaAccounts() {
  localStorage.setItem('slac-wa-accounts', JSON.stringify(waAccounts.value))
}

function switchAccount(id) {
  activeAccountId.value = id
  localStorage.setItem('slac-wa-active-account', id)
  accountDropOpen.value = false
}

function editarConta() {
  opcoesGeralOpen.value = false
  contaModalMode.value = 'edit'
  contaModalNome.value = activeAccount.value?.nome || ''
  contaModalOpen.value = true
}

function adicionarConta() {
  opcoesGeralOpen.value = false
  contaModalMode.value = 'add'
  contaModalNome.value = ''
  contaModalOpen.value = true
}

function salvarConta() {
  const nome = contaModalNome.value.trim()
  if (!nome) return
  if (contaModalMode.value === 'edit') {
    const idx = waAccounts.value.findIndex(a => a.id === activeAccountId.value)
    if (idx !== -1) waAccounts.value[idx] = { ...waAccounts.value[idx], nome }
  } else {
    const id = 'acc_' + Date.now()
    waAccounts.value.push({ id, nome })
    switchAccount(id)
  }
  saveWaAccounts()
  contaModalOpen.value = false
}

function removerConta() {
  waAccounts.value = waAccounts.value.filter(a => a.id !== activeAccountId.value)
  activeAccountId.value = waAccounts.value[0]?.id || 'default'
  localStorage.setItem('slac-wa-active-account', activeAccountId.value)
  saveWaAccounts()
  contaModalOpen.value = false
}

// ── Mídia nas bolhas ──
const MEDIA_IMAGE_EXTS = ['jpg','jpeg','png','gif','webp']
const MEDIA_AUDIO_EXTS = ['opus','mp3','ogg','m4a','aac']
const MEDIA_VIDEO_EXTS = ['mp4','mov','avi','webm']

function getMediaExt(filename) { return (filename.split('.').pop() || '').toLowerCase() }
function getMediaType(filename) {
  const ext = getMediaExt(filename)
  if (MEDIA_IMAGE_EXTS.includes(ext)) return 'image'
  if (MEDIA_AUDIO_EXTS.includes(ext)) return 'audio'
  if (MEDIA_VIDEO_EXTS.includes(ext)) return 'video'
  return 'document'
}

function bubbleMedia(mensagem) {
  if (!mensagem) return null
  const imgM = mensagem.match(/^\[IMG\]([\s\S]+)$/)
  if (imgM) return { type: 'image', url: imgM[1], filename: '' }
  const audM = mensagem.match(/^\[AUDIO\]([\s\S]+)$/)
  if (audM) return { type: 'audio', url: audM[1], filename: '' }
  const vidM = mensagem.match(/^\[VIDEO\]([\s\S]+)$/)
  if (vidM) return { type: 'video', url: vidM[1], filename: '' }
  const docM = mensagem.match(/^\[DOC:([^\]]+)\]([\s\S]+)$/)
  if (docM) return { type: 'document', url: docM[2], filename: docM[1] }
  return null
}

// ── Follow-up automático ──
const fuAutoHorasLocal = ref(4) // valor local do select no modal

// ── Salvar no CRM ──
const salvandoCRM = ref(false)

async function salvarNoCRM() {
  if (!activeLead.value || activeLead.value.id || salvandoCRM.value) return
  salvandoCRM.value = true
  try {
    const telefone = activeLead.value.telefone
    const nome     = activeLead.value.nome || telefone
    const novoId   = crypto.randomUUID()

    // Cria lead no CRM
    await leads.upsert({ id: novoId, nome, telefone, etapa: 'contato' })

    // Vincula conversas do telefone ao novo lead
    await sb.from('conversas')
      .update({ lead_id: novoId })
      .eq('telefone', telefone)
      .eq('user_id', auth.user.id)
      .is('lead_id', null)

    // Recarrega chats e abre o lead recém-criado
    await wa.loadChats()
    const novoLead = leads.leads.find(l => l.id === novoId)
    if (novoLead) openChat(novoLead)

    toast('Lead salvo no CRM', 'ok')
  } catch (e) {
    console.error('[salvarNoCRM]', e)
    toast('Erro ao salvar lead', 'error')
  } finally {
    salvandoCRM.value = false
  }
}

async function checkFuAuto() {
  if (!wa.connected) return
  const now = Date.now()

  for (const [ck, cfg] of Object.entries(wa.fuAutoChats)) {
    if (!cfg?.active) continue

    // Evita reenvio em menos de (horas - 30min) do último enviado
    if (cfg.lastSentAt) {
      const diffHrs = (now - new Date(cfg.lastSentAt).getTime()) / 3600000
      if (diffHrs < cfg.horas - 0.5) continue
    }

    // Resolve lead a partir da chave
    let lead = null
    if (ck.startsWith('lead_')) {
      const id = ck.slice(5)
      lead = leads.leads.find(l => l.id === id) || { id, telefone: null }
    } else if (ck.startsWith('phone_')) {
      const phone = ck.slice(6)
      lead = leads.leads.find(l => l.telefone?.replace(/\D/g,'') === phone) || { id: null, telefone: phone }
    }
    if (!lead) continue

    // Busca últimas mensagens
    let q = sb.from('conversas').select('direcao, mensagem, data')
      .eq('canal', 'whatsapp').eq('user_id', auth.user.id)
      .order('data', { ascending: false }).limit(30)
    if (lead.id)            q = q.eq('lead_id', lead.id)
    else if (lead.telefone) q = q.eq('telefone', lead.telefone.replace(/\D/g,''))
    const { data: rows } = await q
    if (!rows?.length) continue

    const msgs = [...rows].reverse()
    // Encontra última mensagem enviada por nós
    const lastEnviado = [...msgs].reverse().find(m => m.direcao === 'enviado')
    if (!lastEnviado) continue

    // Verifica se há resposta do lead após essa mensagem
    const lastEnviadoAt = new Date(lastEnviado.data).getTime()
    const hasReplyAfter = msgs.some(m => m.direcao === 'recebido' && new Date(m.data).getTime() > lastEnviadoAt)
    if (hasReplyAfter) continue

    // Verifica se já passou X horas desde a última mensagem enviada
    const horasPassadas = (now - lastEnviadoAt) / 3600000
    if (horasPassadas < cfg.horas) continue

    // Gera e envia follow-up
    try {
      const filteredMsgs = msgs
        .filter(m => m.mensagem && !['[IMG]','[AUDIO]','[VIDEO]','[DOC:'].some(p => m.mensagem.startsWith(p)))
        .slice(-15).map(m => ({ direcao: m.direcao, mensagem: m.mensagem }))

      const { data: fuData, error: fuErr } = await sb.functions.invoke('sugerir-resposta', {
        body: {
          messages:  filteredMsgs,
          leadInfo:  { nome: lead.nome, negocio: lead.negocio, categoria: lead.categoria, etapa: lead.etapa },
          scriptBase: wa.scriptBase || '',
          tom: 'recomendado',
          tipo: 'followup',
        }
      })
      if (fuErr || !fuData?.sugestao) continue

      await wa.enviarMensagem(lead.id, auth.user.id, lead.telefone, fuData.sugestao)
      wa.markFuAutoSent(lead)
      toast(`Follow-up enviado para ${lead.nome || lead.telefone}`, 'ok')
    } catch {}
  }
}

// ── Sugestão IA ──
const aiSugestao    = ref('')
// SDR — lock por chat (evita respostas paralelas para o mesmo lead)

const sdrForaMotivo = computed(() => {
  const day  = new Date().getDay()
  const dias = wa.sdrConfig.diasSemana || []
  if (!dias.includes(day)) {
    const NOMES = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
    const conf  = dias.map(d => NOMES[d]).join(', ')
    return `Fora dos dias configurados (${conf || '—'}) — SDR pausado`
  }
  return `Fora do horário — SDR pausado até ${wa.sdrConfig.horaInicio}`
})


const aiTom         = ref('recomendado')
const aiModo        = ref('resposta') // 'resposta' | 'followup'
const aiContextMsg  = ref(null) // mensagem-alvo da última sugestão (null = sugestão geral)
const aiCache       = reactive({ recomendado: '', estrategico: '', direto: '' })
// Mapa de sessão: chatKey → { sugestao, tom, modo, contextMsg, cache }
const aiSessao      = reactive({})
const aiTons        = [
  { id: 'recomendado', label: 'Recomendado' },
  { id: 'estrategico', label: 'Estratégico' },
  { id: 'direto',      label: 'Direto'      },
]
const aiModos = [
  { id: 'resposta',  label: 'Resposta'  },
  { id: 'followup',  label: 'Follow-up' },
]

function selecionarTom(id) {
  if (aiLoading.value) return
  aiTom.value = id
  if (aiCache[id]) {
    // Já gerado — apenas exibe, sem nova chamada
    aiSugestao.value = aiCache[id]
    salvarSessaoAi()
  } else {
    if (aiContextMsg.value) gerarSugestaoMsg(aiContextMsg.value)
    else gerarSugestao()
  }
}

function selecionarModo(id) {
  if (aiLoading.value) return
  if (aiModo.value === id) return
  aiModo.value = id
  limparCacheAi()
  if (id === 'followup') aiContextMsg.value = null
  gerarSugestao()
}

// Botão "Regenerar" — limpa só o tom atual e regenera
function regenerarSugestao() {
  aiCache[aiTom.value] = ''
  aiContextMsg.value = null
  gerarSugestao()
}

function limparCacheAi() {
  aiCache.recomendado = ''
  aiCache.estrategico = ''
  aiCache.direto      = ''
}

function salvarSessaoAi() {
  if (!activeLead.value) return
  const key = chatKey(activeLead.value)
  aiSessao[key] = {
    sugestao:   aiSugestao.value,
    tom:        aiTom.value,
    modo:       aiModo.value,
    contextMsg: aiContextMsg.value,
    cache:      { ...aiCache },
  }
}

function restaurarSessaoAi(lead) {
  const key = chatKey(lead)
  const s = aiSessao[key]
  if (s?.sugestao) {
    aiSugestao.value   = s.sugestao
    aiTom.value        = s.tom        || 'recomendado'
    aiModo.value       = s.modo       || 'resposta'
    aiContextMsg.value = s.contextMsg || null
    Object.assign(aiCache, { recomendado: '', estrategico: '', direto: '', ...s.cache })
  } else {
    aiSugestao.value   = ''
    aiTom.value        = 'recomendado'
    aiModo.value       = 'resposta'
    aiContextMsg.value = null
    limparCacheAi()
  }
}

const aiLoading  = ref(false)

async function gerarSugestao() {
  if (!activeLead.value || aiLoading.value) return
  aiLoading.value  = true
  aiSugestao.value = ''
  try {
    const lead     = activeLead.value
    const leadFull = lead.id ? leads.leads.find(l => l.id === lead.id) : null

    const MEDIA_PREFIXES = ['[IMG]', '[AUDIO]', '[VIDEO]', '[DOC:']
    const msgs = waMsgs.value
      .filter(m => m.mensagem && !MEDIA_PREFIXES.some(p => m.mensagem.startsWith(p)))
      .slice(-15)
      .map(m => ({ direcao: m.direcao, mensagem: m.mensagem }))

    if (!msgs.length) { toast('Nenhuma mensagem de texto para analisar', 'warn'); aiLoading.value = false; return }

    const { data, error } = await sb.functions.invoke('sugerir-resposta', {
      body: {
        messages:   msgs,
        scriptBase: wa.scriptBase || '',
        leadInfo:   { nome: lead.nome, etapa: leadFull?.etapa || null },
        tom:        aiTom.value,
        tipo:       aiModo.value,
      },
    })
    if (error) throw new Error(error.message || JSON.stringify(error))
    if (data?.error) throw new Error(data.error)
    aiSugestao.value = data.sugestao || ''
    aiCache[aiTom.value] = aiSugestao.value
    salvarSessaoAi()
  } catch (e) {
    console.error('[gerarSugestao]', e)
    toast('Erro ao gerar sugestão: ' + (e.message || 'desconhecido'), 'error')
  } finally {
    aiLoading.value = false
  }
}

// ── Análise IA ──
const analysisResult  = ref(null)
const analysisLoading = ref(false)
const analysisOpen    = ref(false)
const analysisCache   = reactive({}) // leadKey → result

function analysisKey(lead) {
  return lead?.id ? `ai_analysis_${lead.id}` : `ai_analysis_phone_${lead?.telefone?.replace(/\D/g, '')}`
}

async function openAnalysisModal() {
  if (!activeLead.value) return
  analysisOpen.value = true
  const key = analysisKey(activeLead.value)
  // Usa cache in-memory primeiro
  if (analysisCache[key]) { analysisResult.value = analysisCache[key]; return }
  // Tenta carregar do Supabase
  try {
    const { data } = await sb.from('configuracoes')
      .select('valor').eq('user_id', auth.user.id).eq('chave', key).maybeSingle()
    if (data?.valor) {
      const parsed = typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor
      analysisResult.value = parsed
      analysisCache[key]   = parsed
    }
  } catch { /* silent */ }
}

function scoreColor(s) {
  if (s >= 75) return '#22c55e'
  if (s >= 50) return '#e8a838'
  if (s >= 25) return '#f97316'
  return '#e05555'
}
function scoreLabel(s) {
  if (s >= 75) return 'Lead quente'
  if (s >= 50) return 'Lead morno'
  if (s >= 25) return 'Lead frio'
  return 'Desinteressado'
}

async function analisarLeadIA() {
  if (!activeLead.value || analysisLoading.value) return
  analysisLoading.value = true
  try {
    const lead     = activeLead.value
    const leadFull = lead.id ? leads.leads.find(l => l.id === lead.id) : null
    const MEDIA_PREFIXES = ['[IMG]', '[AUDIO]', '[VIDEO]', '[DOC:']
    const msgs = waMsgs.value
      .filter(m => m.mensagem && !MEDIA_PREFIXES.some(p => m.mensagem.startsWith(p)))
      .map(m => ({ direcao: m.direcao, mensagem: m.mensagem }))

    const { data, error } = await sb.functions.invoke('analyze-lead', {
      body: {
        messages: msgs,
        leadInfo: {
          nome:           lead.nome,
          negocio:        leadFull?.negocio   || lead.negocio,
          categoria:      leadFull?.categoria || lead.categoria,
          cidade:         leadFull?.cidade    || lead.cidade,
          etapa:          leadFull?.etapa     || lead.etapa,
          valor_estimado: leadFull?.valor_estimado,
        },
      },
    })
    if (error) throw error
    if (data?.error) throw new Error(data.error)

    const result = { ...data, geradoEm: new Date().toISOString() }
    analysisResult.value = result

    // Salva no cache e no Supabase
    const key = analysisKey(lead)
    analysisCache[key] = result
    await sb.from('configuracoes').upsert(
      { id: auth.user.id + '_' + key, user_id: auth.user.id, chave: key, valor: result },
      { onConflict: 'id' }
    )
  } catch (e) {
    toast('Erro ao analisar lead: ' + (e.message || ''), 'error')
  } finally {
    analysisLoading.value = false
  }
}

// Menu de opções da mensagem
const msgMenu = reactive({ id: null, msg: null, style: {} })

function openMsgMenu(m, e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const isOut = m.direcao === 'enviado'
  const menuW = 190
  let left = isOut ? rect.right - menuW : rect.left
  if (left + menuW > window.innerWidth - 8) left = window.innerWidth - menuW - 8
  if (left < 8) left = 8
  const top = rect.bottom + 4 + window.scrollY
  msgMenu.id  = m.id
  msgMenu.msg = m
  msgMenu.style = { position: 'fixed', top: rect.bottom + 4 + 'px', left: left + 'px', zIndex: 9999 }
}

function copiarMensagem() {
  const txt = msgMenu.msg?.mensagem
  if (!txt) return
  navigator.clipboard.writeText(txt).then(() => toast('Copiado', 'ok')).catch(() => toast('Erro ao copiar', 'error'))
  msgMenu.id = null
}

function encaminharMensagem() {
  const txt = msgMenu.msg?.mensagem
  if (!txt) return
  novaMsg.value = txt
  msgMenu.id = null
  nextTick(() => { autoResize(); inputEl.value?.focus() })
}

async function apagarMensagem() {
  const m = msgMenu.msg
  msgMenu.id = null
  if (!m?.id) return
  try {
    const { error } = await sb.from('conversas').delete().eq('id', m.id)
    if (error) throw error
    waMsgs.value = waMsgs.value.filter(x => x.id !== m.id)
    toast('Mensagem apagada', 'ok')
  } catch {
    toast('Erro ao apagar mensagem', 'error')
  }
}

async function gerarSugestaoMsg(targetMsg) {
  if (!activeLead.value || aiLoading.value) return
  aiContextMsg.value = targetMsg
  aiLoading.value    = true
  aiSugestao.value   = ''
  try {
    const lead     = activeLead.value
    const leadFull = lead.id ? leads.leads.find(l => l.id === lead.id) : null

    const MEDIA_PREFIXES = ['[IMG]', '[AUDIO]', '[VIDEO]', '[DOC:']
    const targetIdx = waMsgs.value.findIndex(m => m.id === targetMsg.id)
    const slice = targetIdx >= 0 ? waMsgs.value.slice(0, targetIdx + 1) : waMsgs.value
    const msgs = slice
      .filter(m => m.mensagem && !MEDIA_PREFIXES.some(p => m.mensagem.startsWith(p)))
      .slice(-15)
      .map(m => ({ direcao: m.direcao, mensagem: m.mensagem }))

    if (!msgs.length) { toast('Nenhuma mensagem de texto para analisar', 'warn'); aiLoading.value = false; return }

    const { data, error } = await sb.functions.invoke('sugerir-resposta', {
      body: {
        messages:   msgs,
        scriptBase: wa.scriptBase || '',
        leadInfo:   { nome: lead.nome, etapa: leadFull?.etapa || null },
        tom:        aiTom.value,
      },
    })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    aiSugestao.value = data.sugestao || ''
    aiCache[aiTom.value] = aiSugestao.value
    salvarSessaoAi()
  } catch (e) {
    toast('Erro ao gerar sugestão: ' + (e.message || 'desconhecido'), 'error')
  } finally {
    aiLoading.value = false
  }
}

function usarSugestao() {
  if (!aiSugestao.value) return
  novaMsg.value    = aiSugestao.value
  aiSugestao.value = ''
  // Limpa sessão deste chat (sugestão foi usada)
  if (activeLead.value) delete aiSessao[chatKey(activeLead.value)]
  nextTick(() => { autoResize(); inputEl.value?.focus() })
}

// ── Lightbox ──
const lightboxSrc = ref(null)
function onLightboxKey(e) { if (e.key === 'Escape') lightboxSrc.value = null }
watch(lightboxSrc, (v) => {
  if (v) window.addEventListener('keydown', onLightboxKey)
  else   window.removeEventListener('keydown', onLightboxKey)
})

// ── Player de áudio customizado ──
const _audioEls    = {}                 // id → HTMLAudioElement
const _audioStates = reactive({})      // id → { playing, currentTime, duration }

function audioState(id) {
  if (!_audioStates[id]) _audioStates[id] = { playing: false, currentTime: 0, duration: 0 }
  return _audioStates[id]
}
function bubbleAudioProgress(id) {
  const s = audioState(id)
  return s.duration > 0 ? (s.currentTime / s.duration) * 100 : 0
}
function registerAudio(id, el) {
  if (el) { _audioEls[id] = el; audioState(id) }
  else    { delete _audioEls[id]; delete _audioStates[id] }
}
function onAudioTimeUpdate(id) {
  const el = _audioEls[id]; if (!el) return
  audioState(id).currentTime = el.currentTime
}
function onAudioMeta(id) {
  const el = _audioEls[id]; if (!el) return
  audioState(id).duration = el.duration || 0
}
function onAudioEnded(id) { audioState(id).playing = false }

function toggleAudio(id) {
  const el = _audioEls[id]; if (!el) return
  // Para qualquer outro áudio tocando
  for (const [oid, oel] of Object.entries(_audioEls)) {
    if (oid !== id && !oel.paused) { oel.pause(); audioState(oid).playing = false }
  }
  if (el.paused) { el.play(); audioState(id).playing = true }
  else           { el.pause(); audioState(id).playing = false }
}

function seekAudio(id, e) {
  const el = _audioEls[id]; if (!el) return
  const bar  = e.currentTarget
  const rect = bar.getBoundingClientRect()
  const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  el.currentTime = pct * (el.duration || 0)
}

function fmtAudioTime(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── Importar conversa ──
const importModalOpen   = ref(false)
const importFileInput   = ref(null)
const importParsed      = ref(false)
const importMsgs        = ref([])     // { sender, mensagem, data, mediaFile?, mediaEntry? }
const importSenders     = ref([])
const importMeuNome     = ref('')
const importLeadSearch  = ref('')
const importLeadResults = ref([])
const importLead        = ref(null)
const importLoading     = ref(false)
const importProgress    = ref('')
const importMediaCount  = computed(() => importMsgs.value.filter(m => m.mediaFile).length)

function abrirImportarConversa() {
  opcoesGeralOpen.value = false
  resetImport()
  importModalOpen.value = true
}

function fecharImportModal() {
  importModalOpen.value = false
  resetImport()
}

function resetImport() {
  importParsed.value      = false
  importMsgs.value        = []
  importSenders.value     = []
  importMeuNome.value     = ''
  importLeadSearch.value  = ''
  importLeadResults.value = []
  importLead.value        = null
  importLoading.value     = false
  importProgress.value    = ''
}

function handleImportDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  if (file) handleImportFile({ target: { files: [file] } })
}

function handleImportFile(e) {
  const file = e.target?.files?.[0]
  if (!file) return
  if (typeof e.target.value !== 'undefined') e.target.value = ''

  if (file.name.toLowerCase().endsWith('.zip')) {
    parseImportZip(file)
  } else {
    parseImportTxt(file)
  }
}

function parseImportTxt(file) {
  const reader = new FileReader()
  reader.onload = (ev) => {
    const msgs = parseWhatsAppTxt(ev.target.result, false)
    if (!msgs.length) { toast('Nenhuma mensagem reconhecida no arquivo', 'warn'); return }
    finalizarParse(msgs)
  }
  reader.readAsText(file, 'utf-8')
}

async function parseImportZip(file) {
  try {
    const zip = await JSZip.loadAsync(file)

    // Encontra o .txt dentro do zip
    let txtContent = null
    for (const [name, entry] of Object.entries(zip.files)) {
      if (!entry.dir && name.toLowerCase().endsWith('.txt')) {
        txtContent = await entry.async('string')
        break
      }
    }
    if (!txtContent) { toast('Arquivo .txt não encontrado no zip', 'error'); return }

    // Mapa de arquivos de mídia pelo nome base
    const mediaMap = {}
    for (const [name, entry] of Object.entries(zip.files)) {
      if (!entry.dir && !name.toLowerCase().endsWith('.txt')) {
        const fname = name.split('/').pop()
        mediaMap[fname] = entry
      }
    }

    const msgs = parseWhatsAppTxt(txtContent, true)
    // Associa os arquivos zip às mensagens
    for (const m of msgs) {
      if (m.mediaFile && mediaMap[m.mediaFile]) {
        m.mediaEntry = mediaMap[m.mediaFile]
      }
    }

    if (!msgs.length) { toast('Nenhuma mensagem reconhecida no arquivo', 'warn'); return }
    finalizarParse(msgs)
  } catch (e) {
    toast('Erro ao ler zip: ' + (e.message || 'desconhecido'), 'error')
  }
}

function finalizarParse(msgs) {
  importMsgs.value    = msgs
  importSenders.value = [...new Set(msgs.map(m => m.sender))]
  const saved = localStorage.getItem('slac-wa-import-meu-nome')
  if (saved && importSenders.value.includes(saved)) importMeuNome.value = saved
  importParsed.value = true
}

const WA_PATTERNS = [
  /^\[(\d{1,2}\/\d{1,2}\/\d{4}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\]\s+([^:]+):\s*(.*)/,
  /^(\d{1,2}\/\d{1,2}\/\d{4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)\s+-\s+([^:]+):\s*(.*)/,
]

// Regex para detectar referência de arquivo de mídia no texto
const MEDIA_FILE_RE = /^(.+\.(jpe?g|png|gif|webp|mp4|mov|avi|webm|opus|mp3|ogg|m4a|aac|pdf|doc|docx|xlsx|pptx|zip|rar|txt))\s*(?:\(arquivo anexado\)|\(file attached\))?$/i

function parseWhatsAppTxt(text, keepMedia = false) {
  const SKIP_PATTERNS = ['<Mídia omitida>', '<Media omitted>', 'image omitted', 'audio omitted', 'video omitted', 'document omitted', 'sticker omitted', '(arquivo anexado)', '(file attached)']
  const lines = text.split(/\r?\n/)
  const msgs  = []
  let cur     = null

  for (const line of lines) {
    let matched = false
    for (const pat of WA_PATTERNS) {
      const m = line.match(pat)
      if (m) {
        if (cur) msgs.push(cur)
        const [, dateStr, timeStr, sender, msg] = m
        const [d, mo, y] = dateStr.split('/')
        const isoDate = `${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}T${timeStr.padStart(5,'0')}:00.000Z`
        const msgTrimmed = msg.trim()
        const mediaMatch = keepMedia ? msgTrimmed.match(MEDIA_FILE_RE) : null
        cur = {
          sender:    sender.trim(),
          mensagem:  msgTrimmed,
          data:      isoDate,
          mediaFile: mediaMatch ? mediaMatch[1].trim() : null,
        }
        matched = true
        break
      }
    }
    if (!matched && cur && line.trim()) {
      cur.mensagem += '\n' + line.trim()
    }
  }
  if (cur) msgs.push(cur)

  return msgs.filter(m => {
    const t = m.mensagem.trim()
    if (!t) return false
    if (m.mediaFile) return true   // sempre inclui se tem arquivo
    // Sem arquivo: pular menções de mídia omitida
    return !SKIP_PATTERNS.some(s => t.toLowerCase().includes(s.toLowerCase()))
  })
}

function pesquisarImportLead() {
  const q = importLeadSearch.value.trim().toLowerCase()
  if (!q) { importLeadResults.value = []; return }
  importLeadResults.value = leads.leads.filter(l =>
    l.nome?.toLowerCase().includes(q) || l.telefone?.includes(q) || l.empresa?.toLowerCase().includes(q)
  ).slice(0, 8)
}

function selecionarImportLead(l) {
  importLead.value        = l
  importLeadSearch.value  = l.nome
  importLeadResults.value = []
}

async function uploadImportMedia(entry, filename) {
  const blob   = await entry.async('blob')
  const mime   = blob.type || guessMime(filename)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = (e) => resolve(e.target.result)  // data URL base64
    reader.onerror = reject
    reader.readAsDataURL(new Blob([blob], { type: mime }))
  })
}

function guessMime(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase()
  const map = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
    mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
    ogg: 'audio/ogg', opus: 'audio/ogg', mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac',
    pdf: 'application/pdf',
  }
  return map[ext] || 'application/octet-stream'
}

async function doImport() {
  if (!importMeuNome.value || importLoading.value) return
  localStorage.setItem('slac-wa-import-meu-nome', importMeuNome.value)
  importLoading.value = true
  try {
    const userId    = auth.user.id
    const leadId    = importLead.value?.id || null
    const phone     = importLead.value?.telefone?.replace(/\D/g, '') || null
    const otherName = importSenders.value.find(s => s !== importMeuNome.value) || 'Contato'
    const allMsgs   = importMsgs.value
    const total     = allMsgs.length
    const rows      = []

    // Processa mensagens com upload de mídia
    for (let i = 0; i < allMsgs.length; i++) {
      const m = allMsgs[i]
      let mensagem = m.mensagem

      if (m.mediaFile && m.mediaEntry) {
        importProgress.value = `Enviando mídia ${i + 1}/${total}...`
        try {
          const url  = await uploadImportMedia(m.mediaEntry, m.mediaFile)
          const type = getMediaType(m.mediaFile)
          if (type === 'image')    mensagem = `[IMG]${url}`
          else if (type === 'audio')   mensagem = `[AUDIO]${url}`
          else if (type === 'video')   mensagem = `[VIDEO]${url}`
          else                         mensagem = `[DOC:${m.mediaFile}]${url}`
        } catch {
          // Falha no upload: mantém o nome do arquivo como texto
          mensagem = `[${m.mediaFile}]`
        }
      }

      rows.push({
        id:           'imp_' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2, 6),
        user_id:      userId,
        lead_id:      leadId,
        canal:        'whatsapp',
        direcao:      m.sender === importMeuNome.value ? 'enviado' : 'recebido',
        mensagem,
        data:         m.data,
        status:       m.sender === importMeuNome.value ? 'read' : 'received',
        telefone:     phone,
        contato_nome: m.sender !== importMeuNome.value ? m.sender : otherName,
      })
    }

    importProgress.value = 'Salvando mensagens...'
    for (let i = 0; i < rows.length; i += 100) {
      const { error } = await sb.from('conversas')
        .upsert(rows.slice(i, i + 100), { onConflict: 'id', ignoreDuplicates: true })
      if (error) throw error
    }

    toast(`${rows.length} mensagens importadas`, 'ok')
    fecharImportModal()
    await wa.loadChats()
    if (importLead.value) openChat(importLead.value)
  } catch (e) {
    toast('Erro ao importar: ' + (e.message || 'desconhecido'), 'error')
  } finally {
    importLoading.value  = false
    importProgress.value = ''
  }
}

const pinnedLeadIds    = ref(new Set(JSON.parse(localStorage.getItem('slac-pinned-chats') || '[]')))

function togglePin(leadId) {
  const ids = new Set(pinnedLeadIds.value)
  if (ids.has(leadId)) ids.delete(leadId)
  else ids.add(leadId)
  pinnedLeadIds.value = ids
  localStorage.setItem('slac-pinned-chats', JSON.stringify([...ids]))
}

// Item dropdown menu
const activeItemMenu = ref(null)   // leadId | telefone da conversa com menu aberto
const menuPos = ref({})

const menuStyle = computed(() => {
  const s = { position: 'fixed', zIndex: 9999 }
  if (menuPos.value.top  != null) s.top    = menuPos.value.top  + 'px'
  if (menuPos.value.bottom != null) s.bottom = menuPos.value.bottom + 'px'
  if (menuPos.value.left != null) s.left   = menuPos.value.left + 'px'
  else                             s.right  = (menuPos.value.right ?? 0) + 'px'
  return s
})

const menuChat = computed(() =>
  activeItemMenu.value
    ? [...pinnedChats.value, ...recentChats.value].find(
        c => (c.lead.id || c.lead.telefone) === activeItemMenu.value
      )
    : null
)

const isMenuLeadPinned = computed(() =>
  activeItemMenu.value ? pinnedLeadIds.value.has(activeItemMenu.value) : false
)

const isMenuLeadUnread = computed(() =>
  menuChat.value ? isUnread(menuChat.value) : false
)

const MENU_EST_H = 290  // altura estimada do dropdown em px

function openItemMenu(id, event) {
  if (activeItemMenu.value === id) { activeItemMenu.value = null; return }
  const btn  = event.currentTarget
  const rect = btn.getBoundingClientRect()
  const vw   = window.innerWidth
  const vh   = window.innerHeight

  const pos = {}

  // Vertical: abre para baixo, mas sobe se não couber
  if (rect.bottom + MENU_EST_H > vh && rect.top > MENU_EST_H) {
    pos.bottom = vh - rect.top + 4
  } else {
    pos.top = rect.bottom + 4
  }

  // Horizontal: prefere alinhar pela direita do botão, mas garante que não saia pela esquerda
  const rightEdge = vw - rect.right
  const menuW = 210
  if (rect.right - menuW < 0) {
    pos.left = Math.max(4, rect.left)
  } else {
    pos.right = rightEdge
  }

  menuPos.value = pos
  activeItemMenu.value = id
}

function openSlacOpts(section = 'contato') {
  const chat = menuChat.value
  if (chat) {
    slacOptsLead.value = leads.leads.find(l => l.id === chat.lead.id) || chat.lead
  }
  activeSection.value = section
  opcoesSLACOpen.value = true
  activeItemMenu.value = null
}

function openSlacOptsFromToolbar() {
  slacOptsLead.value = activeLead.value
  opcoesSLACOpen.value = true
}

function doTogglePin() {
  if (activeItemMenu.value) togglePin(activeItemMenu.value)
  activeItemMenu.value = null
}

function toggleNaoLido() {
  const chat = menuChat.value
  if (!chat) { activeItemMenu.value = null; return }
  const key = chatKey(chat.lead)

  if (isMenuLeadUnread.value) {
    // Marcar como lido
    markAsRead(chat.lead, chat.lastAt)
  } else {
    // Marcar como não lido: força unreadCounts = 1 e remove lastSeenAt para garantir badge
    wa.storeSetUnread(key, 1)
    const seen = { ...lastSeenAt.value }
    delete seen[key]
    lastSeenAt.value = seen
    localStorage.setItem('slac-last-seen', JSON.stringify(seen))
  }
  activeItemMenu.value = null
}

function desativarNotificacoes() {
  toast('Notificações desativadas', 'ok')
  activeItemMenu.value = null
}

async function marcarPerdido() {
  const chat = menuChat.value
  activeItemMenu.value = null
  if (!chat?.lead?.id) { toast('Lead não encontrado', 'error'); return }
  try {
    await leads.upsert({ id: chat.lead.id, etapa: 'perdido' })
    toast('Lead marcado como perdido', 'ok')
  } catch {
    toast('Erro ao atualizar lead', 'error')
  }
}

async function apagarConversa() {
  const chat = menuChat.value
  activeItemMenu.value = null
  if (!chat) return
  try {
    const { lead } = chat
    let query = sb.from('conversas')
      .delete()
      .eq('canal', 'whatsapp')
      .eq('user_id', auth.user.id)
    if (lead.id) query = query.eq('lead_id', lead.id)
    else query = query.eq('telefone', lead.telefone?.replace(/\D/g, ''))
    const { error } = await query
    if (error) throw error
    // Remove da lista local imediatamente
    if (activeLead.value?.id === lead.id || activeLead.value?.telefone === lead.telefone) {
      activeLead.value = null
      waMsgs.value = []
      msgsOffset.value = 0
      msgsHasMore.value = false
    }
    await wa.loadChats()
    toast('Conversa apagada', 'ok')
  } catch (e) {
    toast('Erro ao apagar conversa', 'error')
  }
}

// Attachment
const showAttachMenu  = ref(false)
const selectedFile    = ref(null)  // { tipo, nome, dataUrl }
const fileCaption     = ref('')
const fileInputMedia  = ref(null)
const fileInputDoc    = ref(null)
const fileInputAudio  = ref(null)

// ── Emoji picker ──
const showEmojiPicker = ref(false)
const emojiPickerEl   = ref(null)
let _emojiPickerInstance = null

function toggleEmojiPicker() {
  showEmojiPicker.value = !showEmojiPicker.value
  if (showEmojiPicker.value) {
    nextTick(() => {
      if (!emojiPickerEl.value) return
      emojiPickerEl.value.innerHTML = ''
      _emojiPickerInstance = new Picker({
        data: EmojiData,
        set: 'native',
        locale: 'pt',
        theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark',
        onEmojiSelect: (e) => {
          novaMsg.value += e.native
          nextTick(() => { autoResize(); inputEl.value?.focus() })
        },
        parent: emojiPickerEl.value,
      })
    })
  }
}

function closeEmojiPicker() { showEmojiPicker.value = false }

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
  if (showEmojiPicker.value && !e.target.closest('.sz-emoji-wrap')) {
    showEmojiPicker.value = false
  }
  if (opcoesGeralOpen.value && !e.target.closest('.sz-opcoes-wrap')) {
    opcoesGeralOpen.value = false
  }
  if (accountDropOpen.value && !e.target.closest('.sz-account-wrap')) {
    accountDropOpen.value = false
  }
}

function togglePerdidosFilter() {
  opcoesGeralOpen.value = false
  chatFilter.value = chatFilter.value === 'perdidos' ? 'tudo' : 'perdidos'
}

function marcarTodasLidas() {
  opcoesGeralOpen.value = false
  const now = new Date().toISOString()
  const newSeen = { ...lastSeenAt.value }
  for (const c of wa.chats) {
    const key = chatKey(c.lead)
    if (key) newSeen[key] = now
  }
  lastSeenAt.value = newSeen
  wa.storeClearAllUnread()
  localStorage.setItem('slac-last-seen', JSON.stringify(newSeen))
  saveLastSeenRemote()
  toast('Todas as conversas marcadas como lidas', 'ok')
}

async function desconectarWA() {
  opcoesGeralOpen.value = false
  await wa.disconnect()
  toast('WhatsApp desconectado', 'ok')
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
function fmtDataHora(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
function fmtValor(v) {
  return v ? 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''
}

// ── Status indicators ──
function itemStatuses(lead) {
  // busca o lead completo no store para ter relead_data
  const full = (lead.id ? leads.leads.find(l => l.id === lead.id) : null) || lead
  const s = [], now = new Date()
  if (full.relead_data && new Date(full.relead_data) <= now)
    s.push({ type: 'relead', label: 'Relead', color: '#8b5cf6' })
  if (work.leadsComWork.has(lead.id))
    s.push({ type: 'work', label: 'Work', color: '#5b8dee' })
  return s
}

function itemTint(lead) {
  const full = (lead.id ? leads.leads.find(l => l.id === lead.id) : null) || lead
  if (full.proximo_followup) return 'followup'
  if (full.relead_data) return 'relead'
  if (work.leadsComWork.has(lead.id)) return 'work'
  return null
}

function itemFollowup(lead) {
  const full = (lead.id ? leads.leads.find(l => l.id === lead.id) : null) || lead
  return full.proximo_followup || null
}

function itemRelead(lead) {
  const full = (lead.id ? leads.leads.find(l => l.id === lead.id) : null) || lead
  return full.relead_data || null
}

function itemWork(lead) {
  return lead.id ? work.leadsComWork.has(lead.id) : false
}

function fmtFollowup(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${date} às ${time}`
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
const activeCrmLead = computed(() => {
  const lead = slacOptsLead.value || activeLead.value
  return lead?.id ? leads.leads.find(l => l.id === lead.id) ?? null : null
})

watch([opcoesSLACOpen, activeSection], () => {
  if (!opcoesSLACOpen.value || !activeCrmLead.value) return
  const l = activeCrmLead.value
  if (activeSection.value === 'followup') {
    followupDate.value = l.proximo_followup ? toLocalDatetimeInput(l.proximo_followup) : ''
    followupObs.value  = l.followup_obs ?? ''
    const fuKey = slacOptsLead.value && wa.fuAutoKey(slacOptsLead.value)
    fuAutoHorasLocal.value = (fuKey && wa.fuAutoChats[fuKey]?.horas) || 4
  }
  if (activeSection.value === 'financeiro') {
    parcelasLocal.value = JSON.parse(JSON.stringify(l.parcelas ?? []))
  }
  if (activeSection.value === 'anotacoes') {
    anotacoesText.value = l.anotacoes ?? ''
  }
})

watch(activeLead, () => {
  opcoesSLACOpen.value = false
  activeSection.value   = 'contato'
  erroAnalise.value     = null
})

watch(opcoesSLACOpen, (val) => {
  if (!val) slacOptsLead.value = null
})

function onEscModal(e) {
  if (e.key === 'Escape') {
    if (activeItemMenu.value) { activeItemMenu.value = null; return }
    opcoesSLACOpen.value = false
  }
}
watch(opcoesSLACOpen, (val) => {
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

function toLocalDatetimeInput(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 16)
}

async function saveFollowup() {
  if (!activeCrmLead.value) return
  await leads.upsert({
    id: activeCrmLead.value.id,
    proximo_followup: followupDate.value ? new Date(followupDate.value).toISOString() : null,
    followup_obs: followupObs.value || null,
    followup_count: (activeCrmLead.value.followup_count ?? 0) + 1
  })
  toast('Follow-up salvo', 'ok')
  opcoesSLACOpen.value = false
  router.push('/crm?tab=followup')
}

async function handleToggleFuAutoChat() {
  const lead = slacOptsLead.value
  if (!lead) return
  const wasActive = wa.isFuAutoActive(lead)
  await wa.toggleFuAutoChat(lead, fuAutoHorasLocal.value)
  // Ao ativar: agenda proximo_followup = agora + horas para aparecer na aba CRM
  if (!wasActive && activeCrmLead.value) {
    const fuAt = new Date(Date.now() + fuAutoHorasLocal.value * 3600000).toISOString()
    await leads.upsert({ id: activeCrmLead.value.id, proximo_followup: fuAt })
  }
}

async function saveFuAutoHoras() {
  const lead = slacOptsLead.value
  if (!lead) return
  await wa.setFuAutoHoras(lead, fuAutoHorasLocal.value)
  // Atualiza proximo_followup se FuAuto já está ativo
  if (wa.isFuAutoActive(lead) && activeCrmLead.value) {
    const fuAt = new Date(Date.now() + fuAutoHorasLocal.value * 3600000).toISOString()
    await leads.upsert({ id: activeCrmLead.value.id, proximo_followup: fuAt })
  }
  toast('Configuração salva', 'ok')
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
    let rawMsgs = waMsgs.value
    // Carrega mensagens do DB se o chat do modal não está aberto
    if (!rawMsgs.length || activeLead.value?.id !== activeCrmLead.value.id) {
      const loaded = await leads.loadConversas(activeCrmLead.value.id, { noStore: true })
      rawMsgs = (loaded || []).filter(c => c.canal === 'whatsapp')
    }
    const msgs = rawMsgs
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
  if (diff < 7 * 86400000) return d.toLocaleDateString('pt-BR', { weekday: 'long' })
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

// ── Não lidas ──
// unreadCounts agora fica no wa store (global) — acessado via wa.unreadCounts
const lastSeenAt = ref(JSON.parse(localStorage.getItem('slac-last-seen') || '{}'))

function chatKey(lead) { return lead?.id || lead?.telefone || '' }

// ── Som de notificação ──
function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const t   = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()
    osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination)
    osc1.frequency.setValueAtTime(880, t)
    osc2.frequency.setValueAtTime(1100, t + 0.12)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.15, t + 0.02)
    gain.gain.linearRampToValueAtTime(0.08, t + 0.1)
    gain.gain.linearRampToValueAtTime(0.15, t + 0.14)
    gain.gain.linearRampToValueAtTime(0, t + 0.28)
    osc1.start(t); osc1.stop(t + 0.11)
    osc2.start(t + 0.12); osc2.stop(t + 0.28)
    setTimeout(() => ctx.close(), 400)
  } catch {}
}

function markAsRead(lead, lastAt) {
  const key = chatKey(lead)
  if (!key) return
  const ts = lastAt || new Date().toISOString()
  lastSeenAt.value = { ...lastSeenAt.value, [key]: ts }
  localStorage.setItem('slac-last-seen', JSON.stringify(lastSeenAt.value))
  wa.storeClearUnread(key)
  // salva no Supabase para sync cross-device
  saveLastSeenRemote()
}

let _savingLastSeen = false
async function saveLastSeenRemote() {
  if (_savingLastSeen) return
  _savingLastSeen = true
  try {
    await sb.from('configuracoes').upsert({
      id: auth.user.id + '_wa_last_seen',
      user_id: auth.user.id,
      chave: 'wa_last_seen',
      valor: lastSeenAt.value
    }, { onConflict: 'id' })
  } catch { /* silent */ } finally {
    _savingLastSeen = false
  }
}

async function syncLastSeen() {
  try {
    const { data } = await sb.from('configuracoes')
      .select('valor')
      .eq('user_id', auth.user.id)
      .eq('chave', 'wa_last_seen')
      .maybeSingle()
    if (!data?.valor) return
    const remote = typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor
    // merge: usa o timestamp mais recente por chave
    let changed = false
    const merged = { ...lastSeenAt.value }
    for (const [k, ts] of Object.entries(remote)) {
      if (!merged[k] || ts > merged[k]) { merged[k] = ts; changed = true }
    }
    if (!changed) return
    lastSeenAt.value = merged
    localStorage.setItem('slac-last-seen', JSON.stringify(merged))
    // limpa contadores de chaves agora marcadas como lidas
    for (const key of Object.keys({ ...wa.unreadCounts })) {
      const seen = merged[key]
      if (seen) {
        const chat = wa.chats.find(c => chatKey(c.lead) === key)
        if (!chat || !chat.lastAt || chat.lastAt <= seen) {
          wa.storeClearUnread(key)
        }
      }
    }
  } catch { /* silent */ }
}

function isUnread(chat) {
  const key = chatKey(chat.lead)
  // Realtime: contador explícito garante prioridade
  if ((wa.unreadCounts[key] || 0) > 0) return true
  // Timestamp: só avalia se temos um ponto de referência de quando o chat foi aberto
  if (chat.lastDirecao !== 'recebido') return false
  const seen = lastSeenAt.value[key]
  if (!seen) return false   // nunca aberto = assumir lido (evita "tudo não lido" no primeiro acesso)
  return !!chat.lastAt && chat.lastAt > seen
}

function getUnreadCount(chat) {
  return wa.unreadCounts[chatKey(chat.lead)] || 0
}


const filteredChats = computed(() => {
  const q = search.value.toLowerCase()
  let chats = wa.chats
  if (q) chats = chats.filter(c => c.lead.nome?.toLowerCase().includes(q) || c.lead.telefone?.includes(q))
  if (chatFilter.value === 'nao-lidas') chats = chats.filter(c => isUnread(c))
  if (chatFilter.value === 'followup') {
    chats = chats.filter(c => {
      const fullLead = c.lead.id ? leads.leads.find(l => l.id === c.lead.id) : null
      return !!(fullLead?.proximo_followup)
    })
  }
  if (chatFilter.value === 'perdidos') {
    chats = chats.filter(c => {
      const fullLead = c.lead.id ? leads.leads.find(l => l.id === c.lead.id) : null
      return fullLead?.etapa === 'perdido'
    })
  }
  if (chatFilter.value === 'relead') {
    chats = chats.filter(c => {
      const fullLead = c.lead.id ? leads.leads.find(l => l.id === c.lead.id) : null
      return !!(fullLead?.relead_data)
    })
  }
  if (chatFilter.value === 'work') {
    chats = chats.filter(c => c.lead.id ? work.leadsComWork.has(c.lead.id) : false)
  }
  return chats
})

// Leads do CRM que não aparecem nos chats — só quando há busca ativa
const searchLeads = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return []
  const chatLeadIds = new Set(wa.chats.map(c => c.lead.id).filter(Boolean))
  return leads.leads
    .filter(l => {
      if (chatLeadIds.has(l.id)) return false
      return l.nome?.toLowerCase().includes(q) || l.telefone?.includes(q) || l.empresa?.toLowerCase().includes(q)
    })
    .slice(0, 8)
})

const pinnedChats = computed(() =>
  filteredChats.value.filter(c => pinnedLeadIds.value.has(c.lead.id || c.lead.telefone))
)
const recentChats = computed(() =>
  filteredChats.value.filter(c => !pinnedLeadIds.value.has(c.lead.id || c.lead.telefone))
)
const paginatedRecentChats = computed(() => recentChats.value.slice(0, chatsVisible.value))
const hasMoreChats = computed(() => chatsVisible.value < recentChats.value.length)

// Reset paginação ao mudar busca ou filtro
watch([search, chatFilter], () => { chatsVisible.value = 20 })

function scrollBottom() {
  nextTick(() => { if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight })
}

function scrollToUnreadOrBottom() {
  nextTick(() => {
    if (!messagesEl.value) return
    const divider = messagesEl.value.querySelector('.sz-unread-divider')
    if (divider) {
      divider.scrollIntoView({ block: 'start', behavior: 'instant' })
    } else {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  })
}

function autoResize() {
  if (!inputEl.value) return
  inputEl.value.style.height = 'auto'
  inputEl.value.style.height = Math.min(inputEl.value.scrollHeight, 120) + 'px'
}

// ── Chat open/close ──
async function openChat(chatLead) {
  // Salva sessão do chat atual antes de sair
  salvarSessaoAi()
  aiLoading.value = false
  analysisResult.value  = null
  analysisOpen.value    = false
  analysisLoading.value = false

  const key = chatKey(chatLead)
  // captura timestamp de última leitura ANTES de marcar como lido
  firstUnreadTs.value = lastSeenAt.value[key] || null
  const chat = wa.chats.find(c => (c.lead.id || c.lead.telefone) === key)
  markAsRead(chatLead, chat?.lastAt)
  activeLead.value = chatLead.id
    ? (leads.leads.find(l => l.id === chatLead.id) || chatLead)
    : chatLead
  loadingMsgs.value = true
  msgsOffset.value = 0
  msgsHasMore.value = false
  const PAGE = 50
  const all = chatLead.id
    ? await leads.loadConversas(chatLead.id, { limit: PAGE, offset: 0 })
    : await leads.loadConversasByPhone(chatLead.telefone, { limit: PAGE, offset: 0 })
  const filtered = (all || []).filter(c => c.canal === 'whatsapp')
  waMsgs.value = filtered
  msgsOffset.value = PAGE
  msgsHasMore.value = (all || []).length === PAGE
  loadingMsgs.value = false
  // Restaura sugestão de IA da sessão para este chat
  restaurarSessaoAi(activeLead.value)
  scrollToUnreadOrBottom()
  nextTick(() => inputEl.value?.focus())
  clearInterval(msgPoller)
  msgPoller = setInterval(pollMsgs, 3000)
}

function closeChat() {
  activeLead.value = null
  clearInterval(msgPoller)
  msgPoller = null
  msgsOffset.value = 0
  msgsHasMore.value = false
}

async function loadMoreMsgs() {
  if (!activeLead.value || !msgsHasMore.value || loadingMoreMsgs.value) return
  loadingMoreMsgs.value = true
  const el = messagesEl.value
  const prevScrollHeight = el ? el.scrollHeight : 0
  const PAGE = 50
  try {
    const all = activeLead.value.id
      ? await leads.loadConversas(activeLead.value.id, { limit: PAGE, offset: msgsOffset.value, noStore: true })
      : await leads.loadConversasByPhone(activeLead.value.telefone, { limit: PAGE, offset: msgsOffset.value })
    const older = (all || []).filter(c => c.canal === 'whatsapp')
    if (older.length) {
      waMsgs.value = [...older, ...waMsgs.value]
      msgsOffset.value += PAGE
      msgsHasMore.value = (all || []).length === PAGE
      nextTick(() => {
        if (el) el.scrollTop = el.scrollHeight - prevScrollHeight
      })
    } else {
      msgsHasMore.value = false
    }
  } finally {
    loadingMoreMsgs.value = false
  }
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
  if (tipo === 'media')         fileInputMedia.value?.click()
  else if (tipo === 'document') fileInputDoc.value?.click()
  else if (tipo === 'audio')    fileInputAudio.value?.click()
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

// ── Busca contagem exata de não lidas no Supabase ──
async function fetchUnreadCounts() {
  // Pass 1 (sem query): se a última msg de um chat é 'enviado', o usuário estava no WhatsApp
  // → avança lastSeen para cobrir as mensagens que ele leu antes de responder
  const seenSnap = { ...lastSeenAt.value }
  let seenDirty = false
  for (const c of wa.chats) {
    const key = chatKey(c.lead)
    if (!key || !c.lastAt) continue
    if (c.lastDirecao === 'enviado' && (!seenSnap[key] || c.lastAt > seenSnap[key])) {
      seenSnap[key] = c.lastAt
      seenDirty = true
    }
  }
  if (seenDirty) {
    lastSeenAt.value = seenSnap
    localStorage.setItem('slac-last-seen', JSON.stringify(seenSnap))
    saveLastSeenRemote()
  }

  // Pass 2: chats que ainda podem ter não-lidas após o ajuste acima
  const candidates = wa.chats.filter(c => {
    const key = chatKey(c.lead)
    const seen = lastSeenAt.value[key]
    if (!seen || !c.lead.id) return false
    return (c.lastDirecao === 'recebido' && !!c.lastAt && c.lastAt > seen) ||
           (wa.unreadCounts[key] > 0)
  })
  if (!candidates.length) return

  const updated = { ...wa.unreadCounts }
  await Promise.all(candidates.map(async (c) => {
    const key = chatKey(c.lead)
    let seen = lastSeenAt.value[key]
    try {
      // Verifica se usuário respondeu pelo celular depois do lastSeen
      // (caso: lastDirecao='recebido' mas houve 'enviado' intermediário — recebeu novas msgs depois da resposta)
      const { data: lastSent } = await sb.from('conversas')
        .select('data')
        .eq('lead_id', c.lead.id).eq('canal', 'whatsapp').eq('direcao', 'enviado')
        .gt('data', seen)
        .order('data', { ascending: false }).limit(1).maybeSingle()
      if (lastSent?.data && lastSent.data > seen) {
        seen = lastSent.data
        const newMap = { ...lastSeenAt.value, [key]: seen }
        lastSeenAt.value = newMap
        localStorage.setItem('slac-last-seen', JSON.stringify(newMap))
        saveLastSeenRemote()
      }

      // Conta recebidas após o seen (possivelmente atualizado acima)
      const { count, error } = await sb.from('conversas')
        .select('*', { count: 'exact', head: true })
        .eq('lead_id', c.lead.id).eq('canal', 'whatsapp').eq('direcao', 'recebido')
        .gt('data', seen)
      if (error) return
      if (count > 0) updated[key] = count
      else delete updated[key]
    } catch { /* silent */ }
  }))
  wa.storeSetAllUnread(updated)
}

// ── Realtime ──
let realtimeChannel = null
let statusTimer = null
let msgPoller = null
let fuAutoTimer = null

let _polling = false
async function pollMsgs() {
  if (!activeLead.value || _polling) return
  _polling = true
  try {
    // Busca apenas mensagens a partir da última que já temos (evita recarregar tudo)
    const realMsgs = waMsgs.value.filter(m => !m.id?.startsWith('opt_'))
    const lastTs = realMsgs.at(-1)?.data

    let q = sb.from('conversas').select('*')
      .eq('user_id', uid())
      .eq('canal', 'whatsapp')
      .order('data', { ascending: true })
    if (lastTs) q = q.gte('data', lastTs)
    else q = q.limit(50)
    if (activeLead.value.id) {
      q = q.eq('lead_id', activeLead.value.id)
    } else {
      const phone = String(activeLead.value.telefone).replace(/\D/g, '').replace(/^55/, '').slice(-10)
      q = q.is('lead_id', null).ilike('telefone', `%${phone}%`)
    }
    const { data } = await q
    const fresh = data || []

    const existingIds = new Set(waMsgs.value.map(m => m.id))
    const added = fresh.filter(m => !existingIds.has(m.id))
    if (added.length) {
      const confirmedTexts = new Set(added.map(m => m.mensagem))
      waMsgs.value = [
        ...waMsgs.value.filter(m => !m.id?.startsWith('opt_') || !confirmedTexts.has(m.mensagem)),
        ...added,
      ].sort((a, b) => new Date(a.data) - new Date(b.data))
      scrollBottom()
      if (added.some(m => m.direcao === 'recebido')) playNotifSound()
    }
    // Atualiza status das mensagens já na tela (entregue/lido)
    for (const m of fresh) {
      const idx = waMsgs.value.findIndex(e => e.id === m.id)
      if (idx !== -1 && m.status && waMsgs.value[idx].status !== m.status) {
        waMsgs.value[idx] = { ...waMsgs.value[idx], status: m.status }
      }
    }
  } finally {
    _polling = false
  }
}

const _themeObserver = new MutationObserver(() => {
  isDarkTheme.value = document.documentElement.getAttribute('data-theme') !== 'light'
})

// IntersectionObserver para infinite scroll da lista de chats
let _chatObserver = null
watch(sentinelEl, (el) => {
  if (_chatObserver) _chatObserver.disconnect()
  if (!el) return
  _chatObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMoreChats.value) {
      chatsVisible.value += 20
    }
  }, { root: listEl.value, threshold: 0.1 })
  _chatObserver.observe(el)
})

onMounted(async () => {
  _themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  window.addEventListener('resize', onResize)
  document.addEventListener('click', onDocClick, true)

  // Carrega configs do SDR, Follow-up automático e script
  await Promise.all([wa.loadSdrConfig(), wa.loadFuAutoConfig(), wa.loadConfig()])

  // Verifica status do servidor local e inicia polling
  await wa.checkStatus()
  statusTimer = setInterval(async () => {
    await wa.checkStatus()
    await wa.loadChats()
    await fetchUnreadCounts()
    await syncLastSeen()
  }, 15000)

  loading.value = true
  await Promise.all([wa.loadChats(), work.load()])
  loading.value = false

  // Polling de follow-up automático a cada 5 minutos
  fuAutoTimer = setInterval(() => { checkFuAuto() }, 5 * 60 * 1000)
  await fetchUnreadCounts()
  await syncLastSeen()

  const leadId = route.query.lead
  const telQuery = route.query.tel ? String(route.query.tel).replace(/\D/g, '') : null
  if (leadId) {
    const chat = wa.chats.find(c => c.lead.id === leadId)
    if (chat) openChat(chat.lead)
    else { const lead = leads.leads.find(l => l.id === leadId); if (lead) openChat(lead) }
  } else if (telQuery) {
    const chat = wa.chats.find(c => c.lead.telefone?.replace(/\D/g, '').endsWith(telQuery) || telQuery.endsWith(c.lead.telefone?.replace(/\D/g, '') || ''))
    if (chat) openChat(chat.lead)
    else {
      const lead = leads.leads.find(l => l.telefone?.replace(/\D/g, '').endsWith(telQuery) || telQuery.endsWith(l.telefone?.replace(/\D/g, '') || ''))
      if (lead) openChat(lead)
      else openChat({ id: null, nome: telQuery, telefone: telQuery })
    }
  }

  // Broadcast de novas mensagens — canal gerenciado pelo useAppInit (global)
  // SlacZapView só assiste wa.lastWaMsg para atualizar a UI do chat
  watch(() => wa.lastWaMsg, async (nova) => {
    if (!nova || nova.canal !== 'whatsapp') return
    const active = activeLead.value
    const isActive = active && (
      (active.id && active.id === nova.lead_id) ||
      (!active.id && nova.telefone && active.telefone &&
        nova.telefone.slice(-8) === active.telefone.replace(/\D/g,'').slice(-8))
    )
    if (isActive) {
      const exists = waMsgs.value.some(m => m.id === nova.id || (m.id?.startsWith('opt_') && m.mensagem === nova.mensagem))
      if (!exists) { waMsgs.value.push(nova); scrollBottom() }
    } else if (nova.direcao === 'recebido') {
      setTimeout(fetchUnreadCounts, 500)
      playNotifSound()
    }
  })

  realtimeChannel = sb.channel('slaczap-' + auth.user.id)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'configuracoes', filter: 'user_id=eq.' + auth.user.id },
      async (payload) => {
        if (payload.new?.chave === 'wa_last_seen') await syncLastSeen()
      })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversas' },
      (payload) => {
        const upd = payload.new
        if (upd.user_id !== auth.user.id) return
        if (!upd?.status || !upd?.id) return
        const idx = waMsgs.value.findIndex(m => m.id === upd.id)
        if (idx !== -1) waMsgs.value[idx] = { ...waMsgs.value[idx], status: upd.status }
      })
    .subscribe()
})
onUnmounted(() => {
  _themeObserver.disconnect()
  window.removeEventListener('resize', onResize)
  document.removeEventListener('click', onDocClick, true)
  if (realtimeChannel) sb.removeChannel(realtimeChannel)
  clearInterval(statusTimer)
  clearInterval(msgPoller)
  clearInterval(fuAutoTimer)
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
/* Inverte QR gerado com fundo escuro para fundo branco no tema claro */
[data-theme="light"] .sz-qr-img {
  filter: invert(1) saturate(0) contrast(1.5);
  border-color: var(--accent);
}
/* Light mode — overlay de conexão visível sobre fundo claro */
[data-theme="light"] .sz-connect-overlay {
  background: var(--bg-surface);
  border-top: 1px solid var(--border-default);
}
[data-theme="light"] .sz-spinner {
  border-color: var(--border-default);
  border-top-color: var(--accent);
}
[data-theme="light"] .sz-sidebar {
  border-right-color: var(--border-default);
}
[data-theme="light"] .sz-search {
  background: var(--bg-surface);
  border-color: var(--border-default);
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
.sz-title-group { display: flex; align-items: center; gap: .5rem; min-width: 0; flex-shrink: 0; }

/* ── Account tag ── */
.sz-account-wrap { position: relative; }
.sz-account-tag {
  display: flex; align-items: center; gap: .3rem;
  padding: .18rem .45rem; border-radius: 6px;
  background: var(--bg-elevated); border: 1px solid var(--border-default);
  color: var(--text-secondary); font-size: .7rem; font-weight: 500;
  font-family: inherit; cursor: pointer; max-width: 110px;
  transition: background .12s, color .12s;
  white-space: nowrap; overflow: hidden;
}
.sz-account-tag span { overflow: hidden; text-overflow: ellipsis; }
.sz-account-tag:hover { background: var(--bg-overlay); color: var(--text-primary); }
.sz-account-menu {
  position: absolute; top: calc(100% + .4rem); left: 0;
  background: var(--bg-elevated); border: 1px solid var(--border-default);
  border-radius: 10px; padding: .25rem; min-width: 160px;
  box-shadow: 0 8px 24px rgba(0,0,0,.25); z-index: 200;
}
.sz-account-item {
  display: flex; align-items: center; gap: .5rem;
  padding: .45rem .6rem; border-radius: 7px;
  font-size: .82rem; color: var(--text-secondary); cursor: pointer;
  transition: background .12s;
}
.sz-account-item:hover { background: var(--bg-overlay); color: var(--text-primary); }
.sz-account-item--active { color: var(--accent); }
.sz-account-check { margin-left: auto; color: var(--accent); }

/* ── Modal conta ── */
.sz-conta-modal { width: min(380px, 95vw); height: auto; }
.sz-conta-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: .75rem; }
.sz-conta-hint { font-size: .75rem; color: var(--text-secondary); line-height: 1.5; }
.sz-conta-footer { display: flex; align-items: center; gap: .5rem; padding: .75rem 1.5rem 1.25rem; border-top: 1px solid var(--border-subtle); }

/* ── Bolha de mídia (imagem/vídeo edge-to-edge) ── */
.sz-bubble--media {
  padding: 3px !important;
  overflow: hidden;
}
.sz-bubble-img {
  display: block;
  width: 100%;
  max-width: 280px;
  max-height: 320px;
  border-radius: 5px;
  object-fit: contain;
  cursor: zoom-in;
  background: rgba(0,0,0,.1);
}
.sz-bubble-video {
  display: block;
  width: 100%;
  max-width: 280px;
  max-height: 300px;
  border-radius: 5px;
}
/* Footer sobreposto em imagem/vídeo */
.sz-bubble-media-footer {
  display: flex;
  align-items: center;
  gap: .25rem;
  justify-content: flex-end;
  padding: 2px 4px 2px 8px;
  margin-top: 2px;
}

/* ── Documento ── */
.sz-bubble-doc {
  display: flex;
  align-items: center;
  gap: .6rem;
  padding: .5rem .6rem;
  border-radius: 6px;
  color: inherit;
  text-decoration: none;
  background: rgba(0,0,0,.12);
  transition: background .15s;
  min-width: 160px;
}
.sz-bubble-doc:hover { background: rgba(0,0,0,.2); }
[data-theme="light"] .sz-bubble-doc { background: rgba(0,0,0,.06); }
[data-theme="light"] .sz-bubble-doc:hover { background: rgba(0,0,0,.1); }
.sz-bubble-doc-icon {
  width: 32px; height: 32px;
  border-radius: 6px;
  background: rgba(255,255,255,.12);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
[data-theme="light"] .sz-bubble-doc-icon { background: rgba(0,0,0,.08); }
.sz-bubble-doc-name {
  font-size: .78rem;
  line-height: 1.3;
  word-break: break-all;
  flex: 1;
}

/* ── Player de áudio ── */
.sz-audio-player {
  display: flex;
  align-items: center;
  gap: .55rem;
  padding: .1rem 0;
  min-width: 220px;
  max-width: 280px;
}
.sz-ap-btn {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: filter .15s, transform .1s;
}
.sz-ap-btn:hover  { filter: brightness(1.12); }
.sz-ap-btn:active { transform: scale(.93); }
.sz-ap-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.sz-ap-bar {
  position: relative;
  height: 4px;
  background: rgba(255,255,255,.22);
  border-radius: 4px;
  cursor: pointer;
}
.sz-audio-player--in .sz-ap-bar { background: rgba(0,0,0,.18); }
[data-theme="light"] .sz-audio-player--out .sz-ap-bar { background: rgba(0,61,40,.18); }
[data-theme="light"] .sz-audio-player--in  .sz-ap-bar { background: rgba(0,0,0,.12); }
.sz-ap-fill {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  background: var(--accent);
  border-radius: 4px;
  transition: width .08s linear;
  pointer-events: none;
}
.sz-ap-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 2px rgba(255,255,255,.3);
  pointer-events: none;
  transition: left .08s linear;
}
.sz-ap-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sz-ap-time {
  font-size: .67rem;
  color: rgba(255,255,255,.55);
  font-variant-numeric: tabular-nums;
  letter-spacing: .01em;
}
.sz-audio-player--in .sz-ap-time { color: var(--text-secondary); }
[data-theme="light"] .sz-audio-player--out .sz-ap-time { color: rgba(0,61,40,.55); }
.sz-ap-check {
  display: flex;
  align-items: center;
  gap: .2rem;
}

/* ── Lightbox ── */
.sz-lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,.88);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.sz-lightbox-toolbar {
  position: absolute;
  top: 0; right: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 1rem;
}
.sz-lightbox-dl,
.sz-lightbox-close {
  width: 38px; height: 38px;
  border-radius: 10px;
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.08);
  color: rgba(255,255,255,.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  text-decoration: none;
  transition: background .15s;
}
.sz-lightbox-dl:hover,
.sz-lightbox-close:hover { background: rgba(255,255,255,.18); }
.sz-lightbox-img {
  max-width: min(92vw, 900px);
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 24px 60px rgba(0,0,0,.6);
  user-select: none;
}
.sz-lightbox-fade-enter-active,
.sz-lightbox-fade-leave-active { transition: opacity .16s ease; }
.sz-lightbox-fade-enter-from,
.sz-lightbox-fade-leave-to { opacity: 0; }

/* ── Botão IA no composer ── */
.sz-ai-trigger-btn {
  flex-shrink: 0;
  width: 30px; height: 30px;
  border-radius: 8px;
  background: none;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: color .15s, border-color .15s, background .15s;
  margin-right: 2px;
  align-self: flex-end;
  margin-bottom: 5px;
}
.sz-ai-trigger-btn:hover { color: var(--accent); border-color: var(--accent); }
.sz-ai-trigger-btn--active { color: var(--accent); border-color: var(--accent); background: var(--accent-subtle); }

/* Modal de análise IA */
.sz-analysis-modal {
  max-width: 420px;
}
.sz-analysis-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: .875rem 1rem .75rem; border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}
.sz-analysis-modal-lead { font-size: .82rem; font-weight: 600; color: var(--text-secondary); }
.sz-analysis-modal-loading {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 2.5rem 1rem;
}
.sz-analysis-modal-body {
  padding: 1.25rem; display: flex; flex-direction: column; gap: .875rem;
  overflow-y: auto; flex: 1; min-height: 0;
}
.sz-analysis-modal-body::-webkit-scrollbar { width: 4px; }
.sz-analysis-modal-body::-webkit-scrollbar-track { background: transparent; }
.sz-analysis-modal-body::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 4px; }
.sz-analysis-modal-body::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }
.sz-score-row { display: flex; align-items: center; gap: 1.125rem; }
.sz-score-ring { position: relative; width: 88px; height: 88px; flex-shrink: 0; }
.sz-score-ring svg { position: absolute; inset: 0; }
.sz-score-num {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; font-weight: 800;
}
.sz-score-info { flex: 1; min-width: 0; }
.sz-score-label { font-size: .8rem; font-weight: 700; margin: 0 0 .375rem; }
.sz-analysis-resumo { font-size: .8125rem; color: var(--text-secondary); margin: 0; line-height: 1.5; }
.sz-analysis-next {
  display: flex; align-items: flex-start; gap: .5rem;
  font-size: .8rem; color: var(--accent); font-weight: 500;
  background: var(--accent-subtle); border-radius: 8px; padding: .5rem .75rem;
  border: 1px solid rgba(34,197,94,.15);
}
.sz-analysis-cols { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
.sz-analysis-col ul { list-style: none; padding: 0; margin: .4rem 0 0; display: flex; flex-direction: column; gap: .35rem; }
.sz-analysis-col li { font-size: .775rem; color: var(--text-secondary); padding-left: .875rem; position: relative; line-height: 1.45; }
.sz-analysis-col li::before { content: '•'; position: absolute; left: 0; }
.sz-analysis-col-title {
  font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
  margin: 0; display: flex; align-items: center; gap: .3rem;
}
.sz-analysis-col-title--pos  { color: #22c55e; }
.sz-analysis-col-title--warn { color: #e8a838; }
.sz-analysis-modal-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: .625rem; padding: 2.5rem 1rem; color: var(--text-tertiary); font-size: .82rem;
}
.sz-analysis-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: .75rem; border-top: 1px solid var(--border-subtle); margin-top: .25rem;
}
.sz-analysis-ts { font-size: .7rem; color: var(--text-tertiary); }
.sz-toolbar-btn--active { color: var(--accent) !important; }
.sz-toolbar-btn--save { width: auto !important; border-radius: 20px !important; padding: 0 12px !important; gap: 4px; font-size: 11px; font-weight: 600; color: var(--accent) !important; border: 1px solid rgba(34,197,94,.3) !important; }
.sz-toolbar-btn--save:hover { background: rgba(34,197,94,.1) !important; }
@keyframes sz-spin { to { transform: rotate(360deg) } }
.sz-spin { animation: sz-spin .7s linear infinite; }
@keyframes sdr-btn-pulse { 0%, 100% { opacity: 1; transform: scale(1) } 50% { opacity: .5; transform: scale(.7) } }

/* Nav SDR tab */
.sz-modal-nav-item--sdr { color: var(--accent) !important; }
.sz-modal-nav-sdr-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--accent);
  flex-shrink: 0; animation: sdr-btn-pulse 1.8s ease infinite;
}

/* SDR seção no modal */
.sz-sdr-section-warn {
  display: flex; align-items: center; gap: .4rem; flex-wrap: wrap;
  font-size: .78rem; color: var(--status-warning);
  background: rgba(232,168,56,.08); border: 1px solid rgba(232,168,56,.2);
  border-radius: 8px; padding: .5rem .75rem; margin-bottom: 1rem;
}
.sz-sdr-link { color: var(--accent); text-decoration: none; font-weight: 600; }
.sz-sdr-link:hover { text-decoration: underline; }

.sz-sdr-toggle-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 1rem; padding: .75rem 0;
  border-bottom: 1px solid var(--border-subtle); margin-bottom: .75rem;
}
.sz-sdr-toggle-title { font-size: .875rem; font-weight: 600; margin: 0 0 .2rem; }
.sz-sdr-toggle-sub   { margin: 0; }

.sz-sdr-pill {
  width: 42px; height: 24px; border-radius: 12px; flex-shrink: 0;
  background: var(--bg-overlay); border: 1px solid var(--border-subtle);
  cursor: pointer; position: relative; transition: background .2s, border-color .2s;
}
.sz-sdr-pill:disabled { opacity: .45; cursor: not-allowed; }
.sz-sdr-pill--on { background: var(--accent); border-color: var(--accent); }
.sz-sdr-pill-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 16px; height: 16px; border-radius: 50%;
  background: var(--text-secondary); transition: transform .2s, background .2s;
}
.sz-sdr-pill--on .sz-sdr-pill-thumb { transform: translateX(18px); background: #fff; }

.sz-sdr-active-info {
  display: flex; flex-direction: column; gap: .5rem;
  padding: .625rem .75rem; border-radius: 8px;
  background: rgba(34,197,94,.05); border: 1px solid rgba(34,197,94,.15);
}
.sz-sdr-active-row {
  display: flex; align-items: center; gap: .45rem;
  font-size: .775rem; color: var(--accent);
}
.sz-sdr-active-row--warn { color: var(--status-warning); }

/* ── Card de sugestão IA ── */
.sz-ai-card {
  margin: 0 .75rem .5rem;
  border-radius: 10px;
  border: 1px solid rgba(34,197,94,.25);
  background: rgba(34,197,94,.06);
  overflow: hidden;
  backdrop-filter: blur(4px);
}
[data-theme="light"] .sz-ai-card {
  background: rgba(34,197,94,.05);
  border-color: rgba(34,197,94,.3);
}
.sz-ai-card-header {
  display: flex; align-items: center; gap: .4rem;
  padding: .45rem .6rem .35rem;
  border-bottom: 1px solid rgba(34,197,94,.12);
}
/* Modo Resposta / Follow-up */
.sz-ai-modo-row {
  display: flex; gap: 0; padding: .45rem .6rem .3rem;
  border-bottom: 1px solid rgba(34,197,94,.06);
}
.sz-ai-modo-btn {
  font-size: .72rem; font-weight: 600; font-family: inherit;
  padding: .25rem .7rem; cursor: pointer;
  border: 1px solid var(--border-subtle); background: transparent; color: var(--text-tertiary);
  transition: all 120ms;
}
.sz-ai-modo-btn:first-child { border-radius: 20px 0 0 20px; }
.sz-ai-modo-btn:last-child  { border-radius: 0 20px 20px 0; border-left: none; }
.sz-ai-modo-btn:hover { color: var(--text-secondary); }
.sz-ai-modo-btn.active {
  background: var(--accent); color: #000; border-color: var(--accent); font-weight: 700;
}
.sz-ai-tom-row {
  display: flex; gap: .3rem; padding: .4rem .6rem .3rem;
  border-bottom: 1px solid rgba(34,197,94,.08);
}
.sz-ai-tom-btn {
  font-size: .68rem; font-weight: 600; font-family: inherit;
  padding: .2rem .55rem; border-radius: 20px; cursor: pointer;
  border: 1px solid var(--border-subtle);
  background: transparent; color: var(--text-tertiary);
  transition: all 120ms;
}
.sz-ai-tom-btn:hover { color: var(--text-secondary); border-color: var(--text-tertiary); }
.sz-ai-tom-btn.active {
  background: rgba(34,197,94,.15); color: var(--accent);
  border-color: rgba(34,197,94,.4);
}
.sz-ai-badge {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: .65rem; font-weight: 700; letter-spacing: .04em;
  color: var(--accent);
  background: rgba(34,197,94,.12);
  padding: 2px 6px; border-radius: 4px;
  flex-shrink: 0;
}
.sz-ai-card-label {
  font-size: .72rem;
  color: var(--text-secondary);
  font-weight: 500;
}
.sz-ai-regen, .sz-ai-close {
  width: 22px; height: 22px;
  border-radius: 5px;
  background: none;
  border: none;
  color: var(--text-secondary);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: color .15s, background .15s;
}
.sz-ai-regen:hover { color: var(--accent); background: var(--accent-subtle); }
.sz-ai-close:hover { color: var(--status-danger); background: rgba(224,85,85,.08); }
.sz-ai-loading {
  display: flex; align-items: center; gap: 4px;
  padding: .65rem .75rem;
}
.sz-ai-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--accent);
  opacity: .4;
  animation: sz-ai-pulse 1.2s ease-in-out infinite;
}
.sz-ai-dot:nth-child(2) { animation-delay: .2s; }
.sz-ai-dot:nth-child(3) { animation-delay: .4s; }
@keyframes sz-ai-pulse {
  0%, 100% { opacity: .25; transform: scale(.85); }
  50%       { opacity: 1;   transform: scale(1.1); }
}
.sz-ai-text {
  padding: .55rem .75rem .45rem;
  font-size: .83rem;
  line-height: 1.5;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}
.sz-ai-usar {
  display: block;
  width: 100%;
  padding: .45rem .75rem;
  border: none;
  border-top: 1px solid rgba(34,197,94,.12);
  background: rgba(34,197,94,.08);
  color: var(--accent);
  font-size: .78rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
  text-align: center;
  font-family: inherit;
}
.sz-ai-usar:hover { background: rgba(34,197,94,.15); }
.sz-ai-slide-enter-active, .sz-ai-slide-leave-active {
  transition: opacity .18s ease, transform .18s ease;
}
.sz-ai-slide-enter-from, .sz-ai-slide-leave-to {
  opacity: 0; transform: translateY(6px);
}

/* ── Import modal ── */
.sz-import-modal { width: min(480px, 95vw); height: auto; }
.sz-import-zone {
  margin: 1rem 1.5rem 1.5rem;
  border: 1.5px dashed var(--border-subtle);
  border-radius: 10px;
  padding: 2.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .6rem;
  cursor: pointer;
  transition: border-color .15s, background .15s;
  text-align: center;
}
.sz-import-zone:hover { border-color: var(--accent); background: var(--accent-subtle); }
.sz-import-zone-title { font-size: .9rem; font-weight: 600; color: var(--text-primary); }
.sz-import-zone-hint { font-size: .76rem; color: var(--text-secondary); line-height: 1.6; }
.sz-import-zone-hint span { color: var(--text-tertiary); font-size: .72rem; }
.sz-import-stats {
  display: flex;
  align-items: center;
  gap: .5rem;
  margin: .75rem 1.5rem 0;
  padding: .6rem .75rem;
  background: var(--accent-subtle);
  border-radius: 8px;
  font-size: .8rem;
  color: var(--text-primary);
}
.sz-import-modal .form-group { margin: .75rem 1.5rem 0; }
.sz-import-lead-list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0; right: 0;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow: hidden;
  z-index: 200;
  box-shadow: 0 8px 24px rgba(0,0,0,.3);
  max-height: 200px;
  overflow-y: auto;
}
.sz-import-lead-item {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .5rem .75rem;
  cursor: pointer;
  transition: background .1s;
}
.sz-import-lead-item:hover,
.sz-import-lead-item--sel { background: var(--accent-subtle); }
.sz-import-lead-sel {
  display: flex;
  align-items: center;
  gap: .4rem;
  margin-top: .4rem;
  padding: .35rem .6rem;
  background: var(--accent-subtle);
  border-radius: 6px;
  border: 1px solid rgba(34,197,94,.25);
}
.sz-import-lead-clear {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
}
.sz-import-lead-clear:hover { color: var(--status-danger); }

.sz-sidebar-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}
.sz-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  border-radius: 8px;
  cursor: pointer;
  transition: background .12s, color .12s;
}
.sz-action-btn:hover { background: var(--bg-overlay); color: var(--text-primary); }

/* ── Opções geral dropdown ── */
.sz-opcoes-wrap { position: relative; }
.sz-opcoes-menu {
  position: absolute; top: calc(100% + .4rem); right: 0;
  background: var(--bg-elevated); border: 1px solid var(--border-default);
  border-radius: 10px; padding: .25rem; min-width: 160px;
  box-shadow: 0 8px 24px rgba(0,0,0,.25); z-index: 100;
}
.sz-opcoes-item {
  display: flex; align-items: center; gap: .5rem;
  width: 100%; padding: .5rem .7rem; border: none; background: none;
  font-size: .83rem; font-family: inherit; cursor: pointer;
  border-radius: 7px; text-align: left; transition: background .12s;
  color: var(--text-primary);
}
.sz-opcoes-item:hover { background: var(--bg-overlay); }
.sz-opcoes-item--danger { color: var(--status-danger); }
.sz-opcoes-item--danger:hover { background: rgba(224,85,85,.1); }
.sz-opcoes-sep { height: 1px; background: var(--border-subtle); margin: .25rem 0; }

/* filtros */
.sz-filter-tabs {
  display: flex;
  gap: 4px;
  margin-top: .65rem;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.sz-filter-tabs::-webkit-scrollbar { display: none; }
.sz-filter-tab {
  flex: 1;
  padding: .3rem .4rem;
  font-size: .72rem;
  font-weight: 500;
  font-family: inherit;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: background .12s, color .12s, border-color .12s;
  white-space: nowrap;
}
.sz-filter-tab:hover { background: var(--bg-elevated); color: var(--text-secondary); }
.sz-filter-tab--active {
  background: var(--accent-subtle);
  border-color: rgba(34,197,94,.3);
  color: var(--accent);
}
/* rótulos de seção */
.sz-list-section {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: .5rem 1rem .3rem;
  font-size: .68rem;
  font-weight: 600;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}
/* ── Pin badge + opts button ── */
.sz-item-pin-badge {
  position: absolute; top: 10px; right: 10px;
  display: flex; align-items: center; justify-content: center;
  color: var(--accent); opacity: .55;
  pointer-events: none;
  transition: opacity .12s;
}
.sz-item:hover .sz-item-pin-badge { opacity: 0; }

.sz-item-opts-btn {
  position: absolute; top: 7px; right: 8px;
  display: flex; align-items: center; justify-content: center;
  width: 20px; height: 20px;
  border: none; background: none; padding: 0;
  color: var(--accent); cursor: pointer;
  opacity: 0; pointer-events: none;
  transition: opacity .12s;
}
.sz-item:hover .sz-item-opts-btn { opacity: 1; pointer-events: auto; }
.sz-item-opts-btn:focus-visible { opacity: 1; pointer-events: auto; outline: none; }

/* ── Item dropdown menu ── */
@keyframes sz-menu-in { from { opacity: 0; transform: scale(.95) translateY(-4px) } to { opacity: 1; transform: scale(1) translateY(0) } }
.sz-item-menu-overlay {
  position: fixed; inset: 0; z-index: 9998;
}
.sz-item-menu {
  min-width: 200px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,.4), 0 2px 8px rgba(0,0,0,.2);
  padding: 5px;
  animation: sz-menu-in .12s ease;
  overflow-y: auto;
  max-height: 90vh;
}
.sz-item-menu-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 8px 10px;
  border: none; background: none; cursor: pointer;
  font-size: .82rem; font-family: inherit;
  color: var(--text-primary); border-radius: 8px;
  text-align: left; transition: background .1s;
}
.sz-item-menu-item:hover { background: var(--bg-overlay); }
.sz-item-menu-item--danger { color: var(--status-danger); }
.sz-item-menu-item--danger:hover { background: rgba(224,85,85,.1); }
.sz-item-menu-sep { height: 1px; background: var(--border-subtle); margin: 4px 6px; }
/* transitions */
.sz-menu-enter-active { transition: opacity .12s, transform .12s; }
.sz-menu-leave-active { transition: opacity .08s; }
.sz-menu-enter-from { opacity: 0; transform: scale(.95) translateY(-4px); }
.sz-menu-leave-to { opacity: 0; }

/* light mode */
[data-theme="light"] .sz-action-btn:hover { background: var(--bg-elevated); }
[data-theme="light"] .sz-item-menu {
  background: var(--bg-surface);
  border-color: var(--border-default);
  box-shadow: 0 8px 32px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.08);
}
[data-theme="light"] .sz-modal-header { border-bottom-color: var(--border-default); }
[data-theme="light"] .sz-modal-nav { border-bottom-color: var(--border-default); }
[data-theme="light"] .sz-modal-nav-item:hover { background: rgba(0,0,0,.03); }
[data-theme="light"] .sz-modal-close:hover { background: rgba(0,0,0,.05); color: var(--text-primary); }
[data-theme="light"] .sz-filter-tab--active { background: rgba(34,197,94,.08); }
[data-theme="light"] .sz-filter-tab { border-color: var(--border-default); }

/* ── Root ── */
@keyframes sz-fadein { from { opacity: 0 } to { opacity: 1 } }

.sz-root {
  position: relative;
  display: flex;
  height: calc(100vh - 56px);
  overflow: hidden;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-base);
}


/* ── Sidebar ── */
.sz-sidebar {
  width: 380px;
  min-width: 260px;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-subtle);
  background: var(--bg-base);
  transition: transform .3s cubic-bezier(.4,0,.2,1);
  flex-shrink: 0;
}
.sz-sidebar-header {
  padding: 1rem 1rem .75rem;
  background: var(--bg-base);
  position: sticky;
  top: 0;
  z-index: 2;
  border-bottom: 1px solid var(--border-subtle);
}
.sz-sidebar-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0;
  white-space: nowrap;
  letter-spacing: -.02em;
}
.sz-search-wrap { position: relative; }
.sz-search-icon {
  position: absolute; left: .7rem; top: 50%; transform: translateY(-50%);
  color: var(--text-tertiary); pointer-events: none;
}
.sz-search {
  width: 100%;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: .5rem .75rem .5rem 2.1rem;
  color: var(--text-primary);
  font-size: .85rem;
  font-family: inherit;
  outline: none;
  transition: background .15s, border-color .15s;
}
.sz-search:focus { background: var(--bg-surface); border-color: var(--accent); }
.sz-search::placeholder { color: var(--text-tertiary); }

.sz-list { flex: 1; overflow-y: auto; overflow-x: hidden; }
.sz-list::-webkit-scrollbar { width: 3px; }
.sz-list::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 2px; }
.sz-load-sentinel { height: 32px; display: flex; align-items: center; justify-content: center; }
.sz-load-more-hint { font-size: .65rem; color: var(--text-tertiary); }

.sz-empty-list {
  padding: 3rem 1rem; text-align: center;
  color: var(--text-tertiary); font-size: .82rem;
}

/* ── Chat item ── */
.sz-item {
  width: 100%; display: flex; flex-direction: column;
  border: none; background: var(--bg-base);
  cursor: pointer; text-align: left; transition: background .12s;
  touch-action: manipulation; position: relative;
}
.sz-item-content::after {
  content: ''; position: absolute; bottom: 0; left: 68px; right: 0;
  height: 1px; background: var(--border-subtle); pointer-events: none;
}
.sz-item-content {
  display: flex; align-items: center; gap: .75rem;
  padding: .65rem 1rem; min-height: 64px; position: relative; width: 100%;
}
.sz-item:hover { background: var(--bg-elevated); }
.sz-item:active { background: var(--bg-overlay); }
.sz-item--active { background: var(--bg-elevated); }

.sz-item-followup-bar,
.sz-item-relead-bar,
.sz-item-work-bar {
  display: flex; align-items: center; gap: .25rem;
  padding: 0 .6rem 0 68px;
  font-size: .6rem; font-weight: 600;
  height: 3px; flex-shrink: 0; overflow: hidden;
  transition: height .15s ease;
}
.sz-item:hover .sz-item-followup-bar,
.sz-item:hover .sz-item-relead-bar,
.sz-item:hover .sz-item-work-bar { height: 16px; }
.sz-item-followup-bar svg,
.sz-item-relead-bar svg,
.sz-item-work-bar svg { flex-shrink: 0; }
.sz-item-followup-bar span,
.sz-item-relead-bar span,
.sz-item-work-bar span,
.sz-item-followup-bar svg,
.sz-item-relead-bar svg,
.sz-item-work-bar svg { opacity: 0; transition: opacity .15s ease; }
.sz-item:hover .sz-item-followup-bar span,
.sz-item:hover .sz-item-relead-bar span,
.sz-item:hover .sz-item-work-bar span,
.sz-item:hover .sz-item-followup-bar svg,
.sz-item:hover .sz-item-relead-bar svg,
.sz-item:hover .sz-item-work-bar svg { opacity: 1; }
.sz-item-followup-bar { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #92400e; }
.sz-item-relead-bar   { background: linear-gradient(135deg, #a78bfa, #8b5cf6); color: #ede9fe; }
.sz-item-work-bar     { background: linear-gradient(135deg, #60a5fa, #3b82f6); color: #dbeafe; }

.sz-avatar-wrap { position: relative; flex-shrink: 0; }
.sz-avatar {
  width: 46px; height: 46px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .8rem; font-weight: 700; color: #fff; flex-shrink: 0;
}
.sz-item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: .2rem; }
.sz-item-row { display: flex; justify-content: space-between; align-items: baseline; gap: .5rem; }
.sz-item-name { font-size: .88rem; font-weight: 400; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
.sz-item-time {
  font-size: .72rem; color: var(--text-tertiary); flex-shrink: 0;
  transition: opacity .12s;
}
.sz-item:hover .sz-item-time { opacity: 0; }
.sz-item-name--unread { color: var(--text-primary); font-weight: 700; }
.sz-item-time--unread { color: var(--text-primary); font-weight: 400; }
[data-theme="light"] .sz-item-time--unread { color: var(--text-primary); }
.sz-item-preview--unread { color: #ebebeb; font-weight: 500; }
[data-theme="light"] .sz-item-preview--unread { color: #374151; font-weight: 500; }
.sz-item-unread-badge {
  flex-shrink: 0;
  min-width: 20px; height: 20px; padding: 0 5px;
  background: var(--accent);
  color: #000; font-size: .68rem; font-weight: 700; font-family: inherit;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  line-height: 1;
}
[data-theme="light"] .sz-item-unread-badge { color: #fff; }
.sz-item-sdr-badge {
  flex-shrink: 0; width: 18px; height: 18px; border-radius: 5px;
  background: rgba(34,197,94,.15); color: var(--accent);
  display: flex; align-items: center; justify-content: center;
}
.sz-item-preview {
  font-size: .78rem; color: var(--text-secondary); flex: 1; min-width: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.35;
}
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
.sz-etapa-badge--sm { font-size: .6rem; padding: .15rem .4rem; flex-shrink: 0; }
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
  display: flex; flex-direction: column;
}
.sz-messages::-webkit-scrollbar { width: 3px; }
.sz-messages::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 2px; }

.sz-msgs-loading { display: flex; justify-content: center; padding: 2rem; }
.sz-no-msgs { text-align: center; color: var(--text-tertiary); font-size: .83rem; padding: 3rem 1rem; line-height: 1.7; }
.sz-load-more-wrap { display: flex; justify-content: center; padding: .35rem 0 .5rem; }
.sz-load-more-btn {
  background: var(--bg-elevated); border: 1px solid var(--border-default);
  color: var(--text-secondary); font-size: .71rem; padding: .28rem .9rem;
  border-radius: 999px; cursor: pointer; transition: background .15s, color .15s;
  font-family: inherit; display: flex; align-items: center; gap: .4rem;
}
.sz-load-more-btn:hover:not(:disabled) { background: var(--bg-overlay); color: var(--text-primary); }
.sz-load-more-btn:disabled { opacity: .45; cursor: default; }

/* ── Time separator ── */
.sz-time-sep {
  text-align: center; font-size: .7rem; color: var(--text-tertiary);
  margin: .75rem 0 .5rem; font-weight: 500; letter-spacing: .03em;
}
.sz-unread-divider {
  display: flex; align-items: center; gap: .5rem;
  margin: .75rem 0 .5rem; color: var(--accent); font-size: .7rem; font-weight: 600;
}
.sz-unread-divider::before,
.sz-unread-divider::after { content: ''; flex: 1; height: 1px; background: var(--accent); opacity: .3; }
[data-theme="light"] .sz-unread-divider::before,
[data-theme="light"] .sz-unread-divider::after { opacity: .2; }

/* ── Bubbles ── */
.sz-bubble-wrap {
  display: flex; margin-bottom: 2px; align-items: flex-end;
}
.sz-bubble-wrap--out { justify-content: flex-end; }
.sz-bubble-wrap--in  { justify-content: flex-start; }

/* Botão de opções — canto superior direito da bolha */
.sz-bubble-menu-btn {
  position: absolute; top: 4px; right: 4px; z-index: 10;
  width: 22px; height: 22px; border-radius: 50%;
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  padding: 0; opacity: 0; transition: opacity 120ms;
}
.sz-bubble-wrap:hover .sz-bubble-menu-btn { opacity: 1; }
.sz-bubble-menu-btn--out { background: #005236; color: rgba(255,255,255,.8); }
.sz-bubble-menu-btn--out:hover { background: #006644; }
.sz-bubble-menu-btn--in  { background: var(--bg-overlay); color: var(--text-secondary); }
.sz-bubble-menu-btn--in:hover  { background: var(--bg-elevated); }
[data-theme="light"] .sz-bubble-menu-btn--out { background: #BEFFDB; color: rgba(0,61,40,.7); }
[data-theme="light"] .sz-bubble-menu-btn--out:hover { background: #a8f5cc; }
[data-theme="light"] .sz-bubble-menu-btn--in  { background: #e8e8e8; color: rgba(0,0,0,.5); }
[data-theme="light"] .sz-bubble-menu-btn--in:hover  { background: #d8d8d8; }

.sz-bubble {
  max-width: 72%; padding: .5rem .75rem .35rem;
  border-radius: 8px; position: relative; word-break: break-word;
}
.sz-bubble--out { background: #005236; color: #fff; border-bottom-right-radius: 8px; }
[data-theme="light"] .sz-bubble--out { background: #BEFFDB; color: #003d28; }
[data-theme="light"] .sz-bubble--out .sz-bubble-time { color: rgba(0,61,40,.55); }
[data-theme="light"] .sz-bubble-check--sent,
[data-theme="light"] .sz-bubble-check--delivered { color: rgba(0,61,40,.45); }
[data-theme="light"] .sz-bubble-check--read { color: #0077b6; }
.sz-bubble--in  { background: var(--bg-overlay); color: var(--text-primary); border-bottom-left-radius: 8px; }
.sz-bubble--tail-out { border-bottom-right-radius: 2px; }
.sz-bubble--tail-in  { border-bottom-left-radius: 2px; }
.sz-bubble--stacked  { border-radius: 8px; margin-bottom: 1px; }

.sz-bubble-text { font-size: .88rem; line-height: 1.45; display: block; }
.sz-bubble-spacer { display: inline-block; width: 36px; }
.sz-bubble--out .sz-bubble-spacer { width: 46px; }
.sz-bubble-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: .25rem;
  float: right; margin-top: -1.1em; margin-bottom: -.1em; margin-left: .25rem;
  position: relative;
}
.sz-bubble-time { font-size: .65rem; opacity: .6; }
.sz-bubble--out .sz-bubble-time { color: rgba(255,255,255,.6); }
.sz-bubble-check { display: flex; align-items: center; }
.sz-bubble-check--sent     { color: rgba(255,255,255,.55); }
.sz-bubble-check--delivered { color: rgba(255,255,255,.55); }
.sz-bubble-check--read     { color: #38bdf8; }

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
  padding: .6rem .75rem;
  padding-bottom: max(.6rem, env(safe-area-inset-bottom));
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
}
.sz-composer-inner { display: flex; align-items: flex-end; gap: .4rem; }

/* ── Ícones esquerda ── */
.sz-composer-left { display: flex; align-items: flex-end; gap: .1rem; flex-shrink: 0; padding-bottom: 4px; }
.sz-icon-btn {
  width: 32px; height: 32px; border: none; background: none;
  color: var(--text-secondary); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px; transition: color .12s, background .12s;
  flex-shrink: 0; padding: 0;
}
.sz-icon-btn:hover { color: var(--text-primary); background: var(--bg-elevated); }
.sz-clip-icon { transition: transform .2s cubic-bezier(.34,1.56,.64,1); }
.sz-icon-btn--open .sz-clip-icon { transform: rotate(45deg); }

/* ── Emoji picker ── */
.sz-emoji-wrap { position: relative; }
.sz-emoji-picker {
  position: absolute; bottom: calc(100% + .5rem); left: -4px;
  z-index: 200; border-radius: 12px; overflow: hidden;
  box-shadow: 0 12px 32px rgba(0,0,0,.35);
}
.sz-emoji-picker em-emoji-picker {
  --border-radius: 12px;
  --shadow: none;
}

/* ── Attach menu — lista vertical ── */
.sz-attach-wrap { position: relative; }
.sz-attach-menu {
  position: absolute; bottom: calc(100% + .5rem); left: -4px;
  background: var(--bg-elevated); border: 1px solid var(--border-default);
  border-radius: 10px; padding: .25rem;
  box-shadow: 0 8px 24px rgba(0,0,0,.25); z-index: 100;
  display: flex; flex-direction: column; gap: .1rem;
}
.sz-attach-icon-btn {
  display: flex; flex-direction: row; align-items: center; gap: .4rem;
  border: none; background: none; cursor: pointer;
  padding: .45rem .6rem; border-radius: 7px;
  transition: background .12s;
  color: var(--text-secondary); font-family: inherit;
  font-size: .78rem; font-weight: 500; white-space: nowrap;
}
.sz-attach-icon-btn:hover { background: var(--bg-overlay); color: var(--text-primary); }

/* ── Input ── */
.sz-input-wrap { flex: 1; }
.sz-input {
  width: 100%; background: var(--bg-elevated); border: 1px solid var(--border-default);
  border-radius: 10px; padding: .6rem .85rem;
  color: var(--text-primary); font-size: .875rem; font-family: inherit;
  resize: none; outline: none; line-height: 1.45;
  transition: border-color .15s, background .15s;
  display: block; overflow: hidden; max-height: 120px;
}
.sz-input:focus { border-color: var(--accent); background: var(--bg-overlay); }
.sz-input::placeholder { color: var(--text-tertiary); }

/* ── Enviar ── */
.sz-send-btn {
  width: 36px; height: 36px; min-width: 36px;
  border-radius: 50%; border: none; background: var(--accent); color: #000;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; transition: transform .15s, opacity .15s;
  touch-action: manipulation; padding-bottom: 4px;
}
[data-theme="light"] .sz-send-btn { color: #fff; }
.sz-send-btn:hover { transform: scale(1.08); }
.sz-send-btn:active { transform: scale(.93); }
.sz-send-btn:disabled { opacity: .35; cursor: default; }
.sz-send-btn:disabled:hover { transform: none; }

.sz-attach-enter-active { transition: all .15s cubic-bezier(.34,1.56,.64,1); }
.sz-attach-leave-active { transition: all .1s ease; }
.sz-attach-enter-from { opacity: 0; transform: scale(.9) translateY(6px); }
.sz-attach-leave-to { opacity: 0; transform: scale(.9) translateY(6px); }

/* ── Config Modal Glass ── */
.sz-modal-overlay {
  position: fixed; inset: 0;
  /* overlay leve — modal blurs o conteúdo real por trás */
  background: rgba(0,0,0,0.25);
  z-index: 200;
  display: flex; align-items: center; justify-content: center;
}
.sz-modal {
  display: flex;
  flex-direction: column;
  width: min(680px, 95vw);
  height: min(580px, 92vh);
  background: rgba(8,8,8,0.55);
  backdrop-filter: blur(40px) saturate(1.6);
  -webkit-backdrop-filter: blur(40px) saturate(1.6);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.05);
  overflow: hidden;
  position: relative;
}
/* Light mode */
[data-theme="light"] .sz-modal-overlay {
  background: rgba(0,0,0,0.15);
}
[data-theme="light"] .sz-modal {
  background: rgba(255,255,255,0.55);
  backdrop-filter: blur(40px) saturate(1.6);
  -webkit-backdrop-filter: blur(40px) saturate(1.6);
  border: 1px solid rgba(0,0,0,0.1);
  box-shadow: 0 24px 64px rgba(0,0,0,0.12);
}

/* ── Nova Conversa Modal ── */
.sz-nova-conversa-modal { width: min(460px, 95vw); height: min(560px, 92vh); }
.sz-modal-header-info { flex: 1; min-width: 0; }
.sz-nc-tipo-btn {
  display: flex; align-items: center; gap: 5px;
  padding: .3rem .65rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04); color: var(--text-secondary);
  font-size: .75rem; font-weight: 600; cursor: pointer;
  transition: background .12s, color .12s, border-color .12s;
  font-family: inherit;
}
.sz-nc-tipo-btn:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }
.sz-nc-tipo-btn.active { background: var(--accent-subtle); color: var(--accent); border-color: var(--accent); }
[data-theme="light"] .sz-nc-tipo-btn { border-color: rgba(0,0,0,0.12); background: rgba(0,0,0,0.03); }
[data-theme="light"] .sz-nc-tipo-btn:hover { background: rgba(0,0,0,0.06); }
.sz-nc-search-wrap {
  display: flex; align-items: center; gap: .5rem;
  padding: .6rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.08);
  color: var(--text-tertiary); background: rgba(255,255,255,0.03);
}
[data-theme="light"] .sz-nc-search-wrap { border-bottom-color: rgba(0,0,0,0.08); background: rgba(0,0,0,0.02); }
.sz-nc-search {
  flex: 1; border: none; background: transparent; outline: none;
  font-family: inherit; font-size: .875rem; color: var(--text-primary);
}
.sz-nc-search::placeholder { color: var(--text-tertiary); }
.sz-nc-selected {
  display: flex; flex-wrap: wrap; gap: 6px;
  padding: .6rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
}
[data-theme="light"] .sz-nc-selected { border-bottom-color: rgba(0,0,0,0.08); }
.sz-nc-chip {
  display: flex; align-items: center; gap: 5px;
  background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.4);
  border-radius: 20px; padding: .2rem .5rem .2rem .3rem;
  font-size: .75rem; color: var(--accent);
}
.sz-nc-chip-avatar {
  width: 18px; height: 18px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .55rem; font-weight: 700; color: #fff; flex-shrink: 0;
}
.sz-nc-chip button { background: none; border: none; cursor: pointer; color: var(--accent); display: flex; padding: 0; }
.sz-nc-list { flex: 1; overflow-y: auto; }
.sz-nc-empty { color: var(--text-tertiary); font-size: .85rem; text-align: center; padding: 2rem; }
.sz-nc-item {
  display: flex; align-items: center; gap: .75rem;
  padding: .6rem 1rem; cursor: pointer;
  transition: background .1s; border-bottom: 1px solid rgba(255,255,255,0.05);
}
[data-theme="light"] .sz-nc-item { border-bottom-color: rgba(0,0,0,0.06); }
.sz-nc-item:hover { background: rgba(255,255,255,0.06); }
[data-theme="light"] .sz-nc-item:hover { background: rgba(0,0,0,0.04); }
.sz-nc-item--selected { background: rgba(34,197,94,0.08); }
.sz-nc-avatar {
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: .75rem; font-weight: 700; color: #fff;
}
.sz-nc-info { flex: 1; min-width: 0; }
.sz-nc-name { display: block; font-size: .875rem; color: var(--text-primary); font-weight: 500; }
.sz-nc-phone { display: block; font-size: .75rem; color: var(--text-secondary); }
.sz-nc-check {
  width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid rgba(255,255,255,0.15);
  display: flex; align-items: center; justify-content: center;
  transition: background .1s, border-color .1s;
}
[data-theme="light"] .sz-nc-check { border-color: rgba(0,0,0,0.2); }
.sz-nc-check--active { background: var(--accent); border-color: var(--accent); color: #000; }
.sz-nc-footer {
  display: flex; gap: .5rem; padding: .75rem 1rem;
  border-top: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
}
[data-theme="light"] .sz-nc-footer { border-top-color: rgba(0,0,0,0.08); }
.sz-nc-grupo-nome {
  flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px; padding: .4rem .75rem; color: var(--text-primary);
  font-family: inherit; font-size: .875rem; outline: none;
}
[data-theme="light"] .sz-nc-grupo-nome { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.12); }
.sz-nc-grupo-nome:focus { border-color: var(--accent); }
[data-theme="light"] .sz-modal-history-row {
  border-bottom-color: rgba(0,0,0,0.06);
}
/* Modal header */
.sz-modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  flex-shrink: 0;
}
.sz-modal-lead-avatar {
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: .78rem; font-weight: 700; color: #fff;
}
.sz-modal-lead-info { flex: 1; min-width: 0; }
.sz-modal-lead-name {
  font-size: .95rem; font-weight: 600; color: var(--text-primary);
  margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sz-modal-lead-phone {
  font-size: .76rem; color: var(--text-tertiary); margin: 2px 0 0;
}
.sz-modal-close {
  margin-left: auto; flex-shrink: 0;
  background: none; border: none; cursor: pointer;
  color: var(--text-tertiary); padding: 6px; border-radius: 6px;
  transition: color 0.15s, background 0.15s; display: flex;
}
.sz-modal-close:hover { color: var(--text-primary); background: rgba(255,255,255,.06); }
/* Nav horizontal */
.sz-modal-nav {
  display: flex; flex-direction: row; flex-shrink: 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  overflow-x: auto; gap: 0;
}
.sz-modal-nav::-webkit-scrollbar { display: none; }
.sz-modal-nav-item {
  display: flex; align-items: center; gap: 6px;
  padding: 0 16px; height: 44px; flex-shrink: 0;
  background: none; border: none; cursor: pointer;
  color: var(--text-tertiary); font-size: .8rem; font-family: inherit;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, background 0.15s;
  white-space: nowrap;
}
.sz-modal-nav-item:hover { color: var(--text-secondary); background: rgba(255,255,255,0.03); }
.sz-modal-nav-item--active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}
.sz-modal-body {
  flex: 1; overflow-y: auto; padding: 20px 24px;
}
.sz-modal-body::-webkit-scrollbar { width: 4px; }
.sz-modal-body::-webkit-scrollbar-track { background: transparent; }
.sz-modal-body::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 2px; }
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
  padding: 6px 0; border-bottom: 1px solid var(--border-subtle);
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
  .sz-modal { width: 100vw; height: 100vh; border-radius: 0; border: none; }
  .sz-modal-nav-item { padding: 0 12px; font-size: .75rem; }
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
}
@media (min-width: 768px) {
  .sz-back-btn { display: none; }
}
</style>
