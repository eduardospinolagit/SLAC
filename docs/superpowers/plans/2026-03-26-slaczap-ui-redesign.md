# SlacZap UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir botões de exportar/contato por modal glass com 5 seções (Contato, Anotações, Follow-up, Financeiro, Análise IA) no SlacZapView.vue.

**Architecture:** O modal é estado local do componente SlacZapView.vue (sem novo arquivo). A Edge Function `analyze-lead` é adicionada em `supabase/functions/`. Novos campos são adicionados via ALTER TABLE no Supabase.

**Tech Stack:** Vue 3 Composition API, scoped CSS, Supabase Edge Functions (Deno + Anthropic SDK), SQL migration manual.

**Spec:** `docs/superpowers/specs/2026-03-26-slaczap-ui-redesign-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/views/SlacZapView.vue` | Modify | Remover painel antigo, adicionar modal glass + 5 seções |
| `supabase/functions/analyze-lead/index.ts` | Create | Edge Function — analisa conversa com Claude Haiku |
| Supabase SQL Editor (manual) | Run SQL | 7 novas colunas na tabela `leads` |

---

## Task 1: SQL Migration — Novas colunas na tabela leads

**Files:**
- No arquivo: executar SQL manual no Supabase Dashboard → SQL Editor

- [ ] **Step 1: Executar migração no Supabase**

Acesse: https://supabase.com/dashboard/project/jqmnmudfxxdcjfradvcj/sql/new

Execute:
```sql
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS anotacoes text,
  ADD COLUMN IF NOT EXISTS followup_obs text,
  ADD COLUMN IF NOT EXISTS followup_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pacote text,
  ADD COLUMN IF NOT EXISTS valor_contrato numeric,
  ADD COLUMN IF NOT EXISTS parcelas jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS analise_ia jsonb;
```

- [ ] **Step 2: Verificar**

No Supabase Table Editor, abrir tabela `leads` e confirmar que as 7 colunas aparecem.

---

## Task 2: Edge Function analyze-lead

**Files:**
- Create: `supabase/functions/analyze-lead/index.ts`

- [ ] **Step 1: Criar o arquivo**

```typescript
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk'

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  try {
    const { messages } = await req.json()
    if (!messages?.length) {
      return json({ error: 'messages obrigatório' }, 400)
    }

    const conversa = messages
      .map((m: { direcao: string; mensagem: string; data: string }) =>
        `[${m.direcao === 'enviado' ? 'Você' : 'Lead'}] ${m.mensagem}`
      )
      .join('\n')

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY })
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Você é um assistente de vendas da Sano Lab, empresa que cria sites para pequenas empresas.
Pacotes: Essencial R$797, Profissional R$1.097, Completo R$1.397.
Analise a conversa abaixo e retorne APENAS um JSON válido, sem markdown, com os campos:
- score (integer 0-100): probabilidade de fechar negócio
- resumo (string, máximo 2 frases): avaliação geral do lead
- positivos (array de strings, máximo 4 itens): sinais positivos na conversa
- atencao (array de strings, máximo 4 itens): pontos de atenção ou objeções
- geradoEm (string ISO 8601): data/hora atual

Considere score alto (>70) quando o lead demonstra interesse claro, pergunta sobre preços, ou tem necessidade óbvia.
Considere score baixo (<40) quando há objeções fortes, desinteresse ou sem resposta.

CONVERSA:
${conversa}`
      }]
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    const result = JSON.parse(text)
    return json(result)
  } catch (e) {
    console.error('[analyze-lead] erro:', e)
    return json({ error: 'Erro ao analisar' }, 500)
  }
})

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app',
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}
```

- [ ] **Step 2: Deploy da Edge Function**

```bash
cd "C:\Users\Eduardo\Pictures\Sano Lab Sites\SLAC\v2\slac\SiposCommandCenter"
npx supabase functions deploy analyze-lead --project-ref jqmnmudfxxdcjfradvcj
```

- [ ] **Step 3: Confirmar que ANTHROPIC_API_KEY já existe como secret**

```bash
npx supabase secrets list --project-ref jqmnmudfxxdcjfradvcj
```

Se `ANTHROPIC_API_KEY` não aparecer na lista, setar:
```bash
npx supabase secrets set ANTHROPIC_API_KEY=<chave> --project-ref jqmnmudfxxdcjfradvcj
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/analyze-lead/index.ts
git commit -m "feat: edge function analyze-lead com Claude Haiku"
```

---

## Task 3: Remover elementos antigos do SlacZapView.vue

**Files:**
- Modify: `src/views/SlacZapView.vue`

- [ ] **Step 0: Garantir que `watch` está no import do Vue**

Na linha de imports do `<script setup>` (linha ~360), adicionar `watch` se ainda não estiver:
```js
import { ref, computed, watch, nextTick, onMounted, onUnmounted, inject } from 'vue'
```

O arquivo atual **não tem `watch`** no import — sem isso, a Task 4 quebra o app.

O arquivo atual tem:
- Botão exportar: linha ~93 (button com `@click="exportarConversa"`)
- Botão openContact: linha ~96 (button com `@click="openContact"`)
- Botão irCRM: linha ~99 (button com `@click="irCRM"`)
- Painel contato: linhas ~247–344 (Transition sz-panel-bg + sz-contact-panel completo)
- Estado `showContact = ref(false)`: linha ~389
- Função `openContact()`: linhas ~554–557
- Função `exportarConversa()`: linhas ~560–581
- CSS do painel: procurar por `.sz-contact-panel`, `.sz-panel-bg`, `.sz-cp-*`

- [ ] **Step 1: Remover os 3 botões da toolbar e substituir pelo botão ⚙️**

No template, localizar o bloco `.sz-chat-toolbar` (linhas ~89–102):

Remover os botões de exportar e openContact inteiros. Substituir o botão `irCRM` pelo botão de configuração:

```html
<div class="sz-chat-toolbar">
  <span class="sz-etapa-badge" :style="{ background: etapaColor(activeLead.etapa) + '20', color: etapaColor(activeLead.etapa) }">
    {{ etapaLabel(activeLead.etapa) }}
  </span>
  <button v-if="activeLead?.id" class="sz-toolbar-btn" @click="configModalOpen = true" title="Configurações do lead" aria-label="Configurações do lead">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  </button>
