<template>
  <div v-if="conversation" class="mt-12">
    <!-- Спиннер загрузки сообщений -->
    <div v-if="conversation.loadingMessages" class="text-center">
      <v-progress-circular color="primary" indeterminate/>
    </div>

    <!-- Основной контент чата -->
    <div v-else>
      <div ref="chatWindow">
        <!-- Телепорт для селекта модели в шапку -->
        <Teleport to="#portal-target">
          <div class="model-select-container" style="margin-top: 2px;">
            <v-select
                v-model="selectedModel"
                :items="models"
                class="model-select"
                density="compact"
                hide-details
                item-title="name"
                item-value="value"
                label="Модель"
                variant="outlined"
                @update:model-value="onModelChange"
            />
          </div>
        </Teleport>

        <!-- Лента сообщений -->
        <v-container class="chat-container">
          <v-row>
            <v-col
                v-for="(message, index) in conversation.messages"
                :key="index"
                cols="12"
            >
              <div
                  :class="message.role === AuthorRole.Assistant ? 'justify-start' : 'justify-end'"
                  class="d-flex align-center content_and_action"
              >
                <div class="d-flex flex-row-reverse">
                  <!-- Экшены для сообщений пользователя -->
                  <MessageActions
                      v-if="message.role !== AuthorRole.Assistant"
                      :delete-message="deleteMessage"
                      :message="message"
                      :message-index="index"
                      :toggle-message="toggleMessage"
                      :use-prompt="usePrompt"
                      class="message-actions"
                  />

                  <!-- Контент сообщения -->
                  <div :class="['message-wrapper', { 'message-error': message.is_error }]">
                    <MsgContent
                        :delete-message="deleteMessage"
                        :index="index"
                        :message="message"
                        :use-prompt="usePrompt"
                    />
                  </div>

                  <!-- Экшены для сообщений ассистента -->
                  <MessageActions
                      v-if="message.role === AuthorRole.Assistant"
                      :delete-message="deleteMessage"
                      :message="message"
                      :message-index="index"
                      :use-prompt="usePrompt"
                      class="message-actions"
                  />
                </div>
              </div>
            </v-col>

            <!-- Индикатор печати, пока модель отвечает -->
            <v-col v-if="fetchingResponse" cols="12">
              <div class="d-flex align-center justify-start">
                <div class="d-flex align-center">
                  <v-icon class="mr-2" icon="mdi-robot"/>
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

        <!-- Якорь для автоскролла вниз -->
        <div ref="grab" class="w-100" style="height: 200px;"></div>
      </div>
    </div>
  </div>

  <!-- Футер с редактором сообщения и выбранным системным промптом -->
  <v-footer
      app
      class="chat-footer"
  >
    <div class="chat-footer-shell">
      <div class="liquidGlass-wrapper liquidGlass-wrapper--lg chat-footer-glass">
        <div class="liquidGlass-effect"></div>
        <div class="liquidGlass-tint"></div>
        <div class="liquidGlass-shine"></div>

        <div class="liquidGlass-text chat-footer-content">
          <!-- Левый блок: активный системный промпт + кнопка промптов -->
          <div class="chat-footer-left">
            <div
                v-if="systemPrompt"
                class="d-flex align-center mr-3 system-prompt-label"
            >
              <span class="mr-1 text-body-2">{{ systemPrompt.title }}</span>
              <v-btn
                  class="system-prompt-close"
                  icon="close"
                  size="x-small"
                  variant="text"
                  @click="clearSystemPrompt"
              />
            </div>


          </div>

          <!-- Центр: редактор сообщения -->
          <div class="chat-footer-center">
            <div class="d-flex flex-column justify-center" style="width: 100%">
              <div class="d-flex align-end py-3">
                <v-btn
                    v-show="!fetchingResponse"
                    class="chat-footer-icon-btn mr-6 mb-1 ml-n3"
                    icon="view_list"
                    size="z-large"
                    style="width: 48px; height: 48px;"
                    @click="dialogAll = true"
                />
                <MsgEditor
                    ref="editor"
                    :disabled="fetchingResponse"
                    :loading="fetchingResponse"
                    :send-message="send"
                />
                <v-btn
                    v-show="fetchingResponse"
                    class="chat-footer-icon-btn mb-1 ml-6"
                    icon="close"
                    style="width: 48px; height: 48px;"
                    title="Stop"
                    @click="stop"
                />
              </div>

              <div class="floating-disclaimer d-flex justify-center font-weight-regular" style="font-size: 12px;">
                ТНЭ чат может допускать ошибки. Проверяйте важную информацию.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </v-footer>

  <!-- Снэкбар для уведомлений -->
  <v-snackbar v-model="snackbar" location="top" multi-line>
    {{ snackbarText }}
    <template #actions>
      <v-btn color="red" variant="text" @click="snackbar = false">
        Закрыть
      </v-btn>
    </template>
  </v-snackbar>

  <!-- Диалог со всеми готовыми промптами -->
  <PromptsDialog
      v-model="dialogAll"
      :ready-prompts="readyPrompts"
      :system-prompts="systemPrompts"
      @use="applySystemPrompt"
      @apply-ready="applyReadyPrompt"
  />
