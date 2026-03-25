<template>
  <div class="page-layout">

    <div class="page-header">
      <div>
        <h1 class="page-title">Configurações</h1>
        <p class="page-subtitle">Gerencie sua conta e preferências</p>
      </div>
    </div>

    <div class="cfg-layout">

      <!-- SIDEBAR DE ABAS -->
      <nav class="cfg-nav">
        <button v-for="t in tabs" :key="t.id" class="cfg-nav-item" :class="{ active: activeTab === t.id }" @click="activeTab = t.id">
          <span v-html="t.icon" class="cfg-nav-icon"></span>
          {{ t.label }}
        </button>
      </nav>

      <!-- CONTEÚDO -->
      <div class="cfg-content">

        <!-- PERFIL -->
        <template v-if="activeTab === 'perfil'">
          <h2 class="cfg-section-title">Perfil</h2>
          <div class="card card--flat cfg-card">
            <div class="cfg-avatar-row">
              <div class="cfg-avatar">{{ userInitial }}</div>
              <div>
                <p class="cfg-name">{{ auth.userName }}</p>
                <p class="cfg-email">{{ auth.user?.email }}</p>
                <span class="plan-tag" :class="`plan-tag--${auth.role}`">{{ auth.roleLabel }}</span>
              </div>
            </div>
            <div class="cfg-divider"></div>
            <div class="cfg-field">
              <label class="form-label">Nome de exibição</label>
              <div class="cfg-row-inline">
                <input v-model="nomeEdit" class="form-input cfg-input" placeholder="Seu nome" maxlength="40" @keydown.enter="salvarNome" />
                <button class="btn btn-primary btn-sm" @click="salvarNome" :disabled="nomeEdit === auth.userName || !nomeEdit.trim()">Salvar</button>
              </div>
            </div>
            <div class="cfg-field" style="margin-top:.75rem">
              <label class="form-label">Nome da empresa</label>
              <div class="cfg-row-inline">
                <input v-model="empresaEdit" class="form-input cfg-input" placeholder="Ex: Sano Lab" maxlength="60" @keydown.enter="salvarEmpresa" />
                <button class="btn btn-primary btn-sm" @click="salvarEmpresa" :disabled="empresaEdit === auth.companyName">Salvar</button>
              </div>
            </div>
            <div class="cfg-field" style="margin-top:.75rem">
              <label class="form-label">E-mail</label>
              <p class="cfg-value">{{ auth.user?.email }}</p>
            </div>
          </div>
        </template>

        <!-- SEGURANÇA -->
        <template v-if="activeTab === 'seguranca'">
          <h2 class="cfg-section-title">Segurança</h2>
          <div class="card card--flat cfg-card">
            <p class="cfg-block-title">Alterar senha</p>
            <div class="cfg-pw-grid">
              <div class="form-group">
                <label class="form-label">Nova senha</label>
                <input v-model="novaSenha" type="password" class="form-input" placeholder="Mínimo 6 caracteres" autocomplete="new-password" />
              </div>
              <div class="form-group">
                <label class="form-label">Confirmar nova senha</label>
                <input v-model="confirmarSenha" type="password" class="form-input" placeholder="Repita a senha" autocomplete="new-password" @keydown.enter="alterarSenha" />
              </div>
            </div>
            <p v-if="senhaErro" class="cfg-error">{{ senhaErro }}</p>
            <button class="btn btn-secondary btn-sm" style="margin-top:.75rem;align-self:flex-start" @click="alterarSenha" :disabled="salvandoSenha">
              {{ salvandoSenha ? 'Salvando...' : 'Atualizar senha' }}
            </button>
          </div>

          <!-- SESSÕES ATIVAS -->
          <h2 class="cfg-section-title">Sessões ativas</h2>
          <div class="card card--flat cfg-card">
            <div class="cfg-session">
              <div class="cfg-session-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              </div>
              <div class="cfg-session-info">
                <p class="cfg-session-device">{{ sessionDevice }} <span class="cfg-session-current">sessão atual</span></p>
                <p class="cfg-hint">{{ sessionBrowser }} · Último acesso {{ lastSignIn }}</p>
              </div>
            </div>
            <div class="cfg-divider"></div>
            <div class="cfg-toggle-row">
              <div>
                <p class="cfg-block-title">Desconectar de todos os dispositivos</p>
                <p class="cfg-hint">Encerra todas as sessões ativas, incluindo esta</p>
              </div>
              <button class="btn btn-secondary btn-sm" @click="desconectarTodos">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Desconectar todos
              </button>
            </div>
          </div>

          <!-- ZONA DE PERIGO -->
          <h2 class="cfg-section-title" style="color:var(--status-danger)">Zona de perigo</h2>
          <div class="card card--flat cfg-card cfg-danger-card">
            <div class="cfg-toggle-row">
              <div>
                <p class="cfg-block-title" style="color:var(--status-danger)">Excluir conta</p>
                <p class="cfg-hint">Remove permanentemente sua conta e todos os dados. Ação irreversível.</p>
              </div>
              <button class="btn btn-danger btn-sm" @click="confirmarDelecao = true">Excluir conta</button>
            </div>
          </div>

          <!-- MODAL CONFIRMAR EXCLUSÃO -->
          <Teleport to="body">
            <Transition name="modal-fade">
              <div v-if="confirmarDelecao" class="modal-backdrop" @click.self="confirmarDelecao = false">
                <div class="card cfg-confirm-modal">
                  <div style="display:flex;align-items:center;gap:.625rem;margin-bottom:.875rem">
                    <div class="cfg-danger-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <h3 style="font-size:.9375rem;font-weight:700;color:var(--text-primary);margin:0">Excluir conta permanentemente?</h3>
                  </div>
                  <p style="font-size:.8125rem;color:var(--text-secondary);margin:0 0 .5rem;line-height:1.5">Todos os seus leads, dados financeiros e configurações serão <strong>apagados para sempre</strong>. Esta ação não pode ser desfeita.</p>
                  <p style="font-size:.8125rem;color:var(--text-secondary);margin:0 0 1rem;line-height:1.5">Digite <strong>EXCLUIR</strong> para confirmar:</p>
                  <input v-model="textoConfirmacao" class="form-input" placeholder="EXCLUIR" style="margin-bottom:.875rem" />
                  <div style="display:flex;gap:.5rem;justify-content:flex-end">
                    <button class="btn btn-ghost btn-sm" @click="confirmarDelecao = false; textoConfirmacao = ''">Cancelar</button>
                    <button class="btn btn-danger btn-sm" @click="excluirConta" :disabled="textoConfirmacao !== 'EXCLUIR' || excluindo">
                      {{ excluindo ? 'Excluindo...' : 'Excluir permanentemente' }}
                    </button>
                  </div>
                </div>
              </div>
            </Transition>
          </Teleport>
        </template>

        <!-- PLANO -->
        <template v-if="activeTab === 'plano'">
          <h2 class="cfg-section-title">Plano</h2>

          <!-- PRO -->
          <template v-if="auth.role === 'pro'">
            <div class="cfg-plan-grid">
              <div class="card card--flat cfg-plan-box cfg-plan-box--current">
                <div class="cfg-plan-header">
                  <div>
                    <p class="cfg-label">Plano atual</p>
                    <p class="cfg-plan-name">Pro</p>
                  </div>
                  <span class="plan-tag plan-tag--pro">PRO</span>
                </div>
                <div class="cfg-divider"></div>
                <p class="cfg-label" style="margin-bottom:.625rem">Incluído no seu plano</p>
                <ul class="cfg-benefits">
                  <li v-for="b in beneficiosPro" :key="b"><span class="bcheck">✓</span>{{ b }}</li>
                </ul>
              </div>

              <div class="card cfg-plan-box cfg-plan-box--elite">
                <div class="cfg-plan-header">
                  <div>
                    <p class="cfg-label">Quer mais poder?</p>
                    <p class="cfg-plan-name cfg-elite-text">Elite</p>
                  </div>
                  <span class="plan-tag plan-tag--elite">ELITE</span>
                </div>
                <p class="cfg-upgrade-desc">Recursos avançados para escalar sua prospecção e gestão de clientes.</p>
                <div class="cfg-divider"></div>
                <p class="cfg-label" style="margin-bottom:.625rem">Tudo do Pro, mais:</p>
                <ul class="cfg-benefits cfg-benefits--elite">
                  <li v-for="b in beneficiosElite" :key="b"><span class="bcheck bcheck--elite">✦</span>{{ b }}</li>
                </ul>
                <button class="btn cfg-btn-upgrade" style="margin-top:1.25rem;width:100%;justify-content:center">
                  Fazer upgrade para Elite
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
              </div>
            </div>
          </template>

          <!-- ELITE -->
          <template v-else-if="auth.role === 'elite'">
            <div class="card card--flat cfg-plan-box cfg-plan-box--elite-active">
              <div class="cfg-plan-header">
                <div>
                  <p class="cfg-label">Plano atual</p>
                  <p class="cfg-plan-name cfg-elite-text">Elite</p>
                </div>
                <span class="plan-tag plan-tag--elite">ELITE</span>
              </div>
              <div class="cfg-divider"></div>
              <ul class="cfg-benefits cfg-benefits--elite">
                <li v-for="b in [...beneficiosPro, ...beneficiosElite]" :key="b">
                  <span class="bcheck bcheck--elite">✦</span>{{ b }}
                </li>
              </ul>
              <div class="cfg-elite-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Você está no plano máximo. Obrigado pela confiança!
              </div>
            </div>
          </template>

          <!-- ADMIN -->
          <template v-else-if="auth.role === 'admin'">
            <div class="card card--flat cfg-plan-box">
              <div class="cfg-plan-header">
                <div>
                  <p class="cfg-label">Acesso</p>
                  <p class="cfg-plan-name" style="color:#f87171">Administrador</p>
                </div>
                <span class="plan-tag plan-tag--admin">ADMIN</span>
              </div>
              <div class="cfg-divider"></div>
              <p class="cfg-value">Acesso total ao sistema. Gerenciamento de usuários e relatórios disponíveis.</p>
            </div>
          </template>
        </template>

        <!-- APARÊNCIA -->
        <template v-if="activeTab === 'aparencia'">
          <h2 class="cfg-section-title">Aparência</h2>
          <div class="card card--flat cfg-card">
            <p class="cfg-block-title">Tema</p>
            <div class="cfg-theme-row">
              <button class="cfg-theme-btn" :class="{ active: isDark }" @click="!isDark && toggleTheme()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                <span>Modo Escuro</span>
              </button>
              <button class="cfg-theme-btn" :class="{ active: !isDark }" @click="isDark && toggleTheme()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
                <span>Modo Claro</span>
              </button>
            </div>
          </div>

          <h2 class="cfg-section-title" style="margin-top:.5rem">Notificações</h2>
          <div class="card card--flat cfg-card">
            <div class="cfg-toggle-row">
              <div>
                <p class="cfg-block-title">Alertas de follow-up</p>
                <p class="cfg-hint">Receba notificações push quando um follow-up vencer</p>
              </div>
              <button class="btn btn-sm" :class="notifAtiva ? 'btn-primary' : 'btn-secondary'" @click="pedirNotificacao" :disabled="notifAtiva">
                {{ notifAtiva ? 'Ativo' : 'Ativar' }}
              </button>
            </div>
          </div>
        </template>

        <!-- WHATSAPP -->
        <template v-if="activeTab === 'whatsapp'">
          <h2 class="cfg-section-title">WhatsApp Business</h2>
          <div class="card card--flat cfg-card">
            <div class="form-group">
              <label class="form-label">Instance ID (Z-API)</label>
              <input v-model="waInstanceId" class="form-input" placeholder="Ex: 3C4F2A1B..." />
              <p class="cfg-hint" style="margin-top:.35rem">Encontre em: Z-API Dashboard → sua instância → Instance ID</p>
            </div>
            <div class="cfg-divider"></div>
            <div class="form-group">
              <label class="form-label">Script base de prospecção</label>
              <textarea v-model="waScriptBase" class="form-textarea" rows="10"
                placeholder="Cole aqui seu script de vendas. A IA vai adaptar para cada lead com base no Instagram e Google do negócio.

