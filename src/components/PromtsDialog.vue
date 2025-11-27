<!-- WelcomePromptsDialog.vue -->
<template>
  <v-dialog
      :model-value="modelValue"
      max-width="960"
      @update:model-value="value => emit('update:modelValue', value)"
  >
    <v-card class="prompts-dialog-card d-flex flex-column">
      <!-- Шапка диалога -->
      <v-toolbar class="px-4 flex-grow-0" density="comfortable" flat>
        <v-toolbar-title class="text-subtitle-1 font-weight-medium">
          Промпты
        </v-toolbar-title>

        <v-spacer />

        <v-btn
            icon="close"
            variant="text"
            @click="close"
        />
      </v-toolbar>

      <!-- Вкладки (отображаются только в списке, не в режиме детального просмотра готового промпта) -->
      <v-tabs
          v-if="!selectedPrompt"
          v-model="activeTab"
          color="primary"
          density="comfortable"
          class="mt-2"
      >
        <v-tab value="system">Системные указания</v-tab>
        <v-tab value="ready">Готовые промпты</v-tab>
      </v-tabs>

      <!-- Центральная прокручиваемая область -->
      <div class="flex-grow-1 overflow-y-auto mt-0">
        <v-tabs-window v-model="activeTab">
          <!-- Вкладка «Системные указания» -->
          <v-tabs-window-item value="system">
            <v-card-text class="pa-0">
              <div
                  v-for="(p, index) in systemPrompts"
                  :key="'dlg-' + index"
              >
                <div class="d-flex align-start px-4 py-3">
                  <!-- Левая колонка: заголовок и раскрываемый текст -->
                  <div class="flex-grow-1">
                    <div class="text-body-1 font-weight-500">
                      {{ p.title }}
                    </div>

                    <transition
                        name="smooth-fold"
                        @enter="onEnter"
                        @leave="onLeave"
                        @after-enter="onAfterEnter"
                    >
                      <div
                          v-show="expandedIdx === index"
                          class="mt-3"
                      >
                        <div
                            class="pa-3 rounded-lg border-sm system-prompt-full"
                        >
                          <pre class="ma-0 text-body-2 system-prompt-pre">
{{ p.full }}
                          </pre>
                        </div>
                      </div>
                    </transition>
                  </div>

                  <!-- Правая колонка: кнопки «Подробнее» и «Использовать» -->
                  <div class="d-flex align-center justify-end ml-4">
                    <v-btn
                        class="text-none text-body-2 text-medium-emphasis"
                        density="compact"
                        size="small"
                        variant="text"
                        @click="toggle(index)"
                    >
                      {{ expandedIdx === index ? 'Свернуть' : 'Подробнее' }}
                    </v-btn>

                    <v-btn
                        class="text-none ml-2"
                        color="primary"
                        density="comfortable"
                        elevation="0"
                        @click="handleUseClick(p)"
                    >
                      Использовать
                    </v-btn>
                  </div>
                </div>

                <v-divider />
              </div>
            </v-card-text>
          </v-tabs-window-item>

          <!-- Вкладка «Готовые промпты» -->
          <v-tabs-window-item value="ready">
            <v-card-text class="pa-0">
              <!-- Детальный просмотр конкретного готового промпта -->
              <div
                  v-if="selectedPrompt"
                  class="px-4 my-4 ready-detail"
              >
                <v-btn
                    class="mb-3"
                    prepend-icon="mdi-arrow-left"
                    variant="text"
                    @click="selectedPrompt = null"
                >
                  Назад
                </v-btn>

                <div class="d-flex flex-wrap gap-2 mb-3">
                  <v-chip
                      v-for="tag in selectedPrompt.tags"
                      :key="tag"
                      color="primary"
                      size="small"
                      variant="outlined"
                      class="mr-2"
                  >
                    {{ tag }}
                  </v-chip>
                </div>

                <div class="text-h6 font-weight-semibold mb-3">
                  {{ selectedPrompt.title }}
                </div>

                <pre class="ready-text">
{{ selectedPrompt.text }}
                </pre>

                <div class="text-body-2 text-medium-emphasis mt-4">
                  В чате с ТНЭ чатом замените данные в квадратных скобках […] на свои.
                </div>

                <v-btn
                    class="text-none mt-4"
                    color="primary"
                    prepend-icon="mdi-content-copy"
                    @click="copyPrompt(selectedPrompt)"
                >
                  Подставить промпт
                </v-btn>
              </div>

              <!-- Список карточек готовых промптов -->
              <div v-else class="pa-4">
                <v-row class="ready-cards" dense>
                  <v-col
                      v-for="prompt in readyPrompts"
                      :key="prompt.id"
                      cols="12"
                      sm="6"
                  >
                    <v-card
                        class="ready-card pa-4 h-100 elevation-1"
                        style="background-color: rgb(var(--v-theme-header-bg));"
                        @click="openReadyPrompt(prompt)"
                    >
                      <div class="text-subtitle-1 font-weight-semibold mb-4">
                        {{ prompt.title }}
                      </div>

                      <div class="d-flex flex-wrap gap-2">
                        <v-chip
                            v-for="tag in prompt.tags"
                            :key="tag"
                            color="primary"
                            size="small"
                            variant="outlined"
                            class="mr-2"
                        >
                          {{ tag }}
                        </v-chip>
                      </div>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
            </v-card-text>
          </v-tabs-window-item>
        </v-tabs-window>
      </div>

      <!-- Футер диалога -->
      <v-card-actions class="px-4 flex-grow-0">
        <v-spacer />
        <v-btn
            class="text-none"
            variant="text"
            @click="close"
        >
          Закрыть
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/**
 * WelcomePromptsDialog
 *
 * Диалог, в котором пользователь:
 *  - выбирает системные указания (systemPrompts) и применяет их к чату;
 *  - просматривает и копирует «готовые промпты» (readyPrompts).
 *
 * Внешний контракт:
 *  - v-model: Boolean (modelValue)
 *  - props: systemPrompts, readyPrompts
 *  - emits:
 *      - update:modelValue (открыть/закрыть диалог)
 *      - use (выбор системного промпта)
 *      - apply-ready (подстановка готового промпта в редактор)
 */