</template>

<script lang="ts" setup>
import {ref} from 'vue'

import MessageActions from '@/components/MessageActions.vue'
import MsgContent from '@/components/MsgContent.vue'
import MsgEditor from '@/components/MsgEditor.vue'
import PromptsDialog from './PromtsDialog.vue'

import Llm from '@/api/Llm'
import {AuthorRole} from '@/data/enums/AuthorRole'
import {trimMessagesByTokens} from '@/helpers/llm'

// ========================= Локальные типы =========================

type ChatMessage = {
  id?: number | string | null
  is_disabled?: boolean
  is_error?: boolean
  content: string
  role: string
  message_type?: number
}

type ConversationT = {
  id: number | string | null
  topic: string | null
  messages: ChatMessage[]
  loadingMessages: boolean
}

// ========================= Константы промптов =========================

const systemPrompts = [
  {
    title: 'Ассистент по переписке',
    full:
        'Ты — ассистент сотрудника компании. Помогаешь формулировать письма, ответы в мессенджерах и служебные записки. ' +
        'Пиши вежливо, по-деловому, кратко и по-русски, без канцелярита и лишних эмоций. ' +
        'Всегда предлагай 1–2 варианта формулировок на выбор.'
  },
  {
    title: 'Объяснение сложных тем',
    full:
        'Ты — наставник, который объясняет сложные темы простыми словами. ' +
        'Отвечай структурировано, шаг за шагом, с примерами из повседневной офисной работы (Excel, отчёты, совещания, процессы). ' +
        'Если можно — давай короткий пример или мини-инструкцию, как сделать это на практике.'
  },
  {
    title: 'Помощь в рабочих ситуациях',
    full:
        'Ты — рабочий ассистент, который помогает разобраться в типичных ситуациях. ' +
        'Помогаешь спокойно разложить проблему по пунктам, предложить варианты действий, ' +
        'составить чек-лист или план разговора с коллегами/руководителем. ' +
        'Пиши доброжелательно, без оценок, с упором на здравый смысл и конструктив.'
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

// ========================= Пропсы и состояние =========================

const props = defineProps<{
  conversation: ConversationT
}>()

const dialogAll = ref(false)
const systemPrompt = ref<{
  title: string;
  full: string
} | null>(null)

const models = [
  {name: 'Для кода', value: 'qwen3-coder:30b'},
  {name: 'Для любых задач', value: 'qwen3:30b-a3b-q4_K_M'}
]
const selectedModel = ref('qwen3:30b-a3b-q4_K_M')

const fetchingResponse = ref(false)

const editor = ref<{
  usePrompt?: (s: string) => void;
  refreshDocList?: () => void
} | null>(null)
const grab = ref<HTMLElement | null>(null)

const snackbar = ref(false)
const snackbarText = ref('')

// ========================= Вспомогательные функции UI =========================

const scrollChatWindow = () => {
  if (!grab.value) return
  grab.value.scrollIntoView({behavior: 'smooth'})
}

const usePrompt = (prompt: string) => {
  editor.value?.usePrompt?.(prompt)
}

const deleteMessage = (index: number) => {
  props.conversation.messages.splice(index, 1)
}

const toggleMessage = (index: number) => {
  const msg = props.conversation.messages[index]
  msg.is_disabled = !msg.is_disabled
}

// ========================= Работа с системным промптом =========================

const clearSystemPrompt = () => {
  systemPrompt.value = null
}

const applySystemPrompt = (prompt: {
  title: string;
  full: string
}) => {
  systemPrompt.value = prompt
}

const applyReadyPrompt = (prompt: string) => {
  editor.value?.usePrompt?.(prompt)
}

// ========================= Работа с LLM =========================

let ctrl: AbortController | null = null

const abortFetch = () => {
  if (ctrl) ctrl.abort()
  fetchingResponse.value = false
}

const fetchReply = async () => {
  fetchingResponse.value = true

  try {
    const model = selectedModel.value

    const limitedMessages = trimMessagesByTokens(
        props.conversation.messages,
        model
    )

    const data = await Llm.generate({
      messages: limitedMessages,
      promptOptions: {
        model
      }
    })

    props.conversation.messages.push({
      content: data.response.content,
      role: AuthorRole.Assistant
    })
  } catch (error) {
    console.error('Ошибка при запросе к LLM', error)

    props.conversation.messages.push({
      content: 'Упс, что-то пошло не так при обращении к модели. Попробуйте ещё раз чуть позже.',
      role: AuthorRole.Assistant,
      is_error: true
    })
  } finally {
    fetchingResponse.value = false
    scrollChatWindow()
  }
}

const send = (message: {
  content: string;
  role: string
}) => {
  fetchingResponse.value = true

  const enrichedContent = systemPrompt.value?.full
      ? `Системные указания: ${systemPrompt.value.full} Вопрос пользователя: ${message.content}`
      : message.content

  props.conversation.messages.push({
    content: enrichedContent,
    role: message.role
  })

  fetchReply()
  scrollChatWindow()
}

const stop = () => abortFetch()

const onModelChange = (model: string) => {
  console.log('Выбрана модель:', model)
}
</script>

<style scoped>
/* Контейнер чата (ширина/отступы) */
.chat-container {
  max-width: 1280px;
  padding-inline: clamp(16px, 4vw, 90px);
}

/* Обёртка для сообщения + иконки действий */
.content_and_action {
  position: relative;
}

.content_and_action:hover .message-actions {
  opacity: 1;
  visibility: visible;
}

/* Кнопки действий над сообщением (копировать, удалить и т.п.) */
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

/* Обёртка вокруг MsgContent */
.message-wrapper {
  max-width: 100%;
}

/* Красное системное сообщение об ошибке */
.message-error {
  border-left: 3px solid rgb(var(--v-theme-error));
  background-color: rgba(var(--v-theme-error), 0.06);
  border-radius: 8px;
  padding: 8px 12px;
}

/* ===== Футер ===== */

.chat-footer {
  background-color: transparent;
  border-top: none;
  padding: 0;
}

.chat-footer-shell {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 clamp(16px, 4vw, 90px) 28px; /* левитация над нижним краем */
}

.chat-footer-glass {
  width: 100%;
}

.chat-footer-content {
  width: 100%;
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.chat-footer-left,
.chat-footer-right {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}

.chat-footer-center {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
}

/* Иконки слева/справа (круглые) */
.chat-footer-icon-btn.v-btn {
  min-width: 40px;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  padding: 0;
}

/* Плашка активного системного промпта внутри футера */
.system-prompt-label {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 999px;
  background-color: rgba(var(--v-theme-system-prompt), 0.12);
  color: rgb(var(--v-theme-system-prompt));
  white-space: nowrap;
}

.system-prompt-close.v-btn {
  margin-left: 4px;
}

/* Анимация «печатает…» */
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
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-5px);
  }
}

/* Селект модели в шапке */
.model-select-container {
  z-index: 1000;
  width: 250px;
}

.model-select {
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>

<style lang="scss">
.message-wrapper.message-error {
  .v-card {
    background: transparent;
  }
}
</style>
