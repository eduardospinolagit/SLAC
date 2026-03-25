<template>
  <div class="page-layout">

    <div class="page-header">
      <div>
        <h1 class="page-title">CRM <span class="page-count">{{ leads.stats.total }} leads</span></h1>
        <p class="page-subtitle">Gerencie seu pipeline de vendas</p>
      </div>
      <div class="page-actions">
        <button
          class="btn btn-sm"
          :class="notifAtiva ? 'btn-notif-on' : 'btn-secondary'"
          :disabled="notifAtiva"
          @click="pedirNotificacao"
          :title="notifAtiva ? 'Notificações ativadas' : 'Ativar alertas de follow-up'"
        >
          <svg v-if="!notifAtiva" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {{ notifAtiva ? 'Alertas ativos' : 'Alertas' }}
        </button>
        <button class="btn btn-primary" @click="openNew()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo lead
        </button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid kpi-grid--5">
      <div class="kpi-card"><span class="kpi-label">Total</span><span class="kpi-value" style="color:var(--status-info)">{{ leads.stats.total }}</span><span class="kpi-sub">leads</span></div>
      <div class="kpi-card"><span class="kpi-label">Negociando</span><span class="kpi-value kpi-value--warning">{{ leads.stats.negociando }}</span><span class="kpi-sub">demo + negoc.</span></div>
      <div class="kpi-card"><span class="kpi-label">Fechados</span><span class="kpi-value kpi-value--accent">{{ leads.stats.fechados }}</span><span class="kpi-sub">convertidos</span></div>
      <div class="kpi-card"><span class="kpi-label">Follow-up hoje</span><span class="kpi-value kpi-value--danger">{{ leads.stats.fuHoje }}</span><span class="kpi-sub">pendentes</span></div>
      <div class="kpi-card"><span class="kpi-label">Pipeline</span><span class="kpi-value" style="color:var(--status-info)">{{ fmt(leads.stats.pipe) }}</span><span class="kpi-sub">potencial</span></div>
    </div>

    <!-- Sel bar -->
    <Transition name="sel-bar">
      <div v-if="selected.size > 0" class="sel-bar">
        <span class="sel-count">{{ selected.size }} selecionado{{ selected.size !== 1 ? 's' : '' }}</span>
        <select v-model="selEtapa" class="form-select" style="width:auto;font-size:.82rem;padding:.35rem .7rem">
          <option value="">Mover para...</option>
          <option v-for="e in ETAPAS" :key="e.id" :value="e.id">{{ e.label }}</option>
        </select>
        <button class="btn btn-primary btn-sm" @click="moverSelecionados">Mover</button>
        <button class="btn btn-danger btn-sm" @click="excluirSelecionados">Excluir</button>
        <button class="btn btn-ghost btn-sm" @click="selected = new Set()">Limpar</button>
      </div>
    </Transition>

    <!-- Toolbar: tabs + busca -->
    <div class="toolbar">
      <div class="tabs">
        <button class="tab" :class="{ active: tab === 'kanban' }" @click="changeTab('kanban')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Kanban
        </button>
        <button class="tab" :class="{ active: tab === 'tabela' }" @click="changeTab('tabela')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          Tabela
        </button>
        <button class="tab" :class="{ active: tab === 'followup' }" @click="changeTab('followup')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Follow-up
          <span v-if="listaFollowUp.length" class="tab-badge tab-badge--orange">{{ listaFollowUp.length }}</span>
        </button>
        <button class="tab" :class="{ active: tab === 'relead' }" @click="changeTab('relead')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Relead
          <span v-if="listaRelead.length" class="tab-badge tab-badge--purple">{{ listaRelead.length }}</span>
        </button>
      </div>
      <div class="kb-search-box">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="search" class="kb-search-input" placeholder="Buscar lead..." />
        <button v-if="search" class="kb-search-clear" @click="search = ''">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>

    <!-- KANBAN -->
    <div v-if="tab === 'kanban'" class="kanban-board">
      <div v-for="e in ETAPAS" :key="e.id" class="kb-col"
        :class="{ 'drop-over': dragOver === e.id }"
        @dragover.prevent="dragOver = e.id"
        @dragleave="dragOver = null"
        @drop.prevent="onDrop(e.id)">
        <div class="kb-head">
          <div class="kb-title">
            <span class="kb-dot" :style="{ background: e.color }"></span>
            <span :style="{ color: e.color }">{{ e.label }}</span>
          </div>
          <span class="kb-count">{{ byEtapaFiltrado(e.id).length }}</span>
        </div>
        <div class="kb-cards">
          <div v-for="l in byEtapaFiltrado(e.id)" :key="l.id"
            class="kb-card" draggable="true"
            @dragstart="onDragStart(l)" @dragend="dragOver = null"
            @click="openCardModal(l)">
            <div class="kb-drag-handle">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
            </div>
            <div class="kb-name">{{ l.nome }}</div>
            <div v-if="l.negocio" class="kb-negocio">{{ l.negocio }}</div>
            <div v-if="l.site_atual" class="kb-servico">{{ l.site_atual }}</div>
            <div v-if="l.notas" class="kb-notas">{{ l.notas.slice(0,80) }}{{ l.notas.length > 80 ? '...' : '' }}</div>
            <div class="kb-footer">
              <span class="kb-pri" :class="`pri-${l.prioridade}`">{{ l.prioridade }}</span>
            </div>
            <div v-if="work.leadsComWork.has(l.id)" class="kb-work-bar">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
              Em execução
            </div>
            <div v-if="l.proximo_followup" class="kb-fu-bar">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {{ fmtDataHora(l.proximo_followup) }}
            </div>
            <div v-if="l.relead_data" class="kb-relead-bar">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              {{ fmtDataHora(l.relead_data) }}
            </div>
          </div>
          <button class="kb-add" @click="openNewEtapa(e.id)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Adicionar
          </button>
        </div>
      </div>
    </div>

    <!-- TABELA -->
    <div v-if="tab === 'tabela'" class="tabela-wrap">
      <div class="tabela-filters">
        <select v-model="filterEtapa" class="form-select" style="width:auto;font-size:.82rem">
          <option value="">Todas etapas</option>
          <option v-for="e in ETAPAS" :key="e.id" :value="e.id">{{ e.label }}</option>
        </select>
        <select v-model="filterPri" class="form-select" style="width:auto;font-size:.82rem">
          <option value="">Todas prioridades</option>
          <option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
        </select>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style="width:36px"><input type="checkbox" class="cb" @change="toggleAll($event.target.checked)" /></th>
              <th class="th-sort" @click="toggleSort('nome')">Nome <span class="sort-icon">{{ sortKey==='nome'?(sortDir==='asc'?'↑':'↓'):'↕' }}</span></th>
              <th class="th-sort" @click="toggleSort('negocio')">Negócio <span class="sort-icon">{{ sortKey==='negocio'?(sortDir==='asc'?'↑':'↓'):'↕' }}</span></th>
              <th>Telefone</th>
              <th class="th-sort" @click="toggleSort('etapa')">Etapa <span class="sort-icon">{{ sortKey==='etapa'?(sortDir==='asc'?'↑':'↓'):'↕' }}</span></th>
              <th class="th-sort" @click="toggleSort('prioridade')">Prioridade <span class="sort-icon">{{ sortKey==='prioridade'?(sortDir==='asc'?'↑':'↓'):'↕' }}</span></th>
              <th class="th-sort" @click="toggleSort('proximo_followup')">Follow-up <span class="sort-icon">{{ sortKey==='proximo_followup'?(sortDir==='asc'?'↑':'↓'):'↕' }}</span></th>
              <th class="th-sort" @click="toggleSort('valor_estimado')" style="text-align:right">Valor <span class="sort-icon">{{ sortKey==='valor_estimado'?(sortDir==='asc'?'↑':'↓'):'↕' }}</span></th>
              <th style="width:36px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!listaFiltrada.length"><td colspan="9" style="text-align:center;color:var(--text-tertiary);padding:2rem;font-size:.875rem">Nenhum lead encontrado</td></tr>
            <tr v-for="l in listaFiltrada" :key="l.id" :class="{ 'row-sel': selected.has(l.id) }">
              <td @click.stop><input type="checkbox" class="cb" :checked="selected.has(l.id)" @change="toggleSel(l.id, $event.target.checked)" /></td>
              <!-- Células clicáveis copiam o valor -->
              <td class="td-copy" @click="copyText(l.nome)" title="Clique para copiar">{{ l.nome }}</td>
              <td class="td-copy text-muted" @click="copyText(l.negocio)" title="Clique para copiar">{{ l.negocio || '—' }}</td>
              <td><a :href="'https://wa.me/55'+l.telefone.replace(/\D/g,'')" target="_blank" class="wa-link" @click.stop>{{ l.telefone }}</a></td>
              <td><span class="etapa-tag" :style="{ background: etapaColor(l.etapa)+'18', color: etapaColor(l.etapa) }">{{ etapaLabel(l.etapa) }}</span></td>
              <td><span class="kb-pri" :class="`pri-${l.prioridade}`">{{ l.prioridade }}</span></td>
              <td class="td-copy text-muted text-sm" @click="copyText(l.proximo_followup ? fmtDataHora(l.proximo_followup) : '')" title="Clique para copiar">{{ l.proximo_followup ? fmtDataHora(l.proximo_followup) : '—' }}</td>
              <td class="td-copy" style="text-align:right;font-weight:600;color:var(--accent)" @click="copyText(l.valor_estimado ? fmt(l.valor_estimado) : '')" title="Clique para copiar">{{ l.valor_estimado ? fmt(l.valor_estimado) : '—' }}</td>
              <td @click.stop><button class="btn btn-ghost btn-icon btn-sm" @click="openLead(l.id)" title="Editar"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- FOLLOW-UP TAB -->
    <div v-if="tab === 'followup'" class="fu-wrap">
      <div v-if="!listaFollowUp.length" class="fu-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <p>Nenhum follow-up agendado</p>
        <span>Adicione datas de follow-up nos leads para vê-los aqui</span>
      </div>
      <div v-else class="fu-list">
        <div v-for="l in listaFollowUp" :key="l.id"
          class="fu-card" :class="{ 'fu-vencido': isFuVencido(l), 'fu-hoje': isFuHoje(l) }"
          @click="openLead(l.id)">
          <div class="fu-card-left">
            <div class="fu-datetime">
              <span class="fu-date">{{ fmtFuDate(l.proximo_followup) }}</span>
              <span class="fu-time">{{ fmtFuTime(l.proximo_followup) }}</span>
            </div>
            <div class="fu-status-dot" :class="{ 'dot-vencido': isFuVencido(l), 'dot-hoje': isFuHoje(l), 'dot-futuro': !isFuVencido(l) && !isFuHoje(l) }"></div>
          </div>
          <div class="fu-card-body">
            <div class="fu-nome">{{ l.nome }}</div>
            <div class="fu-neg">{{ l.negocio || l.categoria || '—' }}</div>
            <div class="fu-meta">
              <span class="etapa-tag" :style="{ background: etapaColor(l.etapa)+'18', color: etapaColor(l.etapa) }">{{ etapaLabel(l.etapa) }}</span>
              <span v-if="l.notas" class="fu-nota">{{ l.notas.slice(0, 60) }}{{ l.notas.length > 60 ? '...' : '' }}</span>
            </div>
          </div>
          <div class="fu-card-right">
            <button class="btn btn-primary btn-sm fu-concluido" @click.stop="concluirFollowUp(l)" title="Marcar follow-up como concluído">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Concluído
            </button>
            <a :href="'https://wa.me/55'+l.telefone.replace(/\D/g,'')" target="_blank" class="btn btn-secondary btn-sm btn-icon" @click.stop title="WhatsApp">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
            <button class="btn btn-ghost btn-sm btn-icon" @click.stop="openLead(l.id)" title="Editar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- RELEAD TAB -->
    <div v-if="tab === 'relead'" class="fu-wrap">
      <div v-if="!listaRelead.length" class="fu-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        <p>Nenhum relead agendado</p>
        <span>Leads com interesse que precisam de uma nova abordagem</span>
      </div>
      <div v-else class="fu-list">
        <div v-for="l in listaRelead" :key="l.id"
          class="fu-card fu-relead"
          @click="openLead(l.id)">
          <div class="fu-card-left">
            <div class="fu-datetime">
              <span class="fu-date">{{ fmtFuDate(l.relead_data) }}</span>
              <span class="fu-time">{{ fmtFuTime(l.relead_data) }}</span>
            </div>
            <div class="fu-status-dot dot-purple"></div>
          </div>
          <div class="fu-card-body">
            <div class="fu-nome">{{ l.nome }}</div>
            <div class="fu-neg">{{ l.negocio || l.categoria || '—' }}</div>
            <div class="fu-meta">
              <span class="etapa-tag" :style="{ background: etapaColor(l.etapa)+'18', color: etapaColor(l.etapa) }">{{ etapaLabel(l.etapa) }}</span>
              <span v-if="l.notas" class="fu-nota">{{ l.notas.slice(0, 60) }}{{ l.notas.length > 60 ? '...' : '' }}</span>
            </div>
          </div>
          <div class="fu-card-right">
            <button class="btn btn-purple btn-sm fu-concluido" @click.stop="concluirRelead(l)" title="Marcar relead como concluído">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Concluído
            </button>
            <a :href="'https://wa.me/55'+l.telefone.replace(/\D/g,'')" target="_blank" class="btn btn-secondary btn-sm btn-icon" @click.stop title="WhatsApp">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
            <button class="btn btn-ghost btn-sm btn-icon" @click.stop="openLead(l.id)" title="Editar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- CARD MODAL (expandido do kanban) -->
  <Transition name="modal-fade">
    <div v-if="cardModal" class="modal-backdrop" @click.self="cardModal = null">
      <div class="card-modal">
        <div class="card-modal-header">
          <div>
            <h3 class="card-modal-name">{{ cardModal.nome }}</h3>
            <p class="card-modal-neg">{{ cardModal.negocio || cardModal.categoria || '—' }}</p>
          </div>
          <div class="card-modal-actions">
            <button class="btn btn-ghost btn-icon" @click="cardModal = null">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div class="card-modal-body">
          <div class="card-modal-grid">
            <div class="cm-item"><span class="cm-label">Telefone</span>
              <a :href="'https://wa.me/55'+cardModal.telefone.replace(/\D/g,'')" target="_blank" class="cm-val wa-link">{{ cardModal.telefone }}</a>
            </div>
            <div class="cm-item"><span class="cm-label">Etapa</span>
              <span class="cm-val"><span class="etapa-tag" :style="{ background: etapaColor(cardModal.etapa)+'18', color: etapaColor(cardModal.etapa) }">{{ etapaLabel(cardModal.etapa) }}</span></span>
            </div>
            <div class="cm-item"><span class="cm-label">Prioridade</span>
              <span class="cm-val kb-pri" :class="`pri-${cardModal.prioridade}`">{{ cardModal.prioridade }}</span>
            </div>
            <div v-if="cardModal.site_atual" class="cm-item"><span class="cm-label">Serviço</span><span class="cm-val">{{ cardModal.site_atual }}</span></div>
            <div v-if="cardModal.cidade" class="cm-item"><span class="cm-label">Cidade</span><span class="cm-val">{{ cardModal.cidade }}</span></div>
            <div v-if="cardModal.instagram" class="cm-item"><span class="cm-label">Instagram</span><span class="cm-val">{{ cardModal.instagram }}</span></div>
            <div v-if="cardModal.valor_estimado" class="cm-item"><span class="cm-label">Valor estimado</span><span class="cm-val" style="color:var(--accent);font-weight:700">{{ fmt(cardModal.valor_estimado) }}</span></div>
            <div v-if="cardModal.proximo_followup" class="cm-item"><span class="cm-label">Follow-up</span><span class="cm-val" style="color:var(--status-warning)">{{ fmtDataHora(cardModal.proximo_followup) }}</span></div>
          </div>
          <div class="cm-notas">
            <span class="cm-label">Notas</span>
            <textarea
              v-model="cardNotasEdit"
              class="form-textarea cm-notas-textarea"
              placeholder="Adicionar nota..."
              rows="3"
              @blur="salvarNotas"
            ></textarea>
          </div>
        </div>
        <div class="card-modal-footer">
          <a :href="'https://wa.me/55'+cardModal.telefone.replace(/\D/g,'')+'?text=Oi '+cardModal.nome+'!'" target="_blank" class="btn btn-secondary btn-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>
          <!-- Follow-up picker -->
          <div class="fu-picker-wrap">
            <button class="btn btn-warning btn-sm fu-picker-toggle" @click.stop="fuPickerOpen = !fuPickerOpen">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Follow-up
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :style="{ transform: fuPickerOpen ? 'rotate(180deg)' : '', transition: 'transform 150ms' }"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <Transition name="fu-opts">
              <div v-if="fuPickerOpen" class="fu-opts">
                <button v-for="opt in fuOpts" :key="opt.h" class="fu-opt" @click.stop="agendarFollowUp(cardModal, opt.h); cardModal = null; fuPickerOpen = false">
                  {{ opt.label }}
                </button>
              </div>
            </Transition>
          </div>
          <!-- Relead -->
          <button class="btn btn-purple btn-sm" @click="openReleadModal(cardModal); cardModal = null" title="Marcar como Relead">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Relead
          </button>
          <!-- Editar -->
          <button class="btn btn-ghost btn-icon btn-sm" @click="openLead(cardModal.id); cardModal = null" title="Editar lead">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- MODAL RELEAD: escolher data -->
  <Transition name="modal-fade">
    <div v-if="releadModal" class="modal-backdrop" @click.self="releadModal = null">
      <div class="relead-modal">
        <div class="card-modal-header">
          <div>
            <h3 class="card-modal-name">Agendar Relead</h3>
            <p class="card-modal-neg">{{ releadModal.nome }} — {{ releadModal.negocio || releadModal.categoria || '' }}</p>
          </div>
          <button class="btn btn-ghost btn-icon" @click="releadModal = null">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="card-modal-body">
          <p style="font-size:.8125rem;color:var(--text-tertiary);margin:0 0 1rem">
            Escolha quando abordar este lead novamente. Ele aparecerá na aba Relead no dia escolhido.
          </p>
          <div class="fu-datetime-input">
            <input v-model="releadDate" class="form-input" type="date" style="flex:1.4" />
            <input v-model="releadTime" class="form-input" type="time" style="flex:1" />
          </div>
          <!-- Atalhos rápidos -->
          <div class="relead-shortcuts">
            <button class="btn btn-ghost btn-sm" @click="setReleadShortcut(7)">1 semana</button>
            <button class="btn btn-ghost btn-sm" @click="setReleadShortcut(14)">2 semanas</button>
            <button class="btn btn-ghost btn-sm" @click="setReleadShortcut(30)">1 mês</button>
            <button class="btn btn-ghost btn-sm" @click="setReleadShortcut(90)">3 meses</button>
          </div>
        </div>
        <div class="card-modal-footer">
          <button class="btn btn-secondary" @click="releadModal = null">Cancelar</button>
          <button class="btn btn-purple" style="flex:1;justify-content:center" @click="confirmarRelead">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Agendar Relead
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- TOAST CÓPIA -->
  <Transition name="toast-anim">
    <div v-if="copyToast" class="copy-toast">✓ Copiado</div>
  </Transition>

  <!-- DRAWER BACKDROP -->
  <div v-show="drawerOpen" class="drawer-bg" @click="closeDrawer"></div>

  <!-- DRAWER -->
  <div v-show="drawerOpen" class="drawer">
    <div class="drawer-header">
      <h3 class="drawer-title">{{ drawerTitle }}</h3>
      <button class="btn btn-ghost btn-icon" @click="closeDrawer">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <!-- Abas do drawer -->
    <div class="drawer-tabs">
      <button class="drawer-tab" :class="{ active: drawerTab === 'dados' }" @click="drawerTab = 'dados'">Dados</button>
      <button class="drawer-tab" :class="{ active: drawerTab === 'whatsapp' }" @click="drawerTab = 'whatsapp'">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        WhatsApp
      </button>
      <button class="drawer-tab" :class="{ active: drawerTab === 'historico' }" @click="drawerTab = 'historico'">Histórico</button>
    </div>

    <div class="drawer-body">
      <!-- ── ABA DADOS ── -->
      <div v-show="drawerTab === 'dados'">
      <div class="drawer-section">
        <p class="drawer-section-title">Informações</p>
        <div class="form-group"><label class="form-label">Nome *</label><input v-model="form.nome" class="form-input" placeholder="Nome do responsável" /></div>
        <div class="form-group"><label class="form-label">Negócio</label><input v-model="form.negocio" class="form-input" placeholder="Ex: Salão da Maria" /></div>
        <div class="form-group"><label class="form-label">Telefone *</label><input v-model="form.telefone" class="form-input" placeholder="(47) 99999-9999" /></div>
        <div class="form-group">
          <label class="form-label">Categoria</label>
          <select v-model="form.categoria" class="form-select">
            <option value="">Selecionar...</option>
            <option>Academia</option><option>Salão de Beleza</option><option>Clínica</option>
            <option>Restaurante</option><option>Pet Shop</option><option>Oficina Mecânica</option>
            <option>Confecção</option><option>Advocacia</option><option>Personal Trainer</option><option>Outro</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Cidade</label><input v-model="form.cidade" class="form-input" placeholder="Ex: Brusque/SC" /></div>
        <div class="form-group"><label class="form-label">Instagram</label><input v-model="form.instagram" class="form-input" placeholder="@perfil" /></div>
      </div>
      <div class="drawer-section">
        <p class="drawer-section-title">Funil</p>
        <div class="form-group">
          <label class="form-label">Serviço de interesse</label>
          <select v-model="form.site_atual" class="form-select">
            <option value="">Selecionar...</option>
            <option>Site Essencial</option><option>Site Profissional</option><option>Site Completo</option>
            <option>Google Meu Negócio</option><option>Tráfego Pago</option>
            <option>Automação WhatsApp</option><option>Manutenção</option><option>Pacote Completo</option><option>Outro</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Etapa</label>
          <select v-model="form.etapa" class="form-select">
            <option v-for="e in ETAPAS" :key="e.id" :value="e.id">{{ e.label }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Prioridade</label>
          <select v-model="form.prioridade" class="form-select">
            <option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Valor estimado (R$)</label><input v-model.number="form.valor_estimado" class="form-input" type="number" placeholder="797" min="0" /></div>

        <!-- Follow-up: data + hora -->
        <div class="form-group">
          <label class="form-label">
            Próximo follow-up
            <span v-if="form.proximo_followup" class="fu-badge">✓ agendado</span>
          </label>
          <div class="fu-datetime-input">
            <input v-model="fuDate" class="form-input" type="date" @change="onFuDateChange" style="flex:1.4" />
            <input v-model="fuTime" class="form-input" type="time" @change="onFuTimeChange" style="flex:1" />
            <button v-if="form.proximo_followup" class="btn btn-ghost btn-icon btn-sm" @click="clearFollowUp" title="Remover follow-up">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <p v-if="form.proximo_followup" class="fu-hint">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            Notificação agendada para {{ fmtDataHora(form.proximo_followup) }}
          </p>
        </div>
      </div>
      <div class="drawer-section">
        <p class="drawer-section-title">Notas</p>
        <div class="form-group"><textarea v-model="form.notas" class="form-textarea" placeholder="Observações, objeções, contexto..."></textarea></div>
      </div>
      <div class="drawer-section">
        <p class="drawer-section-title">Script rápido</p>
        <button class="btn btn-secondary" style="width:100%;justify-content:center;font-size:.82rem" @click="gerarScript">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Gerar script para esta etapa
        </button>
        <div v-if="script" class="script-box">{{ script }}</div>
      </div>
      <div v-if="histEtapas.length" class="drawer-section">
        <p class="drawer-section-title">Histórico de etapas</p>
        <div v-for="h in histEtapas" :key="h.ts" class="hist-row">
          <span style="color:var(--accent)">{{ h.de }}</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          <span>{{ h.para }}</span>
          <span class="hist-time">{{ fmtDataHora(h.ts) }}</span>
        </div>
      </div>
      </div><!-- /aba dados -->

      <!-- ── ABA WHATSAPP ── -->
      <div v-show="drawerTab === 'whatsapp'" class="wa-tab">
        <div class="wa-msgs">
          <div v-if="!waMensagens.length" class="wa-empty">Nenhuma mensagem ainda. Envie a primeira!</div>
          <div v-for="m in waMensagens" :key="m.id" class="wa-msg" :class="m.direcao === 'enviado' ? 'wa-out' : 'wa-in'">
            <div class="wa-bubble">{{ m.mensagem }}</div>
            <div class="wa-time">{{ fmtDataHora(m.data) }}</div>
          </div>
        </div>
        <div class="wa-composer">
          <div class="wa-toolbar">
            <select v-model="waTemplateId" class="form-select wa-select" @change="waAplicarTemplate" :disabled="waGerandoScript">
              <option value="">📋 Template...</option>
              <option v-for="t in waTemplatesFiltrados" :key="t.id" :value="t.id">{{ t.nome }}</option>
            </select>
            <button class="btn btn-ghost btn-sm wa-ia-btn" @click="waGerarComIA" :disabled="waGerandoScript || waEnviando">
              <span v-if="waGerandoScript">Gerando...</span>
              <span v-else>✨ Gerar com IA</span>
            </button>
          </div>
          <textarea v-model="waMensagem" class="form-textarea wa-textarea"
            :placeholder="waGerandoScript ? 'Analisando perfil do negócio...' : 'Digite a mensagem...'"
            :disabled="waGerandoScript" rows="4" />
          <button class="btn btn-primary wa-send-btn" @click="waEnviar"
            :disabled="!waMensagem.trim() || waEnviando || waGerandoScript">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            {{ waEnviando ? 'Enviando...' : 'Enviar no WhatsApp' }}
          </button>
        </div>
      </div>

      <!-- ── ABA HISTÓRICO ── -->
      <div v-show="drawerTab === 'historico'">
      <div v-if="currentLeadId" class="drawer-section">
        <p class="drawer-section-title">Conversas</p>
        <div class="conv-list">
          <div v-if="!leads.conversas.length" class="conv-empty">Nenhuma conversa registrada</div>
          <div v-for="c in leads.conversas" :key="c.id" class="conv-item">
            <div class="conv-meta">
              <span class="conv-canal">{{ c.canal }}</span>
              <span :class="c.direcao === 'recebido' ? 'dir-in' : 'dir-out'">{{ c.direcao === 'recebido' ? '← Recebido' : '→ Enviado' }}</span>
              <span class="conv-time">{{ fmtDataHora(c.data) }}</span>
            </div>
            <div class="conv-msg">{{ c.mensagem }}</div>
          </div>
        </div>
        <div class="conv-composer">
          <div class="conv-selects">
            <div class="conv-select-wrap">
              <span class="conv-select-label">Canal</span>
              <select v-model="convCanal" class="form-select" style="font-size:.8rem;padding:.35rem .6rem">
                <option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option>
                <option value="email">Email</option><option value="ligacao">Ligação</option>
              </select>
            </div>
            <div class="conv-select-wrap">
              <span class="conv-select-label">Direção</span>
              <select v-model="convDir" class="form-select" style="font-size:.8rem;padding:.35rem .6rem">
                <option value="enviado">Enviado</option><option value="recebido">Recebido</option>
              </select>
            </div>
          </div>
          <textarea v-model="convMsg" class="form-textarea" style="min-height:60px;font-size:.85rem;resize:none" placeholder="Registrar mensagem..." @keydown.ctrl.enter="addConversa"></textarea>
          <button class="btn btn-primary btn-sm" style="width:100%;justify-content:center" @click="addConversa">+ Registrar</button>
        </div>
      </div>
      </div><!-- /aba historico -->

    </div>
    <div class="drawer-footer">
      <a :href="'https://wa.me/55'+form.telefone.replace(/\D/g,'')+'?text=Oi '+form.nome+'!'" target="_blank" class="btn btn-secondary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        WhatsApp
      </a>
      <button class="btn btn-primary" style="flex:1;justify-content:center" @click="salvar">Salvar</button>
      <button v-if="currentLeadId" class="btn btn-danger btn-icon" @click="deletar" title="Excluir">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </div>
  </div>

  <FecharNegocioModal v-model="fecharOpen" :lead="fecharLead" @fechado="onNegocioFechado" />
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import FecharNegocioModal from '@/components/crm/FecharNegocioModal.vue'
import { useLeadsStore, ETAPAS } from '@/stores/leads'
import { useWorkStore } from '@/stores/work'
import { useAuthStore } from '@/stores/auth'
import { useFinStore } from '@/stores/fin'
import { useWaStore } from '@/stores/wa'
import { useSaving } from '@/composables/useSaving'
import { usePushNotifications } from '@/composables/usePushNotifications'

const wa = useWaStore()

const leads = useLeadsStore()
const work  = useWorkStore()
const auth  = useAuthStore()
const fin   = useFinStore()
const { run, toast } = useSaving()
const fmt = fin.fmt

// ── WhatsApp ──
const drawerTab        = ref('dados')
const waMensagem       = ref('')
const waTemplateId     = ref('')
const waGerandoScript  = ref(false)
const waEnviando       = ref(false)

const waMensagens = computed(() =>
  leads.conversas
    .filter(c => c.canal === 'whatsapp')
    .slice().sort((a, b) => new Date(a.data) - new Date(b.data))
)

const waTemplatesFiltrados = computed(() => {
  const etapaAtual = form.value?.etapa
  return wa.templates.filter(t => !t.etapa || t.etapa === etapaAtual)
})

function waAplicarTemplate() {
  if (!waTemplateId.value) return
  const t = wa.templates.find(x => x.id === waTemplateId.value)
  if (!t) return
  waMensagem.value = t.corpo
    .replace(/\{\{nome\}\}/g, form.value.nome || '')
    .replace(/\{\{negocio\}\}/g, form.value.negocio || '')
    .replace(/\{\{cidade\}\}/g, form.value.cidade || '')
}

async function waGerarComIA() {
  waGerandoScript.value = true
  try {
    const script = await wa.gerarScript(
      auth.user.id,
      form.value.instagram,
      form.value.negocio || form.value.nome,
      form.value.cidade
    )
    waMensagem.value = script
  } catch {
    toast('Erro ao gerar script. Verifique as configurações.', 'err')
  } finally {
    waGerandoScript.value = false
  }
}

async function waEnviar() {
  if (!form.value.telefone) { toast('Lead sem telefone cadastrado', 'err'); return }
  if (!waMensagem.value.trim()) return
  waEnviando.value = true
  try {
    await wa.enviarMensagem(currentLeadId.value, auth.user.id, form.value.telefone, waMensagem.value.trim())
    waMensagem.value = ''
    waTemplateId.value = ''
    toast('Mensagem enviada!', 'ok')
  } catch {
    toast('Erro ao enviar. Verifique a integração Z-API.', 'err')
  } finally {
    waEnviando.value = false
  }
}

const tab         = ref('kanban')
function changeTab(t) {
  const y = window.scrollY
  tab.value = t
  nextTick(() => {
    window.scrollTo(0, y)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.scrollTo(0, y))
    })
  })
}
const search      = ref('')
const filterEtapa = ref('')
const filterPri   = ref('')
const selected    = ref(new Set())
const selEtapa    = ref('')
const sortKey     = ref('')
const sortDir     = ref('asc')

