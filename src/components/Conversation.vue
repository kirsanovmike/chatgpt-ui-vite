<template>
  <div v-if="conversation">
    <!-- Спиннер загрузки сообщений -->
    <div v-if="conversation.loadingMessages" class="text-center">
      <v-progress-circular indeterminate color="primary" />
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

        <!-- Лента сообщений -->
        <v-container class="chat-container">
          <v-row>
            <v-col
                v-for="(message, index) in conversation.messages"
                :key="index"
                cols="12"
            >
              <div
                  class="d-flex align-center content_and_action"
                  :class="message.role === AuthorRole.Assistant ? 'justify-start' : 'justify-end'"
              >
                <div class="d-flex flex-row-reverse">
                  <!-- Экшены для сообщений пользователя -->
                  <MessageActions
                      v-if="message.role !== AuthorRole.Assistant"
                      class="message-actions"
                      :message="message"
                      :message-index="index"
                      :use-prompt="usePrompt"
                      :delete-message="deleteMessage"
                      :toggle-message="toggleMessage"
                  />

                  <!-- Контент сообщения -->
                  <div :class="['message-wrapper', { 'message-error': message.is_error }]">
                    <MsgContent
                        :message="message"
                        :index="index"
                        :use-prompt="usePrompt"
                        :delete-message="deleteMessage"
                    />
                  </div>

                  <!-- Экшены для сообщений ассистента -->
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

            <!-- Индикатор печати, пока модель отвечает -->
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

        <!-- Якорь для автоскролла вниз -->
        <div ref="grab" class="w-100" style="height: 200px;"></div>
      </div>
    </div>
  </div>

  <!-- Футер с редактором сообщения и выбранным системным промптом -->
  <v-footer
      app
      class="footer chat-footer py-5"
  >
    <!-- Плашка с активным системным промптом -->
    <div
        v-if="systemPrompt"
        class="d-flex align-center mb-6 ml-3 py-1 system-prompt-label"
    >
      <span class="mr-2 text-body-1">{{ systemPrompt.title }}</span>
      <v-btn
          icon="close"
          color="transparent"
          size="dense"
          elevation="0"
          @click="clearSystemPrompt"
      />
    </div>

    <!-- Область ввода -->
    <div class="px-md-4 w-100 d-flex flex-column">
      <div class="d-flex align-center">
        <!-- Кнопка открытия списка готовых промптов -->
        <v-btn
            v-show="!fetchingResponse"
            icon="view_list"
            class="mr-4"
            elevation="0"
            @click="dialogAll = true"
        />
        <!-- Редактор сообщения -->
        <MsgEditor
            ref="editor"
            :send-message="send"
            :disabled="fetchingResponse"
            :loading="fetchingResponse"
        />
        <!-- Кнопка остановки генерации -->
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

  <!-- Снэкбар для уведомлений -->
  <v-snackbar v-model="snackbar" multi-line location="top">
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
      :system-prompts="systemPrompts"
      :ready-prompts="readyPrompts"
      @use="applySystemPrompt"
      @apply-ready="applyReadyPrompt"
  />
</template>

<script setup lang="ts">
/**
 * Компонент Conversation
 * Отвечает за:
 *  - отображение ленты сообщений чата
 *  - выбор модели
 *  - ввод нового сообщения
 *  - показ индикатора печати
 *  - работу с системными и готовыми промптами
 */

import { ref } from 'vue'

import MessageActions from '@/components/MessageActions.vue'
import MsgContent from '@/components/MsgContent.vue'
import MsgEditor from '@/components/MsgEditor.vue'
import PromptsDialog from './PromtsDialog.vue'

import Llm from '@/api/Llm'
import { AuthorRole } from '@/data/enums/AuthorRole'
import { trimMessagesByTokens } from '@/helpers/llm'

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

/**
 * Набор системных промптов — пользователь выбирает один,
 * он подмешивается к вопросу, который отправляется модели.
 */
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

/**
 * Готовые промпты — длинные заготовки задач,
 * которые пользователь может вставить в редактор.
 */
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

