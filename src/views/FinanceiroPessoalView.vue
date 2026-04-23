<template>
  <div class="page-layout">

    <div class="page-header">
      <div>
        <h1 class="page-title">Finanças Pessoais</h1>
        <p class="page-subtitle">Controle de gastos e receitas pessoais</p>
      </div>
      <div class="page-actions">
        <select v-model="mesFil" class="form-select" style="width:auto;font-size:.85rem">
          <option value="">Todo período</option>
          <option v-for="m in mesesDisponiveis" :key="m.val" :value="m.val">{{ m.label }}</option>
        </select>
        <button class="btn btn-ghost btn-sm" @click="modalCats = true" title="Gerenciar categorias">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Categorias
        </button>
        <button class="btn btn-secondary" @click="abrirDrawer('saida')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Despesa
        </button>
        <button class="btn btn-primary" @click="abrirDrawer('entrada')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Receita
        </button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid kpi-grid--3">
      <div class="kpi-card">
        <span class="kpi-label">Receitas</span>
        <span class="kpi-value kpi-value--accent">{{ fp.fmt(recMes) }}</span>
        <div class="kpi-detail-row">
          <span class="kpi-detail-item">
            <span class="kpi-dot kpi-dot--ok"></span>
            Recebido <strong>{{ fp.fmt(recPago) }}</strong>
          </span>
          <span class="kpi-detail-item" v-if="recPendente > 0">
            <span class="kpi-dot kpi-dot--warn"></span>
            A receber <strong>{{ fp.fmt(recPendente) }}</strong>
          </span>
        </div>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Despesas</span>
        <span class="kpi-value kpi-value--danger">{{ fp.fmt(saiMes) }}</span>
        <div class="kpi-detail-row">
          <span class="kpi-detail-item">
            <span class="kpi-dot kpi-dot--danger"></span>
            Pago <strong>{{ fp.fmt(saiPago) }}</strong>
          </span>
          <span class="kpi-detail-item" v-if="saiPendente > 0">
            <span class="kpi-dot kpi-dot--warn"></span>
            Pendente <strong>{{ fp.fmt(saiPendente) }}</strong>
          </span>
        </div>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Saldo atual</span>
        <span class="kpi-value" :style="{ color: saldoAtual >= 0 ? 'var(--accent)' : 'var(--status-danger)' }">
          {{ fp.fmt(saldoAtual) }}
        </span>
        <div class="kpi-detail-row">
          <span class="kpi-detail-item">
            <span class="kpi-dot" :style="{ background: saldoMes >= 0 ? 'var(--status-info)' : 'var(--status-warning)' }"></span>
            Projetado <strong>{{ fp.fmt(saldoMes) }}</strong>
          </span>
        </div>
      </div>
    </div>

    <!-- Gráfico despesas por categoria -->
    <div class="card chart-card" v-show="listaFiltrada.some(t=>t.tipo==='saida')">
      <h3 class="chart-title">Despesas por categoria</h3>
      <div class="chart-wrap"><canvas ref="chartCat"></canvas></div>
    </div>

    <!-- Tabela -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Transações</h3>
        <div style="display:flex;gap:.5rem">
          <select v-model="tipoFil" class="form-select" style="width:auto;font-size:.82rem">
            <option value="">Todos tipos</option>
            <option value="entrada">Receitas</option>
            <option value="saida">Despesas</option>
          </select>
          <select v-model="catFil" class="form-select" style="width:auto;font-size:.82rem">
            <option value="">Todas categorias</option>
            <option v-for="c in catsDisponiveis" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
      </div>

      <div v-if="listaFiltrada.length === 0" class="empty-state">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <p>Nenhuma transação encontrada</p>
        <button class="btn btn-primary btn-sm" @click="abrirDrawer('saida')">Adicionar primeira despesa</button>
      </div>

      <div v-else class="table-wrapper">
        <table class="fp-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Status</th>
              <th style="text-align:right">Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in listaFiltrada" :key="t.id" class="fp-row" @click="editarTx(t)">
              <td class="fp-date">{{ fmtData(t.data) }}</td>
              <td class="fp-desc">{{ t.descricao }}</td>
              <td><span class="badge">{{ t.cat }}</span></td>
              <td>
                <span class="badge" :class="t.st === 'pago' ? 'badge-accent' : 'badge-warning'">
                  {{ t.st === 'pago' ? 'Pago' : 'Pendente' }}
                </span>
              </td>
              <td class="fp-val" :style="{ color: t.tipo === 'entrada' ? 'var(--accent)' : 'var(--status-danger)' }">
                {{ t.tipo === 'entrada' ? '+' : '-' }}{{ fp.fmt(t.val) }}
              </td>
              <td>
                <button class="btn-icon btn-ghost" @click.stop="confirmarRemover(t)" title="Remover">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Drawer transação -->
    <div v-show="drawer" class="drawer-bg" @click="drawer = false"></div>
    <div v-show="drawer" class="drawer">
      <div class="drawer-header">
        <h3 class="drawer-title">{{ form.id ? 'Editar transação' : (form.tipo === 'entrada' ? 'Nova receita' : 'Nova despesa') }}</h3>
        <button class="btn-icon btn-ghost" @click="drawer = false">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="drawer-body">
        <div class="drawer-section">
          <div class="form-group">
            <label class="form-label">Tipo</label>
            <select v-model="form.tipo" class="form-select">
              <option value="saida">Despesa</option>
              <option value="entrada">Receita</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Descrição</label>
            <input v-model="form.descricao" class="form-input" placeholder="Ex: Aluguel, Mercado..." />
          </div>
          <div class="form-group">
            <label class="form-label">Categoria</label>
            <select v-model="form.cat" class="form-select">
              <option v-for="c in (form.tipo === 'entrada' ? fp.catsEntrada : fp.catsSaida)" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Valor (R$)</label>
            <input v-model="form.val" class="form-input" type="number" min="0" step="0.01" placeholder="0,00" />
          </div>
          <div class="form-group">
            <label class="form-label">Data</label>
            <input v-model="form.data" class="form-input" type="date" />
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select v-model="form.st" class="form-select">
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Observação</label>
            <textarea v-model="form.obs" class="form-textarea" rows="2" placeholder="Opcional..."></textarea>
          </div>
        </div>
      </div>
      <div class="drawer-footer">
        <button class="btn btn-ghost" @click="drawer = false">Cancelar</button>
        <button class="btn btn-primary" @click="salvar" :disabled="saving">
          {{ saving ? 'Salvando...' : 'Salvar' }}
        </button>
      </div>
    </div>

    <!-- Modal categorias -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="modalCats" class="modal-backdrop" @click.self="modalCats = false">
          <div class="cats-modal">
            <div class="cats-modal-header">
              <h3 class="cats-modal-title">Gerenciar categorias</h3>
              <button class="btn-icon btn-ghost" @click="modalCats = false">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div class="cats-modal-body">
              <!-- Despesas -->
              <div class="cats-section">
                <p class="cats-section-title">Despesas</p>
                <div class="cats-list">
                  <div v-for="c in fp.catsSaida" :key="c" class="cats-tag">
                    <label class="cats-color-wrap" :title="`Cor de ${c}`">
                      <input type="color" :value="fp.colorFor(c)" @change="e => fp.setColor(c, e.target.value)" class="cats-color-input" />
                      <span class="cats-color-swatch" :style="{ background: fp.colorFor(c) }"></span>
                    </label>
                    <span>{{ c }}</span>
                    <button @click="removerCat('saida', c)" class="cats-remove" title="Remover">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
                <div class="cats-add-row">
                  <input v-model="novaCatSaida" class="form-input" placeholder="Nova categoria de despesa..."
                    @keydown.enter="adicionarCat('saida')" />
                  <button class="btn btn-secondary btn-sm" @click="adicionarCat('saida')">Adicionar</button>
                </div>
              </div>

              <!-- Receitas -->
              <div class="cats-section">
                <p class="cats-section-title">Receitas</p>
                <div class="cats-list">
                  <div v-for="c in fp.catsEntrada" :key="c" class="cats-tag cats-tag--entrada">
                    <label class="cats-color-wrap" :title="`Cor de ${c}`">
                      <input type="color" :value="fp.colorFor(c)" @change="e => fp.setColor(c, e.target.value)" class="cats-color-input" />
                      <span class="cats-color-swatch" :style="{ background: fp.colorFor(c) }"></span>
                    </label>
                    <span>{{ c }}</span>
                    <button @click="removerCat('entrada', c)" class="cats-remove" title="Remover">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
                <div class="cats-add-row">
                  <input v-model="novaCatEntrada" class="form-input" placeholder="Nova categoria de receita..."
                    @keydown.enter="adicionarCat('entrada')" />
                  <button class="btn btn-secondary btn-sm" @click="adicionarCat('entrada')">Adicionar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, inject, onMounted } from 'vue'
