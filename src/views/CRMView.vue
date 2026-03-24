<template>
  <div class="crm-page">

    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">
          CRM
          <span class="crm-total">{{ leads.stats.total }} leads</span>
        </h1>
        <p class="page-subtitle">Gerencie seu pipeline de vendas</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" @click="pedirNotificacao">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          {{ push.status.value === 'granted' ? 'Notif. ativas' : 'Notificações' }}
        </button>
        <button class="btn btn-primary" @click="openNew()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo lead
        </button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid kpi-grid--5">
      <div class="kpi-card">
        <span class="kpi-label">Total</span>
        <span class="kpi-value" style="color:var(--status-info)">{{ leads.stats.total }}</span>
        <span class="kpi-sub">leads</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Negociando</span>
        <span class="kpi-value kpi-value--warning">{{ leads.stats.negociando }}</span>
        <span class="kpi-sub">demo + negoc.</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Fechados</span>
        <span class="kpi-value kpi-value--accent">{{ leads.stats.fechados }}</span>
        <span class="kpi-sub">convertidos</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Follow-up hoje</span>
        <span class="kpi-value kpi-value--danger">{{ leads.stats.fuHoje }}</span>
        <span class="kpi-sub">pendentes</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Pipeline</span>
        <span class="kpi-value" style="color:var(--status-info)">{{ fmt(leads.stats.pipe) }}</span>
        <span class="kpi-sub">potencial</span>
      </div>
    </div>

    <!-- Sel bar -->
    <Transition name="sel-bar">
      <div v-if="selected.size > 0" class="sel-bar">
        <span class="sel-count">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {{ selected.size }} selecionado{{ selected.size !== 1 ? 's' : '' }}
        </span>
        <select v-model="selEtapa" class="form-select" style="width:auto;font-size:.82rem;padding:.4rem .75rem">
          <option value="">Mover para...</option>
          <option v-for="e in ETAPAS" :key="e.id" :value="e.id">{{ e.label }}</option>
        </select>
        <button class="btn btn-primary btn-sm" @click="moverSelecionados">Mover</button>
        <button class="btn btn-danger btn-sm" @click="excluirSelecionados">Excluir</button>
        <button class="btn btn-ghost btn-sm" @click="selected = new Set()">Limpar</button>
      </div>
    </Transition>

    <!-- Tabs -->
    <div class="crm-tabs">
      <button class="crm-tab" :class="{ active: tab === 'kanban' }" @click="tab = 'kanban'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Kanban
      </button>
      <button class="crm-tab" :class="{ active: tab === 'tabela' }" @click="tab = 'tabela'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        Tabela
      </button>
    </div>

    <!-- KANBAN -->
    <div v-if="tab === 'kanban'" class="kanban-board">
      <div
        v-for="e in ETAPAS"
        :key="e.id"
        class="kanban-col"
        :class="`kanban-col--${e.id}`"
      >
        <div class="kanban-col-header">
          <div class="kanban-col-title" :style="{ color: e.color }">
            <span class="col-dot" :style="{ background: e.color }"></span>
            {{ e.label }}
          </div>
          <span class="kanban-col-count">{{ byEtapa(e.id).length }}</span>
        </div>
        <div class="kanban-cards">
          <div
            v-for="l in byEtapa(e.id)"
            :key="l.id"
            class="kanban-card"
            :class="{ 'kanban-card--followup': getFU(l.id) }"
            @click="openLead(l.id)"
          >
            <div class="kb-name">{{ l.nome }}</div>
            <div class="kb-neg">{{ l.negocio || l.categoria || '—' }}</div>
            <div v-if="l.site_atual" class="kb-servico">{{ l.site_atual }}</div>
            <div class="kb-footer">
              <span class="kb-tel">{{ l.telefone }}</span>
              <span class="kb-pri" :class="`pri-${l.prioridade}`">{{ l.prioridade }}</span>
            </div>
            <div v-if="l.proximo_followup" class="kb-fu">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {{ fmtData(l.proximo_followup) }}
            </div>
          </div>
          <button class="kb-add-btn" @click="openNewEtapa(e.id)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Adicionar
          </button>
        </div>
      </div>
    </div>

    <!-- TABELA -->
    <div v-if="tab === 'tabela'">
      <div class="crm-filters">
        <div style="position:relative;flex:1;min-width:200px">
          <svg style="position:absolute;left:.75rem;top:50%;transform:translateY(-50%);color:var(--text-tertiary)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="search" class="form-input" style="padding-left:2.25rem" placeholder="Buscar lead..." />
        </div>
        <select v-model="filterEtapa" class="form-select" style="width:auto">
          <option value="">Todas etapas</option>
          <option v-for="e in ETAPAS" :key="e.id" :value="e.id">{{ e.label }}</option>
        </select>
        <select v-model="filterPri" class="form-select" style="width:auto">
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
              <th><input type="checkbox" class="cb" @change="toggleAll($event.target.checked)" /></th>
              <th>Nome</th>
              <th>Negócio</th>
              <th>Telefone</th>
              <th>Etapa</th>
              <th>Prioridade</th>
              <th>Follow-up</th>
              <th>Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!listaFiltrada.length">
              <td colspan="9" class="empty-row">Nenhum lead encontrado</td>
            </tr>
            <tr
              v-for="l in listaFiltrada"
              :key="l.id"
              :class="{ 'row-selected': selected.has(l.id) }"
              style="cursor:pointer"
              @click="openLead(l.id)"
            >
              <td @click.stop>
                <input type="checkbox" class="cb"
                  :checked="selected.has(l.id)"
                  @change="toggleSel(l.id, $event.target.checked)"
                />
              </td>
              <td style="font-weight:600">{{ l.nome }}</td>
              <td class="text-muted">{{ l.negocio || '—' }}</td>
              <td>
                <a :href="'https://wa.me/55' + l.telefone.replace(/\D/g,'')" target="_blank"
                  class="wa-link" @click.stop>{{ l.telefone }}</a>
              </td>
              <td>
                <span class="etapa-badge" :style="{ background: etapaColor(l.etapa) + '20', color: etapaColor(l.etapa) }">
                  {{ etapaLabel(l.etapa) }}
                </span>
              </td>
              <td>
                <span class="pri-dot" :class="`pri-${l.prioridade}`">{{ l.prioridade }}</span>
              </td>
              <td class="text-muted text-sm">{{ l.proximo_followup ? fmtData(l.proximo_followup) : '—' }}</td>
              <td style="font-weight:600;color:var(--accent)">{{ l.valor_estimado ? fmt(l.valor_estimado) : '—' }}</td>
              <td @click.stop>
                <button class="btn btn-ghost btn-sm btn-icon" @click="openLead(l.id)" title="Editar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- DRAWER BACKDROP -->
  <Transition name="fade">
    <div v-if="drawerOpen" class="drawer-backdrop" @click="closeDrawer"></div>
  </Transition>

  <!-- DRAWER LEAD -->
  <Transition name="drawer-slide">
    <div v-if="drawerOpen" class="drawer">
      <div class="drawer-header">
        <h3 class="drawer-title">{{ drawerTitle }}</h3>
        <button class="btn btn-ghost btn-icon" @click="closeDrawer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="drawer-body">

        <!-- Informações -->
        <div class="drawer-section">
          <h4 class="drawer-section-title">Informações</h4>
          <div class="form-group">
            <label class="form-label">Nome *</label>
            <input v-model="form.nome" class="form-input" placeholder="Nome do responsável" />
          </div>
          <div class="form-group">
            <label class="form-label">Negócio</label>
            <input v-model="form.negocio" class="form-input" placeholder="Ex: Salão da Maria" />
          </div>
          <div class="form-group">
            <label class="form-label">Telefone *</label>
            <input v-model="form.telefone" class="form-input" placeholder="(47) 99999-9999" />
          </div>
          <div class="form-group">
            <label class="form-label">Categoria</label>
            <select v-model="form.categoria" class="form-select">
              <option value="">Selecionar...</option>
              <option>Academia</option><option>Salão de Beleza</option><option>Clínica</option>
              <option>Restaurante</option><option>Pet Shop</option><option>Oficina Mecânica</option>
              <option>Confecção</option><option>Advocacia</option><option>Personal Trainer</option><option>Outro</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Cidade</label>
            <input v-model="form.cidade" class="form-input" placeholder="Ex: Brusque/SC" />
          </div>
          <div class="form-group">
            <label class="form-label">Instagram</label>
            <input v-model="form.instagram" class="form-input" placeholder="@perfil" />
          </div>
        </div>

        <!-- Funil -->
        <div class="drawer-section">
          <h4 class="drawer-section-title">Funil</h4>
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
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Valor estimado (R$)</label>
            <input v-model.number="form.valor_estimado" class="form-input" type="number" placeholder="797" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Próximo follow-up</label>
            <input v-model="form.proximo_followup" class="form-input" type="date" />
          </div>
          <div class="followup-check">
            <input id="cb-followup" v-model="form.needs_followup" type="checkbox" class="cb" />
            <label for="cb-followup" class="followup-check-label">
              ⚡ Marcar como precisa de follow-up
            </label>
          </div>
        </div>

        <!-- Notas -->
        <div class="drawer-section">
          <h4 class="drawer-section-title">Notas</h4>
          <div class="form-group">
            <textarea v-model="form.notas" class="form-textarea" placeholder="Observações, objeções, contexto..."></textarea>
          </div>
        </div>

        <!-- Script rápido -->
        <div class="drawer-section">
          <h4 class="drawer-section-title">Script rápido</h4>
          <button class="btn btn-secondary w-full" style="justify-content:center;font-size:.82rem" @click="gerarScript">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Gerar script para esta etapa
          </button>
          <div v-if="script" class="script-box">{{ script }}</div>
        </div>

        <!-- Histórico etapas -->
        <div v-if="histEtapas.length" class="drawer-section">
          <h4 class="drawer-section-title">Histórico de etapas</h4>
          <div v-for="h in histEtapas" :key="h.ts" class="hist-item">
            <span style="color:var(--accent)">{{ h.de }}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            <span style="color:var(--text-primary)">{{ h.para }}</span>
            <span class="hist-time">{{ fmtDataHora(h.ts) }}</span>
          </div>
        </div>

        <!-- Conversas -->
        <div v-if="currentLeadId" class="drawer-section">
          <h4 class="drawer-section-title">Histórico de conversas</h4>
          <div class="conv-list">
            <div v-if="!leads.conversas.length" class="conv-empty">Nenhuma conversa registrada</div>
            <div v-for="c in leads.conversas" :key="c.id" class="conv-item">
              <div class="conv-meta">
                <span class="conv-canal">{{ c.canal }}</span>
                <span class="conv-dir" :class="c.direcao === 'recebido' ? 'dir-in' : 'dir-out'">
                  {{ c.direcao === 'recebido' ? '← Recebido' : '→ Enviado' }}
                </span>
                <span class="conv-data">{{ fmtDataHora(c.data) }}</span>
              </div>
              <div class="conv-msg">{{ c.mensagem }}</div>
            </div>
          </div>
          <div class="conv-add-row">
            <select v-model="convCanal" class="form-select" style="flex:0 0 auto;width:auto;font-size:.8rem;padding:.4rem .7rem">
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="email">Email</option>
              <option value="ligacao">Ligação</option>
            </select>
            <select v-model="convDir" class="form-select" style="flex:0 0 auto;width:auto;font-size:.8rem;padding:.4rem .7rem">
              <option value="enviado">Enviado</option>
              <option value="recebido">Recebido</option>
            </select>
          </div>
          <div class="conv-add">
            <textarea v-model="convMsg" class="form-textarea" placeholder="Registrar mensagem..." rows="2"
              style="min-height:60px;font-size:.85rem"
              @keydown.ctrl.enter="addConversa"></textarea>
            <button class="btn btn-primary btn-sm" style="width:100%;justify-content:center;margin-top:.5rem" @click="addConversa">
              + Registrar
            </button>
          </div>
        </div>
      </div>

      <!-- Drawer footer -->
      <div class="drawer-footer">
        <a :href="'https://wa.me/55' + form.telefone.replace(/\D/g,'') + '?text=Oi ' + form.nome + '!'" target="_blank" class="btn btn-secondary" style="gap:.5rem">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </a>
        <button class="btn btn-primary" style="flex:1;justify-content:center" @click="salvar">Salvar</button>
        <button v-if="currentLeadId" class="btn btn-danger btn-icon" @click="deletar" title="Excluir lead">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
    </div>
  </Transition>

  <!-- Modal fechar negócio -->
  <FecharNegocioModal
    v-model="fecharOpen"
    :lead="fecharLead"
    @fechado="onNegocioFechado"
  />
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import FecharNegocioModal from '@/components/crm/FecharNegocioModal.vue'
import { useLeadsStore, ETAPAS } from '@/stores/leads'
import { useAuthStore } from '@/stores/auth'
import { useFinStore } from '@/stores/fin'
import { useSaving } from '@/composables/useSaving'
import { useRealtime } from '@/composables/useRealtime'
import { usePushNotifications } from '@/composables/usePushNotifications'