// Card modal (kanban expandido)
const cardModal = ref(null)
function openCardModal(lead) { cardModal.value = lead }

// Copy toast
const copyToast = ref(false)
let copyToastTimer = null
function copyText(text) {
  if (!text || text === '—') return
  navigator.clipboard?.writeText(text).then(() => {
    clearTimeout(copyToastTimer)
    copyToast.value = true
    copyToastTimer = setTimeout(() => { copyToast.value = false }, 1500)
  })
}

// Modal fechar negócio
const fecharOpen = ref(false)
const fecharLead = ref(null)

// Drag-and-drop
const dragItem = ref(null)
const dragOver = ref(null)
function onDragStart(lead) { dragItem.value = lead }
async function onDrop(etapaDestino) {
  dragOver.value = null
  if (!dragItem.value || dragItem.value.etapa === etapaDestino) return
  const lead = dragItem.value; dragItem.value = null
  const vaiFicarFechado = etapaDestino === 'fechado' && lead.etapa !== 'fechado'
  const payload = { ...lead, etapa: etapaDestino, updated_at: new Date().toISOString() }
  await run(() => leads.upsert(payload), `Movido para ${etapaLabel(etapaDestino)} ✓`)
  if (vaiFicarFechado) { fecharLead.value = leads.getById(lead.id) || payload; fecharOpen.value = true }
}
function onNegocioFechado() { fecharOpen.value = false; fecharLead.value = null }

