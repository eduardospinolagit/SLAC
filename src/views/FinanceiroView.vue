<template>
  <div class="page-layout">

    <div class="page-header">
      <div>
        <h1 class="page-title">Financeiro</h1>
        <p class="page-subtitle">Receitas, despesas e fluxo de caixa</p>
      </div>
      <div class="page-actions">
        <select v-model="mesFil" class="form-select" style="width:auto;font-size:.85rem">
          <option value="">Todo período</option>
          <option v-for="m in mesesDisponiveis" :key="m.val" :value="m.val">{{ m.label }}</option>
        </select>
        <button class="btn btn-secondary" @click="exportarCSV">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exportar CSV
        </button>
        <button class="btn btn-secondary" @click="openModal('saida')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Despesa
        </button>
        <button class="btn btn-primary" @click="openModal('entrada')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Receita
        </button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid kpi-grid--5">
      <div class="kpi-card">
        <span class="kpi-label">Receita</span>
        <span class="kpi-value kpi-value--accent">{{ fmt(f.rec) }}</span>
        <span class="kpi-sub">{{ listaFiltrada.filter(t=>t.tipo==='entrada'&&t.st==='recebido').length }} transações</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">A receber</span>
        <span class="kpi-value kpi-value--warning">{{ fmt(f.pend) }}</span>
        <span class="kpi-sub">pendente</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Despesas</span>
        <span class="kpi-value kpi-value--danger">{{ fmt(f.sai) }}</span>
        <span class="kpi-sub">{{ listaFiltrada.filter(t=>t.tipo==='saida').length }} transações</span>
      </div>
      <div class="kpi-card kpi-card--lucro" :class="f.lucro < 0 ? 'kpi-card--lucro-neg' : ''">
        <span class="kpi-label">Receita Total</span>
        <span class="kpi-value kpi-value--white">{{ fmt(f.rec + f.pend) }}</span>
        <div class="kpi-rec-detail">
          <span class="kpi-rec-item">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {{ fmt(f.rec) }}
          </span>
          <span class="kpi-rec-sep">·</span>
          <span class="kpi-rec-item kpi-rec-item--pend">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {{ fmt(f.pend) }}
          </span>
        </div>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Ticket médio</span>
        <span class="kpi-value" style="color:var(--status-info)">{{ fmt(f.ticketMedio) }}</span>
        <span class="kpi-sub">por cliente</span>
      </div>
    </div>

    <!-- Gráficos -->
    <div class="charts-row">
      <div class="card chart-card">
        <h3 class="chart-title">Receita vs Despesa — ano</h3>
        <div class="chart-wrap"><canvas ref="chartMen"></canvas></div>
      </div>
      <div class="card chart-card">
        <h3 class="chart-title">Despesas por categoria</h3>
        <div class="chart-wrap"><canvas ref="chartCat"></canvas></div>
      </div>
    </div>

    <!-- Tabela de transações -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Transações</h3>
        <div class="fin-filters">
          <select v-model="tipoFil" class="form-select" style="width:auto;font-size:.82rem">
            <option value="">Todos tipos</option>
            <option value="entrada">Receitas</option>
            <option value="saida">Despesas</option>
          </select>
          <select v-model="catFil" class="form-select" style="width:auto;font-size:.82rem">
            <option value="">Todas categorias</option>
            <option v-for="c in cats" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
      </div>

      <div class="table-wrapper" style="margin-top:.75rem;border:none;border-radius:0;">
        <table>
          <thead>
            <tr>
              <th class="th-sort" @click="toggleSort('data')">Data <span class="sort-icon">{{ sortKey==='data'?(sortDir==='asc'?'↑':'↓'):'↕' }}</span></th>
              <th class="th-sort" @click="toggleSort('desc')">Descrição <span class="sort-icon">{{ sortKey==='desc'?(sortDir==='asc'?'↑':'↓'):'↕' }}</span></th>
              <th>Categoria</th>
              <th>Cliente</th>
              <th>Status</th>
              <th class="th-sort" @click="toggleSort('val')" style="text-align:right">Valor <span class="sort-icon">{{ sortKey==='val'?(sortDir==='asc'?'↑':'↓'):'↕' }}</span></th>
              <th style="width:90px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!listaOrdenada.length">
              <td colspan="7" style="text-align:center;color:var(--text-tertiary);padding:2rem;font-size:.875rem">Nenhuma transação</td>
            </tr>
            <tr v-for="t in listaOrdenada" :key="t.id" class="tx-table-row" :class="{ 'tx-row--vencida': isVencida(t) }">
              <td class="text-muted text-sm" style="white-space:nowrap">{{ fmtData(t.data) }}</td>
              <td>
                <div style="font-weight:500;color:var(--text-primary)">{{ t.desc }}</div>
                <div v-if="t.obs" class="text-muted" style="font-size:.75rem;margin-top:.1rem">{{ t.obs }}</div>
              </td>
              <td>
                <span class="cat-tag">{{ t.cat }}</span>
              </td>
              <td class="text-muted text-sm">{{ t.cli || '—' }}</td>
              <td>
                <span class="badge"
                  :class="t.tipo==='entrada' ? (t.st==='pendente' ? (isVencida(t) ? 'badge-vencida' : 'badge-warning') : 'badge-accent') : 'badge-danger'">
                  <svg v-if="isVencida(t)" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  {{ t.tipo==='entrada' ? (t.st==='pendente' ? (isVencida(t) ? 'Vencida' : 'Pendente') : 'Recebido') : 'Saída' }}
                </span>
              </td>
              <td style="text-align:right;font-weight:700;font-family:var(--font-display)"
                :style="{ color: t.tipo==='entrada'?'var(--accent)':'var(--status-danger)' }">
                {{ t.tipo==='entrada'?'+':'-' }}{{ fmt(t.val) }}
              </td>
              <td>
                <div class="tx-actions">
                  <button v-if="t.tipo==='entrada'&&t.st==='pendente'"
                    class="btn btn-ghost btn-icon btn-sm"
                    style="color:var(--accent)"
                    title="Confirmar recebimento"
                    @click="confirmarRecebimento(t.id)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </button>
                  <button class="btn btn-ghost btn-icon btn-sm" title="Editar" @click="editTx(t)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--status-danger)" title="Remover" @click="rmTx(t.id)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>

  <!-- MODAL TRANSAÇÃO -->
  <div v-show="modalOpen" class="drawer-bg" @click="modalOpen=false"></div>
  <div v-show="modalOpen" class="drawer">
    <div class="drawer-header">
      <h3 class="drawer-title">
        {{ editId ? (modalTipo==='entrada'?'Editar Receita':'Editar Despesa') : (modalTipo==='entrada'?'Nova Receita':'Nova Despesa') }}
      </h3>
      <button class="btn btn-ghost btn-icon" @click="modalOpen=false">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="drawer-body">
      <div class="drawer-section">
        <p class="drawer-section-title">Informações</p>
        <div class="form-group"><label class="form-label">Descrição *</label><input v-model="mForm.desc" class="form-input" placeholder="Ex: Site Iron House — 50% entrada" /></div>
        <div class="form-group"><label class="form-label">Valor (R$) *</label><input v-model.number="mForm.val" class="form-input" type="number" placeholder="797.00" step="0.01" min="0" /></div>
        <div class="form-group"><label class="form-label">Data *</label><input v-model="mForm.data" class="form-input" type="date" /></div>
        <div class="form-group"><label class="form-label">Cliente</label><input v-model="mForm.cli" class="form-input" placeholder="Nome do cliente" /></div>
      </div>
      <div class="drawer-section">
        <p class="drawer-section-title">Classificação</p>
        <div class="form-group">
          <label class="form-label">Categoria</label>
          <select v-model="mForm.cat" class="form-select">
            <option>Site</option><option>Google Meu Negócio</option><option>Tráfego</option>
            <option>Automação</option><option>Manutenção</option><option>Ferramentas</option>
            <option>Assinatura</option><option>Marketing</option><option>Outros</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Recorrência</label>
          <select v-model="mForm.rec" class="form-select">
            <option value="unica">Pagamento único</option>
            <option value="mensal">Mensal</option>
            <option value="anual">Anual</option>
          </select>
        </div>
        <div v-if="modalTipo==='entrada'" class="form-group">
          <label class="form-label">Status</label>
          <select v-model="mForm.st" class="form-select">
            <option value="recebido">Recebido</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>
      </div>
      <div class="drawer-section">
        <p class="drawer-section-title">Extras</p>
        <div class="form-group"><label class="form-label">Observação</label><input v-model="mForm.obs" class="form-input" placeholder="Parcela, vencimento, nota..." /></div>
      </div>
    </div>
    <div class="drawer-footer">
      <button class="btn btn-secondary" @click="modalOpen=false">Cancelar</button>
      <button class="btn btn-primary" style="flex:1;justify-content:center" @click="saveTx">Salvar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useFinStore } from '@/stores/fin'