const leads = useLeadsStore()
const auth  = useAuthStore()
const fin   = useFinStore()
const { run, toast } = useSaving()
const push  = usePushNotifications()
const fmt   = fin.fmt

const tab         = ref('kanban')
const search      = ref('')
const filterEtapa = ref('')
const filterPri   = ref('')
const selected    = ref(new Set())
const selEtapa    = ref('')

const fecharOpen = ref(false)
const fecharLead = ref(null)

const drawerOpen    = ref(false)
const drawerTitle   = ref('Novo Lead')
const currentLeadId = ref(null)
const script        = ref('')
const histEtapas    = ref([])
const convCanal     = ref('whatsapp')
const convDir       = ref('enviado')
const convMsg       = ref('')

const form = ref({
  nome:'', negocio:'', telefone:'', categoria:'',
  cidade:'', instagram:'', site_atual:'', etapa:'contato',
  prioridade:'media', valor_estimado:'', proximo_followup:'', notas:'', needs_followup: false
})

const listaFiltrada = computed(() => {
  let lista = leads.leads
  if (search.value) {
    const q = search.value.toLowerCase()
    lista = lista.filter(l => (l.nome + l.negocio + l.telefone).toLowerCase().includes(q))
  }
  if (filterEtapa.value) lista = lista.filter(l => l.etapa === filterEtapa.value)
  if (filterPri.value)   lista = lista.filter(l => l.prioridade === filterPri.value)
  return lista
})

