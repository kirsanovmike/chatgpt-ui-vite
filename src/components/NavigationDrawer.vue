<!-- src/components/NavigationDrawer.vue -->
<template>
  <v-navigation-drawer
      v-model="drawer" :permanent="mdAndUp" width="300"
      color="transparent"
      elevation="0"
      class="app-drawer"
  >
    <!-- user header (можно скрыть если нет user) -->
    <template v-if="user" #prepend>
      <v-list>
        <v-list-item :title="user.username" :subtitle="user.email">
          <template #prepend>
            <v-icon icon="mdi-account" size="x-large" />
          </template>
          <template #append>
            <v-menu>
              <template #activator="{ props }">
                <v-btn v-bind="props" size="small" variant="text" icon="mdi-chevron-down" />
              </template>
              <v-list>
                <v-list-item title="Reset password" to="/account/reset-password" />
                <v-list-item title="Sign out" @click="signOut" />
              </v-list>
            </v-menu>
          </template>
        </v-list-item>
      </v-list>
      <v-divider />
    </template>

    <!-- список диалогов -->
    <div class="px-2">
      <div class="drawer-card glass-card">
        <v-list>
          <v-list-item v-show="loadingConversations">
            <v-list-item-title class="d-flex justify-center">
              <v-progress-circular indeterminate />
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <v-list>
          <template v-for="(c, i) in conversations" :key="c.id ?? i">
            <v-list-item
              rounded="xl"
              active-color="primary"
              :to="c.id ? `/${c.id}` : '/'"
            >
              <v-list-item-title>{{ c.topic && c.topic !== '' ? c.topic : 'Новый чат' }}</v-list-item-title>
            </v-list-item>
          </template>
        </v-list>
      </div>
    </div>

    <template #append>
      <div class="drawer-settings glass-card mx-2 mb-2">
        <v-expansion-panels multiple v-model="open">
          <v-expansion-panel rounded="rounded-pill">
            <v-expansion-panel-title expand-icon="mdi-plus" collapse-icon="mdi-close">
              <v-icon icon="mdi-cog" class="mr-4" /> {{ $textVariables.settings }}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-list density="compact">
                <!-- Theme -->
                <v-menu>
                  <template #activator="{ props }">
                    <v-list-item v-bind="props" rounded="xl" :title="$textVariables.theme">
                      <template #prepend>
                        <v-icon v-if="theme.mode === 'light'" icon="mdi-white-balance-sunny" />
                        <v-icon v-else-if="theme.mode === 'dark'" icon="mdi-weather-night" />
                        <v-icon v-else icon="mdi-theme-light-dark" />
                      </template>
                    </v-list-item>
                  </template>

                  <v-list>
                    <v-list-item v-for="t in themeItems" :key="t.value" @click="theme.setMode(t.value)">
                      <v-list-item-title>{{ t.title }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </template>
  </v-navigation-drawer>

  <!-- Диалог обратной связи -->
  <v-dialog v-model="feedback.dialog" max-width="560">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-message-text-outline" class="mr-3" />
        <span>{{ $textVariables.feedback }}</span>
      </v-card-title>

      <v-progress-linear
        v-if="feedback.loading"
        indeterminate
        class="mb-0"
      />

      <v-card-text class="pt-4">
        <v-alert
          v-if="feedback.error"
          type="error"
          density="comfortable"
          variant="tonal"
          class="mb-3"
        >
          {{ feedback.error }}
        </v-alert>

        <v-textarea
          v-model="feedback.text"
          :label="$textVariables?.yourFeedbackLabel ?? 'Ваш отзыв (до 500 символов)'"
          :placeholder="$textVariables?.yourFeedbackPlaceholder ?? 'Коротко опишите, что понравилось или что стоит улучшить…'"
          rows="4"
          max-rows="10"
          auto-grow
          counter="500"
          :maxlength="500"
          :disabled="feedback.loading"
          variant="outlined"
        />

        <div class="d-flex align-center justify-space-between mt-2">
          <div class="text-caption opacity-70">
            {{ feedbackCharsLeft }} {{ $textVariables?.charactersLeft ?? 'симв. осталось' }}
          </div>

          <!-- можно скрыть рейтинг, если не нужен -->
          <div class="d-flex align-center">
            <span class="text-body-2 mr-2">{{ $textVariables?.rating ?? 'Оценка' }}</span>
            <v-rating
              v-model="feedback.rating"
              length="5"
              size="20"
              :disabled="feedback.loading"
              color="primary"
              density="comfortable"
            />
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn
          variant="text"
          :disabled="feedback.loading"
          @click="closeFeedback"
        >
          {{ $textVariables?.cancel ?? 'Отмена' }}
        </v-btn>

        <v-btn
          color="primary"
          :loading="feedback.loading"
          :disabled="isSubmitDisabled"
          @click="submitFeedback"
        >
          {{ $textVariables?.send ?? 'Отправить' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Snackbar об успехе -->
  <v-snackbar v-model="snackbar.open" :timeout="3000" location="bottom right">
    <v-icon icon="mdi-check-circle-outline" class="mr-2" />
    {{ snackbar.text }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import { useDisplay } from 'vuetify'
import { useConversations, useDrawer, useUser } from '@/composables/states'
import { useThemeMode } from '@/composables/theme'

// достаём appContext для $textVariables
const { appContext } = getCurrentInstance()!
const textVariables = appContext.config.globalProperties.$textVariables

const { mdAndUp } = useDisplay()

// глобальные состояния
const drawer = useDrawer()
const user = useUser()
const conversations = useConversations()

// загрузка заглушек
const loadingConversations = ref(false)
onMounted(async () => {
  loadingConversations.value = false
})

const open = ref(0)

// темы
const theme = useThemeMode()
const themeItems = [
  { title: textVariables.lightMode, value: 'light' as const },
  { title: textVariables.darkMode, value: 'dark' as const },
  { title: textVariables.followSystem, value: 'system' as const }
]

// sign out — потом подключишь бекенд
const signOut = async () => {
  console.log('signOut() clicked')
}

/* ===========================
   Feedback: диалог + мок API
   =========================== */
const feedback = ref({
  dialog: false,
  text: '',
  rating: 0,
  loading: false,
  error: '' as string | null,
})

const snackbar = ref({ open: false, text: '' })

const openFeedback = () => {
  feedback.value.dialog = true
  feedback.value.error = null
}

const closeFeedback = () => {
  if (feedback.value.loading) return
  feedback.value.dialog = false
}

const feedbackTrimmed = computed(() => feedback.value.text.trim())
const isSubmitDisabled = computed(() =>
  feedback.value.loading || feedbackTrimmed.value.length < 3
)
const feedbackCharsLeft = computed(() => 500 - feedback.value.text.length)

// мок апишки
function mockSendFeedback(payload: { message: string; rating: number }) {
  // имитируем сетевую задержку + иногда ошибку
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      // Смоделируй редкую ошибку:
      // if (Math.random() < 0.1) return reject(new Error('Server unavailable'))
      resolve()
    }, 700)
  })
}