import { useSaving } from '@/composables/useSaving'
import { useTheme } from '@/composables/useTheme'

const fin  = useFinStore()
const { run, toast } = useSaving()
const { theme } = useTheme()
const fmt  = fin.fmt

const mesFil  = ref('')
const tipoFil = ref('')
const catFil  = ref('')
const sortKey = ref('data')
const sortDir = ref('desc')

const chartMen = ref(null)
const chartCat = ref(null)
let charts = {}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const CHART_FONT = "'Sora', 'Helvetica Neue', Arial, sans-serif"
const cats = ['Site','Google Meu Negócio','Tráfego','Automação','Manutenção','Ferramentas','Assinatura','Marketing','Outros']

const mesesDisponiveis = computed(() => {
  const ms = [...new Set(fin.fin.map(t => t.data?.substring(0,7)).filter(Boolean))].sort().reverse()
  return ms.map(m => {
    const [y, mo] = m.split('-')
    return { val: m, label: MESES[parseInt(mo)-1] + ' ' + y }
  })
})

const f = computed(() => fin.calcPeriodo(mesFil.value))

const listaFiltrada = computed(() => {
  let lista = fin.fin
  if (mesFil.value)  lista = lista.filter(t => t.data?.includes(mesFil.value))
  if (tipoFil.value) lista = lista.filter(t => t.tipo === tipoFil.value)
  if (catFil.value)  lista = lista.filter(t => t.cat === catFil.value)
  return lista
})

