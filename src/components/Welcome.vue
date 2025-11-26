<template>
  <v-container class="py-10">
    <!-- Заголовок -->
    <v-row style="margin-top: 140px;">
      <v-col cols="12">
        <div class="text-center">
          <h2 class="text-h4 text-md-h3 font-weight-medium">
            {{ $textVariables.welcomeTo }} <span class="text-primary">{{ APP_NAME }}</span>
          </h2>
          <p class="text-body-2 text-medium-emphasis mt-4">
            {{ APP_NAME }} помогает вам общаться с большими языковыми моделями
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
      <v-col cols="12" md="4">
        <div class="d-flex flex-column align-center mb-4">
          <h3 class="text-subtitle-1 text-medium-emphasis">
            {{ $textVariables.welcomeScreen.capabilities.title }}
          </h3>
        </div>
        <WelcomeCard
            v-for="(cap, i) in $textVariables.welcomeScreen.capabilities.items"
            :key="'cap-' + i"
            :content="cap"
        />
      </v-col>

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
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import WelcomeCard from '@/components/WelcomeCard.vue'

const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'ТНЭ чат'

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