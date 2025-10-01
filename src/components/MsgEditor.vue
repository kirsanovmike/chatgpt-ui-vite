<template>
  <div class="flex-grow-1 d-flex align-center justify-space-between">
    <v-btn
      title="Tools"
      :icon="getToolIcon()"
      density="compact"
      size="default"
      class="mr-3"
      id="tools_btn"
    >
    </v-btn>

    <v-menu activator="#tools_btn" open-on-hover>
      <v-list density="compact">
        <v-list-item
          v-for="(item, index) in toolSelector.list"
          :key="index"
          :prepend-icon="item.icon"
          @click="selectTool(index)"
        >
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>

        <v-list-item prepend-icon="article" @click="docDialogCtl.dialog = true">
          Documents
        </v-list-item>
      </v-list>
    </v-menu>

    <v-textarea
      ref="textArea"
      v-model="message"
      :label="currentLabel"
      :placeholder="hint"
      :rows="rows"
      max-rows="8"
      :auto-grow="autoGrow"
      :disabled="disabled"
      :loading="loading"
      :hide-details="true"
      clearable
      variant="outlined"
      class="userinputmsg"
      @keypress.enter.exact="enterOnly"
    ></v-textarea>

    <v-btn
      :disabled="loading"
      icon="send"
      title="Send"
      class="ml-3"
      @click="clickSendBtn"
    ></v-btn>
  </div>

  <DocumentsManage
    :send-message="sendMessage"
    :control="docDialogCtl"
    ref="documentMan"
  />
</template>

<script setup>
import { isMobile } from 'is-mobile'

const props = defineProps({
  sendMessage: { type: Function, required: true },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
})

const message = ref('')
const rows = ref(1)
const autoGrow = ref(true)

const hint = computed(() =>
  isMobile() ? '' : 'Press Enter to send. Shift+Enter for a new line.'
)

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
  // remove trailing "\n"
  if (msg.endsWith('\n')) msg = msg.slice(0, -1)
  if (msg.length > 0) {
    const item = toolSelector.value.list[toolSelector.value.selected]
    props.sendMessage({ content: msg, tool: item.name, message_type: item.type })
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

defineExpose({ usePrompt, refreshDocList })

const toolSelector = ref({
  list: [
    { title: 'Chat', icon: 'add', name: 'chat', type: 0 },
    { title: 'Web Search', icon: 'travel_explore', name: 'web_search', type: 100 },
    { title: 'ArXiv', icon: 'local_library', name: 'arxiv', type: 110 }
  ],
  selected: 0
})

function getToolIcon() {
  const v = toolSelector.value
  return v.list[v.selected].icon
}

function selectTool(idx) {
  toolSelector.value.selected = idx
}

// Локальные метки вместо $t('messageLabel.<name>')
const toolLabelMap = {
  chat: 'Type your message',
  web_search: 'Type your message (web search)',
  arxiv: 'Type your message (arXiv)'
}

const currentLabel = computed(() => {
  const v = toolSelector.value
  const name = v.list[v.selected].name
  return toolLabelMap[name] ?? 'Type your message'
})

const docDialogCtl = ref({ dialog: false })
</script>