</div>
```

- [ ] **Step 2: Remover o painel de contato do template**

Remover o bloco completo (linhas ~247–344):
```html
<!-- Contact panel overlay -->
<Transition name="sz-panel-bg">
  <div v-if="showContact" class="sz-panel-bg" @click="showContact = false"></div>
</Transition>

<!-- Contact panel -->
<Transition name="sz-panel">
  <div v-if="showContact" class="sz-contact-panel">
    ...tudo até </div>
  </div>
</Transition>
```

- [ ] **Step 3: Remover estado e funções no script**

Remover:
- `const showContact = ref(false)` (~linha 389)
- Função `openContact()` completa (~linhas 554–557)
- Função `exportarConversa()` completa (~linhas 560–581)

Também remover referências a `showContact` dentro de `openChat()` e `closeChat()`.

- [ ] **Step 4: Remover CSS do painel antigo**

No `<style scoped>`, remover todos os blocos:
- `.sz-contact-panel` e variantes
- `.sz-panel-bg`
- `.sz-cp-*` (sz-cp-header, sz-cp-body, sz-cp-identity, sz-cp-section, etc.)
- Transitions `.sz-panel-*` e `.sz-panel-bg-*`

- [ ] **Step 5: Testar no browser**

Abrir `http://localhost:5173/slaczap`. Confirmar:
- Toolbar mostra apenas badge de etapa + ícone ⚙️ (para leads com ID)
- Não há painel de contato deslizando ao clicar
- Sem erros no console

- [ ] **Step 6: Commit**

```bash
git add src/views/SlacZapView.vue
git commit -m "refactor: remove painel contato e botoes exportar/crm do SlacZap"
```

---

## Task 4: Modal Glass — Estrutura base + Nav + CSS

**Files:**
- Modify: `src/views/SlacZapView.vue`

- [ ] **Step 1: Adicionar estado reativo no script (no bloco `<script setup>`, após os refs existentes)**

Adicionar após `const showContact = ...` (ou no lugar, após remover):
```js
// Config modal
const configModalOpen = ref(false)
const activeSection   = ref('contato')
const analisando      = ref(false)
const erroAnalise     = ref(null)

// Seção Follow-up (estado local)
const followupDate = ref('')
const followupObs  = ref('')

// Seção Financeiro (estado local)
const parcelasLocal = ref([])

// Seção Anotações (estado local)
const anotacoesText = ref('')
let anotacoesTimer  = null

// Computed: lead completo do store (reativo)
const activeCrmLead = computed(() =>
  activeLead.value?.id
    ? leads.leads.find(l => l.id === activeLead.value.id) ?? null
    : null
)

// Sincroniza estado local ao abrir modal ou trocar seção
watch([configModalOpen, activeSection], () => {
  if (!configModalOpen.value || !activeCrmLead.value) return
  const l = activeCrmLead.value
  if (activeSection.value === 'followup') {
    followupDate.value = l.proximo_followup ? l.proximo_followup.slice(0, 16) : ''
    followupObs.value  = l.followup_obs ?? ''
  }
  if (activeSection.value === 'financeiro') {
    parcelasLocal.value = JSON.parse(JSON.stringify(l.parcelas ?? []))
  }
  if (activeSection.value === 'anotacoes') {
    anotacoesText.value = l.anotacoes ?? ''
  }
})

// Fecha modal e reseta ao trocar de lead
watch(activeLead, () => {
  configModalOpen.value = false
  activeSection.value   = 'contato'
  erroAnalise.value     = null
})

// Fecha com Escape
function onEscModal(e) { if (e.key === 'Escape') configModalOpen.value = false }
watch(configModalOpen, (val) => {
  if (val) document.addEventListener('keydown', onEscModal)
  else     document.removeEventListener('keydown', onEscModal)
})
```

