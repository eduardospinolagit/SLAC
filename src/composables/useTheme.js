// src/composables/useTheme.js
import { ref } from 'vue'

const STORAGE_KEY = 'slac-theme'
const theme = ref('dark')

function applyTheme(value) {
  document.documentElement.setAttribute('data-theme', value)
  theme.value = value
}

function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') {
    applyTheme(saved)
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme(prefersDark ? 'dark' : 'light')
  }
}

function toggleTheme() {
  const next = theme.value === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  localStorage.setItem(STORAGE_KEY, next)
}

export function useTheme() {
  return { theme, toggleTheme, initTheme, isDark: () => theme.value === 'dark' }
}
