<!-- WelcomePromptsDialog.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    max-width="900"
    @update:model-value="v => emit('update:modelValue', v)"
  >
    <v-card
      class="d-flex flex-column"
      style="min-height: 80vh; max-height: 80vh;"
    >
      <!-- Шапка -->
      <v-toolbar class="px-4 flex-grow-0" density="comfortable" flat>
        <v-toolbar-title class="text-subtitle-1 font-weight-medium">
          Все готовые промты
        </v-toolbar-title>
        <v-spacer/>
        <v-btn icon="close" variant="text" @click="emit('update:modelValue', false)"/>
      </v-toolbar>

      <!-- Контент со скроллом -->
      <v-card-text
        class="pa-0 flex-grow-1"
        style="overflow-y: auto;"
      >
        <div
          v-for="(p, i) in prompts"
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
                    >
{{ p.full }}
                  </pre>
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

      <!-- Футер -->
      <v-card-actions class="px-4 flex-grow-0">
        <v-spacer/>
        <v-btn class="text-none" variant="text" @click="emit('update:modelValue', false)">
          Закрыть
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import {nextTick, ref} from 'vue'

type PromptItem = { title: string; full: string }

const props = defineProps<{
  modelValue: boolean
  prompts: PromptItem[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'use', content: any): void
}>()

const expandedIdx = ref<number | null>(null)

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

const handleUseClick = (p) => {
  emit('use', p)
  emit('update:modelValue', false)
}
</script>

<style scoped>
.smooth-fold-enter-active,
.smooth-fold-leave-active {
  transition: height 240ms ease, opacity 240ms ease;
}
</style>

<style scoped>
.v-card-title,
.v-card-text,
.v-btn {
  font-family: inherit;
}
</style>