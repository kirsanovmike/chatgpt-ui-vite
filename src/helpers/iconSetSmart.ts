// src/helpers/iconSetSmart.ts
import { h } from 'vue'
import type { IconSet, IconProps } from 'vuetify'

/**
 * Частые сопоставления имен Material → MDI.
 * Можно расширять по мере нахождения несоответствий.
 */
const MATERIAL_TO_MDI: Record<string, string> = {
  add: 'mdi-plus',
  send: 'mdi-send',
  article: 'mdi-file-document-outline',
  travel_explore: 'mdi-web',
  local_library: 'mdi-library',
}

/** camelCase / snake_case / пробелы → kebab-case */
function toKebab(x: string) {
  return x
  .replace(/[_\s]+/g, '-')
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .toLowerCase()
}

/** Приводим входное имя к валидному mdi-классу (ТОЛЬКО вторая часть, без 'mdi') */
function normalizeMdiSuffix(name: unknown): string | null {
  if (typeof name !== 'string') return null
  const raw = name.trim()
  if (!raw) return null

  // уже полный класс?
  if (raw.startsWith('mdi-')) return raw.slice(4) // → вернём без префикса

  // формат 'mdi:send'
  if (raw.startsWith('mdi:')) return raw.slice(4)

  // если это другой стек (fa-/i-/svg-/$/ и т.п.) — не трогаем, отдадим как есть выше
  if (
    raw.startsWith('fa-') ||
    raw.startsWith('i-') ||
    raw.startsWith('svg:') ||
    raw.startsWith('$')
  ) {
    return null
  }

  // явные сопоставления
  if (MATERIAL_TO_MDI[raw]) return MATERIAL_TO_MDI[raw].slice(4)

  const kebab = toKebab(raw)
  if (MATERIAL_TO_MDI[kebab]) return MATERIAL_TO_MDI[kebab].slice(4)

  // по умолчанию делаем mdi-{kebab}
  return kebab
}

/**
 * Иконсет "smart": всегда рендерим <i class="mdi mdi-XXX">,
 * либо пропускаем внешний класс, если явно задан другой стек.
 */
export function createSmartIconSet(): IconSet {
  return {
    component: (props: IconProps & { class?: any }) => {
      const value = props.icon as string

      // если пользователь явно передал чужой класс (fa-, i-, $...), не вмешиваемся
      if (
        typeof value === 'string' &&
        (value.startsWith('fa-') || value.startsWith('i-') || value.startsWith('$'))
      ) {
        return h('i', {
          class: ['v-icon', 'notranslate', value, props.class],
          'aria-hidden': 'true',
        })
      }

      // нормализуем под mdi
      const mdiSuffix = normalizeMdiSuffix(value) // только часть после 'mdi-'
      const fullClass = mdiSuffix ? ['mdi', `mdi-${mdiSuffix}`] : []

      // итоговый <i class="v-icon notranslate mdi mdi-send ...">
      return h('i', {
        class: ['v-icon', 'notranslate', ...fullClass, props.class],
        'aria-hidden': 'true',
      })
    },
  }
}