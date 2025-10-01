import { apiFetch, authFetch } from '@/lib/api'

type NuxtLikeResult<T> = {
  data: { value: T | null },
  error: { value: null | { status: number; data: any } }
}

export const useMyFetch = async <T = any>(url: string, options: RequestInit = {}): Promise<NuxtLikeResult<T>> => {
  try {
    const res = await apiFetch(url, options)
    const data = (await res.json().catch(() => null)) as T | null
    if (!res.ok) return { data: { value: null }, error: { value: { status: res.status, data } } }
    return { data: { value: data }, error: { value: null } }
  } catch (e: any) {
    return { data: { value: null }, error: { value: { status: 0, data: { detail: e?.message } } } }
  }
}

export const useAuthFetch = async <T = any>(url: string, options: RequestInit = {}): Promise<NuxtLikeResult<T>> => {
  try {
    const res = await authFetch(url, options)
    const data = (await res.json().catch(() => null)) as T | null
    if (!res.ok) return { data: { value: null }, error: { value: { status: res.status, data } } }
    return { data: { value: data }, error: { value: null } }
  } catch (e: any) {
    return { data: { value: null }, error: { value: { status: 0, data: { detail: e?.message } } } }
  }
}
