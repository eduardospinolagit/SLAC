<template>
  <div class="page active">
    <!-- TOPBAR -->
    <div class="topbar">
      <h1>CRM <span style="color:var(--gr);font-weight:400;font-size:.85rem">— {{ leads.stats.total }} leads</span></h1>
      <div class="tbar-right">
        <button class="btn btn-g" @click="openNew()">+ Novo lead</button>
      </div>
    </div>

    <!-- SEL BAR -->
    <div class="crm-sel-bar" :class="{ show: selected.size > 0 }">
      <span style="font-size:.82rem;font-weight:600;color:var(--g)">{{ selected.size }} selecionado{{ selected.size !== 1 ? 's' : '' }}</span>
      <select v-model="selEtapa" class="fs" style="padding:5px 10px;font-size:.8rem;width:auto">
        <option value="">Mover para...</option>
        <option v-for="e in ETAPAS" :key="e.id" :value="e.id">{{ e.label }}</option>
      </select>
      <button class="btn btn-g" style="padding:5px 12px;font-size:.78rem" @click="moverSelecionados">Mover</button>
      <button class="btn btn-r" style="padding:5px 12px;font-size:.78rem" @click="excluirSelecionados">Excluir</button>
      <button class="btn btn-gh" style="padding:5px 10px;font-size:.78rem" @click="selected.value = new Set()">Limpar</button>
    </div>

    <div class="content">
      <!-- KPIs -->
      <div class="kpi-grid" style="--cols:5;margin-bottom:16px">
        <div class="kpi"><div class="kl">Total</div><div class="kv c-b">{{ leads.stats.total }}</div><div class="ks">leads</div></div>
        <div class="kpi"><div class="kl">Negociando</div><div class="kv c-a">{{ leads.stats.negociando }}</div><div class="ks">demo+negoc.</div></div>
        <div class="kpi"><div class="kl">Fechados</div><div class="kv c-g">{{ leads.stats.fechados }}</div><div class="ks">convertidos</div></div>
        <div class="kpi"><div class="kl">Follow-up</div><div class="kv c-r">{{ leads.stats.fuHoje }}</div><div class="ks">hoje</div></div>
        <div class="kpi"><div class="kl">Pipeline</div><div class="kv c-p">{{ fmt(leads.stats.pipe) }}</div><div class="ks">potencial</div></div>
      </div>

      <!-- TABS -->
      <div class="crm-tabs">
        <button class="crm-tab" :class="{ active: tab === 'kanban' }" @click="tab = 'kanban'">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Kanban
        </button>
        <button class="crm-tab" :class="{ active: tab === 'tabela' }" @click="tab = 'tabela'">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          Tabela
        </button>
      </div>

      <!-- KANBAN -->
      <div v-if="tab === 'kanban'" class="kanban">
        <div v-for="e in ETAPAS" :key="e.id" class="kb-col">
          <div class="kb-col-head">
            <div class="kb-col-title">
              <div class="kb-dot" :style="{ background: e.color }"></div>
              {{ e.label }}
            </div>
            <span class="kb-count">{{ byEtapa(e.id).length }}</span>
          </div>
          <div class="kb-cards">
            <div
              v-for="l in byEtapa(e.id)"
              :key="l.id"
              class="kb-card"
              @click="openLead(l.id)"
            >
              <div class="kb-card-name">{{ l.nome }}</div>
              <div class="kb-card-neg">{{ l.negocio || l.categoria || '—' }}</div>
              <div v-if="l.site_atual" style="font-size:.68rem;color:var(--b);margin-bottom:6px">{{ l.site_atual }}</div>
              <div class="kb-card-footer">
                <div class="kb-card-tel">{{ l.telefone }}</div>
                <span class="kb-card-pri" :class="'pri-' + l.prioridade">{{ l.prioridade }}</span>
              </div>
              <div v-if="l.proximo_followup" class="kb-card-fu">
                📅 {{ fmtData(l.proximo_followup) }}
              </div>
            </div>
            <button class="kb-add" @click="openNewEtapa(e.id)">+ Adicionar</button>
          </div>
        </div>
      </div>

      <!-- TABELA -->
      <div v-if="tab === 'tabela'">
        <div class="crm-filters">
          <input v-model="search" class="crm-search" placeholder="Buscar lead..." />
          <select v-model="filterEtapa" class="fs" style="width:auto;padding:7px 10px;font-size:.82rem">
            <option value="">Todas etapas</option>
            <option v-for="e in ETAPAS" :key="e.id" :value="e.id">{{ e.label }}</option>
          </select>
          <select v-model="filterPri" class="fs" style="width:auto;padding:7px 10px;font-size:.82rem">
            <option value="">Todas prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>

        <div class="tbox">
          <div class="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th><input type="checkbox" style="accent-color:#22c55e;cursor:pointer" @change="toggleAll($event.target.checked)" /></th>
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
                  <td colspan="9" style="text-align:center;color:var(--gr);padding:20px">Nenhum lead</td>
                </tr>
                <tr
                  v-for="l in listaFiltrada"
                  :key="l.id"
                  style="cursor:pointer"
                  :style="selected.has(l.id) ? 'background:rgba(34,197,94,.05)' : ''"
                  @click="openLead(l.id)"
                >
                  <td @click.stop>
                    <input type="checkbox" style="accent-color:#22c55e;cursor:pointer"
                      :checked="selected.has(l.id)"
                      @change="toggleSel(l.id, $event.target.checked)"
                    />
                  </td>
                  <td style="font-weight:500">{{ l.nome }}</td>
                  <td style="color:var(--gr)">{{ l.negocio || '—' }}</td>
                  <td>
                    <a :href="'https://wa.me/55' + l.telefone.replace(/\D/g,'')" target="_blank"
                      style="color:var(--g);font-size:.8rem"
                      @click.stop>{{ l.telefone }}</a>
                  </td>
                  <td>
                    <span class="tag" :style="{ background: etapaColor(l.etapa) + '22', color: etapaColor(l.etapa) }">
                      {{ etapaLabel(l.etapa) }}
                    </span>
                  </td>
                  <td :style="{ color: priColor(l.prioridade), fontSize: '.78rem' }">{{ l.prioridade }}</td>
                  <td style="color:var(--gr)">{{ l.proximo_followup ? fmtData(l.proximo_followup) : '—' }}</td>
                  <td style="color:var(--g)">{{ l.valor_estimado ? fmt(l.valor_estimado) : '—' }}</td>
                  <td @click.stop>
                    <button class="it-btn" @click="openLead(l.id)">✏</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- DRAWER OVERLAY -->
  <div id="drawer-overlay" :style="{ display: drawerOpen ? 'block' : 'none' }" @click="closeDrawer"></div>

  <!-- DRAWER LEAD -->
  <div class="lead-drawer" :class="{ open: drawerOpen }">
    <div class="drawer-head">
      <h3>{{ drawerTitle }}</h3>
      <button class="drawer-close" @click="closeDrawer">✕</button>
    </div>
    <div class="drawer-body">
      <!-- Informações -->
      <div class="drawer-section">
        <h4>Informações</h4>
        <div class="drawer-field"><label>Nome *</label><input v-model="form.nome" placeholder="Nome do responsável" /></div>
        <div class="drawer-field"><label>Negócio</label><input v-model="form.negocio" placeholder="Ex: Salão da Maria" /></div>
        <div class="drawer-field"><label>Telefone *</label><input v-model="form.telefone" placeholder="(47) 99999-9999" /></div>
        <div class="drawer-field">
          <label>Categoria</label>
          <select v-model="form.categoria">
            <option value="">Selecionar...</option>
            <option>Academia</option><option>Salão de Beleza</option><option>Clínica</option>
            <option>Restaurante</option><option>Pet Shop</option><option>Oficina Mecânica</option>
            <option>Confecção</option><option>Advocacia</option><option>Personal Trainer</option><option>Outro</option>
          </select>
        </div>
        <div class="drawer-field"><label>Cidade</label><input v-model="form.cidade" placeholder="Ex: Brusque/SC" /></div>
        <div class="drawer-field"><label>Instagram</label><input v-model="form.instagram" placeholder="@perfil" /></div>
      </div>

      <!-- Funil -->
      <div class="drawer-section">
        <h4>Funil</h4>
        <div class="drawer-field">
          <label>Serviço de interesse</label>
          <select v-model="form.site_atual">
            <option value="">Selecionar...</option>
            <option>Site Essencial</option><option>Site Profissional</option><option>Site Completo</option>
            <option>Google Meu Negócio</option><option>Tráfego Pago</option>
            <option>Automação WhatsApp</option><option>Manutenção</option><option>Pacote Completo</option><option>Outro</option>
          </select>
        </div>
        <div class="drawer-field">
          <label>Etapa</label>
          <select v-model="form.etapa">
            <option v-for="e in ETAPAS" :key="e.id" :value="e.id">{{ e.label }}</option>
          </select>
        </div>
        <div class="drawer-field">
          <label>Prioridade</label>
          <select v-model="form.prioridade">
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
        <div class="drawer-field"><label>Valor estimado (R$)</label><input v-model.number="form.valor_estimado" type="number" placeholder="797" min="0" /></div>
        <div class="drawer-field"><label>Próximo follow-up</label><input v-model="form.proximo_followup" type="date" /></div>
      </div>

      <!-- Notas -->
      <div class="drawer-section">
        <h4>Notas</h4>
        <div class="drawer-field">
          <textarea v-model="form.notas" placeholder="Observações, objeções, contexto..."></textarea>
        </div>
      </div>

      <!-- Script rápido -->
      <div class="drawer-section">
        <h4>Script rápido</h4>
        <button class="btn btn-gh" style="width:100%;justify-content:center;font-size:.8rem" @click="gerarScript">
          ✏ Gerar script para esta etapa
        </button>
        <div v-if="script" class="script-box">{{ script }}</div>
      </div>

      <!-- Histórico etapas -->
      <div v-if="histEtapas.length" class="drawer-section">
        <h4>Histórico de etapas</h4>
        <div v-for="h in histEtapas" :key="h.ts" style="display:flex;gap:8px;margin-bottom:6px;font-size:.78rem;color:var(--lt)">
          <span style="color:var(--g)">{{ h.de }}</span>
          <span style="color:var(--gr)">→</span>
          <span>{{ h.para }}</span>
          <span style="color:var(--gr);margin-left:auto">{{ fmtDataHora(h.ts) }}</span>
        </div>
      </div>

      <!-- Conversas -->
      <div v-if="currentLeadId" class="drawer-section">
        <h4>Histórico de conversas</h4>
        <div class="conv-list">
          <div v-if="!leads.conversas.length" style="font-size:.78rem;color:var(--gr);text-align:center;padding:8px">Nenhuma conversa registrada</div>
          <div v-for="c in leads.conversas" :key="c.id" class="conv-item">
            <div class="conv-meta">
              <span class="conv-canal">{{ c.canal }}</span>
              <span :style="{ fontSize: '.68rem', color: c.direcao === 'recebido' ? 'var(--g)' : 'var(--a)' }">
                {{ c.direcao === 'recebido' ? '← Recebido' : '→ Enviado' }}
              </span>
              <span class="conv-data">{{ fmtDataHora(c.data) }}</span>
            </div>
            <div class="conv-msg">{{ c.mensagem }}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:6px">
          <select v-model="convCanal" style="padding:6px 8px;font-size:.75rem;background:#0d0d0d;border:1px solid var(--brd);border-radius:6px;color:#fff;outline:none">
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="email">Email</option>
            <option value="ligacao">Ligação</option>
          </select>
          <select v-model="convDir" style="padding:6px 8px;font-size:.75rem;background:#0d0d0d;border:1px solid var(--brd);border-radius:6px;color:#fff;outline:none">
            <option value="enviado">Enviado</option>
            <option value="recebido">Recebido</option>
          </select>
        </div>
        <div class="conv-add">
          <textarea v-model="convMsg" class="conv-input" placeholder="Registrar mensagem..." rows="2"
            @keydown.ctrl.enter="addConversa"></textarea>
          <button class="conv-send" @click="addConversa">+ Registrar</button>
        </div>
      </div>
    </div>

    <div class="drawer-footer">
      <button class="wa-btn" @click="openWA">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        WhatsApp
      </button>
      <button class="save-lead-btn" @click="salvar">Salvar</button>
      <button v-if="currentLeadId" class="del-lead-btn" @click="deletar">🗑</button>
    </div>

    <div style="padding:0 18px 14px">
      <button class="notif-btn" @click="pedirNotificacao">
        <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        Ativar alertas de follow-up
      </button>
    </div>
  </div>

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

