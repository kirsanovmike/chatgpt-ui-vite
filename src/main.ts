// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

import 'vuetify/styles'
import './styles/fonts.css'       // @font-face на PTSans
import './styles/typography.css'  // var(--v-font-family) = 'PT Sans'

// ВАЖНО: ставим именно font-версию mdi
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify } from 'vuetify'
import { md3 } from 'vuetify/blueprints'
import textVariables from '@/lang/textVariables'

// наш «умный» сет
import { createSmartIconSet } from '@/helpers/iconSetSmart'

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
    defaultTheme: (localStorage.getItem('theme') as any) || 'system',
    themes: {
      light: { dark: false, colors: {} },
      dark: { dark: true, colors: {} },
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