Use {{nome}}, {{negocio}} e {{cidade}} como variáveis." />
              <p class="cfg-hint" style="margin-top:.35rem">
                Use
                <code style="background:var(--bg-overlay);padding:1px 5px;border-radius:4px;font-size:11px">{{nome}}</code>,
                <code style="background:var(--bg-overlay);padding:1px 5px;border-radius:4px;font-size:11px">{{negocio}}</code>,
                <code style="background:var(--bg-overlay);padding:1px 5px;border-radius:4px;font-size:11px">{{cidade}}</code> como variáveis.
              </p>
            </div>
            <button class="btn btn-primary btn-sm" style="align-self:flex-start" @click="salvarWa">
              Salvar configurações
            </button>
          </div>
        </template>

        <!-- DADOS -->
        <template v-if="activeTab === 'dados'">
          <h2 class="cfg-section-title">Dados</h2>
          <div class="card card--flat cfg-card">
            <div class="cfg-toggle-row">
              <div>
                <p class="cfg-block-title">Exportar leads</p>
                <p class="cfg-hint">Baixe todos os seus leads em formato CSV</p>
              </div>
              <button class="btn btn-secondary btn-sm" @click="exportarLeads">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Exportar CSV
              </button>
            </div>
            <div class="cfg-divider"></div>
            <div class="cfg-toggle-row">
              <div>
                <p class="cfg-block-title">Versão do app</p>
                <p class="cfg-hint">SLAC v2.0 — Sano Lab</p>
              </div>
            </div>
          </div>
        </template>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLeadsStore } from '@/stores/leads'