const leads = useLeadsStore()
const auth = useAuthStore()
const fin = useFinStore()
const { run, toast } = useSaving()
const fmt = fin.fmt

// State
const tab = ref('kanban')
const search = ref('')
const filterEtapa = ref('')
const filterPri = ref('')
const selected = ref(new Set())
const selEtapa = ref('')

// Modal fechar negócio
const fecharOpen = ref(false)
const fecharLead = ref(null)

// Drawer
const drawerOpen = ref(false)
const drawerTitle = ref('Novo Lead')
const currentLeadId = ref(null)
const script = ref('')
const histEtapas = ref([])
const convCanal = ref('whatsapp')
const convDir = ref('enviado')
const convMsg = ref('')

const form = ref({
  nome: '', negocio: '', telefone: '', categoria: '',
  cidade: '', instagram: '', site_atual: '', etapa: 'contato',
  prioridade: 'media', valor_estimado: '', proximo_followup: '', notas: ''
})

// Computed
const listaFiltrada = computed(() => {
  let lista = leads.leads
  if (search.value) {
    const q = search.value.toLowerCase()
    lista = lista.filter(l => (l.nome + l.negocio + l.telefone).toLowerCase().includes(q))
  }
  if (filterEtapa.value) lista = lista.filter(l => l.etapa === filterEtapa.value)
  if (filterPri.value) lista = lista.filter(l => l.prioridade === filterPri.value)
  return lista
})

