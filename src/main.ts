import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { md3 } from 'vuetify/blueprints'

import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

import 'highlight.js/styles/atom-one-dark.css'

import { loadSettings } from '@/lib/settings'
import { apiFetch } from '@/lib/api'

const vuetify = createVuetify({
  blueprint: md3,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi }
  }
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(vuetify);

// загружаем настройки и прокидываем как provide (замена $settings)
(async () => {
  const settings = await loadSettings(apiFetch)
  app.provide('settings', settings as Record<string, string>)
  app.mount('#app')
})()