import { useFinPessoalStore } from '@/stores/finPessoal'

const fp    = useFinPessoalStore()
const toast = inject('toast')

onMounted(fp.load)

// Filtros
const mesFil  = ref('')
const tipoFil = ref('')
const catFil  = ref('')

const mesesDisponiveis = computed(() => {
  const set = new Set(fp.items.map(t => t.data?.slice(0, 7)).filter(Boolean))
  return [...set].sort((a, b) => b.localeCompare(a)).map(v => ({
    val: v,
    label: new Date(v + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }))
})

const listaFiltrada = computed(() => {
  let l = fp.items
  if (mesFil.value) l = l.filter(t => t.data?.startsWith(mesFil.value))
  if (tipoFil.value) l = l.filter(t => t.tipo === tipoFil.value)
  if (catFil.value) l = l.filter(t => t.cat === catFil.value)
  return l
})

const catsDisponiveis = computed(() => [...new Set(fp.items.map(t => t.cat))].sort())

const recPago     = computed(() => listaFiltrada.value.filter(t => t.tipo === 'entrada' && t.st === 'pago').reduce((s, t) => s + Number(t.val), 0))
const recPendente = computed(() => listaFiltrada.value.filter(t => t.tipo === 'entrada' && t.st === 'pendente').reduce((s, t) => s + Number(t.val), 0))
const recMes      = computed(() => recPago.value + recPendente.value)

const saiPago     = computed(() => listaFiltrada.value.filter(t => t.tipo === 'saida' && t.st === 'pago').reduce((s, t) => s + Number(t.val), 0))
const saiPendente = computed(() => listaFiltrada.value.filter(t => t.tipo === 'saida' && t.st === 'pendente').reduce((s, t) => s + Number(t.val), 0))
const saiMes      = computed(() => saiPago.value + saiPendente.value)

const saldoAtual  = computed(() => recPago.value - saiPago.value)
const saldoMes    = computed(() => recMes.value - saiMes.value)

// Chart
const chartCat = ref(null)
let chartInst  = null
watch(listaFiltrada, () => nextTick(renderChart), { deep: true })
watch(() => fp.catColors, () => nextTick(renderChart), { deep: true })
onMounted(() => nextTick(renderChart))

function renderChart() {
  if (!chartCat.value || !window.Chart) return
  const gastos = {}
  listaFiltrada.value.filter(t => t.tipo === 'saida').forEach(t => {
    gastos[t.cat] = (gastos[t.cat] || 0) + Number(t.val)
  })
  const entries = Object.entries(gastos).filter(([, v]) => v > 0)
  if (!entries.length) { if (chartInst) { chartInst.destroy(); chartInst = null } return }

  if (chartInst) chartInst.destroy()
  window.Chart.defaults.font.family = 'Sora'
  chartInst = new window.Chart(chartCat.value, {
    type: 'doughnut',
    data: {
      labels: entries.map(([k]) => k),
      datasets: [{ data: entries.map(([, v]) => v), backgroundColor: entries.map(([k]) => fp.colorFor(k)), borderWidth: 0 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: 'var(--text-secondary)', font: { size: 11 }, padding: 14 } },
        tooltip: { callbacks: { label: ctx => ` ${fp.fmt(ctx.raw)}` } }
      }
    }
  })
}

