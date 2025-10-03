// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { md3 } from 'vuetify/blueprints'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

import textVariables from '@/lang/textVariables'

const vuetify = createVuetify({
  blueprint: md3,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: (localStorage.getItem('theme') as any) || 'system',
    themes: {
      light: { dark: false, colors: {} },
      dark: { dark: true, colors: {} },
      // системная тема — алиас, переключаем вручную
      system: {
        dark: window.matchMedia('(prefers-color-scheme: dark)').matches,
        colors: {},
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