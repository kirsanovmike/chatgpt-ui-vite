// src/composables/theme.ts
import { ref, onMounted } from 'vue'
import { useTheme } from 'vuetify'

type ThemeName = 'light' | 'dark' | 'dim'

const mode = ref<ThemeName>((localStorage.getItem('theme') as ThemeName) || 'light')

export function useThemeMode() {
  const theme = useTheme()

  const apply = (name: ThemeName) => {
    mode.value = name
    localStorage.setItem('theme', name)
    theme.global.name.value = name
  }

  onMounted(() => apply(mode.value))

  // ⚡ возвращаем саму текущую тему (строку)
  return { themeName: theme.global.name, mode, setMode: apply }
}