async function submitFeedback() {
  feedback.value.loading = true
  feedback.value.error = null
  try {
    await mockSendFeedback({
      message: feedbackTrimmed.value,
      rating: feedback.value.rating,
    })
    feedback.value.loading = false
    feedback.value.dialog = false
    // очистим поле для следующего открытия
    const wasRating = feedback.value.rating
    feedback.value.text = ''
    feedback.value.rating = 0

    snackbar.value.text =
      textVariables?.thanksForFeedback ?? 'Спасибо! Отзыв отправлен.'
    if (wasRating && wasRating <= 3 && textVariables?.weWillImprove) {
      snackbar.value.text += ' ' + textVariables.weWillImprove
    }
    snackbar.value.open = true
  } catch (e: any) {
    feedback.value.loading = false
    feedback.value.error =
      textVariables?.feedbackSendError ?? 'Не удалось отправить отзыв. Попробуйте ещё раз.'
  }
}
</script>

<style>
.v-navigation-drawer__content::-webkit-scrollbar { width: 0; }
.v-navigation-drawer__content:hover::-webkit-scrollbar { width: 6px; }
.v-navigation-drawer__content:hover::-webkit-scrollbar-thumb { background-color: #999; border-radius: 3px; }
</style>
<style scoped>
.app-drawer {
  background: transparent !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.drawer-card,
.drawer-settings {
  border-radius: 18px;
  padding: 8px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1);
}

.drawer-card {
  margin-top: 12px;
}

.drawer-settings {
  margin-top: 8px;
}
</style>