function byEtapa(etapa) {
  return leads.leads.filter(l => l.etapa === etapa)
}

// Helpers
const ETAPA_LABEL = { contato:'Contato', interesse:'Interesse', demo:'Demo enviada', negociacao:'Negociação', fechado:'Fechado', perdido:'Perdido' }
const ETAPA_COLOR = { contato:'#3b82f6', interesse:'#f59e0b', demo:'#8b5cf6', negociacao:'#f97316', fechado:'#22c55e', perdido:'#555' }
const PRI_COLOR = { alta:'#ef4444', media:'#f59e0b', baixa:'#3b82f6' }

function etapaLabel(e) { return ETAPA_LABEL[e] || e }
function etapaColor(e) { return ETAPA_COLOR[e] || '#555' }
function priColor(p) { return PRI_COLOR[p] || '#999' }
function fmtData(d) { return new Date(d).toLocaleDateString('pt-BR') }
function fmtDataHora(d) { return new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) }

// Seleção múltipla
function toggleSel(id, checked) {
  if (checked) selected.value.add(id)
  else selected.value.delete(id)
  selected.value = new Set(selected.value) // trigger reactivity
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

// Drawer
function openNew(etapa = 'contato') {
  currentLeadId.value = null
  drawerTitle.value = 'Novo Lead'
  script.value = ''
  histEtapas.value = []
  leads.conversas = []
  form.value = { nome:'', negocio:'', telefone:'', categoria:'', cidade:'', instagram:'', site_atual:'', etapa, prioridade:'media', valor_estimado:'', proximo_followup:'', notas:'' }
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
    nome: l.nome || '', negocio: l.negocio || '', telefone: l.telefone || '',
    categoria: l.categoria || '', cidade: l.cidade || '', instagram: l.instagram || '',
    site_atual: l.site_atual || '', etapa: l.etapa || 'contato',
    prioridade: l.prioridade || 'media', valor_estimado: l.valor_estimado || '',
    proximo_followup: l.proximo_followup || '', notas: l.notas || ''
  }
  // Histórico de etapas do localStorage
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

  // Captura ANTES do upsert se o lead já era fechado
  const eraFechado = currentLeadId.value
    ? leads.getById(currentLeadId.value)?.etapa === 'fechado'
    : false
  const vaiFicarFechado = form.value.etapa === 'fechado'

  // Salvar histórico de etapa
  if (currentLeadId.value) {
    const l = leads.getById(currentLeadId.value)
    if (l && l.etapa !== form.value.etapa) {
      salvarHistorico(currentLeadId.value, l.etapa, form.value.etapa)
    }
  }

  const payload = {
    id: currentLeadId.value || 'l' + Date.now(),
    user_id: auth.user.id,
    nome: form.value.nome,
    telefone: form.value.telefone,
    negocio: form.value.negocio,
    categoria: form.value.categoria,
    cidade: form.value.cidade,
    instagram: form.value.instagram,
    site_atual: form.value.site_atual,
    etapa: form.value.etapa,
    prioridade: form.value.prioridade,
    valor_estimado: parseFloat(form.value.valor_estimado) || 0,
    proximo_followup: form.value.proximo_followup || null,
    notas: form.value.notas,
    updated_at: new Date().toISOString()
  }

  await run(() => leads.upsert(payload), 'Salvo ✓')

  // Abre modal de fechamento se está indo para "fechado" pela primeira vez
  if (vaiFicarFechado && !eraFechado) {
    fecharLead.value = leads.getById(payload.id) || payload
    fecharOpen.value = true
    return // não fecha o drawer ainda
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

function openWA() {
  const tel = form.value.telefone.replace(/\D/g, '')
  if (!tel) { toast('Adicione um telefone', 'err'); return }
  window.open('https://wa.me/55' + tel + '?text=Oi ' + form.value.nome + '!', '_blank')
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

async function pedirNotificacao() {
  if (!('Notification' in window)) { toast('Notificações não suportadas', 'err'); return }
  const perm = await Notification.requestPermission()
  if (perm === 'granted') toast('Notificações ativadas ✓', 'ok')
  else toast('Permissão negada', 'err')
}

// Realtime
onMounted(() => {
  if (!auth.user) return
  useRealtime(auth.user.id, {
    onLeads: () => leads.load(),
  })
})
</script>