// Computed cacheado — agrupa leads por etapa uma vez, evita filter em cada render
const leadsByEtapa = computed(() => {
  const map = {}
  for (const l of leads.leads) {
    if (!map[l.etapa]) map[l.etapa] = []
    map[l.etapa].push(l)
  }
  return map
})
function byEtapa(etapa) { return leadsByEtapa.value[etapa] || [] }

// Set de IDs com followup — evita .find() em cada card
const followupIds = computed(() => new Set(leads.leads.filter(l => l.needs_followup).map(l => l.id)))

const ETAPA_LABEL = { contato:'Contato', interesse:'Interesse', demo:'Demo enviada', negociacao:'Negociação', fechado:'Fechado', perdido:'Perdido' }
const ETAPA_COLOR = { contato:'#3b82f6', interesse:'#f59e0b', demo:'#8b5cf6', negociacao:'#f97316', fechado:'#22c55e', perdido:'#6b7280' }
const PRI_COLOR   = { alta:'#ef4444', media:'#f59e0b', baixa:'#3b82f6' }

function etapaLabel(e)  { return ETAPA_LABEL[e] || e }
function etapaColor(e)  { return ETAPA_COLOR[e] || '#6b7280' }
function priColor(p)    { return PRI_COLOR[p] || '#9ca3af' }
function getFU(id)      { return followupIds.value.has(id) }
function fmtData(d)     { return new Date(d).toLocaleDateString('pt-BR') }
function fmtDataHora(d) { return new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) }

