<template>
  <div class="page-layout">

    <div class="page-header">
      <div>
        <h1 class="page-title">CRM <span class="page-count">{{ leads.stats.total }} leads</span></h1>
        <p class="page-subtitle">Gerencie seu pipeline de vendas</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" @click="pedirNotificacao">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          Alertas
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

    <!-- Tabs + busca kanban -->
    <div class="toolbar">
      <div class="tabs">
        <button class="tab" :class="{ active: tab === 'kanban' }" @click="tab = 'kanban'">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Kanban
        </button>
        <button class="tab" :class="{ active: tab === 'tabela' }" @click="tab = 'tabela'">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          Tabela
        </button>
      </div>
      <!-- Busca global (funciona em ambas as views) -->
      <div class="kb-search-box">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="search" class="kb-search-input" placeholder="Buscar lead..." />
        <button v-if="search" class="kb-search-clear" @click="search = ''">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>

    <!-- KANBAN com drag-and-drop -->
    <div v-if="tab === 'kanban'" class="kanban-board">
      <div
        v-for="e in ETAPAS" :key="e.id"
        class="kb-col"
        :class="{ 'drop-over': dragOver === e.id }"
        @dragover.prevent="dragOver = e.id"
        @dragleave="dragOver = null"
        @drop.prevent="onDrop(e.id)"
      >
        <div class="kb-head">
          <div class="kb-title">
            <span class="kb-dot" :style="{ background: e.color }"></span>
            <span :style="{ color: e.color }">{{ e.label }}</span>
          </div>
          <span class="kb-count">{{ byEtapaFiltrado(e.id).length }}</span>
        </div>
        <div class="kb-cards">
          <div
            v-for="l in byEtapaFiltrado(e.id)" :key="l.id"
            class="kb-card"
            draggable="true"
            @dragstart="onDragStart(l)"
            @dragend="dragOver = null"
            @click="openLead(l.id)"
          >
            <div class="kb-drag-handle">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
            </div>
            <div class="kb-name">{{ l.nome }}</div>
            <div class="kb-neg">{{ l.negocio || l.categoria || '—' }}</div>
            <div v-if="l.site_atual" class="kb-servico">{{ l.site_atual }}</div>
            <div class="kb-footer">
              <span class="kb-tel">{{ l.telefone }}</span>
              <span class="kb-pri" :class="`pri-${l.prioridade}`">{{ l.prioridade }}</span>
            </div>
            <div v-if="l.proximo_followup" class="kb-fu">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {{ fmtData(l.proximo_followup) }}
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
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
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
            <tr v-for="l in listaFiltrada" :key="l.id" style="cursor:pointer"
              :class="{ 'row-sel': selected.has(l.id) }" @click="openLead(l.id)">
              <td @click.stop><input type="checkbox" class="cb" :checked="selected.has(l.id)" @change="toggleSel(l.id, $event.target.checked)" /></td>
              <td style="font-weight:600">{{ l.nome }}</td>
              <td class="text-muted">{{ l.negocio || '—' }}</td>
              <td><a :href="'https://wa.me/55'+l.telefone.replace(/\D/g,'')" target="_blank" class="wa-link" @click.stop>{{ l.telefone }}</a></td>
              <td><span class="etapa-tag" :style="{ background: etapaColor(l.etapa)+'18', color: etapaColor(l.etapa) }">{{ etapaLabel(l.etapa) }}</span></td>
              <td><span class="kb-pri" :class="`pri-${l.prioridade}`">{{ l.prioridade }}</span></td>
              <td class="text-muted text-sm">{{ l.proximo_followup ? fmtData(l.proximo_followup) : '—' }}</td>
              <td style="text-align:right;font-weight:600;color:var(--accent)">{{ l.valor_estimado ? fmt(l.valor_estimado) : '—' }}</td>
              <td @click.stop><button class="btn btn-ghost btn-icon btn-sm" @click="openLead(l.id)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

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
    <div class="drawer-body">
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
        <div class="form-group"><label class="form-label">Próximo follow-up</label><input v-model="form.proximo_followup" class="form-input" type="date" /></div>
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

  <!-- Modal fechar negócio -->
  <FecharNegocioModal v-model="fecharOpen" :lead="fecharLead" @fechado="onNegocioFechado" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import FecharNegocioModal from '@/components/crm/FecharNegocioModal.vue'
