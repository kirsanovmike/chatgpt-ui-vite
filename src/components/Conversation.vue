<template>
  <div v-if="conversation">
    <div v-if="conversation.loadingMessages" class="text-center">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <div v-else>
      <div v-if="conversation.messages" ref="chatWindow">
        <v-container>
          <v-row>
            <v-col
              v-for="(message, index) in conversation.messages"
              :key="index"
              cols="12"
            >
              <div class="d-flex align-center" :class="message.is_bot ? 'justify-start' : 'justify-end'">
                <MessageActions
                  v-if="!message.is_bot"
                  :message="message"
                  :message-index="index"
                  :use-prompt="usePrompt"
                  :delete-message="deleteMessage"
                  :toggle-message="toggleMessage"
                />
                <MsgContent
                  :message="message"
                  :index="index"
                  :use-prompt="usePrompt"
                  :delete-message="deleteMessage"
                />
                <MessageActions
                  v-if="message.is_bot"
                  :message="message"
                  :message-index="index"
                  :use-prompt="usePrompt"
                  :delete-message="deleteMessage"
                />
              </div>
            </v-col>
          </v-row>
        </v-container>

        <div ref="grab" class="w-100" style="height: 200px;"></div>
      </div>
    </div>
  </div>

  <v-footer app class="footer py-5">
    <div class="px-md-4 w-100 d-flex flex-column">
      <div class="d-flex align-center">
        <Prompt v-show="!fetchingResponse" :use-prompt="usePrompt" class="mr-3" />
        <MsgEditor
          ref="editor"
          :send-message="send"
          :disabled="fetchingResponse"
          :loading="fetchingResponse"
        />
        <v-btn
          v-show="fetchingResponse"
          icon="close"
          title="Stop"
          class="mr-3"
          @click="stop"
        />
      </div>

    </div>
  </v-footer>

  <v-snackbar v-model="snackbar" multi-line location="top">
    {{ snackbarText }}
    <template #actions>
      <v-btn color="red" variant="text" @click="snackbar = false">Close</v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
// ==============================
// Conversation.vue (Vite + TS)
// ==============================

import MessageActions from '@/components/MessageActions.vue'
import MsgContent from '@/components/MsgContent.vue'
import MsgEditor from '@/components/MsgEditor.vue'
import Prompt from '@/components/Prompt.vue'

import { inject, onMounted, ref } from 'vue'

// ---------- Типы ----------
type ChatMessage = {
  id?: number | string | null
  is_bot?: boolean
  is_disabled?: boolean
  message: string
  message_type?: number
}
type ConversationT = {
  id: number | string | null
  topic: string | null
  messages: ChatMessage[]
  loadingMessages: boolean
}

// ---------- Инъекции / пропсы ----------
const settings = inject<Record<string, string> | undefined>('settings', {})
const props = defineProps<{ conversation: ConversationT }>()

// ---------- Флаги / состояние ----------
const USE_BACKEND = false // 👈 оффлайн-режим (всё, что ходит в сеть, вырублено)
const fetchingResponse = ref(false)
const messageQueue: string[] = []
const frugalMode = ref(true)
let isProcessingQueue = false

const editor = ref<{ usePrompt?: (s: string) => void; refreshDocList?: () => void } | null>(null)
const enableWebSearch = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')

// ---------- Заглушки вместо Nuxt-композаблов ----------
const getCurrentModel = () => {
  // Минимальная заглушка модели (если нужно — подставь реальные значения)
  return {
    name: 'gpt-3.5-turbo',
    frequency_penalty: 0,
    presence_penalty: 0,
    total_tokens: 4096,
    max_tokens: 1000,
    temperature: 0.7,
    top_p: 1.0,
  }
}
const currentModel = ref(getCurrentModel())
const openaiApiKey = ref<string | null>(null)
const genTitle = async (_conversationId: string | number) => {
  // без бэкенда — no-op
}

// ---------- UI utils ----------
const showSnackbar = (text: string) => {
  snackbarText.value = text
  snackbar.value = true
}

const grab = ref<HTMLElement | null>(null)
const scrollChatWindow = () => {
  if (!grab.value) return
  grab.value.scrollIntoView({ behavior: 'smooth' })
}

// ---------- Очередь «печати» ответа ----------
const processMessageQueue = () => {
  if (isProcessingQueue || messageQueue.length === 0) return

  if (!props.conversation.messages[props.conversation.messages.length - 1]?.is_bot) {
    props.conversation.messages.push({ id: null, is_bot: true, message: '' })
  }

  isProcessingQueue = true
  const nextChunk = messageQueue.shift()!

  // Если хочешь красивую «печатную» анимацию — раскомментируй и выставь задержку:
  const TYPEWRITER = false
  const TYPEWRITER_DELAY = 50

  if (TYPEWRITER) {
    let i = 0
    const intervalId = setInterval(() => {
      props.conversation.messages[props.conversation.messages.length - 1].message += nextChunk[i]
      i++
      if (i === nextChunk.length) {
        clearInterval(intervalId)
        isProcessingQueue = false
        processMessageQueue()
      }
    }, TYPEWRITER_DELAY)
  } else {
    props.conversation.messages[props.conversation.messages.length - 1].message += nextChunk
    isProcessingQueue = false
    processMessageQueue()
  }
}

