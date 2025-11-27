<template>
  <div class="flex-grow-1 d-flex align-center justify-space-between">
    <v-textarea
        ref="textArea"
        v-model="message"
        v-model:focused="isFocused"
        :auto-grow="autoGrow"
        :counter="MAX_PROMPT_CHARS"
        :disabled="disabled"
        :error="!!errorMessage"
        :error-messages="errorMessage"
        :hide-details="true"
        :label="currentLabel"
        :loading="loading"
        :maxlength="MAX_PROMPT_CHARS"
        :placeholder="placeholderText"
        :rows="rows"
        :rules="[maxLengthRule]"
        class="userinputmsg"
        clearable
        max-rows="8"
        variant="outlined"
        @keypress.enter.exact="enterOnly"
    ></v-textarea>

    <v-btn
        v-if="!loading"
        :disabled="!maxLengthRule(message)"
        class="ml-6"
        elevation="0"
        icon="send"
        title="Send"
        @click="clickSendBtn"
    ></v-btn>
  </div>
</template>

<script setup>
import {isMobile} from 'is-mobile'
import {computed, ref, watchEffect} from "vue";
import {AuthorRole} from "@/data/enums/AuthorRole.js";

const props = defineProps({
  sendMessage: {type: Function, required: true},
  disabled: {type: Boolean, default: false},
  loading: {type: Boolean, default: false}
})

const message = ref('')
const rows = ref(1)
const autoGrow = ref(true)
const errorMessage = ref('')

const MAX_PROMPT_CHARS = 10_000

const maxLengthRule = (value) => {
  const len = value?.length ?? 0
  if (len > MAX_PROMPT_CHARS) {
    return `Слишком длинный запрос. Не более ${MAX_PROMPT_CHARS} символов`
  }
  return true
}

const hintText = computed(() =>
    isMobile() ? '' : 'Нажмите Enter для отправки. Shift+Enter для новой линии.'
)

const isFocused = ref(false)
const placeholderText = computed(() => {
  if (props.disabled) return ''
  const hasText = (message.value?.length ?? 0) > 0
  return isFocused.value && !hasText ? hintText.value : ''
})

watchEffect(() => {
  const lines = message.value.split(/\r\n|\r|\n/).length
  if (lines > 8) {
    rows.value = 8
    autoGrow.value = false
  } else {
    rows.value = 1
    autoGrow.value = true
  }
})

const send = () => {
  let msg = message.value
  if (msg.endsWith('\n')) msg = msg.slice(0, -1)

  if (msg.length > 0) {
    const item = toolSelector.value.list[toolSelector.value.selected]
    props.sendMessage({content: msg, tool: item.name, role: item.role})
  }
  message.value = ''
  toolSelector.value.selected = 0
}

const textArea = ref()
const documentMan = ref(null)

const usePrompt = (prompt) => {
  message.value = prompt
  textArea.value?.focus()
}

const refreshDocList = () => {
  documentMan.value?.loadDocs()
}

const clickSendBtn = () => {
  send()
}

const enterOnly = (event) => {
  event.preventDefault()
  if (!isMobile()) send()
}

defineExpose({usePrompt, refreshDocList})

const toolSelector = ref({
  list: [
    {title: 'Chat', icon: 'add', name: 'chat', role: AuthorRole.User},
  ],
  selected: 0
})

// Локальные метки вместо $t('messageLabel.<name>')
const toolLabelMap = {
  chat: 'Что бы Вы хотели спросить?',
  web_search: 'Что бы Вы хотели спросить? (Веб поиск)',
  arxiv: 'Что бы Вы хотели спросить? (arXiv)'
}

const currentLabel = computed(() => {
  const v = toolSelector.value
  const name = v.list[v.selected].name
  return toolLabelMap[name] ?? 'Ваш запрос'
})
</script>