const listaOrdenada = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...listaFiltrada.value].sort((a, b) => {
    const va = a[sortKey.value] ?? ''
    const vb = b[sortKey.value] ?? ''
    if (sortKey.value === 'val') return (Number(va) - Number(vb)) * dir
    return String(va).localeCompare(String(vb), 'pt-BR') * dir
  })
})

function toggleSort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'desc' }
}

function isVencida(t) {
  if (t.tipo !== 'entrada' || t.st !== 'pendente' || !t.data) return false
  const [y, m, day] = t.data.split('-')
  const dt = new Date(Number(y), Number(m) - 1, Number(day))
  return dt < new Date(new Date().toDateString())
}

function fmtData(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y.slice(2)}`
}

// Modal
const modalOpen = ref(false)
const modalTipo = ref('entrada')
const editId    = ref('')
const mForm = ref({ desc:'', val:'', data:'', cat:'Site', rec:'unica', st:'recebido', cli:'', obs:'' })

function openModal(tipo) {
  editId.value = ''
  modalTipo.value = tipo
  mForm.value = { desc:'', val:'', data: new Date().toISOString().split('T')[0], cat:'Site', rec:'unica', st:'recebido', cli:'', obs:'' }
  modalOpen.value = true
}

function editTx(t) {
  editId.value = t.id
  modalTipo.value = t.tipo
  mForm.value = { desc:t.desc, val:t.val, data:t.data, cat:t.cat||'Site', rec:t.rec||'unica', st:t.st||'recebido', cli:t.cli||'', obs:t.obs||'' }
  modalOpen.value = true
}

async function saveTx() {
  if (!mForm.value.desc || !mForm.value.val || !mForm.value.data) {
    toast('Preencha descrição, valor e data', 'error'); return
  }
  const tx = {
    id: editId.value || 't' + Date.now(),
    tipo: modalTipo.value,
    desc: mForm.value.desc,
    cat:  mForm.value.cat,
    val:  mForm.value.val,
    data: mForm.value.data,
    rec:  mForm.value.rec,
    st:   modalTipo.value === 'entrada' ? mForm.value.st : 'pago',
    cli:  mForm.value.cli,
    obs:  mForm.value.obs
  }
  if (editId.value) {
    const idx = fin.fin.findIndex(t => t.id === editId.value)
    if (idx !== -1) fin.fin[idx] = tx
  } else {
    fin.fin.unshift(tx)
  }
  await run(() => fin.upsert(tx), editId.value ? 'Atualizado' : 'Salvo')
  modalOpen.value = false
}

async function rmTx(id) {
  if (!confirm('Remover esta transação?')) return
  fin.fin = fin.fin.filter(t => t.id !== id)
  await run(() => fin.remove(id), 'Removido')
}

async function confirmarRecebimento(id) {
  const tx = fin.fin.find(t => t.id === id)
  if (!tx) return
  tx.st   = 'recebido'
  tx.data = new Date().toISOString().split('T')[0]
  await run(() => fin.upsert(tx), 'Recebimento confirmado')
}

// Charts
function chartColors() {
  const dark = theme.value === 'dark'
  return {
    grid:   dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
    tick:   dark ? '#555' : '#9ca3af',
    legend: dark ? '#777' : '#6b7280',
  }
}

function renderCharts() {
  if (!window.Chart) return
  window.Chart.defaults.font.family = CHART_FONT
  window.Chart.defaults.font.size   = 11
  nextTick(() => {
    const c = chartColors()
    if (chartMen.value) {
      if (charts.men) charts.men.destroy()
      const rec = fin.mRec
      const sai = Array.from({ length: 12 }, (_, i) => {
        const m = String(i+1).padStart(2,'0')
        return fin.fin.filter(t => t.tipo==='saida' && t.data?.includes('-'+m+'-')).reduce((a,t) => a+Number(t.val), 0)
      })
      charts.men = new window.Chart(chartMen.value, {
        type: 'bar',
        data: {
          labels: MESES,
          datasets: [
            { label:'Receita', data:rec, backgroundColor:'rgba(34,197,94,.2)', borderColor:'#22c55e', borderWidth:2, borderRadius:6, borderSkipped:false },
            { label:'Despesa', data:sai, backgroundColor:'rgba(239,68,68,.2)', borderColor:'#ef4444', borderWidth:2, borderRadius:6, borderSkipped:false }
          ]
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ labels:{ color:c.legend, boxWidth:10, font:{ size:11, family:CHART_FONT } } } },
          scales:{
            x:{ grid:{ color:c.grid }, ticks:{ color:c.tick, font:{ size:10, family:CHART_FONT } } },
            y:{ grid:{ color:c.grid }, ticks:{ color:c.tick, font:{ size:10, family:CHART_FONT }, callback:v=>'R$'+v } }
          }
        }
      })
    }
    if (chartCat.value) {
      if (charts.cat) charts.cat.destroy()
      const gd = fin.gastosData()
      charts.cat = new window.Chart(chartCat.value, {
        type: 'doughnut',
        data: {
          labels: gd.labels,
          datasets: [{ data:gd.vals, backgroundColor:['rgba(224,85,85,.7)','rgba(232,168,56,.7)','rgba(91,141,238,.7)','rgba(139,92,246,.7)','rgba(34,197,94,.7)','rgba(20,184,166,.7)'], borderWidth:0, hoverOffset:6 }]
        },
        options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ color:c.legend, boxWidth:10, font:{ size:11, family:CHART_FONT }, padding:14 } } } }
      })
    }
  })
}

function exportarCSV() {
  const header = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Cliente', 'Status', 'Recorrência', 'Valor', 'Observação']
  const rows = fin.fin.map(t => [
    t.data || '',
    t.tipo === 'entrada' ? 'Receita' : 'Despesa',
    t.desc || '',
    t.cat  || '',
    t.cli  || '',
    t.tipo === 'entrada' ? (t.st === 'pendente' ? 'Pendente' : 'Recebido') : 'Pago',
    t.rec  || 'unica',
    String(t.val || 0).replace('.', ','),
    t.obs  || ''
  ])
  const csv = [header, ...rows].map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `financeiro-slac-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
}

