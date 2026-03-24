<template>
  <div class="page active">
    <div class="topbar">
      <h1>Dashboard</h1>
      <div class="tbar-right">
        <select v-model="mesSel" class="fs" style="font-size:.8rem;padding:6px 10px;width:auto">
          <option value="">Todos os meses</option>
          <option v-for="m in mesesDisponiveis" :key="m.val" :value="m.val">{{ m.label }}</option>
        </select>
        <button class="btn btn-gh" @click="exportar">↓ Exportar</button>
      </div>
    </div>

    <div class="content">
      <!-- KPIs financeiros -->
      <div class="kpi-grid" style="--cols:5">
        <div class="kpi"><div class="kl">Receita</div><div class="kv c-g">{{ fmt(f.rec) }}</div><div class="ks">recebida</div></div>
        <div class="kpi"><div class="kl">A receber</div><div class="kv c-a">{{ fmt(f.pend) }}</div><div class="ks">pendente</div></div>
        <div class="kpi"><div class="kl">Despesas</div><div class="kv c-r">{{ fmt(f.sai) }}</div><div class="ks">total</div></div>
        <div class="kpi"><div class="kl">Lucro</div><div class="kv" :class="f.lucro>=0?'c-g':'c-r'">{{ fmt(f.lucro) }}</div><div class="ks">{{ f.lucro>=0?'positivo':'negativo' }}</div></div>
        <div class="kpi"><div class="kl">Clientes</div><div class="kv c-p">{{ f.clis }}</div><div class="ks">pagos</div></div>
      </div>

      <!-- Alertas follow-up -->
      <div v-if="leads.followUpsAlerta.length" class="tbox" style="margin-bottom:16px;border-color:rgba(245,158,11,.3)">
        <div class="tbox-head" style="border-color:rgba(245,158,11,.2)">
          <h3 style="color:#fbbf24">⏰ Follow-ups pendentes ({{ leads.followUpsAlerta.length }})</h3>
        </div>
        <div class="tbl-wrap">
          <table>
            <thead><tr><th>Lead</th><th>Negócio</th><th>Etapa</th><th>Follow-up</th><th></th></tr></thead>
            <tbody>
              <tr v-for="l in leads.followUpsAlerta.slice(0,5)" :key="l.id">
                <td style="font-weight:500">{{ l.nome }}</td>
                <td style="color:var(--gr)">{{ l.negocio || '—' }}</td>
                <td><span class="tag t-pend">{{ etapaLabel(l.etapa) }}</span></td>
                <td style="color:var(--a)">{{ fmtData(l.proximo_followup) }}</td>
                <td>
                  <a :href="'https://wa.me/55'+l.telefone.replace(/\D/g,'')" target="_blank">
                    <button class="btn btn-gh" style="font-size:.72rem;padding:4px 10px">WhatsApp</button>
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Gráficos -->
      <div class="chart-row">
        <div class="chart-box"><h3>Receita mensal</h3><div class="chart-wrap"><canvas ref="chartRec"></canvas></div></div>
        <div class="chart-box"><h3>Despesas por categoria</h3><div class="chart-wrap"><canvas ref="chartGas"></canvas></div></div>
      </div>

      <!-- KPIs mapa -->
      <div class="sec-head"><h2>Progresso Sano Lab</h2></div>
      <div class="kpi-grid" style="--cols:4;margin-bottom:18px">
        <div class="kpi"><div class="kl">Feito</div><div class="kv c-g">{{ mapa.stats.ok }}</div><div class="ks">{{ Math.round(mapa.stats.ok/mapa.stats.total*100) }}%</div></div>
        <div class="kpi"><div class="kl">Em andamento</div><div class="kv c-a">{{ mapa.stats.doing }}</div><div class="ks">progresso</div></div>
        <div class="kpi"><div class="kl">Faltando</div><div class="kv c-r">{{ mapa.stats.nope }}</div><div class="ks">para fazer</div></div>
        <div class="kpi"><div class="kl">Futuro</div><div class="kv c-p">{{ mapa.stats.future }}</div><div class="ks">planejado</div></div>
      </div>

      <!-- KPIs CRM -->
      <div class="sec-head"><h2>Prospecção</h2></div>
      <div class="kpi-grid" style="--cols:5">
        <div class="kpi"><div class="kl">Total leads</div><div class="kv c-b">{{ leads.stats.total }}</div><div class="ks">no CRM</div></div>
        <div class="kpi"><div class="kl">Negociando</div><div class="kv c-a">{{ leads.stats.negociando }}</div><div class="ks">demo+negoc.</div></div>
        <div class="kpi"><div class="kl">Fechados</div><div class="kv c-g">{{ leads.stats.fechados }}</div><div class="ks">convertidos</div></div>
        <div class="kpi"><div class="kl">Follow-up</div><div class="kv c-r">{{ leads.stats.fuHoje }}</div><div class="ks">hoje</div></div>
        <div class="kpi"><div class="kl">Pipeline</div><div class="kv c-p">{{ fmt(leads.stats.pipe) }}</div><div class="ks">potencial</div></div>
      </div>

      <!-- Últimas transações -->
      <div class="tbox">
        <div class="tbox-head">
          <h3>Últimas transações</h3>
          <router-link to="/financeiro"><button class="btn btn-gh" style="font-size:.75rem;padding:5px 10px">Ver todas</button></router-link>
        </div>
        <div class="tbl-wrap">
          <table>
            <thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor</th></tr></thead>
            <tbody>
              <tr v-if="!fin.fin.length"><td colspan="4" style="text-align:center;color:var(--gr);padding:16px">Nenhuma transação ainda</td></tr>
              <tr v-for="t in fin.fin.slice(0,5)" :key="t.id">
                <td style="color:var(--gr)">{{ t.data }}</td>
                <td>{{ t.desc }}</td>
                <td><span class="tag" :class="t.tipo==='entrada'?(t.st==='pendente'?'t-pend':'t-in'):'t-out'">{{ t.tipo==='entrada'?(t.st==='pendente'?'Pendente':'Entrada'):'Saída' }}</span></td>
                <td :style="{ fontWeight:600, color: t.tipo==='entrada'?'var(--g)':'var(--r)' }">{{ t.tipo==='entrada'?'+':'-' }}{{ fmt(t.val) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useFinStore } from '@/stores/fin'
import { useLeadsStore } from '@/stores/leads'
import { useMapaStore } from '@/stores/mapa'

const fin = useFinStore()
const leads = useLeadsStore()
const mapa = useMapaStore()
const fmt = fin.fmt

const mesSel = ref('')
const chartRec = ref(null)
const chartGas = ref(null)
let charts = {}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const ETAPA_LABEL = { contato:'Contato', interesse:'Interesse', demo:'Demo', negociacao:'Negociação', fechado:'Fechado', perdido:'Perdido' }

const mesesDisponiveis = computed(() => {
  const ms = [...new Set(fin.fin.map(t => t.data?.substring(0,7)).filter(Boolean))].sort().reverse()
  return ms.map(m => {
    const [y, mo] = m.split('-')
    return { val: m, label: MESES[parseInt(mo)-1] + ' ' + y }
  })
})

// Padrão: todos os meses (string vazia)
const f = computed(() => fin.calcPeriodo(mesSel.value))

function etapaLabel(e) { return ETAPA_LABEL[e] || e }
function fmtData(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('pt-BR') }

function renderCharts() {
  if (!window.Chart) return
  nextTick(() => {
    if (chartRec.value) {
      if (charts.rec) charts.rec.destroy()
      charts.rec = new window.Chart(chartRec.value, {
        type: 'bar',
        data: { labels: MESES, datasets: [{ label:'Receita', data: fin.mRec, backgroundColor:'rgba(34,197,94,.35)', borderColor:'#22c55e', borderWidth:2, borderRadius:5 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#666', boxWidth:11, font:{ size:10 } } } }, scales:{ x:{ grid:{ color:'rgba(255,255,255,.04)' }, ticks:{ color:'#555', font:{ size:10 } } }, y:{ grid:{ color:'rgba(255,255,255,.04)' }, ticks:{ color:'#555', font:{ size:10 }, callback: v=>'R$'+v } } } }
      })
    }
    if (chartGas.value) {
      if (charts.gas) charts.gas.destroy()
      const gd = fin.gastosData()
      charts.gas = new window.Chart(chartGas.value, {
        type: 'doughnut',
        data: { labels: gd.labels, datasets: [{ data: gd.vals, backgroundColor:['rgba(239,68,68,.6)','rgba(245,158,11,.6)','rgba(59,130,246,.6)','rgba(139,92,246,.6)','rgba(34,197,94,.6)','rgba(20,184,166,.6)'], borderWidth:0 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ color:'#666', boxWidth:11, font:{ size:10 } } } } }
      })
    }
  })
}

function exportar() {
  const b = new Blob([JSON.stringify({ financeiro: fin.fin, pagamentos: fin.pgto, meta: fin.meta }, null, 2)], { type:'application/json' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'sanolab-backup.json'; a.click()
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

watch(() => fin.fin.length, renderCharts)
</script>
