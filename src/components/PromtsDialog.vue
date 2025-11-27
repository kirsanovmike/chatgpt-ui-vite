<!-- WelcomePromptsDialog.vue -->
<template>
  <v-dialog
      :model-value="modelValue"
      max-width="960"
      @update:model-value="v => emit('update:modelValue', v)"
  >
    <v-card
        class="d-flex flex-column"
        style="min-height: 80vh; max-height: 80vh; overflow: hidden;"
    >
      <!-- Шапка -->
      <v-toolbar class="px-4 flex-grow-0" density="comfortable" flat>
        <v-toolbar-title class="text-subtitle-1 font-weight-medium">
          Промпты
        </v-toolbar-title>
        <v-spacer/>
        <v-btn icon="close" variant="text" @click="close"/>
      </v-toolbar>

      <!-- Шапка табов -->
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

      <!-- ЦЕНТРАЛЬНАЯ СКРОЛЛИРУЕМАЯ ОБЛАСТЬ -->
      <div class="flex-grow-1 overflow-y-auto mt-0">
        <v-tabs-window v-model="activeTab">
          <v-tabs-window-item value="system">
            <v-card-text class="pa-0">
              <div
                  v-for="(p, i) in systemPrompts"
                  :key="'dlg-' + i"
              >
                <div class="d-flex align-start px-4 py-3">
                  <!-- Левая колонка -->
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
                      <div v-show="expandedIdx === i" class="mt-3">
                        <div
                            class="pa-3 rounded-lg border-sm"
                            style="background: rgba(var(--v-theme-surface-variant), 0.5);
                                 border-color: rgba(var(--v-theme-on-surface), 0.12);"
                        >
                          <pre
                              class="ma-0 text-body-2"
                              style="white-space: pre-wrap;
                                   word-break: break-word;
                                   line-height: 1.2;"
                          >{{ p.full }}</pre>
                        </div>
                      </div>
                    </transition>
                  </div>

                  <!-- Правая колонка -->
                  <div class="d-flex align-center justify-end ml-4">
                    <v-btn
                        class="text-none text-body-2 text-medium-emphasis"
                        density="compact"
                        size="small"
                        variant="text"
                        @click="toggle(i)"
                    >
                      {{ expandedIdx === i ? 'Свернуть' : 'Подробнее' }}
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

                <v-divider/>
              </div>
            </v-card-text>
          </v-tabs-window-item>

          <v-tabs-window-item value="ready">
            <v-card-text class="pa-0">
              <div v-if="selectedPrompt" class="px-4 my-4 ready-detail">
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

                <pre class="ready-text">{{ selectedPrompt.text }}</pre>

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

      <!-- Футер -->
      <v-card-actions class="px-4 flex-grow-0">
        <v-spacer/>
        <v-btn class="text-none" variant="text" @click="close">
          Закрыть
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import {nextTick, ref, watch} from 'vue'

type SystemPrompt = { title: string; full: string }
type ReadyPrompt = { id: string; title: string; tags: string[]; text: string }

const props = defineProps<{
  modelValue: boolean,
  systemPrompts: SystemPrompt[],
  readyPrompts: ReadyPrompt[],
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'use', content: SystemPrompt): void
  (e: 'apply-ready', content: string): void
}>()

const expandedIdx = ref<number | null>(null)
const activeTab = ref<'system' | 'ready'>('system')
const selectedPrompt = ref<ReadyPrompt | null>(null)

const close = () => {
  emit('update:modelValue', false)
  selectedPrompt.value = null
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    activeTab.value = 'system'
    expandedIdx.value = null
    selectedPrompt.value = null
  }
})

const toggle = async (idx: number) => {
  expandedIdx.value = expandedIdx.value === idx ? null : idx
  await nextTick()
}

// Плавные раскрытия (как раньше)
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

const handleUseClick = (p: SystemPrompt) => {
  emit('use', p)
  emit('update:modelValue', false)
}

const openReadyPrompt = (prompt: ReadyPrompt) => {
  selectedPrompt.value = prompt
}

const copyPrompt = async (prompt: ReadyPrompt) => {
  try {
    await navigator.clipboard?.writeText(prompt.text)
  } catch (e) {
    console.warn('Clipboard is not available', e)
  }
  emit('apply-ready', prompt.text)
  emit('update:modelValue', false)
}
</script>

<style scoped>
.smooth-fold-enter-active,
.smooth-fold-leave-active {
  transition: height 240ms ease, opacity 240ms ease;
}

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
</style>

<style scoped>
.v-card-title,
.v-card-text,
.v-btn {
  font-family: inherit;
}
</style>