- [ ] **Step 2: Adicionar o modal no template**

No template, adicionar o modal como filho direto do `.sz-root` — **no mesmo nível** de `.sz-chat` e `.sz-empty-chat`, fora de qualquer `v-if`. A posição correta é logo antes do `<!-- Empty state (desktop) -->` (linha ~347), após o bloco `<!-- ═══ CHAT ═══ -->`:

```html
<!-- ═══ CONFIG MODAL ═══ -->
<Transition name="sz-fade">
  <div v-if="configModalOpen" class="sz-modal-overlay" @click.self="configModalOpen = false"
    role="dialog" aria-label="Configurações do lead">

    <div class="sz-modal">
      <!-- Fechar -->
      <button class="sz-modal-close" @click="configModalOpen = false" aria-label="Fechar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      <!-- Nav vertical -->
      <nav class="sz-modal-nav">
        <button class="sz-modal-nav-item" :class="{ 'sz-modal-nav-item--active': activeSection === 'contato' }"
          @click="activeSection = 'contato'" title="Contato">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </button>
        <button class="sz-modal-nav-item" :class="{ 'sz-modal-nav-item--active': activeSection === 'anotacoes' }"
          @click="activeSection = 'anotacoes'" title="Anotações">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/><polyline points="15 3 15 9 21 9"/></svg>
        </button>
        <button class="sz-modal-nav-item" :class="{ 'sz-modal-nav-item--active': activeSection === 'followup' }"
          @click="activeSection = 'followup'" title="Follow-up">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="16" cy="16" r="3"/><path d="M16 14.5V16l1 1"/></svg>
        </button>
        <button class="sz-modal-nav-item" :class="{ 'sz-modal-nav-item--active': activeSection === 'financeiro' }"
          @click="activeSection = 'financeiro'" title="Financeiro">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </button>
        <button class="sz-modal-nav-item" :class="{ 'sz-modal-nav-item--active': activeSection === 'analise' }"
          @click="activeSection = 'analise'" title="Análise IA">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/></svg>
        </button>
      </nav>

      <!-- Corpo: seções injetadas nas tasks 5–9 -->
      <div class="sz-modal-body">
        <!-- placeholder — seções adicionadas nas tasks seguintes -->
      </div>
    </div>
  </div>
</Transition>
```

- [ ] **Step 3: Adicionar CSS do modal no `<style scoped>`**