function toggleSel(id, checked) {
  if (checked) selected.value.add(id)
  else selected.value.delete(id)
  selected.value = new Set(selected.value)
}
function toggleAll(checked) {
  listaFiltrada.value.forEach(l => checked ? selected.value.add(l.id) : selected.value.delete(l.id))
  selected.value = new Set(selected.value)
}

async function moverSelecionados() {
  if (!selEtapa.value) { toast('Escolha uma etapa', 'err'); return }
  const ids = [...selected.value]
  await run(async () => {
    for (const id of ids) {
      const l = leads.getById(id)
      if (!l) continue
      await leads.upsert({ ...l, etapa: selEtapa.value, updated_at: new Date().toISOString() })
    }
    selected.value.clear()
    selEtapa.value = ''
  }, ids.length + ' leads movidos ✓')
}

async function excluirSelecionados() {
  const ids = [...selected.value]
  if (!ids.length) return
  if (!confirm('Excluir ' + ids.length + ' lead(s)? Esta ação não pode ser desfeita.')) return
  ids.forEach(id => leads.remove(id))
  selected.value.clear()
  toast(ids.length + ' removido(s) ✓', 'ok')
}

function openNew(etapa = 'contato') {
  currentLeadId.value = null
  drawerTitle.value = 'Novo Lead'
  script.value = ''
  histEtapas.value = []
  leads.conversas = []
  form.value = { nome:'', negocio:'', telefone:'', categoria:'', cidade:'', instagram:'', site_atual:'', etapa, prioridade:'media', valor_estimado:'', proximo_followup:'', notas:'', needs_followup: false }
  drawerOpen.value = true
}
function openNewEtapa(etapa) { openNew(etapa) }