// Drawer transação
const drawer = ref(false)
const saving = ref(false)
const form   = ref(formVazio('saida'))

function formVazio(tipo) {
  return {
    id: null, tipo, descricao: '', val: '',
    cat: tipo === 'entrada' ? (fp.catsEntrada[0] || 'Outros') : (fp.catsSaida[0] || 'Outros'),
    data: new Date().toISOString().split('T')[0],
    st: 'pago', obs: ''
  }
}

watch(() => form.value.tipo, tipo => {
  form.value.cat = tipo === 'entrada' ? (fp.catsEntrada[0] || 'Outros') : (fp.catsSaida[0] || 'Outros')
})

function abrirDrawer(tipo) {
  form.value = formVazio(tipo)
  drawer.value = true
}

function editarTx(t) {
  form.value = { id: t.id, tipo: t.tipo, descricao: t.descricao, val: t.val, cat: t.cat, data: t.data, st: t.st, obs: t.obs || '' }
  drawer.value = true
}

async function salvar() {
  if (!form.value.descricao || !form.value.val || !form.value.data) {
    toast?.('Preencha descrição, valor e data', 'warn'); return
  }
  saving.value = true
  try {
    await fp.upsert(form.value)
    drawer.value = false
    toast?.(form.value.id ? 'Transação atualizada' : 'Transação adicionada', 'ok')
    nextTick(renderChart)
  } catch {
    toast?.('Erro ao salvar', 'error')
  } finally {
    saving.value = false
  }
}

