<template>
  <div class="page-layout">

    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Visão geral do negócio</p>
      </div>
      <div class="page-actions">
        <select v-model="mesSel" class="form-select" style="width:auto;font-size:.85rem">
          <option value="">Todos os meses</option>
          <option v-for="m in mesesDisponiveis" :key="m.val" :value="m.val">{{ m.label }}</option>
        </select>
        <button class="btn btn-secondary" @click="exportar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exportar CSV
        </button>
      </div>
    </div>

    <!-- KPIs Financeiros -->
    <div class="kpi-grid kpi-grid--5">
      <div class="kpi-card">
        <span class="kpi-label">Receita</span>
        <span class="kpi-value kpi-value--accent">{{ fmt(f.rec) }}</span>
        <span class="kpi-sub">recebida</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">A receber</span>
        <span class="kpi-value kpi-value--warning">{{ fmt(f.pend) }}</span>
        <span class="kpi-sub">pendente</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Despesas</span>
        <span class="kpi-value kpi-value--danger">{{ fmt(f.sai) }}</span>
        <span class="kpi-sub">total</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Lucro</span>
        <span class="kpi-value" :class="f.lucro >= 0 ? 'kpi-value--accent' : 'kpi-value--danger'">{{ fmt(f.lucro) }}</span>
        <span class="kpi-sub">{{ f.lucro >= 0 ? 'positivo' : 'negativo' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Clientes pagos</span>
        <span class="kpi-value" style="color:var(--status-info)">{{ f.clis }}</span>
        <span class="kpi-sub">no período</span>
      </div>
    </div>

    <!-- Alertas follow-up -->
    <div v-if="leads.followUpsAlerta.length" class="card card--followup">
      <div class="followup-header">
        <div class="followup-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Follow-ups pendentes
          <span class="badge badge-warning">{{ leads.followUpsAlerta.length }}</span>
        </div>
        <router-link to="/crm" class="btn btn-ghost btn-sm">Ver no CRM →</router-link>
      </div>
      <div class="table-wrapper" style="border:none;border-radius:0;margin-top:.75rem">
        <table>
          <thead><tr><th>Lead</th><th>Negócio</th><th>Etapa</th><th>Follow-up</th><th></th></tr></thead>
          <tbody>
            <tr v-for="l in leads.followUpsAlerta.slice(0,5)" :key="l.id">
              <td style="font-weight:600">{{ l.nome }}</td>
              <td class="text-muted">{{ l.negocio || '—' }}</td>
              <td><span class="badge badge-warning">{{ etapaLabel(l.etapa) }}</span></td>
              <td style="color:var(--status-warning);font-size:.85rem">{{ fmtData(l.proximo_followup) }}</td>
              <td><a :href="'https://wa.me/55'+l.telefone.replace(/\D/g,'')" target="_blank"><button class="btn btn-ghost btn-sm">WhatsApp</button></a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Gráficos -->
    <div class="charts-row">
      <div class="card chart-card">
        <h3 class="chart-title">Receita mensal</h3>
        <div class="chart-wrap"><canvas ref="chartRec"></canvas></div>
      </div>
      <div class="card chart-card">
        <h3 class="chart-title">Despesas por categoria</h3>
        <div class="chart-wrap"><canvas ref="chartGas"></canvas></div>
      </div>
    </div>

    <!-- KPIs Progresso -->
    <div class="sec-header"><h2 class="sec-title">Progresso</h2></div>
    <div class="kpi-grid kpi-grid--4">
      <div class="kpi-card">
        <span class="kpi-label">Feito</span>
        <span class="kpi-value kpi-value--accent">{{ mapa.stats.ok }}</span>
        <span class="kpi-sub">{{ safePercent(mapa.stats.ok, mapa.stats.total) }}% completo</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Em andamento</span>
        <span class="kpi-value kpi-value--warning">{{ mapa.stats.doing }}</span>
        <span class="kpi-sub">em progresso</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Faltando</span>
        <span class="kpi-value kpi-value--danger">{{ mapa.stats.nope }}</span>
        <span class="kpi-sub">para fazer</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Futuro</span>
        <span class="kpi-value" style="color:var(--status-info)">{{ mapa.stats.future }}</span>
        <span class="kpi-sub">planejado</span>
      </div>
    </div>

    <!-- KPIs CRM -->
    <div class="sec-header"><h2 class="sec-title">Prospecção</h2></div>
    <div class="kpi-grid kpi-grid--5">
      <div class="kpi-card">
        <span class="kpi-label">Total leads</span>
        <span class="kpi-value" style="color:var(--status-info)">{{ leads.stats.total }}</span>
        <span class="kpi-sub">no CRM</span>
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

    <!-- Últimas transações -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Últimas transações</h3>
        <router-link to="/financeiro"><button class="btn btn-ghost btn-sm">Ver todas →</button></router-link>
      </div>
      <div class="tx-list">
        <div v-if="!fin.fin.length" class="tx-empty">Nenhuma transação ainda</div>
        <div v-for="t in fin.fin.slice(0,5)" :key="t.id" class="tx-row">
          <div class="tx-date">
            <span class="tx-day">{{ fmtDay(t.data) }}</span>
            <span class="tx-month">{{ fmtMonth(t.data) }}</span>
          </div>
          <div class="tx-info">
            <span class="tx-desc">{{ t.desc }}</span>
            <span v-if="t.cli || t.cliente" class="tx-client text-muted">{{ t.cli || t.cliente }}</span>
          </div>
          <span class="badge" :class="t.tipo==='entrada'?(t.st==='pendente'?'badge-warning':'badge-accent'):'badge-danger'">
            {{ t.tipo==='entrada'?(t.st==='pendente'?'Pendente':'Entrada'):'Saída' }}
          </span>
          <span class="tx-val" :style="{ color: t.tipo==='entrada'?'var(--accent)':'var(--status-danger)' }">
            {{ t.tipo==='entrada'?'+':'-' }}{{ fmt(t.val) }}
          </span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useFinStore } from '@/stores/fin'
import { useLeadsStore } from '@/stores/leads'
import { useMapaStore } from '@/stores/mapa'
import { useTheme } from '@/composables/useTheme'

const fin   = useFinStore()
const leads = useLeadsStore()
const mapa  = useMapaStore()
const fmt   = fin.fmt
const { theme } = useTheme()

// mesSel começa vazio — mostra todos os meses sem resetar ao voltar
const mesSel   = ref('')
const chartRec = ref(null)
const chartGas = ref(null)
let charts = {}

const MESES      = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const ETAPA_LABEL = { contato:'Contato', interesse:'Interesse', demo:'Demo', negociacao:'Negociação', fechado:'Fechado', perdido:'Perdido' }
const CHART_FONT  = "'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif"

const mesesDisponiveis = computed(() => {
  const ms = [...new Set(fin.fin.map(t => t.data?.substring(0,7)).filter(Boolean))].sort().reverse()
  return ms.map(m => {
    const [y, mo] = m.split('-')
    return { val: m, label: MESES[parseInt(mo)-1] + ' ' + y }
  })
})

// f usa mesSel — string vazia = todos os meses (não filtra)
const f = computed(() => fin.calcPeriodo(mesSel.value))

function etapaLabel(e) { return ETAPA_LABEL[e] || e }
function fmtData(d)    { if (!d) return '—'; return new Date(d).toLocaleDateString('pt-BR') }
function safePercent(v, t) { return !t ? 0 : Math.round(v / t * 100) }

function fmtDay(d)   { if (!d) return '--'; return d.split('-')[2] || '--' }
function fmtMonth(d) { if (!d) return ''; const mo = parseInt(d.split('-')[1]) - 1; return MESES[mo] || '' }

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
    if (chartRec.value) {
      if (charts.rec) charts.rec.destroy()
      charts.rec = new window.Chart(chartRec.value, {
        type: 'bar',
        data: { labels: MESES, datasets: [{ label:'Receita', data:fin.mRec, backgroundColor:'rgba(34,197,94,0.2)', borderColor:'#22c55e', borderWidth:2, borderRadius:6, borderSkipped:false }] },
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
    if (chartGas.value) {
      if (charts.gas) charts.gas.destroy()
      const gd = fin.gastosData()
      charts.gas = new window.Chart(chartGas.value, {
        type: 'doughnut',
        data: { labels:gd.labels, datasets:[{ data:gd.vals, backgroundColor:['rgba(224,85,85,.7)','rgba(232,168,56,.7)','rgba(91,141,238,.7)','rgba(139,92,246,.7)','rgba(34,197,94,.7)','rgba(20,184,166,.7)'], borderWidth:0, hoverOffset:6 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ color:c.legend, boxWidth:10, font:{ size:11, family:CHART_FONT }, padding:14 } } } }
      })
    }
  })
}

function exportar() {
  const rows = [['Data','Descrição','Categoria','Cliente','Tipo','Valor']]
  fin.fin.forEach(t => rows.push([t.data||'',t.desc||'',t.categoria||'',t.cli||t.cliente||'',t.tipo||'',t.val||0]))
  const csv = rows.map(r => r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `slac-financeiro-${new Date().toISOString().split('T')[0]}.csv`
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
/* Charts — exclusivo do Dashboard */
.charts-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; min-width:0; }
.chart-card { display:flex; flex-direction:column; gap:.875rem; min-width:0; }
.chart-title { font-size:.9375rem; font-weight:700; color:var(--text-primary); }
.chart-wrap  { height:200px; position:relative; min-width:0; }

@media (max-width:900px) { .charts-row { grid-template-columns:1fr; } }
</style>
