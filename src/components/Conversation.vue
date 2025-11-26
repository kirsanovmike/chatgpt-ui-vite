<template>
  <div v-if="conversation">
    <div v-if="conversation.loadingMessages" class="text-center">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <div v-else>
      <div ref="chatWindow">
        <Teleport to="#portal-target">
          <!-- Селект выбора моделей -->
          <div class="model-select-container mt-1 liquidGlass-wrapper hoverable">
            <div class="liquidGlass-effect"></div>
            <div class="liquidGlass-tint"></div>
            <div class="liquidGlass-shine"></div>
            <div class="liquidGlass-text model-select-text">
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
          </div>
        </Teleport>

        <v-container class="chat-container">
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

  <v-footer app class="footer chat-footer py-5">
    <div class="px-md-4 w-100 d-flex flex-column gap-4">
      <div v-if="systemPrompt" class="d-flex align-center system-prompt-label glass-chip">
        <span class="mr-2 text-body-1">{{ systemPrompt.title }}</span>
        <v-btn icon="close" color="transparent" size="dense" elevation="0" @click="clearSystemPrompt" />
      </div>
      <div class="chat-input-shell liquidGlass-wrapper hoverable">
        <div class="liquidGlass-effect"></div>
        <div class="liquidGlass-tint"></div>
        <div class="liquidGlass-shine"></div>
        <div class="liquidGlass-text chat-input-content">
          <v-btn
              v-show="!fetchingResponse"
              icon="view_list"
              class="prompt-trigger"
              elevation="0"
              variant="text"
              @click="dialogAll = true"
          />
          <MsgEditor
              ref="editor"
              :send-message="send"
              :disabled="fetchingResponse"
              :loading="fetchingResponse"
              class="flex-grow-1 chat-msg-editor"
          />
          <v-btn
              v-show="fetchingResponse"
              icon="close"
              title="Stop"
              elevation="0"
              variant="text"
              class="send-btn"
              @click="stop"
          />
        </div>
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
      :system-prompts="systemPrompts"
      :ready-prompts="readyPrompts"
      @use="applySystemPrompt"
      @apply-ready="applyReadyPrompt"
  />
</template>

<script setup lang="ts">
// ============================== // Conversation.vue (Vite + TS) // ==============================

import MessageActions from '@/components/MessageActions.vue'
import MsgContent from '@/components/MsgContent.vue'
import MsgEditor from '@/components/MsgEditor.vue'
import PromptsDialog from './PromtsDialog.vue'

import {inject, ref} from 'vue'

import {AuthorRole} from "@/data/enums/AuthorRole.js";
import Llm, {trimMessagesByTokens} from "@/helpers/llm";

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

const systemPrompts = [
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

const readyPrompts = [
  {
    id: 'anti-manipulation',
    title: 'Мастер-класс по защите от манипуляций',
    tags: ['Психология', 'Безопасность'],
    text: `Ты ведущий эксперт по психологической безопасности и противодействию манипуляциям с опытом работы более 20 лет.

Исходные данные  
Сфера, где чаще сталкиваюсь с манипуляциями: [работа]  
Мои слабые места: [жалость к людям, страх конфликтов, желание понравиться]  
Мой уровень знаний о манипуляциях: [базовый]

Задание  
Создай персональную программу защиты от манипулятивного воздействия:

– Диагностика — Топ-5 манипулятивных техник, которым я наиболее подвержен.  
– Распознавание — Ключевые сигналы и красные флаги для моих ситуаций.  
– Защита — 10 универсальных фраз-щитов от манипуляций в моей сфере.  
– Тренировка — 5 упражнений для развития иммунитета к воздействию.  
– Экстренная помощь — Алгоритм действий, если манипуляция уже началась.  
– План роста — 30-дневная программа прокачки навыков защиты.

Все рекомендации адаптируй под мою специфику. Добавь примеры из реальной жизни. Не давай дисклеймер о себе в конце.`
  },
  {
    id: 'breaks',
    title: 'Как правильно делать перерывы, чтобы не терять концентрацию',
    tags: ['Психология', 'Карьера'],
    text: `Роль  
Ты — нейропсихолог с 15-летним опытом, специализирующийся на продуктивности, внимании и устойчивой работоспособности. Объясни простым языком, почему регулярные перерывы важны для поддержания концентрации, и предложи практическую стратегию отдыха, учитывая следующие данные:

Тип деятельности: [работа за компьютером]  
Продолжительность рабочего/учебного блока: [целый день]  
Возраст: [36 лет]  
Уровень усталости до начала задачи: [средний]  
Есть ли хронические состояния (по желанию): [мигрени]

Расскажи:
– почему мозг (или тело) нуждается в паузах при такой нагрузке — коротко и без сложной терминологии;  
– какой тип перерывов наиболее эффективен в этом случае: активные, пассивные, смена деятельности, цифровой детокс и т. п.;  
– оптимальная длительность и частота перерывов (например, каждые 45 минут по 7 минут);  
– конкретные действия во время перерыва, которые реально восстанавливают энергию (до 5 примеров);  
– чего точно стоит избегать в перерывах, чтобы не свести пользу на нет.

Ответ оформи как совет от эксперта — дружелюбно, но авторитетно, без воды. Добавь одну метафору, чтобы суть была понятна с первого раза (например: «Мозг — как мышца, он устаёт от постоянного напряжения»).`
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

const applySystemPrompt = (prompt: { title: string; full: string }) => {
  systemPrompt.value = prompt
}

const applyReadyPrompt = (prompt: string) => {
  editor.value?.usePrompt?.(prompt)
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
.chat-container {
  max-width: 1280px;
  padding-inline: clamp(16px, 4vw, 90px);
}

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
  font-size: 0.9rem;
  color: rgb(var(--v-theme-on-surface));
  padding: 8px 12px;
  border-radius: 14px;
  gap: 8px;
  width: fit-content;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.chat-footer {
  display: block;
  border-top: none;
  background: transparent !important;
}

.chat-input-shell {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
}

.chat-input-content {
  align-items: center;
  gap: 10px;
}

.chat-input-shell :deep(.v-field),
.chat-input-shell :deep(.v-field__field) {
  background: transparent;
  box-shadow: none;
}

.chat-input-shell :deep(textarea) {
  min-height: 52px;
}

.chat-input-shell :deep(.v-btn) {
  box-shadow: none;
}

.chat-msg-editor :deep(.v-field__input) {
  padding-top: 10px;
  padding-bottom: 10px;
}

.prompt-trigger,
.send-btn {
  width: 48px;
  height: 48px;
  border-radius: 16px;
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
  background-color: rgba(var(--v-theme-on-surface), 0.5);
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
  min-width: 240px;
  border-radius: 22px;
  padding: 6px 6px 6px 10px;
}

.model-select :deep(.v-field) {
  background: transparent;
  box-shadow: none;
}

.model-select-text {
  padding-inline: 4px 10px;
}

.badge-shell {
  min-height: 52px;
}

@media (max-width: 960px) {
  .chat-container {
    padding-inline: 16px;
  }

  .chat-input-shell {
    flex-wrap: wrap;
  }

  .prompt-trigger {
    order: 3;
  }
}
</style>