// Drawer
const drawerOpen    = ref(false)
const drawerTitle   = ref('Novo Lead')
const currentLeadId = ref(null)
const script        = ref('')
const histEtapas    = ref([])
const convCanal     = ref('whatsapp')
const convDir       = ref('enviado')
const convMsg       = ref('')

// Follow-up campos separados data + hora
const fuDate = ref('')
const fuTime = ref('')

const form = ref({
  nome:'', negocio:'', telefone:'', categoria:'', cidade:'', instagram:'',
  site_atual:'', etapa:'contato', prioridade:'media', valor_estimado:'',
  proximo_followup:'', notas:''
})

function onFuDateChange() {
  if (!fuDate.value) { form.value.proximo_followup = ''; return }
  const time = fuTime.value || '09:00'
  form.value.proximo_followup = new Date(`${fuDate.value}T${time}:00`).toISOString()
  fuTime.value = time
  agendarNotificacao()
}
function onFuTimeChange() {
  if (!fuDate.value) return
  form.value.proximo_followup = new Date(`${fuDate.value}T${fuTime.value}:00`).toISOString()
  agendarNotificacao()
}
function clearFollowUp() {
  form.value.proximo_followup = ''; fuDate.value = ''; fuTime.value = ''
}
function syncFuFields() {
  if (form.value.proximo_followup) {
    const d = new Date(form.value.proximo_followup)
    const pad = n => String(n).padStart(2, '0')
    fuDate.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
    fuTime.value = d.toTimeString().slice(0, 5)
  } else {
    fuDate.value = ''; fuTime.value = ''
  }
}

