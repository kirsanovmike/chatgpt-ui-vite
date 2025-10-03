// src/composables/theme.ts
import { ref, onMounted } from 'vue'
import { useTheme } from 'vuetify'

type ThemeName = 'light' | 'dark' | 'system'

const mode = ref<ThemeName>((localStorage.getItem('theme') as ThemeName) || 'system')

export function useThemeMode() {
  const theme = useTheme()

  const apply = (name: ThemeName) => {
    mode.value = name
    localStorage.setItem('theme', name)

    if (name === 'system') {
      const isDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
      theme.global.name.value = isDark ? 'dark' : 'light'
    } else {
      theme.global.name.value = name
    }
  }

  onMounted(() => apply(mode.value))

  // ⚡ возвращаем саму текущую тему (строку)
  return { themeName: theme.global.name, mode, setMode: apply }
}