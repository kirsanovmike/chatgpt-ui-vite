<template>
  <div v-if="conversation">
    <div v-if="conversation.loadingMessages" class="text-center">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <div v-else>
      <div ref="chatWindow">
        <Teleport to="#portal-target">
          <!-- Селект выбора моделей -->
          <div class="model-select-container mt-1">
            <v-select
                v-model="selectedModel"
                :items="models"
                item-title="name"
                item-value="value"
                label="Модель"
                variant="outlined"
                density="compact"
                class="model-select"
                hide-details
                @update:model-value="onModelChange"
            />
          </div>
        </Teleport>

        <v-container style="padding-left: 90px; padding-right: 90px;">
          <v-row>
            <v-col
                v-for="(message, index) in conversation.messages"
                :key="index"
                cols="12"
            >
              <div class="d-flex align-center content_and_action" :class="message.role === AuthorRole.Assistant ? 'justify-start' : 'justify-end'"
              >
                <div class="d-flex flex-row-reverse">
                  <MessageActions
                      v-if="message.role !== AuthorRole.Assistant"
                      class="message-actions"
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
                      v-if="message.role === AuthorRole.Assistant"
                      class="message-actions"
                      :message="message"
                      :message-index="index"
                      :use-prompt="usePrompt"
                      :delete-message="deleteMessage"
                  />
                </div>
              </div>
            </v-col>

            <!-- Показываем анимацию печати, когда идет ответ -->
            <v-col v-if="fetchingResponse" cols="12">
              <div class="d-flex align-center justify-start">
                <div class="d-flex align-center">
                  <v-icon icon="mdi-robot" class="mr-2" />
                  <div class="typing-indicator">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                  </div>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-container>

        <div ref="grab" class="w-100" style="height: 200px;"></div>
      </div>
    </div>
  </div>

  <v-footer
      style="display: block;
      border-top: 1px solid rgb(var(--v-theme-surface));
      background-color: rgb(var(--v-theme-header-bg));" app class="footer py-5">
    <div v-if="systemPrompt" class="d-flex align-center mb-6 ml-3 py-1 system-prompt-label" style="width: fit-content">
      <span class="mr-2 text-body-1">{{ systemPrompt.title }}</span>
      <v-btn icon="close" color="transparent" size="dense" elevation="0" @click="clearSystemPrompt" />
    </div>
    <div class="px-md-4 w-100 d-flex flex-column">
      <div class="d-flex align-center">
        <!--        <Prompt v-show="!fetchingResponse" :use-prompt="usePrompt" class="mr-3" />-->
        <v-btn
            v-show="!fetchingResponse"
            icon="view_list"
            class="mr-4"
            elevation="0"
            @click="dialogAll = true"
        />
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
            class="ml-4"
            elevation="0"
            @click="stop"
        />
      </div>
    </div>
  </v-footer>

  <v-snackbar v-model="snackbar" multi-line location="top">
    {{ snackbarText }}
    <template #actions>
      <v-btn color="red" variant="text" @click="snackbar = false">Закрыть</v-btn>
    </template>
  </v-snackbar>
  <!-- Диалог «Все готовые промты» -->
  <PromptsDialog
      v-model="dialogAll"
      :prompts="prompts"
      @use="systemPrompt = $event"
  />
</template>

<script setup lang="ts">
// ============================== // Conversation.vue (Vite + TS) // ==============================

import MessageActions from '@/components/MessageActions.vue'
import MsgContent from '@/components/MsgContent.vue'
import MsgEditor from '@/components/MsgEditor.vue'
import PromptsDialog from './PromtsDialog.vue'

import {inject, ref} from 'vue'

import Llm from "@/api/Llm"
import {AuthorRole} from "@/data/enums/AuthorRole";
import {trimMessagesByTokens} from "@/helpers/llm";

