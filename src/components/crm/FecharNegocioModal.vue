<template>
  <div class="mo" :class="{ open: modelValue }" @click.self="$emit('update:modelValue', false)">
    <div class="mo-box" style="max-width:520px">
      <h3>🎉 Fechar negócio</h3>
      <p style="font-size:.82rem;color:var(--gr);margin-bottom:16px">
        Preencha os detalhes para registrar o pagamento no financeiro automaticamente.
      </p>

      <!-- Cliente -->
      <div class="fg">
        <label>Cliente</label>
        <input v-model="form.cli" class="fi" placeholder="Nome do cliente" readonly style="opacity:.7" />
      </div>

      <!-- Serviços -->
      <div class="fg">
        <label>Serviços contratados *</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:4px">
          <label
            v-for="s in todosServicos"
            :key="s"
            class="servico-check"
            :class="{ sel: servicosSel.includes(s) }"
            @click="toggleServico(s)"
          >
            <div class="sc-dot"></div>
            {{ s }}
          </label>
        </div>
        <!-- Serviço custom -->
        <div style="margin-top:8px;display:flex;gap:6px;align-items:center">
          <input
            v-model="servicoCustom"
            class="fi"
            placeholder="Outro serviço..."
            style="flex:1;padding:7px 10px;font-size:.8rem"
            @keydown.enter="addServicoCustom"
          />
          <button class="btn btn-gh" style="padding:6px 10px;font-size:.78rem;white-space:nowrap" @click="addServicoCustom">+ Add</button>
        </div>
      </div>

      <!-- Contrato -->
      <div class="fg">
        <label>Contrato</label>
        <select v-model="form.rec" class="fs" @change="calcParcelas">
          <option value="unica">Pagamento único</option>
          <option value="mensal">Setup + mensalidade recorrente</option>
          <option value="anual">Setup + anuidade recorrente</option>
        </select>
      </div>

      <!-- Setup -->
      <div style="background:#0d0d0d;border:1px solid var(--brd);border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-size:.72rem;font-weight:600;color:var(--gr);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">
          Setup / Entrada
        </div>
        <div class="fg" style="margin-bottom:8px">
          <label>Valor do setup (R$) *</label>
          <input v-model.number="form.val" class="fi" type="number" placeholder="797" min="0" step="0.01" @input="calcParcelas" />
        </div>
        <div class="fg" style="margin-bottom:0">
          <label>Forma de pagamento</label>
          <select v-model="form.forma" class="fs" @change="calcParcelas">
            <option value="100">100% à vista na entrada</option>
            <option value="50-50">50% agora + 50% na entrega</option>
            <option value="100-entrega">100% na entrega</option>
          </select>
        </div>
      </div>

      <!-- Parcela recorrente -->
      <div v-if="form.rec !== 'unica'" style="background:#0d0d0d;border:1px solid var(--brd);border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-size:.72rem;font-weight:600;color:var(--gr);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">
          Parcela recorrente
        </div>
        <div class="fg" style="margin-bottom:0">
          <label>Valor da parcela (R$)</label>
          <input v-model.number="form.valParcela" class="fi" type="number" placeholder="Ex: 97" min="0" step="0.01" @input="calcParcelas" />
          <small style="color:var(--gr);font-size:.72rem;margin-top:4px;display:block">
            Fica pendente até você confirmar o recebimento
          </small>
        </div>
      </div>

      <!-- Preview -->
      <div style="background:#0d0d0d;border:1px solid rgba(34,197,94,.2);border-radius:8px;padding:12px;margin-bottom:14px;font-size:.82rem;min-height:40px">
        <div v-if="preview.length === 0" style="color:var(--gr);font-size:.78rem">Preencha os valores acima</div>
        <div v-for="(linha, i) in preview" :key="i" style="display:flex;justify-content:space-between;padding:4px 0" :style="i > 0 && linha.sep ? 'border-top:1px solid var(--brd);margin-top:6px;padding-top:10px' : ''">
          <span style="color:var(--gr)">{{ linha.label }}</span>
          <span :style="{ color: linha.color, fontWeight: 600 }">{{ linha.valor }}</span>
        </div>
      </div>

      <!-- Datas -->
      <div class="fg">
        <label>Data da entrada</label>
        <input v-model="form.data1" class="fi" type="date" />
      </div>
      <div v-if="form.forma !== '100'" class="fg">
        <label>Data da entrega / próx. vencimento</label>
        <input v-model="form.data2" class="fi" type="date" />
      </div>

      <!-- Observação -->
      <div class="fg">
        <label>Observação</label>
        <input v-model="form.obs" class="fi" placeholder="Ex: Pago via Pix, entrega em 5 dias..." />
      </div>

      <div class="mo-acts">
        <button class="btn btn-g" :disabled="saving" @click="confirmar">
          {{ saving ? 'Salvando...' : '✓ Fechar e registrar' }}
        </button>
        <button class="btn btn-gh" @click="$emit('update:modelValue', false)">Cancelar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useFinStore } from '@/stores/fin'
import { useLeadsStore } from '@/stores/leads'
import { useAuthStore } from '@/stores/auth'
import { inject } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  lead: Object,         // lead atual
})
const emit = defineEmits(['update:modelValue', 'fechado'])

const fin = useFinStore()
const leads = useLeadsStore()
const auth = useAuthStore()
const toast = inject('toast')

// ── Serviços ──
const SERVICOS_BASE = [
  'Site Essencial', 'Site Profissional', 'Site Completo',
  'Google Meu Negócio', 'Tráfego Pago', 'Automação WhatsApp',
  'Manutenção', 'Pacote Completo'
]
const servicosExtras = ref([])
const servicosSel = ref([])
const servicoCustom = ref('')