```css
/* ── Modal Glass ── */
.sz-modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 200;
  display: flex; align-items: center; justify-content: center;
}
.sz-modal {
  display: flex;
  width: min(720px, 95vw);
  height: min(560px, 90vh);
  background: rgba(22,22,22,0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  overflow: hidden;
  position: relative;
}
.sz-modal-close {
  position: absolute; top: 12px; right: 12px;
  background: none; border: none; cursor: pointer;
  color: var(--text-tertiary); padding: 4px; border-radius: 4px;
  transition: color 0.15s;
}
.sz-modal-close:hover { color: var(--text-primary); }
.sz-modal-nav {
  width: 64px; flex-shrink: 0;
  border-right: 1px solid rgba(255,255,255,0.06);
  display: flex; flex-direction: column;
  padding: 48px 0 12px; gap: 2px;
}
.sz-modal-nav-item {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 44px;
  background: none; border: none; cursor: pointer;
  color: var(--text-tertiary);
  border-left: 2px solid transparent;
  transition: color 0.15s, background 0.15s;
}
.sz-modal-nav-item:hover { color: var(--text-secondary); background: rgba(255,255,255,0.03); }
.sz-modal-nav-item--active {
  color: var(--accent);
  border-left-color: var(--accent);
  background: var(--accent-subtle);
}
.sz-modal-body {
  flex: 1; overflow-y: auto; padding: 24px;
}
.sz-modal-body::-webkit-scrollbar { width: 4px; }
.sz-modal-body::-webkit-scrollbar-track { background: transparent; }
.sz-modal-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
.sz-modal-section-title {
  font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
  color: var(--text-secondary); text-transform: uppercase;
  margin-bottom: 16px;
}
/* Transition fade */
.sz-fade-enter-active, .sz-fade-leave-active { transition: opacity 0.15s ease; }
.sz-fade-enter-from, .sz-fade-leave-to { opacity: 0; }
/* Mobile */
@media (max-width: 768px) {
  .sz-modal { width: 100vw; height: 100vh; border-radius: 0; border: none; flex-direction: column; }
  .sz-modal-nav {
    width: 100%; height: 52px; flex-shrink: 0;
    flex-direction: row;
    border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06);
    padding: 0; overflow-x: auto; overflow-y: hidden; scrollbar-width: none;
  }
  .sz-modal-nav::-webkit-scrollbar { display: none; }
  .sz-modal-nav-item {
    flex-shrink: 0; width: 52px; height: 100%;
    border-left: none; border-bottom: 2px solid transparent;
  }
  .sz-modal-nav-item--active { border-left-color: transparent; border-bottom-color: var(--accent); }
  .sz-modal-body { padding: 16px; }
}
```

- [ ] **Step 4: Testar no browser**

Abrir `http://localhost:5173/slaczap`. Selecionar um lead com ID. Clicar ⚙️. Confirmar:
- Modal abre com overlay escuro e glass panel
- 5 ícones na nav vertical
- Fecha com ✕, clique fora, e Escape
- Em mobile (DevTools 375px): nav horizontal no topo

- [ ] **Step 5: Commit**

```bash
git add src/views/SlacZapView.vue
git commit -m "feat: modal glass base com nav vertical no SlacZap"
```

---

## Task 5: Seção Contato

**Files:**
- Modify: `src/views/SlacZapView.vue`

- [ ] **Step 1: Adicionar função saveField no script**

```js
function saveField(field, value) {
  if (!activeCrmLead.value || activeCrmLead.value[field] === value) return
  leads.upsert({ id: activeCrmLead.value.id, [field]: value || null })
}
```

- [ ] **Step 2: Substituir placeholder do `.sz-modal-body` pela estrutura de seções**

Substituir `<!-- placeholder -->` por:

```html
<!-- Seção: Contato -->
<div v-if="activeSection === 'contato'">
  <p class="sz-modal-section-title">Contato</p>
  <div v-if="activeCrmLead" class="sz-modal-grid">
    <div class="form-group">
      <label class="form-label">Nome</label>
      <input class="form-input" :value="activeCrmLead.nome"
        @blur="e => saveField('nome', e.target.value)" />
    </div>
    <div class="form-group">
      <label class="form-label">Telefone</label>
      <input class="form-input" :value="activeCrmLead.telefone"
        @blur="e => saveField('telefone', e.target.value)" />
    </div>
    <div class="form-group">
      <label class="form-label">Email</label>
      <input class="form-input" :value="activeCrmLead.email"
        @blur="e => saveField('email', e.target.value)" />
    </div>
    <div class="form-group">
      <label class="form-label">Empresa</label>
      <input class="form-input" :value="activeCrmLead.empresa"
        @blur="e => saveField('empresa', e.target.value)" />
    </div>
    <div class="form-group">
      <label class="form-label">Etapa</label>
      <select class="form-select" :value="activeCrmLead.etapa"
        @change="e => saveField('etapa', e.target.value)">
        <option v-for="et in ETAPAS" :key="et.id" :value="et.id">{{ et.label }}</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Valor Estimado (R$)</label>
      <input class="form-input" type="number" :value="activeCrmLead.valor_estimado"
        @blur="e => saveField('valor_estimado', e.target.value ? Number(e.target.value) : null)" />
    </div>
    <div class="form-group">
      <label class="form-label">Origem</label>
      <input class="form-input" :value="activeCrmLead.origem"
        @blur="e => saveField('origem', e.target.value)" />
    </div>
    <div class="form-group sz-modal-full">
      <label class="form-label">Observações</label>
      <textarea class="form-textarea" rows="3" :value="activeCrmLead.obs"
        @blur="e => saveField('obs', e.target.value)"></textarea>
    </div>
  </div>

  <!-- Histórico -->
  <div class="sz-modal-history">
    <p class="sz-modal-section-title" style="margin-top: 20px">Histórico</p>
    <div class="sz-modal-history-row">
      <span class="sz-modal-history-label">Adicionado em</span>
      <span class="sz-modal-history-val">{{ activeCrmLead ? new Date(activeCrmLead.created_at).toLocaleDateString('pt-BR') : '—' }}</span>
    </div>
    <div class="sz-modal-history-row">
      <span class="sz-modal-history-label">Follow-ups realizados</span>
      <span class="sz-modal-history-val">{{ activeCrmLead?.followup_count ?? 0 }}</span>
    </div>
    <div class="sz-modal-history-row">
      <span class="sz-modal-history-label">Releads</span>
      <span class="sz-modal-history-val">{{ activeCrmLead?.relead_data ? '1' : 'Nenhum' }}</span>
    </div>
  </div>
</div>

<!-- Seção: Anotações (placeholder) -->
<div v-else-if="activeSection === 'anotacoes'">
  <p class="sz-modal-section-title">Anotações</p>
</div>

<!-- Seção: Follow-up (placeholder) -->
<div v-else-if="activeSection === 'followup'">
  <p class="sz-modal-section-title">Follow-up</p>
</div>

<!-- Seção: Financeiro (placeholder) -->
<div v-else-if="activeSection === 'financeiro'">
  <p class="sz-modal-section-title">Financeiro</p>
</div>

<!-- Seção: Análise IA (placeholder) -->
<div v-else-if="activeSection === 'analise'">
  <p class="sz-modal-section-title">Análise IA</p>
</div>
```