// Notificação Web Push agendada
async function agendarNotificacao() {
  if (!form.value.proximo_followup) return
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const ts = new Date(form.value.proximo_followup).getTime()
  const diff = ts - Date.now()
  if (diff <= 0) return
  // Armazena no localStorage para o service worker disparar
  const lembretes = JSON.parse(localStorage.getItem('slac_lembretes') || '[]')
  const id = currentLeadId.value || 'new_' + Date.now()
  const idx = lembretes.findIndex(l => l.leadId === id)
  const item = { leadId: id, nome: form.value.nome, negocio: form.value.negocio, ts }
  if (idx !== -1) lembretes[idx] = item; else lembretes.push(item)
  localStorage.setItem('slac_lembretes', JSON.stringify(lembretes))
  // Timeout local (funciona enquanto app está aberto)
  setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('SLAC · Follow-up', {
        body: `${form.value.nome}${form.value.negocio ? ' — ' + form.value.negocio : ''}`,
        icon: '/icons/web-app-manifest-192x192.png',
        tag: 'fu_' + id
      })
    }
  }, diff)
}

// Follow-up list
const listaFollowUp = computed(() => {
  return leads.leads
    .filter(l => l.proximo_followup && l.etapa !== 'perdido')
    .sort((a, b) => new Date(a.proximo_followup) - new Date(b.proximo_followup))
})
function isFuVencido(l) { return new Date(l.proximo_followup) < new Date() && !isFuHoje(l) }
function isFuHoje(l) {
  const d = new Date(l.proximo_followup)
  const h = new Date()
  return d.toDateString() === h.toDateString()
}
function fmtFuDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' })
}
function fmtFuTime(d) {
  if (!d) return ''
  const dt = new Date(d)
  const h = dt.getHours(), m = dt.getMinutes()
  if (h === 0 && m === 0) return ''
  return dt.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
}

