export type SettingItem = { name: string; value: string }

export const transformSettings = (list: SettingItem[] = []) =>
  list.reduce<Record<string, string>>((acc, i) => { acc[i.name] = i.value; return acc }, {})

export async function loadSettings(fetcher: (path: string, init?: RequestInit) => Promise<Response>) {
  try {
    const res = await fetcher('/api/chat/settings/')
    if (!res.ok) return {}
    const data = (await res.json()) as SettingItem[] | any
    return Array.isArray(data) ? transformSettings(data) : {}
  } catch {
    return {}
  }
}