- [ ] **Step 3: Adicionar CSS da seção Contato**

```css
.sz-modal-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
.sz-modal-full { grid-column: 1 / -1; }
.sz-modal-history-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
}
.sz-modal-history-row:last-child { border-bottom: none; }
.sz-modal-history-label { font-size: 12px; color: var(--text-secondary); }
.sz-modal-history-val { font-size: 12px; color: var(--text-primary); font-weight: 500; }
@media (max-width: 480px) { .sz-modal-grid { grid-template-columns: 1fr; } }
```

- [ ] **Step 4: Testar**

Abrir modal, clicar em "Contato". Confirmar campos populados. Editar "Nome" e clicar fora — confirmar que o lead atualiza no store (sem erro no console).

- [ ] **Step 5: Commit**

```bash
git add src/views/SlacZapView.vue
git commit -m "feat: seção Contato no modal SlacZap"
```

---

## Task 6: Seção Anotações

**Files:**
- Modify: `src/views/SlacZapView.vue`

- [ ] **Step 1: Adicionar função de debounce no script**

```js
function onAnotacoesInput(val) {
  clearTimeout(anotacoesTimer)
  anotacoesTimer = setTimeout(() => {
    if (!activeCrmLead.value) return
    leads.upsert({ id: activeCrmLead.value.id, anotacoes: val || null })
  }, 800)
}
```

- [ ] **Step 2: Substituir placeholder da seção Anotações**

```html
<!-- Seção: Anotações -->
<div v-else-if="activeSection === 'anotacoes'">
  <p class="sz-modal-section-title">Anotações</p>
  <textarea
    class="form-textarea sz-anotacoes-textarea"
    v-model="anotacoesText"
    placeholder="Anote qualquer informação sobre este lead..."
    @input="onAnotacoesInput(anotacoesText)"
  ></textarea>
</div>
```

- [ ] **Step 3: Adicionar CSS**

```css
.sz-anotacoes-textarea {
  width: 100%; min-height: 200px; resize: vertical;
  box-sizing: border-box;
}
```

- [ ] **Step 4: Testar**

Abrir modal → Anotações. Digitar texto. Aguardar 800ms. Confirmar que o campo `anotacoes` é salvo no banco (verificar no Supabase Table Editor ou reabrir o modal).

- [ ] **Step 5: Commit**

```bash
git add src/views/SlacZapView.vue
git commit -m "feat: seção Anotações no modal SlacZap"
```

---

## Task 7: Seção Follow-up

**Files:**
- Modify: `src/views/SlacZapView.vue`

- [ ] **Step 1: Adicionar função saveFollowup no script**

```js
async function saveFollowup() {
  if (!activeCrmLead.value) return
  await leads.upsert({
    id: activeCrmLead.value.id,
    proximo_followup: followupDate.value || null,
    followup_obs: followupObs.value || null,
    followup_count: (activeCrmLead.value.followup_count ?? 0) + 1
  })
  toast('Follow-up salvo', 'ok')
}
```

- [ ] **Step 2: Substituir placeholder da seção Follow-up**

