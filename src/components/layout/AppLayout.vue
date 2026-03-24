<template>
  <div class="layout">
    <!-- SIDEBAR DESKTOP -->
    <aside class="sidebar">
      <div class="sb-logo" style="padding:16px 20px">
        <img src="/logo.png" alt="Sano Lab" style="height:52px;width:auto;display:block;filter:invert(1) brightness(2)" />
      </div>

      <div class="sb-sec">
        <div class="sb-label">Principal</div>
        <button class="sb-item" :class="{ active: route.path === '/dashboard' }" @click="go('/dashboard')">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Dashboard
        </button>
        <button class="sb-item" :class="{ active: route.path === '/crm' }" @click="go('/crm')">
          <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          CRM
        </button>
        <button class="sb-item" :class="{ active: route.path === '/financeiro' }" @click="go('/financeiro')">
          <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Financeiro
        </button>
        <button class="sb-item" :class="{ active: route.path === '/recorrencias' }" @click="go('/recorrencias')">
          <svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Recorrências
        </button>
        <button class="sb-item" :class="{ active: route.path === '/mapa' }" @click="go('/mapa')">
          <svg viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
          Mapa Mental
        </button>
      </div>

      <div class="sb-sec">
        <div class="sb-label">Ferramentas</div>
        <button class="sb-item" @click="go('/prospeccao')">
          <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          Prospecção
        </button>
      </div>

      <div class="sb-footer">
        <div class="user-info">
          <span class="user-email">{{ auth.userName }}</span>
          <span class="user-badge">PRO</span>
        </div>
        <button class="logout-btn" @click="auth.logout()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sair
        </button>
      </div>
    </aside>

    <!-- MAIN -->
    <main class="main">
      <router-view />
    </main>
  </div>

  <!-- MOBILE NAV -->
  <nav class="mobile-nav">
    <div class="mnav-inner">
      <button class="mob-item" :class="{ active: route.path === '/dashboard' }" @click="go('/dashboard')">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Dash
      </button>
      <button class="mob-item" :class="{ active: route.path === '/crm' }" @click="go('/crm')">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        CRM
      </button>
      <button class="mob-item" :class="{ active: route.path === '/financeiro' }" @click="go('/financeiro')">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        Financeiro
      </button>
      <button class="mob-item" :class="{ active: route.path === '/mapa' }" @click="go('/mapa')">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>
        Mapa
      </button>
      <button class="mob-item" @click="go('/prospeccao')">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        Prospecção
      </button>
    </div>
  </nav>

  <!-- Modal boas-vindas (primeiro login) -->
  <div v-if="showWelcomeModal" class="welcome-overlay">
    <div class="welcome-box">
      <div style="font-size:2rem;margin-bottom:12px">👋</div>
      <h2>Bem-vindo ao <span>SLAC</span></h2>
      <p>Como você quer ser chamado aqui dentro?<br/>Esse nome aparece no menu e em outros lugares.</p>
      <input
        ref="welcomeInput"
        v-model="welcomeName"
        class="welcome-input"
        type="text"
        placeholder="Seu nome ou apelido"
        maxlength="40"
        @keydown.enter="saveWelcomeName"
      />
      <button class="btn btn-g" style="width:100%;justify-content:center;padding:12px" @click="saveWelcomeName">
        Entrar no SLAC →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppInit } from '@/composables/useAppInit'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const welcomeInput = ref(null)
const welcomeName = ref('')
const showWelcomeModal = ref(false)

onMounted(async () => {
  // Carrega todos os dados + inicia Realtime
  await useAppInit()

  // Mostra modal de boas-vindas se userName ainda é o prefixo do email
  if (auth.isLoggedIn) {
    const emailPrefix = auth.user?.email?.split('@')[0] || ''
    if (auth.userName === emailPrefix) {
      showWelcomeModal.value = true
      await nextTick()
      welcomeInput.value?.focus()
    }
  }
})

async function saveWelcomeName() {
  const nome = welcomeName.value.trim()
  if (!nome) { welcomeInput.value?.focus(); return }
  await auth.saveUserName(nome)
  showWelcomeModal.value = false
}

function go(path) {
  router.push(path)
}
</script>
