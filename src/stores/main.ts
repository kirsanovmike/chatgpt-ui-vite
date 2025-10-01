import { defineStore } from 'pinia'

export interface User {
  id: number
  username: string
  email: string
  // добавляй поля по бэку
}

export const useMainStore = defineStore('main', {
  state: () => ({
    user: null as User | null,
    drawer: false,
    conversations: [] as any[],
    apiKey: null as string | null,
    currentModelName: 'gpt-3.5-turbo'
  }),
  actions: {
    setUser(u: User | null) { this.user = u },
    logout() { this.user = null },
    setDrawer(v: boolean) { this.drawer = v },
    setApiKey(k: string | null) {
      this.apiKey = k
      if (k == null) localStorage.removeItem('openai_api_key')
      else localStorage.setItem('openai_api_key', JSON.stringify(k))
    },
    loadApiKey() {
      const raw = localStorage.getItem('openai_api_key')
      this.apiKey = raw ? (JSON.parse(raw) as string) : null
    }
  }
})
