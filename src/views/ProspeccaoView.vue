<template>
  <div class="page-layout">

    <div class="page-header">
      <div>
        <h1 class="page-title">Prospecção</h1>
        <p class="page-subtitle">Gerencie sua lista de leads para contato</p>
      </div>
      <div class="page-actions">
        <button v-if="allRows.length" class="btn btn-secondary" @click="abrirFoco">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
          Modo Foco
        </button>
        <button v-if="allRows.length" class="btn btn-secondary" @click="limparLista">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          Limpar lista
        </button>
        <button class="btn btn-primary" @click="abrirCSV">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Importar CSV
        </button>
        <input ref="fileInput" type="file" accept=".csv" style="display:none" @change="handleFile" />
      </div>
    </div>

    <!-- KPIs — só aparece quando há dados -->
    <div v-if="allRows.length" class="kpi-grid kpi-grid--4">
      <div class="kpi-card">
        <span class="kpi-label">Total</span>
        <span class="kpi-value" style="color:var(--status-info)">{{ allRows.length }}</span>
        <span class="kpi-sub">empresas</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Pendentes</span>
        <span class="kpi-value kpi-value--warning">{{ pendentes }}</span>
        <span class="kpi-sub">aguardando</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Contatados</span>
        <span class="kpi-value kpi-value--accent">{{ contatados }}</span>
        <span class="kpi-sub">{{ pctTotal }}% da lista</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Sem site</span>
        <span class="kpi-value kpi-value--danger">{{ semSite }}</span>
        <span class="kpi-sub">oportunidade</span>
      </div>
    </div>

    <!-- Barra de progresso -->
    <div v-if="allRows.length" class="progress-card card">
      <div class="progress-top">
        <span class="progress-label">{{ indicadorMsg }}</span>
        <span class="progress-pct" :style="{ color: pctTotal>=100?'var(--status-warning)':pctTotal>=50?'var(--accent)':'var(--text-tertiary)' }">{{ pctTotal }}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill"
          :style="{
            width: pctTotal+'%',
            background: pctTotal>=100?'linear-gradient(90deg,var(--status-warning),#fbbf24)':pctTotal>=50?'var(--accent)':'var(--accent)'
          }"></div>
      </div>
    </div>

    <!-- Alerta 28h -->
    <div v-if="alerta28h" class="card card--followup" style="cursor:pointer" @click="filterStatus='pendente'">
      <div class="followup-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        {{ alerta28h }} lead{{ alerta28h!==1?'s':'' }} sem resposta há mais de 28h — clique para filtrar
      </div>
    </div>

    <!-- Sel bar -->
    <Transition name="sel-bar">
      <div v-if="selected.size" class="sel-bar">
        <span class="sel-count">{{ selected.size }} selecionado{{ selected.size!==1?'s':'' }}</span>
        <button class="btn btn-primary btn-sm" @click="enviarSelecionados">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          Enviar ao CRM
        </button>
        <button class="btn btn-danger btn-sm" @click="excluirSelecionados">Excluir</button>
        <button class="btn btn-ghost btn-sm" @click="selected=new Set()">Limpar</button>
      </div>
    </Transition>

    <!-- Zona de importação (lista vazia) -->
    <div v-if="!allRows.length && !showMap" class="import-zone" @click="abrirCSV" @dragover.prevent @drop.prevent="handleDrop">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      <p>Clique ou arraste um <strong style="color:var(--accent)">.csv</strong> aqui</p>
      <span>Qualquer formato: vírgula, ponto-e-vírgula, tab</span>
    </div>

    <!-- Mapeamento de colunas CSV -->
    <div v-if="showMap" class="card">
      <div class="card-header">
        <h3 class="card-title">Mapear colunas do CSV</h3>
        <span class="kpi-sub">{{ csvRawRows.length }} linhas encontradas</span>
      </div>
      <div class="map-grid">
        <div v-for="f in FIELDS" :key="f.key" class="form-group">
          <label class="form-label">{{ f.label }} {{ f.required?'*':'' }}</label>
          <select v-model="colMap[f.key]" class="form-select">
            <option value="">— não usar —</option>
            <option v-for="h in csvHeaders" :key="h" :value="h">{{ h }}</option>
          </select>
        </div>
      </div>
      <div style="display:flex;gap:.625rem;margin-top:1rem">
        <button class="btn btn-secondary" @click="cancelarImport">Cancelar</button>
        <button class="btn btn-primary" @click="importarDados">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Importar {{ csvRawRows.length }} empresas
        </button>
      </div>
    </div>

    <!-- Filtros + tabela -->
    <div v-if="allRows.length && !showMap" class="card">
      <div class="prosp-toolbar">
        <div class="kb-search-box" style="max-width:280px">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="search" class="kb-search-input" placeholder="Buscar empresa..." />
          <button v-if="search" class="kb-search-clear" @click="search=''">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <select v-model="filterStatus" class="form-select" style="width:auto;font-size:.82rem">
          <option value="">Todos status</option>
          <option value="pendente">Pendentes</option>
          <option value="contatado">Contatados</option>
          <option value="sem_site">Sem site</option>
        </select>
        <select v-if="categorias.length" v-model="filterCat" class="form-select" style="width:auto;font-size:.82rem">
          <option value="">Todas categorias</option>
          <option v-for="c in categorias" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-if="cidades.length" v-model="filterCidade" class="form-select" style="width:auto;font-size:.82rem">
          <option value="">Todas cidades</option>
          <option v-for="c in cidades" :key="c" :value="c">{{ c }}</option>
        </select>
        <span class="kpi-sub" style="margin-left:auto">{{ pagInfo }}</span>
      </div>

      <div class="table-wrapper" style="margin-top:.75rem;border:none;border-radius:0">
        <table>
          <thead>
            <tr>
              <th style="width:36px"><input type="checkbox" class="cb" @change="toggleAll($event.target.checked)" /></th>
              <th class="th-sort" @click="sortBy('nome')">Empresa</th>
              <th class="th-sort" @click="sortBy('categoria')">Categoria</th>
              <th class="th-sort" @click="sortBy('cidade')">Cidade</th>
              <th style="min-width:145px">Telefone</th>
              <th>Status</th>
              <th style="width:120px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!paginado.length">
              <td colspan="7" style="text-align:center;color:var(--text-tertiary);padding:2rem;font-size:.875rem">Nenhuma empresa encontrada</td>
            </tr>
            <tr v-for="r in paginado" :key="r._id"
              :class="{ 'row-contatado': r._status==='contatado', 'row-sel': selected.has(r._id) }">
              <td @click.stop><input type="checkbox" class="cb" :checked="selected.has(r._id)" @change="toggleSel(r._id,$event.target.checked)" /></td>
              <td>
                <div style="font-weight:500;color:var(--text-primary);cursor:pointer" @click.stop="copiarNome(r.nome)" :title="'Copiar: '+r.nome">{{ r.nome }}</div>
                <div v-if="r.site" class="text-muted" style="font-size:.72rem">{{ r.site }}</div>
              </td>
              <td class="text-muted text-sm">{{ r.categoria || '—' }}</td>
              <td class="text-muted text-sm">{{ r.cidade || '—' }}</td>
              <td>
                <button class="wa-link" @click.stop="router.push('/slaczap?lead='+r.id)">
                  {{ formatTel(r.telefone) }}
                </button>
              </td>
              <td>
                <span class="badge" :class="r._status==='contatado'?'badge-accent':'badge-warning'">
                  {{ r._status==='contatado'?'Contatado':'Pendente' }}
                </span>
                <span v-if="r._contatado_em" class="text-muted" style="font-size:.65rem;display:block;margin-top:.1rem">{{ fmtDataHora(r._contatado_em) }}</span>
              </td>
              <td>
                <div style="display:flex;align-items:center;gap:.25rem;justify-content:flex-end">
                  <button v-if="r._status!=='contatado'"
                    class="btn btn-primary btn-sm"
                    style="font-size:.72rem;padding:.3rem .6rem"
                    @click="abrirModalContato(r)">
                    Contatar
                  </button>

                  <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--status-danger)" @click="excluirLead(r._id)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginação -->
      <div v-if="totalPages>1" class="pagination">
        <button class="btn btn-ghost btn-sm" :disabled="page<=1" @click="page--">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button v-for="p in pageRange" :key="p"
          class="btn btn-sm" :class="p===page?'btn-primary':'btn-ghost'"
          :disabled="p==='...'" @click="p!=='...'&&(page=p)">
          {{ p }}
        </button>
        <button class="btn btn-ghost btn-sm" :disabled="page>=totalPages" @click="page++">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>

  </div>

  <!-- MODO FOCO — fullscreen com fundo escurecido -->
  <Transition name="foco-fade">
    <div v-if="focoOpen" class="foco-overlay">
      <!-- Contador + fechar -->
      <div class="foco-top">
        <span class="foco-counter">{{ focoIdx+1 }} <span style="opacity:.4">/</span> {{ focoLista.length }}</span>
        <button class="btn btn-ghost btn-sm" @click="focoOpen=false">Sair do foco</button>
      </div>

      <!-- Barra de progresso -->
      <div class="foco-progress-bar">
        <div class="foco-progress-fill" :style="{ width: focoPct+'%' }"></div>
      </div>

      <!-- Card central -->
      <div v-if="focoLead" class="foco-center" :class="{ flash: focoFlash }">
        <div class="foco-name">{{ focoLead.nome }}</div>
        <div class="foco-details">
          <span v-if="focoLead.categoria" class="foco-tag">{{ focoLead.categoria }}</span>
          <span v-if="focoLead.cidade" class="foco-tag">{{ focoLead.cidade }}</span>
          <span v-if="focoLead.site" class="foco-tag foco-tag--site">{{ focoLead.site }}</span>
        </div>
        <div class="foco-tel-big">{{ formatTel(focoLead.telefone) }}</div>
      </div>
      <div v-else class="foco-center">
        <div class="foco-name" style="color:var(--accent)">🎯 Lista zerada!</div>
        <p class="text-muted">Todos os leads foram processados.</p>
      </div>

      <!-- Ações -->
      <div class="foco-actions">
        <!-- Voltar -->
        <button class="foco-btn foco-btn--nav" :disabled="focoIdx<=0" @click="focoIdx--" title="Lead anterior">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        <!-- Excluir -->
        <button class="foco-btn foco-btn--danger" @click="focoExcluir" title="Excluir lead">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>

        <!-- Contatar -->
        <button class="foco-btn foco-btn--ok" :disabled="focoContatando || !focoLead" @click="focoLead && abrirModalContato(focoLead)" title="Contatar lead">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </button>

        <!-- Avançar -->
        <button class="foco-btn foco-btn--nav" :disabled="focoIdx>=focoLista.length-1" @click="focoIdx++" title="Próximo lead">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  </Transition>

  <!-- ═══ MODAL CONTATO ═══ -->
  <Transition name="cont-modal">
    <div v-if="contModalOpen" class="cont-overlay" @click.self="contModalOpen=false">
      <div class="cont-modal">
        <div class="cont-modal-header">
          <div class="cont-modal-info">
            <span class="cont-modal-nome">{{ contModalLead?.nome }}</span>
            <span class="cont-modal-tel">{{ formatTel(contModalLead?.telefone) }}</span>
          </div>
          <button class="btn btn-ghost btn-icon btn-sm" @click="contModalOpen=false">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="cont-modal-body">
          <textarea
            v-model="contModalMsg"
            class="form-textarea cont-modal-textarea"
            placeholder="Digite a mensagem de abertura..."
            rows="4"
            :disabled="contModalSending"
          ></textarea>

          <div v-if="!wa.connected" class="cont-modal-warn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            SlacZap desconectado — só marcará como contatado, não enviará
          </div>

          <button class="btn btn-ghost btn-sm cont-modal-ia" @click="contModalGerarIA" :disabled="contModalAiLoading || contModalSending">
            <svg v-if="!contModalAiLoading" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="cont-spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
            {{ contModalAiLoading ? 'Gerando...' : 'Sugestão IA' }}
          </button>
        </div>

        <div class="cont-modal-footer">
          <button class="btn btn-secondary" @click="contModalOpen=false" :disabled="contModalSending">Cancelar</button>
          <button class="btn btn-primary" @click="contModalEnviar" :disabled="!contModalMsg.trim() || contModalSending">
            <svg v-if="!contModalSending" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="cont-spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
            {{ contModalSending ? 'Enviando...' : (wa.connected ? 'Enviar e marcar' : 'Marcar como contatado') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>

</template>

<script setup>
import { ref, computed, onMounted, watch, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWaStore } from '@/stores/wa'
import { sb } from '@/lib/supabase'
import { slacLog } from '@/utils/log'

const router = useRouter()
const auth  = useAuthStore()
const wa    = useWaStore()
const toast = inject('toast')

async function copiarNome(nome) {
  try {
    await navigator.clipboard.writeText(nome)
    toast(nome + ' copiado', 'ok')
  } catch {
    toast('Não foi possível copiar', 'error')
  }
}

// ── Modal de contato ──
const contModalOpen     = ref(false)
const contModalLead     = ref(null)
const contModalMsg      = ref('')
const contModalAiLoading = ref(false)
const contModalSending  = ref(false)

function abrirModalContato(lead) {
  contModalLead.value = lead
  contModalMsg.value  = ''
  contModalOpen.value = true
}

async function contModalGerarIA() {
  if (!contModalLead.value) return
  contModalAiLoading.value = true
  try {
    const lead = contModalLead.value
    const { data, error } = await sb.functions.invoke('sugerir-resposta', {
      body: {
        messages: [{ direcao: 'interno', mensagem: 'Primeiro contato — lead ainda não foi abordado.' }],
        leadInfo: { nome: lead.nome, negocio: lead.nome, categoria: lead.categoria, etapa: 'contato' },
        scriptBase: wa.scriptBase || '',
        tom: 'recomendado',
        tipo: 'resposta',
      }
    })
    if (error) throw new Error(error.message || JSON.stringify(error))
    if (data?.error) throw new Error(data.error)
    if (data?.sugestao) contModalMsg.value = data.sugestao
  } catch (e) {
    toast('Erro IA: ' + (e.message || 'tente novamente'), 'error')
  } finally {
    contModalAiLoading.value = false
  }
}

async function contModalEnviar() {
  const lead = contModalLead.value
  if (!lead || !contModalMsg.value.trim()) return
  contModalSending.value = true
  try {
    if (wa.connected) {
      await wa.enviarMensagem(
        lead.id || null,
        auth.user.id,
        lead.telefone,
        contModalMsg.value.trim(),
        null,
        lead.negocio || lead.nome || null
      )
    }
    // Marca como contatado (tabela) ou avança no foco
    const row = allRows.value.find(r => r._id === lead._id)
    if (row) {
      await marcarContato(row._id)
      // Se estava no modo foco, avança
      if (focoOpen.value) {
        focoFlash.value = true; setTimeout(() => focoFlash.value = false, 500)
        tocarSom()
        focoLista.value = allRows.value.filter(r => r._status !== 'contatado')
        setTimeout(() => {
          if (focoIdx.value >= focoLista.value.length) focoOpen.value = false
          focoContatando.value = false
        }, 450)
      }
    }
    contModalOpen.value = false
    toast(wa.connected ? 'Mensagem enviada!' : 'Marcado como contatado', 'ok')
  } catch (e) {
    toast('Erro: ' + (e.message || 'tente novamente'), 'error')
  } finally {
    contModalSending.value = false
  }
}

// ── State ──
const allRows     = ref([])
const search      = ref('')
const filterStatus = ref('')
const filterCat   = ref('')
const filterCidade = ref('')
const sortField   = ref('')
const sortDir     = ref('asc')
const selected    = ref(new Set())
const page        = ref(1)
const focoOpen    = ref(false)
const focoLista   = ref([])
const focoIdx     = ref(0)
const focoFlash   = ref(false)
const focoContatando = ref(false)
const histLead    = ref(null)
const showMap     = ref(false)
const csvHeaders  = ref([])
const csvRawRows  = ref([])
const colMap      = ref({})
const fileInput   = ref(null)

const PAGE_SIZE = 50

const FIELDS = [
  { key:'nome',      label:'Nome / Empresa',  required:true },
  { key:'telefone',  label:'Telefone',         required:true },
  { key:'categoria', label:'Categoria / Ramo', required:false },
  { key:'cidade',    label:'Cidade',           required:false },
  { key:'site',      label:'Site',             required:false },
  { key:'instagram', label:'Instagram',        required:false },
  { key:'endereco',  label:'Endereço',         required:false },
]

const AUTO_MAP = {
  'nome':'nome','empresa':'nome','name':'nome','razão social':'nome','razao social':'nome',
  'telefone':'telefone','phone':'telefone','celular':'telefone','whatsapp':'telefone','fone':'telefone',
  'categoria':'categoria','ramo':'categoria','segmento':'categoria','tipo':'categoria',
  'cidade':'cidade','city':'cidade','município':'cidade',
  'site':'site','website':'site','url':'site','homepage':'site',
  'instagram':'instagram','insta':'instagram',
  'endereco':'endereco','endereço':'endereco','address':'endereco',
}

// ── Computed ──
const pendentes   = computed(() => allRows.value.filter(r=>r._status!=='contatado').length)
const contatados  = computed(() => allRows.value.filter(r=>r._status==='contatado').length)
const semSite     = computed(() => allRows.value.filter(r=>!r.site).length)
const pctTotal    = computed(() => allRows.value.length ? Math.round(contatados.value/allRows.value.length*100) : 0)

const indicadorMsg = computed(() => {
  const total=allRows.value.length, atual=contatados.value, faltam=total-atual, pct=pctTotal.value
  if (!total) return 'Importe uma lista para começar.'
  if (!atual) return 'Bora! '+total+' empresas aguardando contato.'
  if (pct<30) return 'Bom começo! Faltam '+faltam+' contatos.'
  if (pct<60) return 'No caminho certo! Mais da metade foi. 💪'
  if (pct<100) return 'Quase lá! Só '+faltam+' empresa'+(faltam!==1?'s':'')+' pendente'+(faltam!==1?'s':'')+'.'
  return '🎯 Lista zerada! '+atual+' empresas contatadas.'
})

const alerta28h = computed(() => {
  const agora=Date.now()
  return allRows.value.filter(r=>r._status!=='contatado'&&r._contatado_em&&agora-new Date(r._contatado_em).getTime()>28*3600000).length||0
})

const categorias = computed(() => [...new Set(allRows.value.map(r=>r.categoria).filter(Boolean))].sort())
const cidades    = computed(() => [...new Set(allRows.value.map(r=>r.cidade).filter(Boolean))].sort())

const filtrado = computed(() => {
  let lista = allRows.value
  if (search.value) { const q=search.value.toLowerCase(); lista=lista.filter(r=>(r.nome+' '+r.telefone+' '+r.cidade+' '+r.categoria).toLowerCase().includes(q)) }
  if (filterStatus.value==='sem_site') lista=lista.filter(r=>!r.site)
  else if (filterStatus.value) lista=lista.filter(r=>r._status===filterStatus.value)
  if (filterCat.value) lista=lista.filter(r=>r.categoria===filterCat.value)
  if (filterCidade.value) lista=lista.filter(r=>r.cidade===filterCidade.value)
  if (sortField.value) {
    lista=[...lista].sort((a,b)=>{
      const av=(a[sortField.value]||'').toLowerCase(), bv=(b[sortField.value]||'').toLowerCase()
      return sortDir.value==='asc'?av.localeCompare(bv,'pt-BR'):bv.localeCompare(av,'pt-BR')
    })
  }
  return lista
})

const totalPages = computed(() => Math.ceil(filtrado.value.length/PAGE_SIZE))
const paginado   = computed(() => filtrado.value.slice((page.value-1)*PAGE_SIZE, page.value*PAGE_SIZE))
const pagInfo    = computed(() => {
  if (!filtrado.value.length) return '0 resultados'
  const s=(page.value-1)*PAGE_SIZE+1, e=Math.min(page.value*PAGE_SIZE,filtrado.value.length)
  return s+'–'+e+' de '+filtrado.value.length
})
const pageRange = computed(() => {
  const p=page.value, t=totalPages.value
  if (t<=7) return Array.from({length:t},(_,i)=>i+1)
  if (p<=4) return [1,2,3,4,5,'...',t]
  if (p>=t-3) return [1,'...',t-4,t-3,t-2,t-1,t]
  return [1,'...',p-1,p,p+1,'...',t]
})

const focoLead  = computed(() => focoLista.value[focoIdx.value])
const focoPct   = computed(() => focoLista.value.length?Math.round(focoIdx.value/focoLista.value.length*100):0)

const histItems = computed(() => {
  if (!histLead.value) return []
  const r=histLead.value
  return [
    r._contatado_em && { l:'Contatado '+fmtDataHora(r._contatado_em) },
    { l:'Telefone '+formatTel(r.telefone) },
    r.site && { l:'Site '+r.site },
    r.categoria && { l:'Categoria '+r.categoria },
    r.cidade && { l:'Cidade '+r.cidade },
    r.instagram && { l:'Instagram '+r.instagram },
    r.endereco && { l:'Endereço '+r.endereco },
  ].filter(Boolean)
})

watch(filtrado, () => { page.value=1 })
onMounted(() => { carregarDados() })

// ── Persistência ──
async function carregarDados() {
  try { const l=localStorage.getItem('slac_prosp_lista'); if(l) allRows.value=JSON.parse(l) } catch {}
  if (auth.user) {
    try {
      const { data } = await sb.from('configuracoes').select('valor')
        .eq('user_id',auth.user.id).eq('chave','prospeccao_lista').maybeSingle()
      if (data?.valor) { allRows.value=data.valor; localStorage.setItem('slac_prosp_lista',JSON.stringify(data.valor)) }
    } catch {}
  }
}

async function salvarDados() {
  localStorage.setItem('slac_prosp_lista',JSON.stringify(allRows.value))
  if (auth.user) {
    try {
      await sb.from('configuracoes').upsert({
        id:auth.user.id+'_prospeccao_lista', user_id:auth.user.id,
        chave:'prospeccao_lista', valor:allRows.value, updated_at:new Date().toISOString()
      },{onConflict:'id'})
    } catch {}
  }
}

// ── CSV ──
function abrirCSV() { fileInput.value.value=''; fileInput.value.click() }
function handleDrop(e) { const f=e.dataTransfer.files[0]; if(f) processFile(f) }
function handleFile(e) { const f=e.target.files[0]; if(f) processFile(f) }

function processFile(file) {
  const reader=new FileReader()
  reader.onload=e=>{
    const {headers,rows}=parseCSV(e.target.result)
    if(!headers.length||!rows.length) return
    csvHeaders.value=headers; csvRawRows.value=rows
    const map={}
    FIELDS.forEach(f=>{ const h=headers.find(h=>AUTO_MAP[h.toLowerCase()]===f.key); map[f.key]=h||'' })
    colMap.value=map; showMap.value=true
  }
  reader.readAsText(file,'UTF-8')
}

function detectDelimiter(text) {
  const line=text.split('\n')[0]||'', counts={',':0,';':0,'\t':0}
  let inQ=false
  for(const ch of line){ if(ch==='"')inQ=!inQ; if(!inQ&&counts[ch]!==undefined)counts[ch]++ }
  return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0]
}

function parseCSV(text) {
  if(text.charCodeAt(0)===0xFEFF) text=text.slice(1)
  const delim=detectDelimiter(text), lines=text.split(/\r?\n/).filter(l=>l.trim())
  if(!lines.length) return {headers:[],rows:[]}
  const headers=parseLine(lines[0],delim).map(h=>h.trim().replace(/^["']|["']$/g,''))
  const rows=[]
  for(let i=1;i<lines.length;i++){
    const vals=parseLine(lines[i],delim), obj={}
    headers.forEach((h,j)=>{ obj[h]=(vals[j]||'').trim().replace(/^["']|["']$/g,'') })
    rows.push(obj)
  }
  return {headers,rows}
}

function parseLine(line,delim=','){
  const result=[]; let cur='',inQ=false
  for(let i=0;i<line.length;i++){
    const ch=line[i]
    if(ch==='"'){if(inQ&&line[i+1]==='"'){cur+='"';i++;continue}inQ=!inQ;continue}
    if(ch===delim&&!inQ){result.push(cur.trim());cur='';continue}
    cur+=ch
  }
  result.push(cur.trim()); return result
}

function importarDados() {
  if(!colMap.value.nome||!colMap.value.telefone) return
  const novos=csvRawRows.value.map((row,i)=>{
    const nome=(row[colMap.value.nome]||'').trim()
    const tel=limparTel(row[colMap.value.telefone]||'')
    if(!nome&&!tel) return null
    return {
      _id:Date.now()+'_'+i, _status:'pendente',
      nome:nome||tel, telefone:tel,
      categoria:colMap.value.categoria?row[colMap.value.categoria]?.trim():'',
      cidade:colMap.value.cidade?row[colMap.value.cidade]?.trim():'',
      site:colMap.value.site?row[colMap.value.site]?.trim():'',
      instagram:colMap.value.instagram?row[colMap.value.instagram]?.trim():'',
      endereco:colMap.value.endereco?row[colMap.value.endereco]?.trim():'',
    }
  }).filter(Boolean)
  const existTels=new Set(allRows.value.map(r=>r.telefone))
  const unicos=novos.filter(r=>!existTels.has(r.telefone))
  allRows.value=[...unicos,...allRows.value]
  salvarDados(); showMap.value=false
  slacLog('PRO-001', `CSV importado: ${unicos.length} empresas adicionadas`, { total: novos.length, unicos: unicos.length })
}

function cancelarImport() { showMap.value=false }
function limparTel(t) { const d=t.replace(/\D/g,''); return(d.startsWith('55')&&d.length>11)?d.slice(2):d }

// ── Ações ──
async function marcarContato(id) {
  const row=allRows.value.find(r=>r._id===id)
  if(!row||row._status==='contatado') return
  row._status='contatado'; row._contatado_em=new Date().toISOString()
  salvarDados()
  if(auth.user) {
    try {
      const notas=[
        row.endereco&&'Endereço: '+row.endereco,
        row.site&&'Site: '+row.site,
        row.instagram&&'Instagram: '+row.instagram,
        'Contatado: '+new Date(row._contatado_em).toLocaleString('pt-BR'),
        'Origem: Prospecção CSV'
      ].filter(Boolean).join('\n')
      await sb.from('leads').upsert({
        id:'prosp_'+id, user_id:auth.user.id,
        nome:row.nome, telefone:row.telefone, negocio:row.nome,
        categoria:row.categoria||'', cidade:row.cidade||'',
        instagram:row.instagram||'', site_atual:row.site||'',
        etapa:'contato', prioridade:'media',
        notas, created_at:row._contatado_em, updated_at:row._contatado_em
      },{onConflict:'id'})
      slacLog('PRO-002', `Lead marcado como contatado: ${row.nome}`, { nome: row.nome, telefone: row.telefone })
      try { new BroadcastChannel('slac_crm').postMessage({type:'lead_novo'}) } catch {}
    } catch {}
  }
}

function excluirLead(id) {
  if(!confirm('Remover esta empresa da lista?')) return
  allRows.value=allRows.value.filter(r=>r._id!==id)
  selected.value.delete(id); selected.value=new Set(selected.value)
  salvarDados()
}

function limparLista() {
  if(!confirm('Limpar a lista de '+allRows.value.length+' empresas?')) return
  allRows.value=[]; selected.value=new Set(); salvarDados()
}

function toggleSel(id,checked) {
  if(checked) selected.value.add(id); else selected.value.delete(id)
  selected.value=new Set(selected.value)
}
function toggleAll(checked) {
  paginado.value.forEach(r=>checked?selected.value.add(r._id):selected.value.delete(r._id))
  selected.value=new Set(selected.value)
}

async function enviarSelecionados() {
  const ids=[...selected.value]; let ok=0
  for(const id of ids){
    const r=allRows.value.find(x=>x._id===id)
    if(!r||r._status==='contatado') continue
    await marcarContato(id); ok++
  }
  selected.value=new Set()
}

// ── Modo Foco ──
function abrirFoco() {
  focoLista.value=allRows.value.filter(r=>r._status!=='contatado')
  if(!focoLista.value.length) return
  focoIdx.value=0; focoOpen.value=true
}

async function focoMarcar() {
  const r=focoLead.value; if(!r) return
  focoContatando.value=true
  focoFlash.value=true; setTimeout(()=>focoFlash.value=false,500)
  tocarSom()
  await marcarContato(r._id)
  focoLista.value=allRows.value.filter(r=>r._status!=='contatado')
  setTimeout(()=>{
    if(focoIdx.value>=focoLista.value.length){ focoOpen.value=false }
    focoContatando.value=false
  },450)
}

function tocarSom() {
  try {
    const ctx=new(window.AudioContext||window.webkitAudioContext)()
    const osc=ctx.createOscillator(), gain=ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(520,ctx.currentTime)
    osc.frequency.setValueAtTime(660,ctx.currentTime+0.08)
    gain.gain.setValueAtTime(0.15,ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.25)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime+0.25)
  } catch {}
  if(navigator.vibrate) navigator.vibrate([40,20,40])
}

function sortBy(field) {
  sortDir.value=sortField.value===field?(sortDir.value==='asc'?'desc':'asc'):'asc'
  sortField.value=field
}

function focoExcluir() {
  const r = focoLead.value
  if (!r) return
  if (!confirm('Remover ' + r.nome + ' da lista?')) return
  allRows.value = allRows.value.filter(x => x._id !== r._id)
  focoLista.value = focoLista.value.filter(x => x._id !== r._id)
  if (focoIdx.value >= focoLista.value.length) focoIdx.value = Math.max(0, focoLista.value.length - 1)
  if (!focoLista.value.length) focoOpen.value = false
  salvarDados()
}

function formatTel(t) {
  if(!t) return '—'
  const d=t.replace(/\D/g,'')
  if(d.length===11) return '('+d.slice(0,2)+') '+d.slice(2,7)+'-'+d.slice(7)
  if(d.length===10) return '('+d.slice(0,2)+') '+d.slice(2,6)+'-'+d.slice(6)
  return t
}

function fmtDataHora(d) {
  return new Date(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})
}
</script>

<style scoped>
/* Progress bar */
.progress-card { padding:.875rem 1.25rem; }
.progress-top  { display:flex; align-items:center; justify-content:space-between; margin-bottom:.625rem; }
.progress-label{ font-size:.875rem; color:var(--text-secondary); }
.progress-pct  { font-size:.875rem; font-weight:700; }
.progress-bar  { height:6px; background:var(--bg-overlay); border-radius:99px; overflow:hidden; }
.progress-fill { height:100%; border-radius:99px; transition:width 600ms ease; }

/* Import zone */
.import-zone {
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.625rem;
  border:2px dashed var(--border-default); border-radius:var(--radius-lg);
  padding:3rem 2rem; text-align:center; cursor:pointer;
  color:var(--text-tertiary); transition:border-color 200ms ease,background 200ms ease;
}
.import-zone:hover { border-color:var(--accent); background:var(--accent-subtle); color:var(--text-secondary); }
.import-zone svg { opacity:.4; }
.import-zone p   { font-size:.9375rem; font-weight:500; color:var(--text-secondary); margin:0; }
.import-zone span{ font-size:.8125rem; }

/* Map grid */
.map-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:.75rem; margin-top:.875rem; }

/* Toolbar */
.prosp-toolbar { display:flex; align-items:center; gap:.625rem; flex-wrap:wrap; }

/* Search */
.kb-search-box { display:flex; align-items:center; gap:.5rem; background:var(--bg-elevated); border:1px solid var(--border-default); border-radius:var(--radius-full); padding:.375rem .875rem; flex:1; min-width:160px; }
.kb-search-box:focus-within { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-subtle); }
.kb-search-box svg { flex-shrink:0; color:var(--text-tertiary); }
.kb-search-input { flex:1; background:transparent; border:none; outline:none; font-family:var(--font-body); font-size:.875rem; color:var(--text-primary); }
.kb-search-input::placeholder { color:var(--text-tertiary); }
.kb-search-clear { display:flex; align-items:center; background:none; border:none; cursor:pointer; color:var(--text-tertiary); padding:0; }

/* Table */
.cb { accent-color:var(--accent); cursor:pointer; width:14px; height:14px; }
.row-contatado td { opacity:.5; }
.row-sel td { background:var(--accent-subtle) !important; }
.wa-link { color:var(--accent); font-size:.82rem; background:none; border:none; padding:0; cursor:pointer; }
.th-sort { cursor:pointer; user-select:none; }
.th-sort:hover { color:var(--accent); }

/* Sel bar */
.sel-bar { display:flex; align-items:center; gap:.625rem; flex-wrap:wrap; background:var(--accent-subtle); border:1px solid var(--accent); border-radius:var(--radius-lg); padding:.625rem 1rem; }
.sel-count { font-size:.82rem; font-weight:700; color:var(--accent); }
.sel-bar-enter-active,.sel-bar-leave-active { transition:all 180ms ease; }
.sel-bar-enter-from,.sel-bar-leave-to { opacity:0; transform:translateY(-6px); }

/* Paginação */
.pagination { display:flex; align-items:center; gap:.25rem; justify-content:center; padding-top:.875rem; flex-wrap:wrap; }


/* Modo Foco — fullscreen */
.foco-overlay {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(0,0,0,.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 2rem; padding: 1.5rem;
}
.foco-top {
  position: absolute; top: 1.25rem; left: 0; right: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 1.5rem;
}
.foco-counter {
  font-size: .9375rem; font-weight: 700;
  color: rgba(255,255,255,.5);
  font-family: var(--font-display);
}
.foco-progress-bar {
  position: absolute; top: 0; left: 0; right: 0;
  height: 3px; background: rgba(255,255,255,.08);
}
.foco-progress-fill {
  height: 100%; background: var(--accent);
  transition: width 400ms ease;
}

/* Card central */
.foco-center {
  display: flex; flex-direction: column; align-items: center;
  gap: 1rem; text-align: center;
  padding: 2rem; max-width: 480px; width: 100%;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: var(--radius-xl, 20px);
  transition: border-color 300ms ease, box-shadow 300ms ease;
}
.foco-center.flash {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-subtle);
}
.foco-name    { font-size: 1.625rem; font-weight: 800; color: #fff; letter-spacing: -.03em; line-height: 1.2; }
.foco-details { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; justify-content: center; }
.foco-tag {
  font-size: .75rem; font-weight: 500;
  background: rgba(255,255,255,.08); color: rgba(255,255,255,.6);
  border-radius: 99px; padding: .2rem .625rem;
}
.foco-tag--site { color: var(--status-info); background: var(--status-info-subtle); }
.foco-tel-big {
  font-size: 1.25rem; font-weight: 700;
  color: rgba(255,255,255,.8);
  letter-spacing: .02em;
  font-family: var(--font-display);
}

/* Botões de ação */
.foco-actions {
  display: flex; align-items: center; gap: 1rem;
}
.foco-btn {
  display: flex; align-items: center; justify-content: center;
  border: none; cursor: pointer; border-radius: 50%;
  transition: transform 120ms ease, opacity 120ms ease, box-shadow 120ms ease;
  -webkit-tap-highlight-color: transparent;
}
.foco-btn:disabled { opacity: .25; cursor: not-allowed; }
.foco-btn:not(:disabled):active { transform: scale(.9); }

.foco-btn--nav {
  width: 48px; height: 48px;
  background: rgba(255,255,255,.08);
  color: rgba(255,255,255,.6);
}
.foco-btn--nav:not(:disabled):hover { background: rgba(255,255,255,.14); color: #fff; }

.foco-btn--danger {
  width: 48px; height: 48px;
  background: rgba(224,85,85,.15);
  color: var(--status-danger);
  border: 1px solid rgba(224,85,85,.3);
}
.foco-btn--danger:hover { background: rgba(224,85,85,.25); }

.foco-btn--wa {
  width: 56px; height: 56px;
  background: #25d366;
  color: #fff;
  text-decoration: none;
  box-shadow: 0 4px 16px rgba(37,211,102,.35);
}
.foco-btn--wa:hover { background: #22c55e; box-shadow: 0 6px 20px rgba(37,211,102,.5); }

.foco-btn--ok {
  width: 72px; height: 72px;
  background: var(--accent);
  color: #fff;
  box-shadow: 0 4px 20px rgba(34,197,94,.4);
}
.foco-btn--ok:not(:disabled):hover { background: var(--accent-dim); box-shadow: 0 6px 28px rgba(34,197,94,.55); }

/* Animação foco */
.foco-fade-enter-active { transition: all 250ms ease; }
.foco-fade-leave-active { transition: all 180ms ease; }
.foco-fade-enter-from   { opacity: 0; }
.foco-fade-leave-to     { opacity: 0; }

@media(max-width:768px) { .map-grid{grid-template-columns:1fr 1fr;} .page-layout{padding:1rem 1rem 5rem;} }
@media(max-width:480px) { .map-grid{grid-template-columns:1fr;} }
/* ── Modal de contato ── */
.cont-overlay {
  position: fixed; inset: 0; z-index: 1100;
  background: rgba(0,0,0,.45); backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.cont-modal {
  background: rgba(255,255,255,.06);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 18px;
  width: 100%; max-width: 400px;
  display: flex; flex-direction: column; gap: 0;
  box-shadow: 0 32px 80px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.1);
}
.cont-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: .875rem 1rem .75rem;
  border-bottom: 1px solid rgba(255,255,255,.07);
}
.cont-modal-info { display: flex; flex-direction: column; gap: .1rem; }
.cont-modal-nome { font-size: .9rem; font-weight: 700; color: var(--text-primary); }
.cont-modal-tel  { font-size: .75rem; color: var(--text-tertiary); }
.cont-modal-body {
  padding: .875rem 1rem;
  display: flex; flex-direction: column; gap: .625rem;
}
.cont-modal-textarea {
  resize: vertical; min-height: 90px;
  font-size: .875rem; line-height: 1.5;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1);
  color: var(--text-primary);
}
.cont-modal-textarea:focus {
  outline: none;
  border-color: rgba(34,197,94,.4);
  background: rgba(255,255,255,.07);
}
.cont-modal-warn {
  display: flex; align-items: center; gap: .4rem;
  font-size: .72rem; color: var(--status-warning);
  background: rgba(232,168,56,.08);
  border-radius: 6px; padding: .4rem .625rem;
  border: 1px solid rgba(232,168,56,.15);
}
.cont-modal-ia {
  align-self: flex-start;
  color: var(--accent); gap: .375rem;
  font-size: .8rem;
}
.cont-modal-footer {
  display: flex; gap: .625rem; padding: .75rem 1rem .875rem;
  border-top: 1px solid rgba(255,255,255,.07);
  justify-content: flex-end;
}
.cont-spin { animation: cont-spin .9s linear infinite; }
@keyframes cont-spin { to { transform: rotate(360deg); } }

/* Transition modal */
.cont-modal-enter-active, .cont-modal-leave-active { transition: all .18s ease; }
.cont-modal-enter-from, .cont-modal-leave-to { opacity: 0; }
.cont-modal-enter-from .cont-modal, .cont-modal-leave-to .cont-modal { transform: scale(.96) translateY(8px); }
</style>