import { useLeadsStore, ETAPAS } from '@/stores/leads'
import { useAuthStore } from '@/stores/auth'
import { useFinStore } from '@/stores/fin'
import { useSaving } from '@/composables/useSaving'
import { useRealtime } from '@/composables/useRealtime'

const leads = useLeadsStore()
const auth  = useAuthStore()
const fin   = useFinStore()
const { run, toast } = useSaving()
const fmt = fin.fmt

const tab         = ref('kanban')
const search      = ref('')
const filterEtapa = ref('')
const filterPri   = ref('')
const selected    = ref(new Set())
const selEtapa    = ref('')
const sortKey     = ref('')
const sortDir     = ref('asc')

// Modal fechar negócio
const fecharOpen = ref(false)
const fecharLead = ref(null)

// Drag-and-drop
const dragItem = ref(null)
const dragOver = ref(null)

function onDragStart(lead) {
  dragItem.value = lead
}

async function onDrop(etapaDestino) {
  dragOver.value = null
  if (!dragItem.value || dragItem.value.etapa === etapaDestino) return
  const lead = dragItem.value
  dragItem.value = null

  const eraFechado     = lead.etapa === 'fechado'
  const vaiFicarFechado = etapaDestino === 'fechado'

  // Atualiza otimisticamente na store
  const payload = { ...lead, etapa: etapaDestino, updated_at: new Date().toISOString() }
  await run(() => leads.upsert(payload), `Movido para ${etapaLabel(etapaDestino)} ✓`)

  // Abre modal de fechamento
  if (vaiFicarFechado && !eraFechado) {
    fecharLead.value = leads.getById(lead.id) || payload
    fecharOpen.value = true
  }
}

function onNegocioFechado() {
  fecharOpen.value = false
  fecharLead.value = null
}

const drawerOpen    = ref(false)
const drawerTitle   = ref('Novo Lead')
const currentLeadId = ref(null)
const script        = ref('')
const histEtapas    = ref([])
const convCanal     = ref('whatsapp')
const convDir       = ref('enviado')
const convMsg       = ref('')

const form = ref({
  nome:'', negocio:'', telefone:'', categoria:'', cidade:'', instagram:'',
  site_atual:'', etapa:'contato', prioridade:'media', valor_estimado:'', proximo_followup:'', notas:''
})

// Kanban filtrado por busca
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
    const key = sortKey.value
    const dir = sortDir.value === 'asc' ? 1 : -1
    lista = [...lista].sort((a,b) => {
      const va = a[key]??''; const vb = b[key]??''
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
function fmtData(d)    { return new Date(d).toLocaleDateString('pt-BR') }
function fmtDataHora(d){ return new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) }

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
  ids.forEach(id => leads.remove(id))
  selected.value.clear()
  toast(ids.length+' removido(s) ✓','ok')
}

function openNew(etapa='contato') {
  currentLeadId.value=null; drawerTitle.value='Novo Lead'
  script.value=''; histEtapas.value=[]; leads.conversas=[]
  form.value={nome:'',negocio:'',telefone:'',categoria:'',cidade:'',instagram:'',site_atual:'',etapa,prioridade:'media',valor_estimado:'',proximo_followup:'',notas:''}
  drawerOpen.value=true
}
function openNewEtapa(etapa) { openNew(etapa) }

async function openLead(id) {
  const l = leads.getById(id); if (!l) return
  currentLeadId.value=id; drawerTitle.value=l.nome; script.value=''
  form.value={nome:l.nome||'',negocio:l.negocio||'',telefone:l.telefone||'',categoria:l.categoria||'',cidade:l.cidade||'',instagram:l.instagram||'',site_atual:l.site_atual||'',etapa:l.etapa||'contato',prioridade:l.prioridade||'media',valor_estimado:l.valor_estimado||'',proximo_followup:l.proximo_followup||'',notas:l.notas||''}
  try { const raw=localStorage.getItem('slac_hist_'+id); histEtapas.value=raw?JSON.parse(raw):[] } catch { histEtapas.value=[] }
  drawerOpen.value=true
  await leads.loadConversas(id)
}

function closeDrawer() { drawerOpen.value=false; currentLeadId.value=null; leads.conversas=[] }