// Kanban filtrado
const leadsByEtapa = computed(() => {
  const q = search.value.toLowerCase()
  const map = {}
  for (const l of leads.leads) {
    if (q && !(l.nome+l.negocio+l.telefone+l.categoria).toLowerCase().includes(q)) continue
    if (!map[l.etapa]) map[l.etapa] = []
    map[l.etapa].push(l)
  }
  return map
})
function byEtapaFiltrado(etapa) { return leadsByEtapa.value[etapa] || [] }

// Tabela filtrada
const listaFiltrada = computed(() => {
  let lista = leads.leads
  if (search.value) {
    const q = search.value.toLowerCase()
    lista = lista.filter(l => (l.nome+l.negocio+l.telefone+l.categoria).toLowerCase().includes(q))
  }
  if (filterEtapa.value) lista = lista.filter(l => l.etapa === filterEtapa.value)
  if (filterPri.value)   lista = lista.filter(l => l.prioridade === filterPri.value)
  if (sortKey.value) {
    const key = sortKey.value, dir = sortDir.value === 'asc' ? 1 : -1
    lista = [...lista].sort((a,b) => {
      const va = a[key]??'', vb = b[key]??''
      if (typeof va === 'number') return (va-vb)*dir
      return String(va).localeCompare(String(vb),'pt-BR')*dir
    })
  }
  return lista
})
function toggleSort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value==='asc'?'desc':'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}

const ETAPA_LABEL = { contato:'Contato', interesse:'Interesse', demo:'Demo enviada', negociacao:'Negociação', fechado:'Fechado', perdido:'Perdido' }
const ETAPA_COLOR = { contato:'#3b82f6', interesse:'#f59e0b', demo:'#8b5cf6', negociacao:'#f97316', fechado:'#22c55e', perdido:'#6b7280' }
function etapaLabel(e) { return ETAPA_LABEL[e] || e }
function etapaColor(e) { return ETAPA_COLOR[e] || '#6b7280' }
function fmtDataHora(d) {
  if (!d) return '—'
  const dt = new Date(d)
  const h = dt.getHours(), m = dt.getMinutes()
  const date = dt.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' })
  if (h === 0 && m === 0) return date
  return `${date} ${dt.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}`
}

function toggleSel(id, checked) {
  if (checked) selected.value.add(id); else selected.value.delete(id)
  selected.value = new Set(selected.value)
}
function toggleAll(checked) {
  listaFiltrada.value.forEach(l => checked ? selected.value.add(l.id) : selected.value.delete(l.id))
  selected.value = new Set(selected.value)
}

async function moverSelecionados() {
  if (!selEtapa.value) { toast('Escolha uma etapa','err'); return }
  const ids = [...selected.value]
  await run(async () => {
    for (const id of ids) {
      const l = leads.getById(id)
      if (l) await leads.upsert({...l, etapa:selEtapa.value, updated_at:new Date().toISOString()})
    }
    selected.value.clear(); selEtapa.value = ''
  }, ids.length+' leads movidos ✓')
}

async function excluirSelecionados() {
  const ids = [...selected.value]
  if (!ids.length) return
  if (!confirm('Excluir '+ids.length+' lead(s)?')) return
  ids.forEach(id => leads.remove(id)); selected.value.clear()
  toast(ids.length+' removido(s) ✓','ok')
}

function openNew(etapa='contato') {
  currentLeadId.value=null; drawerTitle.value='Novo Lead'
  script.value=''; histEtapas.value=[]; leads.conversas=[]
  leads.drawerLeadId=null; drawerTab.value='dados'
  waMensagem.value=''; waTemplateId.value=''
  form.value={nome:'',negocio:'',telefone:'',categoria:'',cidade:'',instagram:'',site_atual:'',etapa,prioridade:'media',valor_estimado:'',proximo_followup:'',notas:''}
  fuDate.value=''; fuTime.value=''
  drawerOpen.value=true
}
function openNewEtapa(etapa) { openNew(etapa) }

async function openLead(id) {
  const l = leads.getById(id); if (!l) return
  currentLeadId.value=id; drawerTitle.value=l.nome; script.value=''
  leads.drawerLeadId=id; drawerTab.value='dados'
  waMensagem.value=''; waTemplateId.value=''
  form.value={nome:l.nome||'',negocio:l.negocio||'',telefone:l.telefone||'',categoria:l.categoria||'',cidade:l.cidade||'',instagram:l.instagram||'',site_atual:l.site_atual||'',etapa:l.etapa||'contato',prioridade:l.prioridade||'media',valor_estimado:l.valor_estimado||'',proximo_followup:l.proximo_followup||'',notas:l.notas||''}
  syncFuFields()
  try { const raw=localStorage.getItem('slac_hist_'+id); histEtapas.value=raw?JSON.parse(raw):[] } catch { histEtapas.value=[] }
  drawerOpen.value=true
  await Promise.all([leads.loadConversas(id), wa.loadTemplates()])
}
function closeDrawer() { drawerOpen.value=false; currentLeadId.value=null; leads.conversas=[]; leads.drawerLeadId=null }

function salvarHistorico(id,de,para) {
  if(de===para) return
  try {
    const key='slac_hist_'+id
    const hist=JSON.parse(localStorage.getItem(key)||'[]')
    hist.unshift({de:etapaLabel(de),para:etapaLabel(para),ts:new Date().toISOString()})
    localStorage.setItem(key,JSON.stringify(hist.slice(0,20)))
  } catch {}
}

async function salvar() {
  if(!form.value.nome||!form.value.telefone){toast('Nome e telefone obrigatórios','err');return}
  if(currentLeadId.value){
    const l=leads.getById(currentLeadId.value)
    if(l&&l.etapa!==form.value.etapa) salvarHistorico(currentLeadId.value,l.etapa,form.value.etapa)
  }
  const eraFechado=currentLeadId.value?leads.getById(currentLeadId.value)?.etapa==='fechado':false
  const vaiFicarFechado=form.value.etapa==='fechado'
  const payload={
    id:currentLeadId.value||'l'+Date.now(), user_id:auth.user.id,
    nome:form.value.nome, telefone:form.value.telefone, negocio:form.value.negocio,
    categoria:form.value.categoria, cidade:form.value.cidade, instagram:form.value.instagram,
    site_atual:form.value.site_atual, etapa:form.value.etapa, prioridade:form.value.prioridade,
    valor_estimado:parseFloat(form.value.valor_estimado)||0,
    proximo_followup:form.value.proximo_followup||null,
    notas:form.value.notas, updated_at:new Date().toISOString()
  }
  await run(()=>leads.upsert(payload),'Salvo ✓')
  if(vaiFicarFechado&&!eraFechado){fecharLead.value=leads.getById(payload.id)||payload;fecharOpen.value=true;closeDrawer();return}
  closeDrawer()
}

async function deletar() {
  if(!currentLeadId.value) return
  if(!confirm('Remover este lead permanentemente?')) return
  leads.remove(currentLeadId.value); closeDrawer(); toast('Lead removido ✓','ok')
}

function gerarScript() {
  const e=form.value.etapa,nome=form.value.nome||'cliente',neg=form.value.negocio||'seu negócio'
  const scripts={
    contato:`Oi ${nome}! Tudo bem? Me chamo Eduardo da Sano Lab.\n\nVi que o ${neg} está no Google Maps mas ainda não tem um site profissional.\n\nCriamos sites que aparecem no Google e trazem clientes novos.\n\nPoderia ver uma prévia gratuita?`,
    interesse:`Oi ${nome}! Que ótimo que gostou da ideia.\n\nVou preparar uma prévia para o ${neg} — em 24h você já vê como ficaria.\n\nPosso começar hoje?`,
    demo:`Oi ${nome}! Preparei a prévia do site para o ${neg}.\n\n[Link da prévia]\n\nO que achou? Posso ajustar qualquer detalhe.`,
    negociacao:`Oi ${nome}! O site do ${neg} está pronto. O investimento é R$797 com 50% agora e 50% na entrega.\n\nPodemos fechar hoje?`,
    fechado:`Oi ${nome}! Parabéns pelo investimento no ${neg}!\n\nObrigado pela confiança!`,
    perdido:`Oi ${nome}, quando quiser retomar, estarei por aqui.`
  }
  script.value=scripts[e]||'Script não disponível.'
}

