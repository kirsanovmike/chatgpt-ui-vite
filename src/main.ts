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

const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#212121',

    // Поверхности / карточки
    surface: '#212121',
    'surface-variant': '#262626',

    // Акцент (кнопки, ссылки)
    primary: '#5575df',      // можешь поменять, если не нравится «чатгпт-зелёный»
    'primary-lighten': '#2b3863',
    secondary: '#3F3F46',

    // Цвета текста
    'on-background': '#E5E5E5',
    'on-surface': '#E5E5E5',
    'on-surface-variant': '#A3A3A3',

    // Свои именованные цвета под layout
    'sidebar-bg': '#111111', // левая панель
    'header-bg': '#272727',
    'chat-card': '#212121',  // фон сообщений
  },
}

const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: 'rgba(247,247,248,0.63)',

    // поверхности / карточки
    surface: 'rgba(247,247,248,0.63)',
    'surface-variant': '#F2F2F3',

    // акцент
    primary: '#5575df',
    'primary-lighten': '#dee7ff',
    secondary: '#E5E7EB',

    // текст
    'on-background': '#202123',
    'on-surface': '#202123',
    'on-surface-variant': '#6B7280',

    // layout
    'sidebar-bg': '#dddddd',
    'header-bg': '#f5f5f5',
    'chat-card': '#FFFFFF',
  },
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
    defaultTheme: (localStorage.getItem('theme') as any) || 'dark',
    themes: {
      light: lightTheme,
      dark: darkTheme,
      system: {
        dark: window.matchMedia('(prefers-color-scheme: dark)').matches,
        colors: {},
      },
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