const todosServicos = computed(() => [...SERVICOS_BASE, ...servicosExtras.value])

function toggleServico(s) {
  const idx = servicosSel.value.indexOf(s)
  if (idx !== -1) servicosSel.value.splice(idx, 1)
  else servicosSel.value.push(s)
  // Não precisa de new Set — array simples funciona
}

function addServicoCustom() {
  const v = servicoCustom.value.trim()
  if (!v) return
  if (!servicosExtras.value.includes(v)) servicosExtras.value.push(v)
  if (!servicosSel.value.includes(v)) servicosSel.value.push(v)
  servicoCustom.value = ''
}

// ── Form ──
const hoje = new Date().toISOString().split('T')[0]
const entrega = new Date(); entrega.setDate(entrega.getDate() + 5)
const entregaStr = entrega.toISOString().split('T')[0]

const form = reactive({
  cli: '',
  val: 797,
  forma: '50-50',
  rec: 'unica',
  valParcela: 0,
  data1: hoje,
  data2: entregaStr,
  obs: '',
})

const saving = ref(false)

// Quando o modal abre com um lead, preenche os campos
watch(() => props.lead, (lead) => {
  if (!lead) return
  form.cli = lead.nome || ''
  form.val = lead.valor_estimado || 797
  form.forma = '50-50'
  form.rec = 'unica'
  form.valParcela = 0
  form.data1 = hoje
  form.data2 = entregaStr
  form.obs = ''
  servicoCustom.value = ''
  servicosExtras.value = []
  // Pré-seleciona serviço do lead
  servicosSel.value = lead.site_atual ? [lead.site_atual] : []
}, { immediate: true })

// ── Preview ──
const fmt = fin.fmt

const preview = computed(() => {
  const val = form.val || 0
  const linhas = []

  if (form.forma === '100') {
    linhas.push({ label: 'Setup à vista', valor: '+' + fmt(val), color: 'var(--g)' })
  } else if (form.forma === '50-50') {
    linhas.push({ label: '50% setup agora', valor: '+' + fmt(val / 2), color: 'var(--g)' })
    linhas.push({ label: '50% setup na entrega', valor: '+' + fmt(val / 2), color: 'var(--a)' })
  } else if (form.forma === '100-entrega') {
    linhas.push({ label: 'Setup na entrega', valor: '+' + fmt(val), color: 'var(--a)' })
  }

  if ((form.rec === 'mensal' || form.rec === 'anual') && form.valParcela > 0) {
    linhas.push({
      label: 'Parcela ' + (form.rec === 'mensal' ? 'mensal' : 'anual'),
      valor: '+' + fmt(form.valParcela),
      color: 'var(--b)',
      sep: true,
    })
  }

  return linhas
})

// ── Calcular (mantém compatibilidade) ──
function calcParcelas() {
  // Reativo — o computed preview já recalcula automaticamente
}

// ── Confirmar fechamento ──
async function confirmar() {
  if (!servicosSel.value.length) { toast('Selecione ao menos um serviço', 'err'); return }
  if (!form.val || !form.data1) { toast('Preencha o valor e a data', 'err'); return }

  const desc = servicosSel.value.join(' + ')
  const leadId = props.lead?.id
  const tagLead = leadId ? 'lead:' + leadId : ''
  const obsTag = (o) => [o, tagLead].filter(Boolean).join(' · ')

  const txs = []
  const t = Date.now()

  if (form.forma === '100') {
    txs.push({ id: 't' + t, tipo: 'entrada', desc: desc + ' — setup', cat: 'Site', val: form.val, data: form.data1, st: 'recebido', rec: 'unica', cli: form.cli, obs: obsTag(form.obs) })
  } else if (form.forma === '50-50') {
    txs.push({ id: 't' + t,     tipo: 'entrada', desc: desc + ' — 50% setup entrada', cat: 'Site', val: form.val / 2, data: form.data1,          st: 'recebido', rec: 'unica', cli: form.cli, obs: obsTag(form.obs) })
    txs.push({ id: 't' + (t+1), tipo: 'entrada', desc: desc + ' — 50% setup entrega', cat: 'Site', val: form.val / 2, data: form.data2 || form.data1, st: 'pendente', rec: 'unica', cli: form.cli, obs: obsTag('Aguardando entrega') })
  } else if (form.forma === '100-entrega') {
    txs.push({ id: 't' + t, tipo: 'entrada', desc: desc + ' — setup na entrega', cat: 'Site', val: form.val, data: form.data2 || form.data1, st: 'pendente', rec: 'unica', cli: form.cli, obs: obsTag('Aguardando entrega') })
  }

  if ((form.rec === 'mensal' || form.rec === 'anual') && form.valParcela > 0) {
    txs.push({ id: 't' + (t+2), tipo: 'entrada', desc: desc + ' — ' + (form.rec === 'mensal' ? 'mensalidade' : 'anuidade'), cat: 'Site', val: form.valParcela, data: form.data2 || form.data1, st: 'pendente', rec: form.rec, cli: form.cli, obs: obsTag(form.obs) })
  }

  saving.value = true
  try {
    // Salva transações
    for (const tx of txs) {
      fin.fin.unshift(tx)
      await fin.upsert(tx)
    }

    // Atualiza lead para fechado
    if (props.lead) {
      const payload = {
        ...props.lead,
        etapa: 'fechado',
        valor_estimado: form.val,
        updated_at: new Date().toISOString()
      }
      await leads.upsert(payload)
    }

    emit('update:modelValue', false)
    emit('fechado')
    toast('🎉 Negócio fechado! Receita registrada', 'ok')
  } catch (e) {
    toast('Erro: ' + e.message, 'err')
  } finally {
    saving.value = false
  }
}
</script>