async function openLead(id) {
  const l = leads.getById(id)
  if (!l) return
  currentLeadId.value = id
  drawerTitle.value = l.nome
  script.value = ''
  form.value = {
    nome: l.nome||'', negocio: l.negocio||'', telefone: l.telefone||'',
    categoria: l.categoria||'', cidade: l.cidade||'', instagram: l.instagram||'',
    site_atual: l.site_atual||'', etapa: l.etapa||'contato',
    prioridade: l.prioridade||'media', valor_estimado: l.valor_estimado||'',
    proximo_followup: l.proximo_followup||'', notas: l.notas||'', needs_followup: l.needs_followup||false
  }
  try {
    const raw = localStorage.getItem('slac_hist_' + id)
    histEtapas.value = raw ? JSON.parse(raw) : []
  } catch { histEtapas.value = [] }
  drawerOpen.value = true
  await leads.loadConversas(id)
}

function closeDrawer() {
  drawerOpen.value = false
  currentLeadId.value = null
  leads.conversas = []
}

function salvarHistorico(id, de, para) {
  if (de === para) return
  try {
    const key = 'slac_hist_' + id
    const hist = JSON.parse(localStorage.getItem(key) || '[]')
    hist.unshift({ de: etapaLabel(de), para: etapaLabel(para), ts: new Date().toISOString() })
    localStorage.setItem(key, JSON.stringify(hist.slice(0, 20)))
  } catch {}
}

async function salvar() {
  if (!form.value.nome || !form.value.telefone) { toast('Nome e telefone obrigatórios', 'err'); return }
  const eraFechado     = currentLeadId.value ? leads.getById(currentLeadId.value)?.etapa === 'fechado' : false
  const vaiFicarFechado = form.value.etapa === 'fechado'
  if (currentLeadId.value) {
    const l = leads.getById(currentLeadId.value)
    if (l && l.etapa !== form.value.etapa) salvarHistorico(currentLeadId.value, l.etapa, form.value.etapa)
  }
  const payload = {
    id: currentLeadId.value || 'l' + Date.now(),
    user_id: auth.user.id,
    nome: form.value.nome, telefone: form.value.telefone, negocio: form.value.negocio,
    categoria: form.value.categoria, cidade: form.value.cidade, instagram: form.value.instagram,
    site_atual: form.value.site_atual, etapa: form.value.etapa, prioridade: form.value.prioridade,
    valor_estimado: parseFloat(form.value.valor_estimado) || 0,
    proximo_followup: form.value.proximo_followup || null,
    notas: form.value.notas, needs_followup: form.value.needs_followup || false,
    updated_at: new Date().toISOString()
  }
  await run(() => leads.upsert(payload), 'Salvo ✓')
  if (vaiFicarFechado && !eraFechado) {
    fecharLead.value = leads.getById(payload.id) || payload
    fecharOpen.value = true
    return
  }
  closeDrawer()
}

