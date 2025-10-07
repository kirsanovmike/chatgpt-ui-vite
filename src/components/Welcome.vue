<template>
  <v-container class="py-10">
    <!-- Заголовок -->
    <v-row>
      <v-col cols="12">
        <div class="text-center">
          <h2 class="text-h4 text-md-h3 font-weight-medium">
            {{ $textVariables.welcomeTo }} <span class="text-primary">{{ APP_NAME }}</span>
          </h2>
          <p class="text-body-2 text-medium-emphasis mt-4">
            {{ APP_NAME }} помогает вам общаться с большими языковыми моделями.
          </p>
        </div>
      </v-col>
    </v-row>

    <!-- Основные блоки -->
    <v-row class="mt-10" align="start">
      <!-- Примеры -->
      <v-col cols="12" md="4">
        <div class="d-flex flex-column align-center mb-4">
          <h3 class="text-subtitle-1 text-medium-emphasis">
            {{ $textVariables.welcomeScreen.examples.title }}
          </h3>
        </div>
        <WelcomeCard
            v-for="(example, i) in $textVariables.welcomeScreen.examples.items"
            :key="'ex-' + i"
            :content="example"
        />
      </v-col>

<!--      &lt;!&ndash; Возможности &ndash;&gt;-->
<!--      <v-col cols="12" md="4">-->
<!--        <div class="d-flex flex-column align-center mb-4">-->
<!--          <h3 class="text-subtitle-1 text-medium-emphasis">-->
<!--            {{ $textVariables.welcomeScreen.capabilities.title }}-->
<!--          </h3>-->
<!--        </div>-->
<!--        <WelcomeCard-->
<!--            v-for="(cap, i) in $textVariables.welcomeScreen.capabilities.items"-->
<!--            :key="'cap-' + i"-->
<!--            :content="cap"-->
<!--        />-->
<!--      </v-col>-->

      <!-- Ограничения -->
      <v-col cols="12" md="4">
        <div class="d-flex flex-column align-center mb-4">
          <h3 class="text-subtitle-1 text-medium-emphasis">
            {{ $textVariables.welcomeScreen.limitations.title }}
          </h3>
        </div>
        <WelcomeCard
            v-for="(lim, i) in $textVariables.welcomeScreen.limitations.items"
            :key="'lim-' + i"
            :content="lim"
        />
      </v-col>

      <!-- Готовые промты -->
      <v-col cols="12" md="4">
        <div class="d-flex flex-column align-center mb-4">
          <h3 class="text-subtitle-1 text-medium-emphasis">Готовые промты</h3>
        </div>

        <!-- Топ-2 карточки промтов -->
        <WelcomePromptCard
            v-for="(p, i) in topPrompts"
            :key="'prompt-' + i"
            :title="p.title"
            :full-content="p.full"
            @use="handleUsePrompt"
        />

        <div class="text-center mt-2">
          <v-btn variant="text" color="primary" class="text-none" @click="dialogAll = true">
            Посмотреть все
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Диалог «Все готовые промты» -->
    <PromptsDialog
        v-model="dialogAll"
        :prompts="prompts"
        @use="handleUsePrompt"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import WelcomeCard from '@/components/WelcomeCard.vue'
import WelcomePromptCard from '@/components/WelcomePromptCard.vue'
import PromptsDialog from './PromtsDialog.vue'

const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'ТНЭ чат'
const dialogAll = ref(false)

const prompts = [
  {
    title: 'Деловое письмо клиенту',
    full: `Составь краткое деловое письмо клиенту.
Структура:
1. Вежливое приветствие.
2. Краткая суть сообщения (1–2 предложения).
3. Вежливое завершение и призыв к действию.

Требования:
- Стиль: профессиональный, деловой.
- Без сложных терминов.
- Не более 100 слов.`
  },
  {
    title: 'Объяснение формулы Excel',
    full: `Объясни пошагово, что делает формула:
=VLOOKUP(A2, B2:D100, 3, FALSE)

Формат ответа:
1. Простое объяснение для новичка.
2. Пример с конкретными числами.
3. Возможные ошибки при использовании.

Требования:
- Язык простой, без перегрузки терминами.
- Ответ в 3–5 абзацев.`
  },
  {
    title: 'Редактирование текста по корпоративным стандартам',
    full: `Возьми следующий текст (будет вставлен позже) и перепиши его:
1. Убери лишние детали.
2. Сделай предложения короче (до 15 слов).
3. Используй нейтральный, вежливый тон.
4. Проверь орфографию и пунктуацию.

Формат ответа:
- До и после (2 блока).`
  },
  {
    title: 'Упрощение сложного текста',
    full: `Возьми абзац из сложной статьи и перепиши его так, чтобы он был понятен 12-летнему школьнику.

Требования:
- Используй простые слова и короткие предложения.
- Если есть термины — поясни их.
- Сохрани суть текста.`
  },
  {
    title: 'Проверка и улучшение письма',
    full: `Проанализируй письмо (будет вставлено ниже):
1. Найди ошибки в структуре.
2. Предложи 2–3 улучшения.
3. Перепиши письмо в более ясном и вежливом стиле.

Формат:
- Список найденных проблем.
- Переписанный вариант письма.`
  }
]

const topPrompts = prompts.slice(0, 2)

/** Хэндлер использования (дальше подставишь в редактор/инпут) */
const handleUsePrompt = (content: string) => {
  console.log('Используем промт:', content)
  // TODO: editorRef.value?.setText(content) или emit в родитель
}
</script>

<style scoped>
/* аккуратные отступы и типографика — под стиль проекта */
.text-primary { color: rgb(var(--v-theme-primary)) !important; }
</style>