```html
<!-- Seção: Follow-up -->
<div v-else-if="activeSection === 'followup'">
  <p class="sz-modal-section-title">Follow-up</p>
  <div class="sz-modal-grid" style="grid-template-columns: 1fr;">
    <div class="form-group">
      <label class="form-label">Data e hora do próximo follow-up</label>
      <input type="datetime-local" class="form-input" v-model="followupDate" />
    </div>
    <div class="form-group">
      <label class="form-label">Contexto</label>
      <input type="text" class="form-input" v-model="followupObs"
        placeholder="Ex.: ligar às 14h sobre proposta" />
    </div>
    <button class="btn btn-primary btn-sm" style="width: fit-content" @click="saveFollowup">
      Salvar follow-up
    </button>
  </div>
</div>
```

- [ ] **Step 3: Testar**

Abrir modal → Follow-up. Definir data e contexto. Clicar "Salvar follow-up". Confirmar toast "Follow-up salvo" e que `followup_count` incrementou no banco.

- [ ] **Step 4: Commit**

```bash
git add src/views/SlacZapView.vue
git commit -m "feat: seção Follow-up no modal SlacZap"
```

---

## Task 8: Seção Financeiro

**Files:**
- Modify: `src/views/SlacZapView.vue`

- [ ] **Step 1: Importar `useFinStore` no script**

Adicionar no bloco de imports:
```js
import { useFinStore } from '@/stores/fin'
const fin = useFinStore()
```

- [ ] **Step 2: Adicionar computed de transações e funções de parcelas**

```js
const transacoesLead = computed(() => {
  if (!activeCrmLead.value?.nome) return []
  const nome = activeCrmLead.value.nome.toLowerCase()
  return fin.fin
    .filter(t => t.cli?.toLowerCase() === nome)
    .slice(0, 10)
})

function adicionarParcela() {
  parcelasLocal.value.push({
    numero: parcelasLocal.value.length + 1,
    valor: null,
    vencimento: null,
    pago: false
  })
}

function saveParcelas() {
  if (!activeCrmLead.value) return
  leads.upsert({ id: activeCrmLead.value.id, parcelas: parcelasLocal.value })
}

function togglePago(idx) {
  parcelasLocal.value[idx].pago = !parcelasLocal.value[idx].pago
  saveParcelas()
}
```

- [ ] **Step 3: Substituir placeholder da seção Financeiro**