// ---------- Типы ----------
type ChatMessage = {
  id?: number | string | null
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

const dialogAll = ref(false)

const prompts = [
  {
    title: "Ассистент по переписке",
    full: "Ты — ассистент сотрудника компании. Помогаешь формулировать письма, ответы в мессенджерах и служебные записки. Пиши вежливо, по-деловому, кратко и по-русски, без канцелярита и лишних эмоций. Всегда предлагай 1–2 варианта формулировок на выбор."
  },
  {
    title: "Объяснение сложных тем",
    full: "Ты — наставник, который объясняет сложные темы простыми словами. Отвечай структурировано, шаг за шагом, с примерами из повседневной офисной работы (Excel, отчёты, совещания, процессы). Если можно — давай короткий пример или мини-инструкцию, как сделать это на практике."
  },
  {
    title: "Помощь в рабочих ситуациях",
    full: "Ты — рабочий ассистент, который помогает разобраться в типичных ситуациях. Помогаешь спокойно разложить проблему по пунктам, предложить варианты действий, составить чек-лист или план разговора с коллегами/руководителем. Пиши доброжелательно, без оценок, с упором на здравый смысл и конструктив."
  }
]

// ---------- Инъекции / пропсы ----------
const settings = inject<Record<string, string> | undefined>('settings', {})
const props = defineProps<{ conversation: ConversationT }>()

// ---------- Флаги / состояние ----------
const fetchingResponse = ref(false)

const editor = ref<{ usePrompt?: (s: string) => void; refreshDocList?: () => void } | null>(null)
const snackbar = ref(false)
const snackbarText = ref('')

const grab = ref<HTMLElement | null>(null)
const scrollChatWindow = () => {
  if (!grab.value) return
  grab.value.scrollIntoView({ behavior: 'smooth' })
}

// ---------- Сетевой аборт (в оффлайне просто сбрасываем флаг) ----------
let ctrl: AbortController | null = null
const abortFetch = () => {
  if (ctrl) ctrl.abort()
  fetchingResponse.value = false
}

// ---------- «Отправка» сообщения ----------
const fetchReply = async () => {
  fetchingResponse.value = true;
  try {
    const model = selectedModel.value;
    const limitedMessages = trimMessagesByTokens(
        props.conversation.messages,
        model,
    );
    const data = await Llm.generate({
      messages: limitedMessages,
      promptOptions: {
        model,
      },
    });
    props.conversation.messages.push({
      content: data.response.content,
      role: AuthorRole.Assistant,
    });
  } finally {
    fetchingResponse.value = false;
  }
};


const send = (message: {content: string, role: string, }) => {
  fetchingResponse.value = true
  const content =
      systemPrompt.value?.full ? `Системные указания: ${systemPrompt.value?.full} Вопрос пользователя: ${message.content}` : message.content;
  props.conversation.messages.push({ content, role: message.role })
  fetchReply()
  scrollChatWindow()
}

const stop = () => abortFetch()

const usePrompt = (prompt: string) => editor.value?.usePrompt?.(prompt)
const deleteMessage = (index: number) => { props.conversation.messages.splice(index, 1) }
const toggleMessage = (index: number) => {
  props.conversation.messages[index].is_disabled = !props.conversation.messages[index].is_disabled
}

/* System prompt section. */
const systemPrompt = ref<{title: string, full: string} | null>(null)

const clearSystemPrompt = () => {
  systemPrompt.value = null
}

// ---------- Модели ----------
const models = [
  { name: 'Для кода', value: 'qwen3-coder:30b' },
  { name: 'Для любых задач', value: 'qwen3:30b-a3b-q4_K_M' }
]

const selectedModel = ref('qwen3:30b-a3b-q4_K_M')

const onModelChange = (model: string) => {
  // Здесь можно добавить логику при смене модели
  console.log('Выбрана модель:', model)
}
</script>

<style scoped>
.content_and_action {
  position: relative;
}

.content_and_action:hover .message-actions {
  opacity: 1;
  visibility: visible;
}

.message-actions {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.content_and_action.justify-start .message-actions {
  left: -30px;
}

.content_and_action.justify-end .message-actions {
  right: -30px;
}

.system-prompt-label {
  font-size: 0.8rem;
  color: rgb(var(--v-theme-system-prompt));
  padding: 4px 8px;
  border: 8px solid rgb(var(--v-theme-system-prompt));
  border-radius: 4px;
  background-color: rgb(var(--v-theme-primary-lighten));;
  display: inline-block;
}

/* Анимация печати */
.typing-indicator {
  display: flex;
  align-items: center;
}

.typing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #999;
  margin: 0 2px;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(1) {
  animation-delay: 0s;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-5px);
  }
}

/* Селект модели */
.model-select-container {
  z-index: 1000;
  width: 250px;
}

.model-select {
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
</style>