import { useTheme } from '@/composables/useTheme'
import { useWaStore } from '@/stores/wa'
import { useSaving } from '@/composables/useSaving'
import { sb } from '@/lib/supabase'

const auth  = useAuthStore()
const leads = useLeadsStore()
const toast = inject('toast')
const { theme, toggleTheme } = useTheme()
const isDark = computed(() => theme.value === 'dark')

const userInitial = computed(() => (auth.userName || '?').charAt(0).toUpperCase())

const activeTab = ref('perfil')
const tabs = [
  { id: 'perfil',    label: 'Perfil',    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
  { id: 'seguranca', label: 'Segurança', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' },
  { id: 'plano',     label: 'Plano',     icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
  { id: 'aparencia', label: 'Aparência', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>' },
  { id: 'dados',     label: 'Dados',     icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>' },
  { id: 'whatsapp',  label: 'WhatsApp',  icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' },
]

// WhatsApp
const wa           = useWaStore()
const { run }      = useSaving()
const waInstanceId = ref('')
const waScriptBase = ref('')

watch(activeTab, async (tab) => {
  if (tab === 'whatsapp') {
    await wa.loadConfig()
    waInstanceId.value = wa.config.instance_id
    waScriptBase.value = wa.scriptBase
  }
})

async function salvarWa() {
  await run(() => wa.saveConfig(waInstanceId.value, waScriptBase.value), 'Configurações salvas')
}

// Perfil
const nomeEdit    = ref('')
const empresaEdit = ref('')
onMounted(() => { nomeEdit.value = auth.userName; empresaEdit.value = auth.companyName })

async function salvarNome() {
  if (!nomeEdit.value.trim()) return
  await auth.saveUserName(nomeEdit.value.trim())
  toast?.('Nome atualizado', 'ok')
}

async function salvarEmpresa() {
  await auth.saveCompanyName(empresaEdit.value.trim())
  toast?.('Empresa atualizada', 'ok')
}

// Segurança
const novaSenha      = ref('')
const confirmarSenha = ref('')
const senhaErro      = ref('')
const salvandoSenha  = ref(false)
async function alterarSenha() {
  senhaErro.value = ''
  if (novaSenha.value.length < 6) { senhaErro.value = 'Mínimo 6 caracteres.'; return }
  if (novaSenha.value !== confirmarSenha.value) { senhaErro.value = 'As senhas não coincidem.'; return }
  salvandoSenha.value = true
  try {
    const { error } = await sb.auth.updateUser({ password: novaSenha.value })
    if (error) throw error
    novaSenha.value = ''; confirmarSenha.value = ''
    toast?.('Senha atualizada', 'ok')
  } catch (e) {
    senhaErro.value = e.message || 'Erro ao atualizar senha.'
  } finally { salvandoSenha.value = false }
}

// Sessões
function parseDevice(ua) {
  if (/android/i.test(ua)) return 'Android'
  if (/iphone|ipad/i.test(ua)) return 'iPhone / iPad'
  if (/mac/i.test(ua)) return 'Mac'
  if (/windows/i.test(ua)) return 'Windows'
  if (/linux/i.test(ua)) return 'Linux'
  return 'Dispositivo desconhecido'
}
function parseBrowser(ua) {
  if (/edg\//i.test(ua)) return 'Microsoft Edge'
  if (/opr\//i.test(ua)) return 'Opera'
  if (/chrome/i.test(ua)) return 'Chrome'
  if (/firefox/i.test(ua)) return 'Firefox'
  if (/safari/i.test(ua)) return 'Safari'
  return 'Navegador desconhecido'
}
const sessionDevice  = computed(() => parseDevice(navigator.userAgent))
const sessionBrowser = computed(() => parseBrowser(navigator.userAgent))
const lastSignIn     = computed(() => {
  const d = auth.user?.last_sign_in_at
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
})

async function desconectarTodos() {
  await sb.auth.signOut({ scope: 'global' })
  await auth.logout()
  window.location.href = '/login'
}

// Deletar conta
const confirmarDelecao  = ref(false)
const textoConfirmacao  = ref('')
const excluindo         = ref(false)

async function excluirConta() {
  if (textoConfirmacao.value !== 'EXCLUIR') return
  excluindo.value = true
  try {
    await sb.rpc('delete_user')
    await sb.auth.signOut()
    window.location.href = '/login'
  } catch (e) {
    toast?.('Erro ao excluir conta. Contate o suporte.', 'error')
  } finally { excluindo.value = false }
}

// Plano
const beneficiosPro = [
  'CRM com Kanban e pipeline visual',
  'Módulo Financeiro completo',
  'Controle de Recorrências',
  'Prospecção via CSV',
  'Follow-up e Relead com alertas',
  'Modo Foco fullscreen',
  'Histórico de alterações (desfazer)',
  'Notificações push',
]
const beneficiosElite = [
  'Relatórios avançados e analytics',
  'Múltiplos usuários / equipe',
  'Integração WhatsApp automática',
  'Prospecção automatizada (sem CSV)',
  'Suporte prioritário',
  'Acesso antecipado a novos recursos',
]

// Aparência
const notifAtiva = ref(Notification?.permission === 'granted')
async function pedirNotificacao() {
  const perm = await Notification.requestPermission()
  notifAtiva.value = perm === 'granted'
  toast?.(perm === 'granted' ? 'Notificações ativadas' : 'Permissão negada', perm === 'granted' ? 'ok' : 'error')
}

// Dados
function exportarLeads() {
  const cols = ['nome','negocio','telefone','categoria','cidade','instagram','site_atual','etapa','prioridade','valor_estimado','notas','created_at']
  const header = cols.join(';')
  const rows = leads.leads.map(l => cols.map(c => `"${(l[c] ?? '').toString().replace(/"/g,'""')}"`).join(';'))
  const csv = [header, ...rows].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `slac-leads-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  toast?.('CSV exportado', 'ok')
}
</script>

<style scoped>
/* Layout */
.cfg-layout { display: grid; grid-template-columns: 200px 1fr; gap: 1.5rem; align-items: start; }
@media (max-width: 640px) { .cfg-layout { grid-template-columns: 1fr; } }

/* Nav lateral */
.cfg-nav { display: flex; flex-direction: column; gap: .25rem; position: sticky; top: 56px; }
.cfg-nav-item {
  display: flex; align-items: center; gap: .625rem;
  width: 100%; padding: .625rem .75rem; border-radius: 8px;
  background: transparent; border: none; font-family: var(--font-body);
  font-size: .825rem; font-weight: 500; color: var(--text-secondary);
  cursor: pointer; text-align: left; transition: background 100ms ease, color 100ms ease;
}
.cfg-nav-item:hover { background: var(--bg-elevated); color: var(--text-primary); }
.cfg-nav-item.active { background: var(--accent-subtle); color: var(--accent); font-weight: 600; }
.cfg-nav-icon { display: flex; flex-shrink: 0; opacity: .6; }
.cfg-nav-item.active .cfg-nav-icon { opacity: 1; }

/* Content */
.cfg-content { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
.cfg-section-title { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .09em; color: var(--text-tertiary); margin: 0; }
.cfg-card { padding: 1.25rem; display: flex; flex-direction: column; }
.cfg-divider { height: 1px; background: var(--border-subtle); margin: 1rem 0; }
.cfg-block-title { font-size: .875rem; font-weight: 600; color: var(--text-primary); margin: 0 0 .75rem; }
.cfg-label { font-size: .75rem; color: var(--text-tertiary); margin: 0 0 .3rem; }
.cfg-hint { font-size: .8rem; color: var(--text-tertiary); margin: .15rem 0 0; }
.cfg-value { font-size: .875rem; color: var(--text-secondary); margin: 0; }
.cfg-error { font-size: .8rem; color: var(--status-danger); margin: .375rem 0 0; }
.cfg-field { display: flex; flex-direction: column; }

/* Perfil */
.cfg-avatar-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 0; }
.cfg-avatar {
  width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0;
  background: var(--accent-subtle); color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.35rem; font-weight: 700; border: 2px solid rgba(34,197,94,.3);
}
.cfg-name  { font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0 0 .15rem; }
.cfg-email { font-size: .8rem; color: var(--text-tertiary); margin: 0 0 .375rem; }
.cfg-row-inline { display: flex; gap: .5rem; align-items: center; }
.cfg-input { flex: 1; max-width: 320px; }

/* Segurança */
.cfg-pw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
@media (max-width: 560px) { .cfg-pw-grid { grid-template-columns: 1fr; } }

/* Plano */
.cfg-plan-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
@media (max-width: 680px) { .cfg-plan-grid { grid-template-columns: 1fr; } }

.cfg-plan-box { padding: 1.25rem; display: flex; flex-direction: column; gap: .75rem; }
.cfg-plan-box--current      { border-color: rgba(34,197,94,.2) !important; }
.cfg-plan-box--elite        { border-color: rgba(251,191,36,.25) !important; background: linear-gradient(135deg, rgba(251,191,36,.04), transparent) !important; }
.cfg-plan-box--elite-active { border-color: rgba(251,191,36,.3) !important; }

.cfg-plan-header { display: flex; align-items: flex-start; justify-content: space-between; }
.cfg-plan-name   { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: .15rem 0 0; }
.cfg-elite-text  { background: linear-gradient(135deg,#fbbf24,#f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.cfg-upgrade-desc { font-size: .8125rem; color: var(--text-secondary); margin: 0; line-height: 1.5; }

.cfg-benefits { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .5rem; }
.cfg-benefits li { display: flex; align-items: flex-start; gap: .5rem; font-size: .8125rem; color: var(--text-secondary); }
.cfg-benefits--elite li { color: var(--text-primary); }
.bcheck        { color: var(--accent); font-size: .75rem; flex-shrink: 0; margin-top: .1rem; font-weight: 700; }
.bcheck--elite { color: #fbbf24; }

.cfg-btn-upgrade {
  background: linear-gradient(135deg,#fbbf24,#f59e0b); color: #000;
  border: none; font-weight: 700; font-size: .8125rem;
  display: flex; align-items: center; gap: .5rem;
}
.cfg-btn-upgrade:hover { opacity: .9; }

.cfg-elite-badge {
  display: flex; align-items: center; gap: .5rem; padding: .625rem .875rem;
  background: rgba(251,191,36,.08); border: 1px solid rgba(251,191,36,.2);
  border-radius: var(--radius-md); font-size: .8125rem; color: #fbbf24; font-weight: 500;
}

/* Tags plano */
.plan-tag { font-size: .58rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; border-radius: 6px; padding: .2rem .5rem; flex-shrink: 0; }
.plan-tag--pro   { background: rgba(34,197,94,.12);  color: #4ade80; border: 1px solid rgba(34,197,94,.3); }
.plan-tag--elite { background: rgba(251,191,36,.15); color: #fbbf24; border: 1px solid rgba(251,191,36,.35); }
.plan-tag--admin { background: rgba(239,68,68,.12);  color: #f87171; border: 1px solid rgba(239,68,68,.3); }

/* Aparência */
.cfg-theme-row { display: flex; gap: .75rem; }
.cfg-theme-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: .625rem;
  padding: 1.25rem .5rem; border-radius: var(--radius-lg);
  border: 1px solid var(--border-default); background: var(--bg-elevated);
  font-family: var(--font-body); font-size: .8125rem; font-weight: 500;
  color: var(--text-secondary); cursor: pointer; transition: all 120ms ease;
  max-width: 160px;
}
.cfg-theme-btn.active { background: var(--accent-subtle); color: var(--accent); border-color: rgba(34,197,94,.35); }

.cfg-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }

/* Sessão */
.cfg-session { display: flex; align-items: center; gap: .875rem; }
.cfg-session-icon {
  width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
  background: var(--bg-overlay); display: flex; align-items: center; justify-content: center;
  color: var(--text-secondary);
}
.cfg-session-info { flex: 1; }
.cfg-session-device { font-size: .875rem; font-weight: 600; color: var(--text-primary); margin: 0 0 .15rem; display: flex; align-items: center; gap: .5rem; }
.cfg-session-current { font-size: .65rem; font-weight: 700; background: var(--accent-subtle); color: var(--accent); border: 1px solid rgba(34,197,94,.3); border-radius: 99px; padding: .1rem .4rem; }

/* Zona de perigo */
.cfg-danger-card { border-color: rgba(239,68,68,.25) !important; background: rgba(239,68,68,.03) !important; }
.cfg-danger-icon {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  background: rgba(239,68,68,.12); color: var(--status-danger);
  display: flex; align-items: center; justify-content: center;
}
.cfg-confirm-modal {
  width: 100%; max-width: 420px;
  background: rgba(18,18,18,0.42);
  backdrop-filter: blur(32px) saturate(180%);
  -webkit-backdrop-filter: blur(32px) saturate(180%);
  border: 1px solid rgba(239,68,68,.25);
  border-radius: 16px; padding: 1.5rem;
}
[data-theme="light"] .cfg-confirm-modal {
  background: rgba(255,255,255,.52);
  border-color: rgba(239,68,68,.3);
}
</style>