import { nextTick, ref, watch } from 'vue'

// ===================== Типы =====================

type SystemPrompt = {
  title: string
  full: string
}

type ReadyPrompt = {
  id: string
  title: string
  tags: string[]
  text: string
}

// ===================== Пропсы и события =====================

const props = defineProps<{
  modelValue: boolean
  systemPrompts: SystemPrompt[]
  readyPrompts: ReadyPrompt[]
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'use', content: SystemPrompt): void
  (event: 'apply-ready', content: string): void
}>()

// ===================== Состояние диалога =====================

/**
 * index раскрытого системного промпта (для «Подробнее»).
 * null — ничего не раскрыто.
 */
const expandedIdx = ref<number | null>(null)

/**
 * Активная вкладка:
 *  - 'system' — системные указания
 *  - 'ready' — готовые промпты
 */
const activeTab = ref<'system' | 'ready'>('system')

/**
 * Текущий выбранный готовый промпт.
 * Если null — показывается список карточек.
 */
const selectedPrompt = ref<ReadyPrompt | null>(null)

// ===================== Базовые действия =====================

/**
 * Закрыть диалог и сбросить локальное состояние.
 */
const close = () => {
  emit('update:modelValue', false)
  selectedPrompt.value = null
}

/**
 * При открытии диалога сбрасываем вкладку и раскрытия,
 * чтобы пользователь каждый раз видел «чистое» состояние.
 */
watch(
    () => props.modelValue,
    isOpen => {
      if (isOpen) {
        activeTab.value = 'system'
        expandedIdx.value = null
        selectedPrompt.value = null
      }
    }
)

// ===================== Системные промпты =====================

/**
 * Тоггл блока «Подробнее» для системных указаний.
 */
const toggle = async (index: number) => {
  expandedIdx.value = expandedIdx.value === index ? null : index
  await nextTick()
}

/**
 * Нажатие на «Использовать» у системного промпта:
 *  - эмитим выбранный промпт родителю,
 *  - закрываем диалог.
 */
const handleUseClick = (prompt: SystemPrompt) => {
  emit('use', prompt)
  emit('update:modelValue', false)
}

// ===================== Готовые промпты =====================

/**
 * Открыть детальный просмотр готового промпта.
 */
const openReadyPrompt = (prompt: ReadyPrompt) => {
  selectedPrompt.value = prompt
}

/**
 * Скопировать готовый промпт в буфер обмена и отдать его родителю.
 * Родитель обычно подставляет этот текст в редактор.
 */
const copyPrompt = async (prompt: ReadyPrompt) => {
  try {
    await navigator.clipboard?.writeText(prompt.text)
  } catch (error) {
    console.warn('Clipboard is not доступен', error)
  }

  emit('apply-ready', prompt.text)
  emit('update:modelValue', false)
}

// ===================== Анимация раскрытия блока =====================

/**
 * onEnter / onAfterEnter / onLeave — управляют плавной анимацией
 * раскрытия/сворачивания блока с текстом системного промпта.
 */
const onEnter = (el: Element) => {
  const node = el as HTMLElement
  node.style.height = '0px'
  node.style.opacity = '0'
  node.style.overflow = 'hidden'
  node.style.transition = 'height 240ms ease, opacity 240ms ease'

  requestAnimationFrame(() => {
    node.style.height = node.scrollHeight + 'px'
    node.style.opacity = '1'
  })
}

const onAfterEnter = (el: Element) => {
  const node = el as HTMLElement
  node.style.height = 'auto'
  node.style.overflow = ''
  node.style.transition = ''
}

const onLeave = (el: Element) => {
  const node = el as HTMLElement
  node.style.height = node.scrollHeight + 'px'
  node.style.opacity = '1'
  node.style.overflow = 'hidden'
  node.style.transition = 'height 240ms ease, opacity 240ms ease'

  requestAnimationFrame(() => {
    node.style.height = '0px'
    node.style.opacity = '0'
  })
}
</script>

<style scoped>
/* ===== Карточка диалога ===== */

.prompts-dialog-card {
  min-height: 80vh;
  max-height: 80vh;
  overflow: hidden;
}

/* ===== Анимация плавного раскрытия ===== */

.smooth-fold-enter-active,
.smooth-fold-leave-active {
  transition: height 240ms ease, opacity 240ms ease;
}

/* ===== Системные промпты (полный текст) ===== */

.system-prompt-full {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-color: rgba(var(--v-theme-on-surface), 0.12);
}

.system-prompt-pre {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.2;
}

/* ===== Карточки готовых промптов ===== */

.ready-card {
  cursor: pointer;
  border-radius: 18px;
}

.ready-card:hover {
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.12);
}

.ready-text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.3;
  padding: 16px;
  border-radius: 16px;
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.ready-detail {
  margin: 0 auto;
}

/* ===== Общие типографические стили ===== */

.v-card-title,
.v-card-text,
.v-btn {
  font-family: inherit;
}
</style>
