// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

import 'vuetify/styles'
import './styles/fonts.css'       // @font-face на PTSans
import './styles/typography.css'  // var(--v-font-family) = 'PT Sans'
import './styles/glass.css'
import './styles/theme-switcher.css'
import './styles/liquid-glass.css'

// ВАЖНО: ставим именно font-версию mdi
import '@mdi/font/css/materialdesignicons.css'

import textVariables from '@/lang/textVariables'

// наш «умный» сет
import { createSmartIconSet } from '@/helpers/iconSetSmart'
import { createVuetify, type ThemeDefinition } from 'vuetify'
import { md3 } from 'vuetify/blueprints'

const baseColors = {
  background: 'var(--c-bg)',
  surface: 'color-mix(in srgb, var(--c-bg) 92%, transparent)',
  'surface-variant': 'color-mix(in srgb, var(--c-bg) 88%, transparent)',
  primary: 'var(--c-action)',
  'primary-lighten': 'color-mix(in srgb, var(--c-action) 35%, var(--c-light))',
  secondary: 'color-mix(in srgb, var(--c-glass) 60%, transparent)',
  'on-background': 'var(--c-content)',
  'on-surface': 'var(--c-content)',
  'on-surface-variant': 'color-mix(in srgb, var(--c-content) 70%, transparent)',
  'sidebar-bg': 'color-mix(in srgb, var(--c-bg) 90%, transparent)',
  'header-bg': 'color-mix(in srgb, var(--c-bg) 94%, transparent)',
  'chat-card': 'color-mix(in srgb, var(--c-bg) 96%, transparent)'
}

const lightTheme: ThemeDefinition = {
  dark: false,
  colors: baseColors
}

const darkTheme: ThemeDefinition = {
  dark: true,
  colors: baseColors
}

const dimTheme: ThemeDefinition = {
  dark: true,
  colors: baseColors
}

const vuetify = createVuetify({
  blueprint: md3,
  icons: {
    // делаем умный сет дефолтным
    defaultSet: 'smart',
    sets: {
      smart: createSmartIconSet(),
      // при желании можно подключить и стандартный 'mdi',
      // но он не обязателен, т.к. мы рендерим <i class="mdi mdi-...">
    },
  },
  theme: {
    defaultTheme: (localStorage.getItem('theme') as any) || 'light',
    themes: {
      light: lightTheme,
      dark: darkTheme,
      dim: dimTheme
    },
  },
  defaults: {
    global: {
      style: {
        fontFamily: 'PT Sans, sans-serif',
      },
    },
  },
})

const app = createApp(App)
app.config.globalProperties.$textVariables = textVariables

app
.use(createPinia())
.use(router)
.use(vuetify)
.mount('#app')