// ========================= Пропсы и основное состояние =========================

const props = defineProps<{ conversation: ConversationT }>()

/** Флаг открытия диалога «Все промпты» */
const dialogAll = ref(false)

/** Текущий системный промпт, который применён к чату */
const systemPrompt = ref<{ title: string; full: string } | null>(null)

/** Текущая выбранная модель генерации */
const models = [
  { name: 'Для кода', value: 'qwen3-coder:30b' },
  { name: 'Для любых задач', value: 'qwen3:30b-a3b-q4_K_M' }
]
const selectedModel = ref('qwen3:30b-a3b-q4_K_M')

/** Флаг: идёт ли сейчас запрос к LLM */
const fetchingResponse = ref(false)

/** Рефы для управления редактором и прокруткой */
const editor = ref<{ usePrompt?: (s: string) => void; refreshDocList?: () => void } | null>(null)
const grab = ref<HTMLElement | null>(null)

/** Снэкбар для уведомлений (на будущее) */
const snackbar = ref(false)
const snackbarText = ref('')

// ========================= Вспомогательные функции UI =========================

/**
 * Прокрутка чата к нижнему якорю, чтобы пользователь видел последние сообщения.
 */
const scrollChatWindow = () => {
  if (!grab.value) return
  grab.value.scrollIntoView({ behavior: 'smooth' })
}

/**
 * Подставить готовый промпт в редактор.
 */
const usePrompt = (prompt: string) => {
  editor.value?.usePrompt?.(prompt)
}

/**
 * Удалить сообщение по индексу.
 */
const deleteMessage = (index: number) => {
  props.conversation.messages.splice(index, 1)
}

/**
 * Переключить флаг отключения сообщения (например, для пересчёта контекста).
 */
const toggleMessage = (index: number) => {
  const msg = props.conversation.messages[index]
  msg.is_disabled = !msg.is_disabled
}

// ========================= Работа с системным промптом =========================

/**
 * Очистить активный системный промпт.
 */
const clearSystemPrompt = () => {
  systemPrompt.value = null
}

/**
 * Установить системный промпт (выбор из списка).
 */
const applySystemPrompt = (prompt: { title: string; full: string }) => {
  systemPrompt.value = prompt
}

/**
 * Применить «готовый» длинный промпт — просто заполняем редактор.
 */
const applyReadyPrompt = (prompt: string) => {
  editor.value?.usePrompt?.(prompt)
}

// ========================= Работа с LLM =========================

/** Контроллер для возможной отмены запроса (сейчас используется как заглушка) */
let ctrl: AbortController | null = null

/**
 * Принудительно остановить запрос (в оффлайне просто сбрасываем флаг).
 */
const abortFetch = () => {
  if (ctrl) ctrl.abort()
  fetchingResponse.value = false
}

/**
 * Запрос ответа у LLM для текущего набора сообщений.
 * Здесь же обрезаем историю по токенам.
 */
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

/**
 * Отправка нового сообщения:
 *  - добавляем сообщение пользователя в массив
 *  - подмешиваем системный промпт, если выбран
 *  - запускаем генерацию ответа
 */
const send = (message: { content: string; role: string }) => {
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

/**
 * Обработчик кнопки «Stop» — просто останавливает текущий запрос.
 */
const stop = () => abortFetch()

/**
 * Обработчик смены модели — сейчас только логируем,
 * но здесь удобное место для будущей логики.
 */
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

/* Плашка активного системного промпта */
.system-prompt-label {
  font-size: 0.8rem;
  color: rgb(var(--v-theme-system-prompt));
  padding: 4px 8px;
  border: 8px solid rgb(var(--v-theme-system-prompt));
  border-radius: 4px;
  background-color: rgb(var(--v-theme-primary-lighten));
  display: inline-block;
}

/* Оформление футера с инпутом */
.chat-footer {
  display: block;
  border-top: 1px solid rgb(var(--v-theme-surface));
  background-color: rgb(var(--v-theme-header-bg));
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