onMounted(() => {
  if (!window.Chart) {
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js'
    s.onload = renderCharts
    document.head.appendChild(s)
  } else {
    renderCharts()
  }
})
onUnmounted(() => { Object.values(charts).forEach(c => c?.destroy()) })
watch(() => fin.fin.length, renderCharts)
watch(theme, renderCharts)
</script>

<style scoped>
/* Charts */
.charts-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; min-width:0; }
.chart-card { display:flex; flex-direction:column; gap:.875rem; min-width:0; }
.chart-title { font-size:.9375rem; font-weight:700; color:var(--text-primary); }
.chart-wrap  { height:200px; position:relative; min-width:0; }

/* Card header com filtros */
.fin-filters { display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; }

/* Categoria tag */
.cat-tag {
  display:inline-block;
  font-size:.7rem; font-weight:600;
  background:var(--bg-overlay);
  color:var(--text-tertiary);
  border:1px solid var(--border-default);
  border-radius:var(--radius-full);
  padding:.15rem .5rem;
  white-space:nowrap;
}

/* Ações na tabela */
.tx-actions { display:flex; align-items:center; gap:.2rem; justify-content:flex-end; }
.tx-table-row:hover .tx-actions { opacity:1; }

/* Sort */
.th-sort { cursor:pointer; user-select:none; white-space:nowrap; }
.th-sort:hover { color:var(--accent); }
.sort-icon { font-size:.65rem; color:var(--text-tertiary); margin-left:.2rem; }