async function addConversa() {
  if(!currentLeadId.value){toast('Salve o lead primeiro','err');return}
  if(!convMsg.value.trim()) return
  await run(()=>leads.addConversa(currentLeadId.value,convCanal.value,convDir.value,convMsg.value.trim()),'Registrado ✓')
  convMsg.value=''
}

// ── Notas inline no card modal ──
const cardNotasEdit = ref('')
watch(cardModal, l => { cardNotasEdit.value = l?.notas || '' })

async function salvarNotas() {
  if (!cardModal.value) return
  const novas = cardNotasEdit.value.trim()
  if (novas === (cardModal.value.notas || '').trim()) return
  const atualizado = { ...cardModal.value, notas: novas }
  cardModal.value = atualizado
  await run(() => leads.upsert(atualizado), 'Nota salva')
}

// ── Follow-up ──
const fuPickerOpen = ref(false)
const fuOpts = [
  { h: 3,  label: '3 horas'  },
  { h: 6,  label: '6 horas'  },
  { h: 12, label: '12 horas' },
  { h: 24, label: '24 horas' },
]

async function concluirFollowUp(lead) {
  await run(() => leads.upsert({ ...lead, proximo_followup: null }), 'Follow-up concluído')
}

async function concluirRelead(lead) {
  await run(() => leads.upsert({ ...lead, relead_data: null }), 'Relead concluído')
}

async function agendarFollowUp(lead, horas) {
  const future = new Date(Date.now() + horas * 60 * 60 * 1000)
  const iso = future.toISOString()
  const idx = leads.leads.findIndex(l => l.id === lead.id)
  if (idx !== -1) leads.leads[idx] = { ...leads.leads[idx], proximo_followup: iso }
  run(() => leads.upsert({ ...lead, proximo_followup: iso, updated_at: new Date().toISOString() }), `Follow-up em ${horas}h agendado`)
}

async function followUp24h(lead) {
  const ts = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const iso = ts.toISOString()
  const payload = { ...lead, proximo_followup: iso, updated_at: new Date().toISOString() }

  // Atualiza localmente na store ANTES de ir pra aba (não espera o Supabase)
  const idx = leads.leads.findIndex(l => l.id === lead.id)
  if (idx !== -1) leads.leads[idx] = { ...leads.leads[idx], proximo_followup: iso }

  // Persiste no Supabase em background
  run(() => leads.upsert(payload), `Follow-up agendado para ${fmtDataHora(iso)} ✓`)

  // Agenda notificação local
  setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('SLAC · Follow-up', {
        body: `${lead.nome}${lead.negocio ? ' — ' + lead.negocio : ''}`,
        icon: '/icons/web-app-manifest-192x192.png',
        tag: 'fu_' + lead.id
      })
    }
  }, 24 * 60 * 60 * 1000)

  // Vai pra aba depois de atualizar localmente
  tab.value = 'followup'
}

// ── Relead ──
const releadModal = ref(null)
const releadDate  = ref('')
const releadTime  = ref('09:00')

function openReleadModal(lead) {
  releadModal.value = lead
  // Default: 1 semana
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const pad = n => String(n).padStart(2, '0')
  releadDate.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  releadTime.value = '09:00'
}

function setReleadShortcut(days) {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  const pad = n => String(n).padStart(2, '0')
  releadDate.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}

async function confirmarRelead() {
  if (!releadDate.value || !releadModal.value) { toast('Escolha uma data', 'err'); return }
  const iso = new Date(`${releadDate.value}T${releadTime.value}:00`).toISOString()
  const lead = releadModal.value
  const payload = { ...lead, relead_data: iso, updated_at: new Date().toISOString() }
  await run(() => leads.upsert(payload), `Relead agendado para ${fmtFuDate(iso)} ✓`)
  releadModal.value = null
  tab.value = 'relead'
}

const listaRelead = computed(() =>
  leads.leads
    .filter(l => l.relead_data)
    .sort((a, b) => new Date(a.relead_data) - new Date(b.relead_data))
)

// Estado das notificações
const notifAtiva = ref(false)

const { subscribe, getSubscriptionStatus } = usePushNotifications()

onMounted(async () => {
  const s = await getSubscriptionStatus()
  notifAtiva.value = s === 'granted'
})

async function pedirNotificacao() {
  if (notifAtiva.value) return
  console.log('[DEBUG] pedirNotificacao chamado')
  const ok = await subscribe()
  if (ok) {
    notifAtiva.value = true
    toast('Notificações ativadas', 'ok')
  } else {
    toast('Permissão negada', 'error')
  }
}
</script>

<style scoped>
/* Sel bar */
.sel-bar{display:flex;align-items:center;gap:.625rem;flex-wrap:wrap;background:var(--accent-subtle);border:1px solid var(--accent);border-radius:var(--radius-lg);padding:.625rem 1rem;}
.sel-count{font-size:.82rem;font-weight:700;color:var(--accent);}
.sel-bar-enter-active,.sel-bar-leave-active{transition:all 180ms ease;}
.sel-bar-enter-from,.sel-bar-leave-to{opacity:0;transform:translateY(-6px);}

/* Toolbar */
.toolbar{display:flex;align-items:center;gap:.875rem;flex-wrap:wrap;position:sticky;top:0;z-index:10;background:var(--bg-base);padding:.5rem 0;margin:-.5rem 0;}
.tabs{display:flex;gap:.25rem;background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:.25rem;}
.tab{display:flex;align-items:center;gap:.4rem;padding:.4rem .875rem;border-radius:var(--radius-md);background:transparent;border:none;font-family:var(--font-body);font-size:.82rem;font-weight:500;color:var(--text-tertiary);cursor:pointer;transition:background 100ms ease,color 100ms ease;position:relative;}
.tab.active{background:var(--accent);color:#fff;}
.tab:not(.active):hover{background:var(--bg-overlay);color:var(--text-primary);}
.tab-badge{position:absolute;top:2px;right:2px;background:var(--status-danger);color:#fff;font-size:.55rem;font-weight:700;padding:.1rem .35rem;border-radius:99px;line-height:1.4;}

/* Search */
.kb-search-box{flex:1;max-width:320px;display:flex;align-items:center;gap:.5rem;background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-full);padding:.375rem .875rem;transition:border-color 150ms ease,box-shadow 150ms ease;}
.kb-search-box:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-subtle);}
.kb-search-box svg{flex-shrink:0;color:var(--text-tertiary);}
.kb-search-input{flex:1;background:transparent;border:none;outline:none;font-family:var(--font-body);font-size:.875rem;color:var(--text-primary);}
.kb-search-input::placeholder{color:var(--text-tertiary);}
.kb-search-clear{display:flex;align-items:center;background:none;border:none;cursor:pointer;color:var(--text-tertiary);padding:0;}
.kb-search-clear:hover{color:var(--text-primary);}

/* Kanban */
.kanban-board{display:grid;grid-template-columns:repeat(6,1fr);gap:.75rem;min-height:420px;}
.kb-col{background:var(--bg-surface);border:1px solid var(--border-default);border-radius:var(--radius-lg);display:flex;flex-direction:column;overflow:hidden;min-width:0;transition:border-color 150ms ease,background 150ms ease;}
.kb-col.drop-over{border-color:var(--accent);background:var(--accent-subtle);}
.kb-head{display:flex;align-items:center;justify-content:space-between;padding:.625rem .75rem;border-bottom:1px solid var(--border-subtle);}
.kb-title{display:flex;align-items:center;gap:.375rem;font-size:.72rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;}
.kb-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.kb-count{font-size:.68rem;background:var(--bg-overlay);color:var(--text-tertiary);padding:.1rem .4rem;border-radius:var(--radius-full);font-weight:600;}
.kb-cards{flex:1;padding:.5rem;display:flex;flex-direction:column;gap:.375rem;overflow-y:auto;}
.kb-card{background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-md);padding:.625rem .75rem;cursor:pointer;position:relative;transition:box-shadow 120ms ease,border-color 120ms ease,transform 120ms ease;}
.kb-card:hover{box-shadow:var(--shadow-md);border-color:var(--accent);transform:translateY(-1px);}
.kb-drag-handle{position:absolute;top:.5rem;right:.5rem;color:var(--text-tertiary);opacity:0;transition:opacity 100ms ease;cursor:grab;}
.kb-card:hover .kb-drag-handle{opacity:.5;}
.kb-name{font-size:.82rem;font-weight:600;color:var(--text-primary);margin-bottom:.1rem;}
.kb-negocio{font-size:.7rem;color:var(--text-tertiary);margin-bottom:.15rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.kb-neg{font-size:.72rem;color:var(--text-tertiary);margin-bottom:.375rem;}
.kb-servico{font-size:.65rem;color:var(--status-info);margin-bottom:.375rem;}
.kb-footer{display:flex;align-items:center;justify-content:space-between;}
.kb-tel{font-size:.65rem;color:var(--text-tertiary);}
.kb-pri{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.03em;}
.pri-alta{color:var(--status-danger);}.pri-media{color:var(--status-warning);}.pri-baixa{color:var(--status-info);}
.kb-fu{display:flex;align-items:center;gap:.25rem;font-size:.65rem;color:var(--status-warning);margin-top:.375rem;}
.kb-add{display:flex;align-items:center;justify-content:center;gap:.25rem;width:100%;padding:.4rem;background:transparent;border:1px dashed var(--border-default);border-radius:var(--radius-md);color:var(--text-tertiary);font-size:.75rem;cursor:pointer;font-family:var(--font-body);transition:border-color 120ms,color 120ms,background 120ms;}
.kb-add:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-subtle);}