async function deletar() {
  if (!currentLeadId.value) return
  if (!confirm('Remover este lead permanentemente?')) return
  leads.remove(currentLeadId.value)
  closeDrawer()
  toast('Lead removido ✓', 'ok')
}

function gerarScript() {
  const etapa = form.value.etapa
  const nome = form.value.nome || 'cliente'
  const negocio = form.value.negocio || 'seu negócio'
  const scripts = {
    contato: `Oi ${nome}! Tudo bem? Me chamo Eduardo da Sano Lab.\n\nVi que o ${negocio} está no Google Maps mas ainda não tem um site profissional.\n\nCriamos sites que aparecem no Google e trazem clientes novos — com resultado real.\n\nPostaria ver uma prévia gratuita para o ${negocio}?`,
    interesse: `Oi ${nome}! Que ótimo que gostou da ideia.\n\nVou preparar uma prévia personalizada para o ${negocio} — em 24h você já vê como ficaria.\n\nPosso começar hoje. Qual é o seu WhatsApp para eu enviar quando estiver pronto?`,
    demo: `Oi ${nome}! Preparei a prévia do site para o ${negocio}.\n\n[Link da prévia]\n\nO que achou? Posso ajustar qualquer detalhe que quiser. Assim que você aprovar, finalizamos e subimos em até 3 dias.`,
    negociacao: `Oi ${nome}! Passando para confirmar nosso acordo.\n\nO site do ${negocio} está pronto para ir ao ar. O investimento é R$797 com 50% agora e 50% na entrega.\n\nPodemos fechar hoje?`,
    fechado: `Oi ${nome}! Parabéns pelo investimento no ${negocio}!\n\nVou iniciar a produção hoje. Em breve entro em contato com as próximas etapas.\n\nObrigado pela confiança!`,
    perdido: `Oi ${nome}, tudo bem?\n\nSei que o momento pode não ter sido ideal. Quando quiser retomar, estarei por aqui.\n\nGuardo sua indicação com carinho — qualquer necessidade, é só chamar!`
  }
  script.value = scripts[etapa] || 'Script não disponível para esta etapa.'
}

function onNegocioFechado() {
  closeDrawer()
  fecharOpen.value = false
  fecharLead.value = null
}

async function addConversa() {
  if (!currentLeadId.value) { toast('Salve o lead primeiro', 'err'); return }
  if (!convMsg.value.trim()) return
  await run(
    () => leads.addConversa(currentLeadId.value, convCanal.value, convDir.value, convMsg.value.trim()),
    'Registrado ✓'
  )
  convMsg.value = ''
}

async function pedirNotificacao() {
  if (!push.isSupported()) { toast('Notificações não suportadas neste browser', 'err'); return }
  const current = await push.getSubscriptionStatus()
  if (current === 'granted') {
    await push.unsubscribe()
    toast('Notificações desativadas', 'info')
    return
  }
  const ok = await push.subscribe()
  if (ok) toast('✓ Notificações ativadas! Você receberá alertas diários às 8h', 'ok')
  else toast('Permissão negada ou erro ao ativar', 'err')
}

onMounted(() => {
  if (!auth.user) return
  useRealtime(auth.user.id, { onLeads: () => leads.load() })
})
</script>

<style scoped>
.crm-page {
  padding: 2rem 2rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
}

/* Total badge no título */
.crm-total {
  font-family: var(--font-body);
  font-size: .85rem;
  font-weight: 400;
  color: var(--text-tertiary);
  margin-left: .5rem;
}