/* Drawer padrão */
.drawer-bg { position:fixed; inset:0; background:rgba(0,0,0,.35); z-index:800; }
[data-theme="light"] .drawer-bg { background:rgba(200,200,210,0.3); }
.drawer { position:fixed; top:0; right:0; height:100vh; width:400px; max-width:95vw; background:rgba(18,18,18,0.38); backdrop-filter:blur(32px) saturate(180%); -webkit-backdrop-filter:blur(32px) saturate(180%); border-left:1px solid rgba(255,255,255,0.08); box-shadow:-8px 0 40px rgba(0,0,0,.5); z-index:801; display:flex; flex-direction:column; overflow:hidden; }
[data-theme="light"] .drawer { background:rgba(255,255,255,0.88); border-left:1px solid rgba(0,0,0,0.08); box-shadow:-8px 0 40px rgba(0,0,0,.1); }
.drawer-header { display:flex; align-items:center; justify-content:space-between; padding:1rem 1.25rem; border-bottom:1px solid var(--border-default); flex-shrink:0; }
.drawer-title  { font-size:.9375rem; font-weight:700; color:var(--text-primary); }
.drawer-body   { flex:1; overflow-y:auto; padding:.875rem 1.25rem; display:flex; flex-direction:column; gap:.875rem; }
.drawer-section { display:flex; flex-direction:column; gap:.5rem; padding-bottom:.875rem; border-bottom:1px solid var(--border-subtle); }
.drawer-section:last-child { border-bottom:none; }
.drawer-section-title { font-size:.62rem; font-weight:700; letter-spacing:.09em; text-transform:uppercase; color:var(--text-tertiary); margin:0; }
.drawer-footer { display:flex; align-items:center; gap:.5rem; padding:.875rem 1.25rem; border-top:1px solid var(--border-default); flex-shrink:0; }

@media (max-width:900px)  { .charts-row { grid-template-columns:1fr; } }
@media (max-width:1100px) { .kpi-grid--5 { grid-template-columns:repeat(3,1fr); } }
@media (max-width:768px)  { .page-layout { padding:1rem 1rem 5rem; } .drawer { width:100%; } }

.kpi-card--lucro { background: var(--accent); border-color: var(--accent); }
.kpi-card--lucro-neg { background: var(--status-danger); border-color: var(--status-danger); }
.kpi-card--lucro .kpi-label { color: rgba(255,255,255,.7); }
.kpi-value--white { color: #fff !important; }
[data-theme="light"] .kpi-card--lucro .kpi-label { color: rgba(0,0,0,.55); }
[data-theme="light"] .kpi-value--white { color: #fff !important; }

.kpi-rec-detail { display: flex; align-items: center; gap: .3rem; flex-wrap: wrap; margin-top: .15rem; }
.kpi-rec-item { display: inline-flex; align-items: center; gap: .25rem; font-size: .72rem; font-weight: 600; color: rgba(255,255,255,.85); }
.kpi-rec-item--pend { color: rgba(255,255,255,.6); }
.kpi-rec-sep { font-size: .72rem; color: rgba(255,255,255,.4); }
[data-theme="light"] .kpi-rec-item { color: rgba(0,0,0,.75); }
[data-theme="light"] .kpi-rec-item--pend { color: rgba(0,0,0,.45); }
[data-theme="light"] .kpi-rec-sep { color: rgba(0,0,0,.25); }

.tx-row--vencida td { background: rgba(232,168,56,.05); }
.tx-row--vencida td:first-child { border-left: 2.5px solid var(--status-warning); }
.badge-vencida { background: rgba(232,168,56,.15); color: var(--status-warning); border: 1px solid rgba(232,168,56,.3); display: inline-flex; align-items: center; gap: .25rem; }
</style>
