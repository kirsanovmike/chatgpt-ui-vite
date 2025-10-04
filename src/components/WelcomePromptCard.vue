<template>
  <v-row>
    <v-col>
      <v-hover v-slot="{ isHovering, props }" open-delay="100">
        <v-card
          :elevation="isHovering ? 3 : 0"
          v-bind="props"
          variant="tonal"
        >
          <v-card-text>
            <div class="text-body-2">
              {{ shortContent }}
            </div>
            <div class="d-flex justify-end mt-2">
              <v-btn
                variant="text"
                size="small"
                class="text-grey"
                @click="dialog = true"
              >
                Подробнее
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-hover>
    </v-col>
  </v-row>

  <!-- Диалог с полным текстом -->
  <v-dialog v-model="dialog" max-width="600">
    <v-card>
      <v-card-title class="text-h6">{{ title }}</v-card-title>
      <v-card-text class="text-body-2" style="white-space: pre-line">
        {{ fullContent }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">Закрыть</v-btn>
        <v-btn color="primary" variant="flat" @click="usePrompt">Использовать</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  fullContent: { type: String, required: true },
  maxLength: { type: Number, default: 80 }
})

const dialog = ref(false)

const shortContent = computed(() =>
  props.fullContent.length > props.maxLength
    ? props.fullContent.slice(0, props.maxLength) + '…'
    : props.fullContent
)

const emit = defineEmits(['use'])

const usePrompt = () => {
  emit('use', props.fullContent)
  dialog.value = false
}
</script>

<style scoped>
/* всё наследует глобальный PT Sans */
.prompt-body,
.v-card-title,
.v-card-text {
  font-family: inherit;
}

/* у тебя там есть преформатированные блоки — их оставим моноширинными */
.prompt-body pre,
.prompt-body code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 0.875rem; /* ты просил на 1–2 шага меньше */
}
</style>