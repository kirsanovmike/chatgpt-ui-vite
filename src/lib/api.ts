import { useMainStore } from '@/stores/main'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export async function apiFetch(path: string, options: RequestInit = {}) {
  const init: RequestInit = {
    headers: { Accept: 'application/json', ...(options.headers || {}) },
    credentials: 'include',
    ...options
  }
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  return fetch(url, init)
}

export async function authFetch(path: string, options: RequestInit = {}) {
  const res = await apiFetch(path, options)
  if (res.status === 401) {
    const store = useMainStore()
    store.logout()
  }
  return res
}