/* Tabela */
.tabela-wrap{display:flex;flex-direction:column;gap:.75rem;}
.tabela-filters{display:flex;gap:.625rem;flex-wrap:wrap;align-items:center;}
.cb{accent-color:var(--accent);cursor:pointer;width:14px;height:14px;}
.row-sel td{background:var(--accent-subtle) !important;}
.wa-link{color:var(--accent);font-size:.82rem;}
.td-copy{cursor:pointer;user-select:none;}
.td-copy:hover{color:var(--accent);text-decoration:underline dotted;}
.etapa-tag{display:inline-block;font-size:.7rem;font-weight:600;padding:.15rem .5rem;border-radius:var(--radius-full);text-transform:uppercase;letter-spacing:.03em;white-space:nowrap;}
.th-sort{cursor:pointer;user-select:none;white-space:nowrap;}
.th-sort:hover{color:var(--accent);}
.sort-icon{font-size:.65rem;color:var(--text-tertiary);margin-left:.2rem;}

/* Follow-up tab */
.fu-wrap{display:flex;flex-direction:column;gap:.625rem;}
.fu-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;padding:3rem;color:var(--text-tertiary);text-align:center;}
.fu-empty svg{opacity:.3;}
.fu-empty p{font-size:.9375rem;font-weight:600;color:var(--text-secondary);margin:0;}
.fu-empty span{font-size:.8125rem;}
.fu-list{display:flex;flex-direction:column;gap:.5rem;}
.fu-card{display:flex;align-items:stretch;gap:1rem;background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:.875rem 1rem;cursor:pointer;transition:box-shadow 120ms ease,border-color 120ms ease;}
.fu-card:hover{box-shadow:var(--shadow-md);border-color:var(--border-strong);}
.fu-vencido{border-color:rgba(239,68,68,.3);background:var(--status-danger-subtle);}
.fu-hoje{border-color:rgba(245,158,11,.35);background:var(--status-warning-subtle);}
.fu-card-left{display:flex;flex-direction:column;align-items:center;gap:.375rem;min-width:52px;padding-right:.75rem;border-right:1px solid var(--border-subtle);}
.fu-date{font-size:.8125rem;font-weight:700;color:var(--text-primary);text-align:center;white-space:nowrap;}
.fu-time{font-size:.7rem;color:var(--text-tertiary);font-weight:500;}
.fu-status-dot{width:8px;height:8px;border-radius:50%;}
.dot-vencido{background:var(--status-danger);}
.dot-hoje{background:var(--status-warning);}
.dot-futuro{background:var(--accent);}
.fu-card-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:.25rem;}
.fu-nome{font-size:.9rem;font-weight:700;color:var(--text-primary);}
.fu-neg{font-size:.8rem;color:var(--text-tertiary);}
.fu-meta{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-top:.2rem;}
.fu-nota{font-size:.75rem;color:var(--text-tertiary);font-style:italic;}
.fu-card-right{display:flex;flex-direction:column;gap:.375rem;justify-content:center;flex-shrink:0;}
.fu-concluido{gap:.375rem;}

/* Card modal */
.card-modal{background:rgba(18,18,18,0.38);backdrop-filter:blur(32px) saturate(180%);-webkit-backdrop-filter:blur(32px) saturate(180%);border:1px solid rgba(255,255,255,0.08);box-shadow:0 28px 72px rgba(0,0,0,.55),0 1px 0 rgba(255,255,255,.05) inset;border-radius:var(--radius-xl, 16px);width:100%;max-width:480px;overflow:hidden;will-change:opacity;}
[data-theme="light"] .card-modal{background:rgba(255,255,255,0.42);border:1px solid rgba(255,255,255,0.75);box-shadow:0 20px 60px rgba(0,0,0,.1),0 1px 0 rgba(255,255,255,.9) inset;}
.card-modal-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:1.25rem 1.25rem .875rem;}
.card-modal-name{font-size:1.125rem;font-weight:700;color:var(--text-primary);margin:0;}
.card-modal-neg{font-size:.8125rem;color:var(--text-tertiary);margin:.2rem 0 0;}
.card-modal-actions{display:flex;align-items:center;gap:.375rem;flex-shrink:0;}
.card-modal-body{padding:.25rem 1.25rem 1rem;}
.card-modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:.625rem .875rem;}
.cm-item{display:flex;flex-direction:column;gap:.15rem;}
.cm-label{font-size:.6rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);}
.cm-val{font-size:.875rem;color:var(--text-primary);}
.cm-notas{margin-top:.875rem;padding-top:.875rem;border-top:1px solid var(--border-subtle);}
.cm-notas-textarea{
  margin-top:.375rem;font-size:.8125rem;line-height:1.5;resize:vertical;min-height:68px;
  background:rgba(255,255,255,.05) !important;
  border:1px solid rgba(255,255,255,.08) !important;
  backdrop-filter:blur(8px);
  -webkit-backdrop-filter:blur(8px);
}
.cm-notas-textarea:focus{border-color:rgba(34,197,94,.4) !important;outline:none;box-shadow:0 0 0 3px rgba(34,197,94,.08);}
[data-theme="light"] .cm-notas-textarea{background:rgba(0,0,0,.04) !important;border:1px solid rgba(0,0,0,.08) !important;}
[data-theme="light"] .cm-notas-textarea:focus{border-color:rgba(34,197,94,.5) !important;}
.card-modal-footer{display:flex;align-items:center;gap:.5rem;padding:.875rem 1.25rem;border-top:1px solid var(--border-default);}
.modal-fade-enter-active,.modal-fade-leave-active{transition:opacity 200ms ease;}
.modal-fade-enter-from,.modal-fade-leave-to{opacity:0;}

/* Copy toast */
.copy-toast{position:fixed;bottom:5rem;left:50%;transform:translateX(-50%);background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-full);padding:.375rem .875rem;font-size:.8rem;color:var(--accent);font-weight:600;box-shadow:var(--shadow-md);z-index:9999;pointer-events:none;}
.toast-anim-enter-active,.toast-anim-leave-active{transition:all 150ms ease;}
.toast-anim-enter-from,.toast-anim-leave-to{opacity:0;transform:translateX(-50%) translateY(6px);}