// ---------- Сетевой аборт (в оффлайне просто сбрасываем флаг) ----------
let ctrl: AbortController | null = null
const abortFetch = () => {
  if (ctrl) ctrl.abort()
  fetchingResponse.value = false
}

// ---------- «Отправка» сообщения ----------
const fetchReply = async (message: { content: string; tool?: string; message_type?: number } | Array<{ content: string; tool?: string; message_type?: number }>) => {
  // Оффлайн-режим: безопасная заглушка без сетевых вызовов
  if (!USE_BACKEND) {
    // имитация короткого ответа ассистента + очередь чанков
    setTimeout(() => {
      messageQueue.push(`Echo: ${Array.isArray(message) ? message.at(-1)?.content ?? '' : message.content}`)
      processMessageQueue()
      fetchingResponse.value = false
    }, 2700)
    return
  }

  // ===== Ниже оставить закомментированным (включишь, когда подключишь API/стрим) =====

  // ctrl = new AbortController()

  // // Подготовка payload
  // let msg = Array.isArray(message) ? message[message.length - 1] : message
  // const webSearchParams: Record<string, any> = {}

  // if (enableWebSearch.value || msg.tool === 'web_search') {
  //   webSearchParams['web_search'] = {
  //     ua: navigator.userAgent,
  //     default_prompt: 'Кратко ответь. При необходимости используй веб-поиск и укажи источники.',
  //   }
  // }

  // if (msg.tool === 'web_search') {
  //   // @ts-expect-error динамический атрибут
  //   msg.tool_args = webSearchParams['web_search']
  //   // @ts-expect-error совместимость с исходным форматом
  //   msg.type = 100
  // } else if (msg.tool === 'arxiv') {
  //   // @ts-expect-error динамический атрибут
  //   msg.tool_args = null
  //   // @ts-expect-error
  //   msg.type = 110
  // }

  // const payload = Object.assign({}, currentModel.value, {
  //   openaiApiKey: settings?.open_api_key_setting === 'True' ? openaiApiKey.value : null,
  //   message: Array.isArray(message) ? message : [message],
  //   conversationId: props.conversation.id,
  //   frugalMode: frugalMode.value,
  // }, webSearchParams)

  // try {
  //   const { EventStreamContentType, fetchEventSource } = await import('@microsoft/fetch-event-source')
  //   await fetchEventSource('/api/conversation/', {
  //     signal: ctrl.signal,
  //     method: 'POST',
  //     headers: { accept: 'application/json', 'Content-Type': 'application/json' },
  //     body: JSON.stringify(payload),
  //     openWhenHidden: true,
  //     onopen(response) {
  //       if (response.ok && response.headers.get('content-type') === EventStreamContentType) return
  //       throw new Error(`Failed to send message. HTTP ${response.status} - ${response.statusText}`)
  //     },
  //     onclose() {
  //       if (ctrl?.signal.aborted) return
  //       throw new Error('Failed to send message. Server closed the connection unexpectedly.')
  //     },
  //     onerror(err) { throw err },
  //     onmessage(ev) {
  //       const event = ev.event
  //       const data = JSON.parse(ev.data)

  //       if (event === 'error') {
  //         abortFetch()
  //         showSnackbar(data.error)
  //         return
  //       }
  //       if (event === 'userMessageId') {
  //         props.conversation.messages[props.conversation.messages.length - 1].id = data.userMessageId
  //         return
  //       }
  //       if (event === 'done') {
  //         abortFetch()
  //         props.conversation.messages[props.conversation.messages.length - 1].id = data.messageId
  //         if (!props.conversation.id) {
  //           props.conversation.id = data.conversationId
  //           genTitle(props.conversation.id)
  //         }
  //         if (data.newDocId) {
  //           editor.value?.refreshDocList?.()
  //         }
  //         return
  //       }

  //       messageQueue.push(data.content)
  //       processMessageQueue()
  //       scrollChatWindow()
  //     }
  //   })
  // } catch (err: any) {
  //     console.error(err)
  //     abortFetch()
  //     showSnackbar(err?.message ?? 'Failed to send message')
  // }
}

const send = (message: { content: string; tool?: string; message_type?: number } | Array<{ content: string; tool?: string; message_type?: number }>) => {
  fetchingResponse.value = true
  // Если это самый первый месседж — можно было бы addConversation(props.conversation), но без глобального стора опускаем

  if (Array.isArray(message)) {
    props.conversation.messages.push(...message.map(i => ({ message: i.content, message_type: i.message_type })))
  } else {
    props.conversation.messages.push({ message: message.content, message_type: message.message_type })
  }

  fetchReply(message)
  scrollChatWindow()
}

const stop = () => abortFetch()

const usePrompt = (prompt: string) => editor.value?.usePrompt?.(prompt)
const deleteMessage = (index: number) => { props.conversation.messages.splice(index, 1) }
const toggleMessage = (index: number) => {
  props.conversation.messages[index].is_disabled = !props.conversation.messages[index].is_disabled
}

// ---------- Mounted ----------
onMounted(() => {
  currentModel.value = getCurrentModel()
})
</script>

<style scoped>
.footer { width: 100%; }
</style>