/* KPI grid */
.kpi-grid { display: grid; gap: 1rem; }
.kpi-grid--5 { grid-template-columns: repeat(5, 1fr); }

/* Sel bar */
.sel-bar {
  display: flex;
  align-items: center;
  gap: .75rem;
  flex-wrap: wrap;
  background: var(--accent-subtle);
  border: 1px solid var(--accent);
  border-radius: var(--radius-lg);
  padding: .75rem 1.25rem;
}
.sel-count {
  display: flex;
  align-items: center;
  gap: .375rem;
  font-size: .82rem;
  font-weight: 700;
  color: var(--accent);
}

/* Tabs */
.crm-tabs {
  display: flex;
  gap: .25rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: .3rem;
  width: fit-content;
}
.crm-tab {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .45rem 1rem;
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
  font-family: var(--font-body);
  font-size: .85rem;
  font-weight: 500;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease;
}
.crm-tab.active {
  background: var(--accent);
  color: #fff;
}
.crm-tab:not(.active):hover {
  background: var(--bg-overlay);
  color: var(--text-primary);
}

/* Kanban */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: .75rem;
  min-height: 480px;
}
.kanban-col {
  min-width: 0;
  max-width: 100%;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.kanban-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .75rem 1rem;
  border-bottom: 1px solid var(--border-subtle);
}
.kanban-col-title {
  display: flex;
  align-items: center;
  gap: .5rem;
  font-family: var(--font-display);
  font-size: .78rem;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase;
}
.col-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.kanban-col-count {
  font-size: .72rem;
  background: var(--bg-overlay);
  color: var(--text-tertiary);
  padding: .1rem .45rem;
  border-radius: var(--radius-full);
  font-weight: 600;
}
.kanban-cards {
  flex: 1;
  padding: .625rem;
  display: flex;
  flex-direction: column;
  gap: .5rem;
  overflow-y: auto;
}
.kanban-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: .875rem;
  cursor: pointer;
  transition: box-shadow 150ms ease, border-color 150ms ease, transform 150ms ease;
}
.kanban-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-strong);
  transform: translateY(-1px);
}
.kanban-card--followup {
  border-left: 3px solid var(--status-warning);
}
.kb-name { font-weight: 600; font-size: .875rem; color: var(--text-primary); margin-bottom: .2rem; }
.kb-neg  { font-size: .78rem; color: var(--text-tertiary); margin-bottom: .5rem; }
.kb-servico { font-size: .68rem; color: var(--status-info); margin-bottom: .5rem; }
.kb-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: .4rem;
}
.kb-tel { font-size: .72rem; color: var(--text-tertiary); }
.kb-pri { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
.pri-alta  { color: var(--status-danger); }
.pri-media { color: var(--status-warning); }
.pri-baixa { color: var(--status-info); }
.kb-fu {
  display: flex; align-items: center; gap: .3rem;
  font-size: .7rem; color: var(--status-warning); margin-top: .25rem;
}
.kb-add-btn {
  display: flex; align-items: center; gap: .375rem; justify-content: center;
  width: 100%; padding: .5rem;
  background: transparent; border: 1px dashed var(--border-default);
  border-radius: var(--radius-md); color: var(--text-tertiary);
  font-size: .78rem; cursor: pointer; font-family: var(--font-body);
  transition: border-color 150ms ease, color 150ms ease, background-color 150ms ease;
}
.kb-add-btn:hover {
  border-color: var(--accent); color: var(--accent); background: var(--accent-subtle);
}

/* Filters */
.crm-filters {
  display: flex; gap: .75rem; flex-wrap: wrap; align-items: center;
  margin-bottom: .75rem;
}

/* Table extras */
.cb { accent-color: var(--accent); cursor: pointer; width: 15px; height: 15px; }
.row-selected td { background: var(--accent-subtle) !important; }
.empty-row { text-align: center; color: var(--text-tertiary); padding: 2rem !important; font-size: .875rem; }
.wa-link { color: var(--accent); font-size: .82rem; }
.etapa-badge {
  display: inline-block; font-size: .72rem; font-weight: 600;
  padding: .2rem .6rem; border-radius: var(--radius-full);
  text-transform: uppercase; letter-spacing: .03em; white-space: nowrap;
}
.pri-dot { font-size: .78rem; font-weight: 700; text-transform: uppercase; }

/* Drawer */
.drawer {
  position: fixed; top: 0; right: 0; height: 100vh;
  width: 440px; max-width: 95vw;
  background: var(--bg-elevated);
  border-left: 1px solid var(--border-default);
  box-shadow: var(--shadow-lg);
  z-index: 801;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.drawer-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.5);
  backdrop-filter: blur(2px);
  z-index: 800;
}
.drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.25rem 1.25rem 1rem;
  border-bottom: 1px solid var(--border-default);
  flex-shrink: 0;
}
.drawer-title {
  font-family: var(--font-display); font-size: 1rem; font-weight: 700;
  color: var(--text-primary); letter-spacing: -.01em;
}
.drawer-body {
  flex: 1; overflow-y: auto; padding: 1rem 1.25rem;
  display: flex; flex-direction: column; gap: 1rem;
}
.drawer-section {
  display: flex; flex-direction: column; gap: .625rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-subtle);
}
.drawer-section:last-child { border-bottom: none; }
.drawer-section-title {
  font-family: var(--font-display); font-size: .72rem; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase; color: var(--text-tertiary);
}
.drawer-footer {
  display: flex; align-items: center; gap: .625rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-default);
  flex-shrink: 0;
}