async function confirmarRemover(t) {
  if (!confirm(`Remover "${t.descricao}"?`)) return
  try {
    await fp.remove(t.id)
    toast?.('Removido', 'ok')
    nextTick(renderChart)
  } catch {
    toast?.('Erro ao remover', 'error')
  }
}

// Modal categorias
const modalCats     = ref(false)
const novaCatSaida  = ref('')
const novaCatEntrada = ref('')

async function adicionarCat(tipo) {
  const nome = tipo === 'saida' ? novaCatSaida.value : novaCatEntrada.value
  if (!nome.trim()) return
  await fp.addCat(tipo, nome)
  if (tipo === 'saida') novaCatSaida.value = ''
  else novaCatEntrada.value = ''
  toast?.('Categoria adicionada', 'ok')
}

async function removerCat(tipo, nome) {
  if (!confirm(`Remover categoria "${nome}"?`)) return
  await fp.removeCat(tipo, nome)
  toast?.('Categoria removida', 'ok')
}

function fmtData(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}
</script>

<style scoped>
.kpi-detail-row {
  display: flex; flex-direction: column; gap: .2rem; margin-top: .375rem;
}
.kpi-detail-item {
  display: flex; align-items: center; gap: .35rem;
  font-size: .72rem; color: var(--text-tertiary);
}
.kpi-detail-item strong { color: var(--text-secondary); font-weight: 600; }
.kpi-dot {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
}
.kpi-dot--ok     { background: var(--accent); }
.kpi-dot--warn   { background: var(--status-warning); }
.kpi-dot--danger { background: var(--status-danger); }

.empty-state {
  display: flex; flex-direction: column; align-items: center; gap: .75rem;
  padding: 3rem 1rem; color: var(--text-tertiary); text-align: center;
}
.empty-state p { margin: 0; font-size: .875rem; }

.chart-card { padding: 1rem 1.25rem; }
.chart-title { font-size: .875rem; font-weight: 600; color: var(--text-primary); margin: 0 0 .75rem; }
.chart-wrap { height: 180px; }