function salvarHistorico(id,de,para) {
  if (de===para) return
  try {
    const key='slac_hist_'+id
    const hist=JSON.parse(localStorage.getItem(key)||'[]')
    hist.unshift({de:etapaLabel(de),para:etapaLabel(para),ts:new Date().toISOString()})
    localStorage.setItem(key,JSON.stringify(hist.slice(0,20)))
  } catch {}
}

async function salvar() {
  if (!form.value.nome||!form.value.telefone) { toast('Nome e telefone obrigatórios','err'); return }
  if (currentLeadId.value) {
    const l=leads.getById(currentLeadId.value)
    if (l&&l.etapa!==form.value.etapa) salvarHistorico(currentLeadId.value,l.etapa,form.value.etapa)
  }
  const eraFechado     = currentLeadId.value ? leads.getById(currentLeadId.value)?.etapa==='fechado' : false
  const vaiFicarFechado = form.value.etapa==='fechado'

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

  if (vaiFicarFechado && !eraFechado) {
    fecharLead.value = leads.getById(payload.id) || payload
    fecharOpen.value = true
    closeDrawer()
    return
  }
  closeDrawer()
}

async function deletar() {
  if (!currentLeadId.value) return
  if (!confirm('Remover este lead permanentemente?')) return
  leads.remove(currentLeadId.value); closeDrawer(); toast('Lead removido ✓','ok')
}

function gerarScript() {
  const e=form.value.etapa, nome=form.value.nome||'cliente', neg=form.value.negocio||'seu negócio'
  const scripts={
    contato:`Oi ${nome}! Tudo bem? Me chamo Eduardo da Sano Lab.\n\nVi que o ${neg} está no Google Maps mas ainda não tem um site profissional.\n\nCriamos sites que aparecem no Google e trazem clientes novos.\n\nPoderia ver uma prévia gratuita para o ${neg}?`,
    interesse:`Oi ${nome}! Que ótimo que gostou da ideia.\n\nVou preparar uma prévia personalizada para o ${neg} — em 24h você já vê como ficaria.\n\nPosso começar hoje?`,
    demo:`Oi ${nome}! Preparei a prévia do site para o ${neg}.\n\n[Link da prévia]\n\nO que achou? Posso ajustar qualquer detalhe. Assim que aprovar, finalizamos em até 3 dias.`,
    negociacao:`Oi ${nome}! O site do ${neg} está pronto para ir ao ar. O investimento é R$797 com 50% agora e 50% na entrega.\n\nPodemos fechar hoje?`,
    fechado:`Oi ${nome}! Parabéns pelo investimento no ${neg}!\n\nVou iniciar hoje. Em breve entro em contato com os próximos passos.\n\nObrigado pela confiança!`,
    perdido:`Oi ${nome}, tudo bem?\n\nSei que o momento pode não ter sido ideal. Quando quiser retomar, estarei por aqui.`
  }
  script.value=scripts[e]||'Script não disponível.'
}

async function addConversa() {
  if (!currentLeadId.value) { toast('Salve o lead primeiro','err'); return }
  if (!convMsg.value.trim()) return
  await run(()=>leads.addConversa(currentLeadId.value,convCanal.value,convDir.value,convMsg.value.trim()),'Registrado ✓')
  convMsg.value=''
}

async function pedirNotificacao() {
  if (!('Notification' in window)) { toast('Notificações não suportadas','err'); return }
  const perm=await Notification.requestPermission()
  if (perm==='granted') toast('Notificações ativadas ✓','ok')
  else toast('Permissão negada','err')
}

onMounted(()=>{
  if (!auth.user) return
  useRealtime(auth.user.id,{onLeads:()=>leads.load()})
})
</script>

<style scoped>
/* Sel bar */
.sel-bar { display:flex; align-items:center; gap:.625rem; flex-wrap:wrap; background:var(--accent-subtle); border:1px solid var(--accent); border-radius:var(--radius-lg); padding:.625rem 1rem; }
.sel-count { font-size:.82rem; font-weight:700; color:var(--accent); }
.sel-bar-enter-active,.sel-bar-leave-active { transition:all 180ms ease; }
.sel-bar-enter-from,.sel-bar-leave-to { opacity:0; transform:translateY(-6px); }