/* Follow-up checkbox */
.followup-check {
  display: flex; align-items: center; gap: .625rem; margin-top: .25rem;
}
.followup-check-label {
  font-size: .82rem; font-weight: 500; color: var(--status-warning); cursor: pointer;
}

/* Script box */
.script-box {
  background: var(--bg-overlay); border: 1px solid var(--border-default);
  border-radius: var(--radius-md); padding: .875rem;
  font-size: .82rem; color: var(--text-secondary); white-space: pre-wrap;
  line-height: 1.6; margin-top: .25rem;
}

/* Histórico */
.hist-item {
  display: flex; align-items: center; gap: .5rem;
  font-size: .78rem; color: var(--text-tertiary);
}
.hist-time { margin-left: auto; font-size: .72rem; color: var(--text-tertiary); }

/* Conversas */
.conv-list { display: flex; flex-direction: column; gap: .5rem; }
.conv-empty { font-size: .78rem; color: var(--text-tertiary); text-align: center; padding: .75rem; }
.conv-item {
  background: var(--bg-overlay); border-radius: var(--radius-md); padding: .625rem .75rem;
  border: 1px solid var(--border-subtle);
}
.conv-meta { display: flex; align-items: center; gap: .5rem; margin-bottom: .25rem; }
.conv-canal { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--text-tertiary); }
.conv-dir { font-size: .68rem; font-weight: 600; }
.dir-in  { color: var(--accent); }
.dir-out { color: var(--status-warning); }
.conv-data { font-size: .68rem; color: var(--text-tertiary); margin-left: auto; }
.conv-msg { font-size: .8rem; color: var(--text-primary); }
.conv-add-row { display: flex; gap: .5rem; margin-bottom: .5rem; }

/* Transitions */
.sel-bar-enter-active, .sel-bar-leave-active { transition: all 200ms ease; }
.sel-bar-enter-from, .sel-bar-leave-to { opacity: 0; transform: translateY(-8px); }

.fade-enter-active, .fade-leave-active { transition: opacity 200ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.drawer-slide-enter-active, .drawer-slide-leave-active { transition: transform 280ms ease; }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }

/* Responsive */
@media (max-width: 1100px) {
  .kpi-grid--5 { grid-template-columns: repeat(3, 1fr); }
  .kanban-board { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .crm-page { padding: 1rem 1rem 5rem; }
  .kpi-grid--5 { grid-template-columns: repeat(2, 1fr); }
  .kanban-board { grid-template-columns: repeat(2, 1fr); }
}
</style>