```html
<!-- Seção: Financeiro -->
<div v-else-if="activeSection === 'financeiro'">
  <p class="sz-modal-section-title">Financeiro</p>

  <!-- Contrato -->
  <div class="sz-modal-grid" style="margin-bottom: 20px">
    <div class="form-group">
      <label class="form-label">Pacote</label>
      <select class="form-select" :value="activeCrmLead?.pacote ?? ''"
        @change="e => saveField('pacote', e.target.value || null)">
        <option value="">Não definido</option>
        <option value="essencial">Essencial — R$ 797</option>
        <option value="profissional">Profissional — R$ 1.097</option>
        <option value="completo">Completo — R$ 1.397</option>
        <option value="personalizado">Personalizado</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Valor do contrato (R$)</label>
      <input type="number" class="form-input" :value="activeCrmLead?.valor_contrato ?? ''"
        @blur="e => saveField('valor_contrato', e.target.value ? Number(e.target.value) : null)" />
    </div>
  </div>

  <!-- Parcelas -->
  <div style="margin-bottom: 20px">
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 10px">
      <p class="sz-modal-section-title" style="margin: 0">Parcelas</p>
      <button class="btn btn-ghost btn-sm" @click="adicionarParcela">+ Adicionar</button>
    </div>
    <div v-if="!parcelasLocal.length" style="font-size:13px; color:var(--text-tertiary)">
      Nenhuma parcela cadastrada.
    </div>
    <div v-for="(p, idx) in parcelasLocal.slice().sort((a,b) => a.numero - b.numero)" :key="idx"
      class="sz-parcela-row">
      <span class="sz-parcela-num">#{{ p.numero }}</span>
      <input type="number" class="form-input sz-parcela-input" placeholder="Valor"
        :value="p.valor"
        @blur="e => { parcelasLocal[idx].valor = e.target.value ? Number(e.target.value) : null; saveParcelas() }" />
      <input type="date" class="form-input sz-parcela-input"
        :value="p.vencimento"
        @blur="e => { parcelasLocal[idx].vencimento = e.target.value || null; saveParcelas() }" />
      <label class="sz-parcela-pago">
        <input type="checkbox" :checked="p.pago" @change="togglePago(idx)" />
        <span>Pago</span>
      </label>
    </div>
  </div>

  <!-- Transações vinculadas -->
  <div>
    <p class="sz-modal-section-title">Transações vinculadas</p>
    <p v-if="!transacoesLead.length" style="font-size:13px; color:var(--text-tertiary)">
      Nenhuma transação vinculada a este contato.
    </p>
    <div v-for="t in transacoesLead" :key="t.id" class="tx-row">
      <span class="tx-date">{{ new Date(t.data).toLocaleDateString('pt-BR') }}</span>
      <span style="flex:1; font-size:13px; color:var(--text-primary)">{{ t.descricao }}</span>
      <span class="tx-val" :style="{ color: t.tipo === 'receita' ? 'var(--accent)' : 'var(--status-danger)' }">
        {{ t.tipo === 'receita' ? '+' : '-' }} R$ {{ Number(t.val).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
      </span>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Adicionar CSS**

```css
.sz-parcela-row {
  display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
}
.sz-parcela-num { font-size: 12px; color: var(--text-tertiary); min-width: 24px; }
.sz-parcela-input { flex: 1; min-width: 0; }
.sz-parcela-pago { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-secondary); white-space: nowrap; cursor: pointer; }
```

- [ ] **Step 5: Testar**

Abrir modal → Financeiro. Selecionar pacote, digitar valor. Adicionar parcela, preencher e marcar como pago. Confirmar saves no banco.

> **Nota sobre parcelas:** O `v-for` itera sobre uma cópia ordenada, mas o `@blur` referencia `parcelasLocal[idx]` — como parcelas são adicionadas sempre em ordem crescente (número = length+1), os índices coincidem. Se parcelas existentes chegarem fora de ordem do banco, usar `p.numero - 1` como índice no lugar de `idx`.

- [ ] **Step 6: Commit**

```bash
git add src/views/SlacZapView.vue
git commit -m "feat: seção Financeiro no modal SlacZap"
```

---

## Task 9: Seção Análise IA

**Files:**
- Modify: `src/views/SlacZapView.vue`

- [ ] **Step 1: Adicionar função analisarLead no script**

```js
async function analisarLead() {
  if (!activeCrmLead.value) return
  analisando.value  = true
  erroAnalise.value = null
  try {
    const msgs = waMsgs.value
      .slice(-50)
      .map(m => ({ direcao: m.direcao, mensagem: (m.mensagem || '').slice(0, 500), data: m.data }))

    const { data, error } = await sb.functions.invoke('analyze-lead', {
      body: { leadId: activeCrmLead.value.id, messages: msgs }
    })
    if (error) throw error

    await leads.upsert({ id: activeCrmLead.value.id, analise_ia: data })
  } catch {
    erroAnalise.value = 'Erro ao analisar. Tente novamente.'
  } finally {
    analisando.value = false
  }
}
```

- [ ] **Step 2: Substituir placeholder da seção Análise IA**

```html
<!-- Seção: Análise IA -->
<div v-else-if="activeSection === 'analise'">
  <p class="sz-modal-section-title">Análise IA</p>

  <!-- Carregando -->
  <div v-if="analisando" style="display:flex; flex-direction:column; align-items:center; gap:12px; padding: 32px 0">
    <div class="sz-typing"><span></span><span></span><span></span></div>
    <p style="font-size:13px; color:var(--text-secondary)">Analisando conversa...</p>
  </div>

  <!-- Erro -->
  <div v-else-if="erroAnalise" style="padding: 16px 0">
    <p style="font-size:13px; color:var(--status-danger); margin-bottom: 12px">{{ erroAnalise }}</p>
    <button class="btn btn-primary btn-sm" @click="analisarLead">Tentar novamente</button>
  </div>

  <!-- Sem análise -->
  <div v-else-if="!activeCrmLead?.analise_ia" style="padding: 16px 0">
    <p style="font-size:13px; color:var(--text-secondary); margin-bottom: 16px; line-height: 1.5">
      A IA analisa as últimas mensagens e avalia o potencial deste lead.
    </p>
    <button class="btn btn-primary" @click="analisarLead">Analisar conversa</button>
  </div>

  <!-- Com análise -->
  <div v-else>
    <!-- Score -->
    <div style="margin-bottom: 20px">
      <div style="display:flex; justify-content:space-between; margin-bottom: 6px">
        <span style="font-size:12px; color:var(--text-secondary)">Score</span>
        <span style="font-size:12px; font-weight:600"
          :style="{ color: activeCrmLead.analise_ia.score > 70 ? 'var(--accent)' : activeCrmLead.analise_ia.score >= 40 ? 'var(--status-warning)' : 'var(--status-danger)' }">
          {{ activeCrmLead.analise_ia.score }}/100
        </span>
      </div>
      <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden">
        <div style="height:100%; border-radius:3px; transition: width 0.3s"
          :style="{
            width: activeCrmLead.analise_ia.score + '%',
            background: activeCrmLead.analise_ia.score > 70 ? 'var(--accent)' : activeCrmLead.analise_ia.score >= 40 ? 'var(--status-warning)' : 'var(--status-danger)'
          }"></div>
      </div>
    </div>

    <!-- Resumo -->
    <p style="font-size:13px; color:var(--text-primary); line-height:1.6; margin-bottom: 16px">
      {{ activeCrmLead.analise_ia.resumo }}
    </p>

    <!-- Positivos -->
    <div v-if="activeCrmLead.analise_ia.positivos?.length" style="margin-bottom: 14px">
      <p style="font-size:11px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.04em; margin-bottom: 8px">Pontos positivos</p>
      <div v-for="p in activeCrmLead.analise_ia.positivos" :key="p" class="sz-analise-item sz-analise-item--ok">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span>{{ p }}</span>
      </div>
    </div>

    <!-- Atenção -->
    <div v-if="activeCrmLead.analise_ia.atencao?.length" style="margin-bottom: 16px">
      <p style="font-size:11px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.04em; margin-bottom: 8px">Pontos de atenção</p>
      <div v-for="a in activeCrmLead.analise_ia.atencao" :key="a" class="sz-analise-item sz-analise-item--warn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--status-warning)" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>{{ a }}</span>
      </div>
    </div>

    <!-- Rodapé -->
    <div style="display:flex; align-items:center; justify-content:space-between; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06)">
      <span style="font-size:11px; color:var(--text-tertiary)">
        Gerado em {{ new Date(activeCrmLead.analise_ia.geradoEm).toLocaleString('pt-BR') }}
      </span>
      <button class="btn btn-ghost btn-sm" @click="analisarLead">Re-analisar</button>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Adicionar CSS**