/* Toolbar: tabs + busca */
.toolbar { display:flex; align-items:center; gap:.875rem; flex-wrap:wrap; }
.tabs { display:flex; gap:.25rem; background:var(--bg-elevated); border:1px solid var(--border-default); border-radius:var(--radius-lg); padding:.25rem; }
.tab { display:flex; align-items:center; gap:.4rem; padding:.4rem .875rem; border-radius:var(--radius-md); background:transparent; border:none; font-family:var(--font-body); font-size:.82rem; font-weight:500; color:var(--text-tertiary); cursor:pointer; transition:background 100ms ease,color 100ms ease; }
.tab.active { background:var(--accent); color:#fff; }
.tab:not(.active):hover { background:var(--bg-overlay); color:var(--text-primary); }

/* Busca */
.kb-search-box { flex:1; max-width:320px; display:flex; align-items:center; gap:.5rem; background:var(--bg-elevated); border:1px solid var(--border-default); border-radius:var(--radius-full); padding:.375rem .875rem; transition:border-color 150ms ease,box-shadow 150ms ease; }
.kb-search-box:focus-within { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-subtle); }
.kb-search-box svg { flex-shrink:0; color:var(--text-tertiary); }
.kb-search-input { flex:1; background:transparent; border:none; outline:none; font-family:var(--font-body); font-size:.875rem; color:var(--text-primary); }
.kb-search-input::placeholder { color:var(--text-tertiary); }
.kb-search-clear { display:flex; align-items:center; background:none; border:none; cursor:pointer; color:var(--text-tertiary); padding:0; }
.kb-search-clear:hover { color:var(--text-primary); }