/* Drawer */
.drawer-bg{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:800;}
[data-theme="light"] .drawer-bg{background:rgba(200,200,210,0.3);}
.drawer{position:fixed;top:0;right:0;height:100vh;width:420px;max-width:95vw;background:rgba(18,18,18,0.38);backdrop-filter:blur(32px) saturate(180%);-webkit-backdrop-filter:blur(32px) saturate(180%);border-left:1px solid rgba(255,255,255,0.08);box-shadow:-8px 0 40px rgba(0,0,0,.5);z-index:801;display:flex;flex-direction:column;overflow:hidden;}
[data-theme="light"] .drawer{background:rgba(255,255,255,0.42);border-left:1px solid rgba(255,255,255,0.75);box-shadow:-8px 0 40px rgba(0,0,0,.1);}
/* Drawer tabs */
.drawer-tabs{display:flex;gap:2px;background:var(--bg-elevated);border-bottom:1px solid var(--border-default);padding:0 1rem;flex-shrink:0;}
.drawer-tab{display:flex;align-items:center;gap:5px;padding:.55rem .7rem;font-size:.78rem;font-weight:600;color:var(--text-tertiary);background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;transition:color .15s,border-color .15s;white-space:nowrap;}
.drawer-tab:hover{color:var(--text-secondary);}
.drawer-tab.active{color:var(--accent);border-bottom-color:var(--accent);}
/* Aba WhatsApp */
.wa-tab{display:flex;flex-direction:column;height:100%;}
.wa-msgs{flex:1;overflow-y:auto;padding:.875rem 1.25rem;display:flex;flex-direction:column;gap:.5rem;min-height:160px;max-height:240px;}
.wa-empty{color:var(--text-tertiary);font-size:.82rem;text-align:center;padding:2rem 0;}
.wa-msg{display:flex;flex-direction:column;max-width:84%;}
.wa-out{align-self:flex-end;align-items:flex-end;}
.wa-in{align-self:flex-start;align-items:flex-start;}
.wa-bubble{padding:.45rem .7rem;border-radius:12px;font-size:.83rem;line-height:1.5;}
.wa-out .wa-bubble{background:rgba(34,197,94,.15);color:var(--accent);border-bottom-right-radius:3px;}
.wa-in .wa-bubble{background:var(--bg-overlay);color:var(--text-primary);border-bottom-left-radius:3px;}
.wa-time{font-size:.7rem;color:var(--text-tertiary);margin-top:2px;}
.wa-composer{padding:.75rem 1.25rem;border-top:1px solid var(--border-default);display:flex;flex-direction:column;gap:.5rem;}
.wa-toolbar{display:flex;gap:.5rem;}
.wa-select{flex:1;font-size:.78rem;}
.wa-ia-btn{font-size:.78rem;white-space:nowrap;}
.wa-textarea{font-size:.83rem;resize:none;}
.wa-send-btn{width:100%;justify-content:center;gap:.5rem;}
.drawer-header{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid var(--border-default);flex-shrink:0;}
.drawer-title{font-size:.9375rem;font-weight:700;color:var(--text-primary);}
.drawer-body{flex:1;overflow-y:auto;padding:.875rem 1.25rem;display:flex;flex-direction:column;gap:.875rem;}
.drawer-section{display:flex;flex-direction:column;gap:.5rem;padding-bottom:.875rem;border-bottom:1px solid var(--border-subtle);}
.drawer-section:last-child{border-bottom:none;}
.drawer-section-title{font-size:.62rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--text-tertiary);margin:0;}
.drawer-footer{display:flex;align-items:center;gap:.5rem;padding:.875rem 1.25rem;border-top:1px solid var(--border-default);flex-shrink:0;}
.script-box{background:var(--bg-overlay);border:1px solid var(--border-default);border-radius:var(--radius-md);padding:.75rem;font-size:.8rem;color:var(--text-secondary);white-space:pre-wrap;line-height:1.6;}
.hist-row{display:flex;align-items:center;gap:.375rem;font-size:.78rem;color:var(--text-tertiary);}
.hist-time{margin-left:auto;font-size:.7rem;}
.conv-list{display:flex;flex-direction:column;gap:.375rem;}
.conv-empty{font-size:.78rem;color:var(--text-tertiary);text-align:center;padding:.5rem;}
.conv-item{background:var(--bg-overlay);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:.5rem .625rem;}
.conv-meta{display:flex;align-items:center;gap:.375rem;margin-bottom:.2rem;}
.conv-canal{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--text-tertiary);}
.dir-in{font-size:.65rem;font-weight:600;color:var(--accent);}
.dir-out{font-size:.65rem;font-weight:600;color:var(--status-warning);}
.conv-time{font-size:.65rem;color:var(--text-tertiary);margin-left:auto;}
.conv-msg{font-size:.8rem;color:var(--text-primary);}
.conv-composer{display:flex;flex-direction:column;gap:.5rem;margin-top:.5rem;}
.conv-selects{display:flex;gap:.5rem;}
.conv-select-wrap{display:flex;flex-direction:column;gap:.2rem;flex:1;}
.conv-select-label{font-size:.6rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--text-tertiary);}

/* Follow-up datetime input */
.fu-datetime-input{display:flex;align-items:center;gap:.375rem;}
.fu-badge{font-size:.6rem;font-weight:700;background:var(--accent-subtle);color:var(--accent);border:1px solid var(--accent);border-radius:99px;padding:.1rem .4rem;letter-spacing:.03em;margin-left:.375rem;}
.fu-hint{display:flex;align-items:center;gap:.375rem;font-size:.75rem;color:var(--status-warning);margin-top:.25rem;}

/* Kanban card notas */
.kb-notas{font-size:.7rem;color:var(--text-tertiary);margin-bottom:.375rem;line-height:1.4;font-style:italic;}

/* Faixa amarela de follow-up no card */
.kb-fu-bar{
  position:absolute;bottom:0;left:0;right:0;
  display:flex;align-items:center;gap:.3rem;
  font-size:.62rem;font-weight:600;
  color:#92400e;
  background:linear-gradient(135deg,#fbbf24,#f59e0b);
  padding:.25rem .6rem;
  border-radius:0 0 var(--radius-md) var(--radius-md);
}
.kb-card{padding-bottom:.625rem;}
.kb-card:has(.kb-fu-bar){padding-bottom:1.75rem;}
.kb-card:has(.kb-relead-bar){padding-bottom:1.75rem;}
.kb-card:has(.kb-work-bar){padding-bottom:1.75rem;}
.kb-card:has(.kb-fu-bar):has(.kb-relead-bar){padding-bottom:3.25rem;}
.kb-card:has(.kb-fu-bar):has(.kb-work-bar){padding-bottom:3.25rem;}
.kb-card:has(.kb-relead-bar):has(.kb-work-bar){padding-bottom:3.25rem;}
.kb-card:has(.kb-fu-bar):has(.kb-relead-bar):has(.kb-work-bar){padding-bottom:4.75rem;}

/* Barra azul de work no card */
.kb-work-bar{
  position:absolute;bottom:0;left:0;right:0;
  display:flex;align-items:center;gap:.3rem;
  font-size:.62rem;font-weight:600;
  color:#dbeafe;
  background:linear-gradient(135deg,#60a5fa,#3b82f6);
  padding:.25rem .6rem;
  border-radius:0 0 var(--radius-md) var(--radius-md);
}
/* Barra roxa de relead no card */
.kb-relead-bar{
  position:absolute;bottom:0;left:0;right:0;
  display:flex;align-items:center;gap:.3rem;
  font-size:.62rem;font-weight:600;
  color:#ede9fe;
  background:linear-gradient(135deg,#a78bfa,#8b5cf6);
  padding:.25rem .6rem;
  border-radius:0 0 var(--radius-md) var(--radius-md);
}
/* Empilhamento das barras */
.kb-card:has(.kb-fu-bar) .kb-relead-bar{bottom:1.5rem;border-radius:0;}
.kb-card:has(.kb-fu-bar) .kb-work-bar{bottom:1.5rem;border-radius:0;}
.kb-card:has(.kb-relead-bar) .kb-work-bar{bottom:1.5rem;border-radius:0;}
.kb-card:has(.kb-fu-bar):has(.kb-relead-bar) .kb-work-bar{bottom:3rem;border-radius:0;}
.kb-card:has(.kb-fu-bar):has(.kb-work-bar) .kb-relead-bar{bottom:3rem;border-radius:0;}

/* Tab badge roxo */
.tab-badge--purple{background:#8b5cf6;}
.tab-badge--orange{background:var(--status-warning);}

/* Botões novos */
.btn-warning{background:rgba(245,158,11,.15);color:#d97706;border:1px solid rgba(245,158,11,.35);}
.btn-warning:hover{background:rgba(245,158,11,.25);color:#b45309;}
.fu-picker-wrap{position:relative;}
.fu-picker-toggle{gap:.375rem;}
.fu-opts{position:absolute;bottom:calc(100% + 6px);left:0;min-width:120px;background:rgba(18,18,18,0.6);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);border:1px solid rgba(255,255,255,.1);border-radius:10px;overflow:hidden;z-index:10;}
[data-theme="light"] .fu-opts{background:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,.8);}
.fu-opt{display:block;width:100%;padding:.5rem .875rem;background:transparent;border:none;font-family:var(--font-body);font-size:.8125rem;font-weight:500;color:var(--text-primary);text-align:left;cursor:pointer;transition:background 100ms ease;}
.fu-opt:hover{background:rgba(245,158,11,.15);color:#d97706;}
.fu-opts-enter-active{transition:all 180ms cubic-bezier(.34,1.56,.64,1);}
.fu-opts-leave-active{transition:all 120ms ease;}
.fu-opts-enter-from{opacity:0;transform:translateY(6px) scale(.97);}
.fu-opts-leave-to{opacity:0;transform:translateY(4px);}
.btn-purple{background:rgba(139,92,246,.15);color:#7c3aed;border:1px solid rgba(139,92,246,.35);}
.btn-purple:hover{background:rgba(139,92,246,.25);color:#6d28d9;}

/* Relead modal */
.relead-modal{background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-xl,16px);box-shadow:var(--shadow-lg);width:100%;max-width:400px;overflow:hidden;}
.relead-shortcuts{display:flex;gap:.375rem;flex-wrap:wrap;margin-top:.75rem;}

/* Relead card */
.fu-relead{border-color:rgba(139,92,246,.25);}
.fu-relead:hover{border-color:rgba(139,92,246,.5);}
.dot-purple{background:#8b5cf6;}

/* Botão alertas ativo */
.btn-notif-on {
  background: var(--accent-subtle);
  color: var(--accent);
  border: 1px solid var(--accent);
  cursor: default;
  opacity: 1;
}
.btn-notif-on:disabled { opacity: 1; cursor: default; }

@media(max-width:1200px){.kanban-board{grid-template-columns:repeat(3,1fr);}}
@media(max-width:768px){.kanban-board{grid-template-columns:repeat(2,1fr);}.drawer{width:100%;}.fu-card{flex-wrap:wrap;}.card-modal-grid{grid-template-columns:1fr;}}
</style>