```css
.sz-analise-item {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 13px; padding: 4px 0; color: var(--text-primary);
}
.sz-analise-item svg { flex-shrink: 0; margin-top: 2px; }
```

- [ ] **Step 4: Testar**

Abrir modal → Análise IA. Clicar "Analisar conversa". Confirmar spinner durante análise, resultado com score/resumo/listas. Confirmar que re-análise funciona.

> **Nota:** `waMsgs.value` é a lista de mensagens carregada ao abrir o chat (estado local da view). Se o modal for aberto sem ter aberto o chat antes, `waMsgs` estará vazio — isso é aceitável pois o fluxo natural é: abrir chat → ler mensagens → clicar ⚙️.

Se houver erro de CORS na Edge Function, verificar deploy e secrets. A Edge Function não valida JWT (simplificação consciente — projeto single-user, chave fica em secret privado do servidor).

- [ ] **Step 5: Commit final**

```bash
git add src/views/SlacZapView.vue
git commit -m "feat: seção Análise IA com Claude Haiku no modal SlacZap"
```

---

## Task 10: Verificação final e polish

**Files:**
- Modify: `src/views/SlacZapView.vue` (apenas CSS residual)

- [ ] **Step 1: Verificar que não restou código morto**

Confirmar que `exportarConversa`, `openContact`, `showContact` foram totalmente removidos (buscar no arquivo).

- [ ] **Step 2: Confirmar que `watch` foi adicionado ao import (Task 3 Step 0)**

Verificar que a linha de import do Vue contém `watch`:
```js
import { ref, computed, watch, nextTick, onMounted, onUnmounted, inject } from 'vue'
```

- [ ] **Step 3: Testar fluxo completo**

1. Abrir `/slaczap` → selecionar lead com ID → clicar ⚙️ → confirmar modal abre
2. Seção Contato: editar nome e sair → confirmar save
3. Seção Anotações: digitar → aguardar → confirmar save
4. Seção Follow-up: definir data → clicar salvar → confirmar `followup_count` incrementou
5. Seção Financeiro: selecionar pacote → adicionar parcela → confirmar saves
6. Seção Análise IA: analisar → confirmar resultado
7. Pressionar Escape → confirmar fecha
8. Selecionar outro lead → confirmar modal fecha e reseta para seção Contato
9. Em DevTools mobile (375px) → confirmar nav horizontal e modal fullscreen

- [ ] **Step 4: Build de produção**

```bash
npm run build
```

Confirmar zero erros.

- [ ] **Step 5: Commit final**

```bash
git add src/views/SlacZapView.vue
git commit -m "feat: SlacZap UI/UX redesign completo — modal glass 5 seções"
```