/* Kanban */
.kanban-board { display:grid; grid-template-columns:repeat(6,1fr); gap:.75rem; min-height:420px; }
.kb-col { background:var(--bg-surface); border:1px solid var(--border-default); border-radius:var(--radius-lg); display:flex; flex-direction:column; overflow:hidden; min-width:0; transition:border-color 150ms ease,background 150ms ease; }
.kb-col.drop-over { border-color:var(--accent); background:var(--accent-subtle); }
.kb-head { display:flex; align-items:center; justify-content:space-between; padding:.625rem .75rem; border-bottom:1px solid var(--border-subtle); }
.kb-title { display:flex; align-items:center; gap:.375rem; font-size:.72rem; font-weight:700; letter-spacing:.04em; text-transform:uppercase; }
.kb-dot   { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.kb-count { font-size:.68rem; background:var(--bg-overlay); color:var(--text-tertiary); padding:.1rem .4rem; border-radius:var(--radius-full); font-weight:600; }
.kb-cards { flex:1; padding:.5rem; display:flex; flex-direction:column; gap:.375rem; overflow-y:auto; }
.kb-card  { background:var(--bg-elevated); border:1px solid var(--border-default); border-radius:var(--radius-md); padding:.625rem .75rem; cursor:grab; position:relative; transition:box-shadow 120ms ease,border-color 120ms ease,opacity 120ms ease; }
.kb-card:hover { box-shadow:var(--shadow-md); border-color:var(--border-strong); }
.kb-card:active { cursor:grabbing; opacity:.85; }
.kb-drag-handle { position:absolute; top:.5rem; right:.5rem; color:var(--text-tertiary); opacity:0; transition:opacity 100ms ease; cursor:grab; }
.kb-card:hover .kb-drag-handle { opacity:.5; }
.kb-name    { font-size:.82rem; font-weight:600; color:var(--text-primary); margin-bottom:.15rem; }
.kb-neg     { font-size:.72rem; color:var(--text-tertiary); margin-bottom:.375rem; }
.kb-servico { font-size:.65rem; color:var(--status-info); margin-bottom:.375rem; }
.kb-footer  { display:flex; align-items:center; justify-content:space-between; }
.kb-tel     { font-size:.65rem; color:var(--text-tertiary); }
.kb-pri     { font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.03em; }
.pri-alta   { color:var(--status-danger); }
.pri-media  { color:var(--status-warning); }
.pri-baixa  { color:var(--status-info); }
.kb-fu      { display:flex; align-items:center; gap:.25rem; font-size:.65rem; color:var(--status-warning); margin-top:.375rem; }
.kb-add     { display:flex; align-items:center; justify-content:center; gap:.25rem; width:100%; padding:.4rem; background:transparent; border:1px dashed var(--border-default); border-radius:var(--radius-md); color:var(--text-tertiary); font-size:.75rem; cursor:pointer; font-family:var(--font-body); transition:border-color 120ms ease,color 120ms ease,background 120ms ease; }
.kb-add:hover { border-color:var(--accent); color:var(--accent); background:var(--accent-subtle); }

/* Tabela */
.tabela-wrap { display:flex; flex-direction:column; gap:.75rem; }
.tabela-filters { display:flex; gap:.625rem; flex-wrap:wrap; align-items:center; }
.cb        { accent-color:var(--accent); cursor:pointer; width:14px; height:14px; }
.row-sel td { background:var(--accent-subtle) !important; }
.wa-link   { color:var(--accent); font-size:.82rem; }
.etapa-tag { display:inline-block; font-size:.7rem; font-weight:600; padding:.15rem .5rem; border-radius:var(--radius-full); text-transform:uppercase; letter-spacing:.03em; white-space:nowrap; }
.th-sort   { cursor:pointer; user-select:none; white-space:nowrap; }
.th-sort:hover { color:var(--accent); }
.sort-icon { font-size:.65rem; color:var(--text-tertiary); margin-left:.2rem; }

/* Drawer */
.drawer-bg { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:800; }
.drawer { position:fixed; top:0; right:0; height:100vh; width:420px; max-width:95vw; background:var(--bg-elevated); border-left:1px solid var(--border-default); box-shadow:var(--shadow-lg); z-index:801; display:flex; flex-direction:column; overflow:hidden; }
.drawer-header { display:flex; align-items:center; justify-content:space-between; padding:1rem 1.25rem; border-bottom:1px solid var(--border-default); flex-shrink:0; }
.drawer-title { font-size:.9375rem; font-weight:700; color:var(--text-primary); }
.drawer-body  { flex:1; overflow-y:auto; padding:.875rem 1.25rem; display:flex; flex-direction:column; gap:.875rem; }
.drawer-section { display:flex; flex-direction:column; gap:.5rem; padding-bottom:.875rem; border-bottom:1px solid var(--border-subtle); }
.drawer-section:last-child { border-bottom:none; }
.drawer-section-title { font-size:.62rem; font-weight:700; letter-spacing:.09em; text-transform:uppercase; color:var(--text-tertiary); margin:0; }
.drawer-footer { display:flex; align-items:center; gap:.5rem; padding:.875rem 1.25rem; border-top:1px solid var(--border-default); flex-shrink:0; }
.script-box { background:var(--bg-overlay); border:1px solid var(--border-default); border-radius:var(--radius-md); padding:.75rem; font-size:.8rem; color:var(--text-secondary); white-space:pre-wrap; line-height:1.6; }
.hist-row  { display:flex; align-items:center; gap:.375rem; font-size:.78rem; color:var(--text-tertiary); }
.hist-time { margin-left:auto; font-size:.7rem; }
.conv-list    { display:flex; flex-direction:column; gap:.375rem; }
.conv-empty   { font-size:.78rem; color:var(--text-tertiary); text-align:center; padding:.5rem; }
.conv-item    { background:var(--bg-overlay); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:.5rem .625rem; }
.conv-meta    { display:flex; align-items:center; gap:.375rem; margin-bottom:.2rem; }
.conv-canal   { font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:var(--text-tertiary); }
.dir-in       { font-size:.65rem; font-weight:600; color:var(--accent); }
.dir-out      { font-size:.65rem; font-weight:600; color:var(--status-warning); }
.conv-time    { font-size:.65rem; color:var(--text-tertiary); margin-left:auto; }
.conv-msg     { font-size:.8rem; color:var(--text-primary); }
.conv-composer { display:flex; flex-direction:column; gap:.5rem; margin-top:.5rem; }
.conv-selects  { display:flex; gap:.5rem; }
.conv-select-wrap { display:flex; flex-direction:column; gap:.2rem; flex:1; }
.conv-select-label { font-size:.6rem; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--text-tertiary); }

@media (max-width:1200px) { .kanban-board { grid-template-columns:repeat(3,1fr); } }
@media (max-width:768px)  { .kanban-board{grid-template-columns:repeat(2,1fr);} .drawer{width:100%;} }
</style>