.fp-table { width: 100%; border-collapse: collapse; }
.fp-table th {
  font-size: .7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .07em; color: var(--text-tertiary);
  padding: .5rem .75rem; border-bottom: 1px solid var(--border-subtle);
  text-align: left;
}
.fp-row { cursor: pointer; transition: background 100ms; }
.fp-row:hover { background: var(--bg-elevated); }
.fp-row td { padding: .625rem .75rem; border-bottom: 1px solid var(--border-subtle); }
.fp-row:last-child td { border-bottom: none; }
.fp-date { font-size: .78rem; color: var(--text-tertiary); white-space: nowrap; }
.fp-desc { font-size: .85rem; color: var(--text-primary); font-weight: 500; }
.fp-val  { text-align: right; font-size: .9rem; font-weight: 700; white-space: nowrap; }

/* Drawer */
.drawer-bg {
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  z-index: 400; backdrop-filter: blur(2px);
}
.drawer {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: 360px; max-width: 100vw;
  background: var(--bg-surface);
  border-left: 1px solid var(--border-default);
  z-index: 401; display: flex; flex-direction: column;
  box-shadow: -8px 0 40px rgba(0,0,0,.3);
}
[data-theme="light"] .drawer { box-shadow: -4px 0 24px rgba(0,0,0,.1); }
.drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-default); flex-shrink: 0;
}
.drawer-title { font-size: .9375rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.drawer-body { flex: 1; overflow-y: auto; padding: 1rem 1.25rem; }
.drawer-section { display: flex; flex-direction: column; gap: .75rem; }
.drawer-footer {
  display: flex; gap: .75rem; padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-default); flex-shrink: 0;
}
.drawer-footer .btn { flex: 1; justify-content: center; }

/* Modal categorias */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(0,0,0,.5); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.cats-modal {
  width: 480px; max-width: 100%; max-height: 80vh;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0,0,0,.4);
  display: flex; flex-direction: column; overflow: hidden;
}
[data-theme="light"] .cats-modal { box-shadow: 0 12px 40px rgba(0,0,0,.15); }
.cats-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-default); flex-shrink: 0;
}
.cats-modal-title { font-size: .9375rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.cats-modal-body { flex: 1; overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 1.5rem; }

.cats-section { display: flex; flex-direction: column; gap: .625rem; }
.cats-section-title {
  font-size: .7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .08em; color: var(--text-tertiary); margin: 0;
}
.cats-list { display: flex; flex-wrap: wrap; gap: .375rem; }
.cats-tag {
  display: inline-flex; align-items: center; gap: .35rem;
  background: var(--bg-overlay); border: 1px solid var(--border-default);
  border-radius: 99px; padding: .25rem .625rem .25rem .75rem;
  font-size: .78rem; color: var(--text-secondary);
}
.cats-tag--entrada {
  background: rgba(34,197,94,.07);
  border-color: rgba(34,197,94,.2);
  color: var(--accent);
}
.cats-color-wrap {
  position: relative; display: flex; align-items: center;
  cursor: pointer; flex-shrink: 0; width: 14px; height: 14px;
}
.cats-color-input {
  position: absolute; inset: 0; opacity: 0;
  width: 100%; height: 100%; cursor: pointer; padding: 0; border: none;
}
.cats-color-swatch {
  display: block; width: 12px; height: 12px;
  border-radius: 50%; border: 1.5px solid rgba(255,255,255,.15);
  flex-shrink: 0; pointer-events: none; transition: transform 120ms;
}
[data-theme="light"] .cats-color-swatch { border-color: rgba(0,0,0,.15); }
.cats-color-wrap:hover .cats-color-swatch { transform: scale(1.25); }

.cats-remove {
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; cursor: pointer;
  color: var(--text-tertiary); padding: 0; line-height: 1;
  transition: color 100ms;
}
.cats-remove:hover { color: var(--status-danger); }
.cats-add-row { display: flex; gap: .5rem; margin-top: .25rem; }
.cats-add-row .form-input { flex: 1; }

.modal-fade-enter-active { transition: opacity 150ms ease; }
.modal-fade-leave-active { transition: opacity 100ms ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
