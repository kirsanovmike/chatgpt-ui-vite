<template>
  <v-app-bar class="ai-app-bar" flat>
    <div class="d-flex align-center app-bar-left">
      <!-- Бургер -->
      <div class="liquidGlass-wrapper liquidGlass-chip app-bar-nav-shell">
        <div class="liquidGlass-effect"></div>
        <div class="liquidGlass-tint"></div>
        <div class="liquidGlass-shine"></div>
        <div class="liquidGlass-text app-bar-nav-inner">
          <v-app-bar-nav-icon class="app-bar-nav" @click="toggleDrawer" />
        </div>
      </div>

      <!-- Заголовок -->
      <div class="liquidGlass-wrapper liquidGlass-chip app-title">
        <div class="liquidGlass-effect"></div>
        <div class="liquidGlass-tint"></div>
        <div class="liquidGlass-shine"></div>
        <div class="liquidGlass-text app-title__inner">
          <v-toolbar-title class="text-subtitle-1 text-md-subtitle-1 font-weight-medium">
            {{ navTitle }}
          </v-toolbar-title>
        </div>
      </div>
    </div>

    <div class="d-flex align-center app-bar-right">
      <!-- Портал под селект моделей -->
      <div class="liquidGlass-wrapper liquidGlass-chip portal-shell ml-3">
        <div class="liquidGlass-effect"></div>
        <div class="liquidGlass-tint"></div>
        <div class="liquidGlass-shine"></div>
        <div class="liquidGlass-text portal-shell__content" id="portal-target"></div>
      </div>

      <!-- Кнопка "Новый чат" (иконка, мобилка) -->
      <div class="liquidGlass-wrapper liquidGlass-chip d-md-none ma-3 new-chat-icon-shell">
        <div class="liquidGlass-effect"></div>
        <div class="liquidGlass-tint"></div>
        <div class="liquidGlass-shine"></div>
        <div class="liquidGlass-text">
          <v-btn
              title="Новый чат"
              icon="add"
              class="new-chat-icon-btn"
              @click="createNewConversation"
          />
        </div>
      </div>

      <!-- Кнопка "Новый чат" (текст, десктоп) -->
      <div class="liquidGlass-wrapper liquidGlass-chip d-none d-md-inline-flex new-chat-btn-shell">
        <div class="liquidGlass-effect"></div>
        <div class="liquidGlass-tint"></div>
        <div class="liquidGlass-shine"></div>
        <div class="liquidGlass-text">
          <v-btn
              variant="text"
              class="text-none new-chat-btn"
              @click="createNewConversation"
          >
            {{$textVariables.newConversation}}
          </v-btn>
        </div>
      </div>
    </div>
  </v-app-bar>

  <v-main>
    <Welcome v-if="!route.params.id && (conversation.messages?.length ?? 0) === 0" />
    <Conversation :conversation="conversation" />
    <FloatingDisclaimer />
  </v-main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Welcome from '@/components/Welcome.vue'
import Conversation from '@/components/Conversation.vue'
import { useDrawer } from '@/composables/states'
import FloatingDisclaimer from '@/components/FloatingDisclaimer.vue'

// ===== Типы =====
type ChatMessage = {
  id?: number | string
  is_bot?: boolean
  is_disabled?: boolean
  message: string
}
type ConversationT = {
  id: number | string | null
  topic: string | null
  messages: ChatMessage[]
  loadingMessages: boolean
}

// ===== Константы / helpers =====
const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'ТНЭ чат'
const getDefaultConversationData = (): ConversationT => ({
  id: null,
  topic: null,
  messages: [],
  loadingMessages: false
})

// ===== Состояние / роутер =====
const drawer = useDrawer()
const route = useRoute()
const router = useRouter()
const conversation = ref<ConversationT>(getDefaultConversationData())

// ===== Заглушки вместо API (раскомментируешь позже) =====
const loadConversation = async () => {
  // const { data, error } = await useAuthFetch(`/api/chat/conversations/${route.params.id}`)
  // if (!error.value) conversation.value = Object.assign(conversation.value, data.value)
}
const loadMessage = async () => {
  // const { data, error } = await useAuthFetch(`/api/chat/messages/?conversationId=${route.params.id}`)
  // if (!error.value) {
  //   conversation.value.messages = data.value
  //   conversation.value.id = route.params.id as string
  // }
}

// ===== UI-экшены =====
const toggleDrawer = () => { drawer.value = !drawer.value }

const createNewConversation = () => {
  if (route.path !== '/') {
    router.push({ path: '/', query: { new: '1' } })
    return
  }
  conversation.value = { ...getDefaultConversationData() }
}

// ===== Жизненный цикл / реактивность =====
onMounted(async () => {
  if (route.params.id) {
    conversation.value.loadingMessages = true
    await loadConversation()
    await loadMessage()
    conversation.value.loadingMessages = false
  }
})

// реагируем на смену :id?
watch(
  () => route.params.id,
  async (id) => {
    if (id) {
      conversation.value.loadingMessages = true
      await loadConversation()
      await loadMessage()
      conversation.value.loadingMessages = false
    }
  }
)

// обрабатываем ?new на главной (аналог onActivated из Nuxt)
watch(
  () => ({ path: route.path, q: route.query }),
  ({ path, q }) => {
    if (path === '/' && q?.new !== undefined) {
      createNewConversation()
    }
  },
  { immediate: true }
)

// ===== Заголовок =====
const navTitle = computed(() => {
  const topic = conversation.value.topic
  if (topic !== null && topic !== undefined) {
    return topic === '' ? 'Новый чат' : topic
  }
  return APP_NAME
})
</script>

<style scoped>
.ai-app-bar {
  background: transparent !important;
  box-shadow: none;
  padding: 12px 16px;
}

.ai-app-bar :deep(.v-toolbar__content) {
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.app-title {
  border-radius: 999px;
  min-height: 44px;
}

.app-bar-nav {
  border-radius: 50%;
  width: 44px;
  height: 44px;
}

.app-bar-right {
  gap: 12px;
}

.new-chat-btn {
  border-radius: 999px;
  padding-inline: 18px;
}

:global(.floating-disclaimer) {
  --disclaimer-offset: 104px;
  --disclaimer-offset-mobile: 140px;
}

@media (max-width: 960px) {
  .ai-app-bar {
    padding-inline: 8px;
  }

  .app-title {
    padding-inline: 14px;
  }
}

.ai-app-bar {
  background: transparent !important;
  box-shadow: none;
  padding: 12px 16px;
}

.ai-app-bar :deep(.v-toolbar__content) {
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* Общий чип для шапки — одна высота для всех */
.liquidGlass-chip {
  min-height: 44px;
  border-radius: 999px;
  display: flex;
  align-items: center;
}

/* Навигация */
.app-bar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-bar-nav-shell {
  width: 44px;
  flex: 0 0 auto;
}

.app-bar-nav-inner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-bar-nav {
  width: 32px;
  height: 32px;
}

/* Заголовок */
.app-title {
  flex: 0 0 auto;
}

.app-title__inner {
  padding: 0 14px;
  display: flex;
  align-items: center;
}

/* Правый блок */
.app-bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Портал под селект моделей */
.portal-shell {
  min-width: 240px;
}

.portal-shell__content {
  display: flex;
  align-items: center;
}

/* Кнопки "Новый чат" */
.new-chat-icon-shell,
.new-chat-btn-shell {
  flex: 0 0 auto;
}

.new-chat-icon-btn {
  width: 32px;
  height: 32px;
  min-width: 32px;
}

.new-chat-btn {
  border-radius: 999px;
  padding-inline: 18px;
  min-height: 32px;
}

/* Чтоб старый стеклянный фон не конфликтовал внутри liquidGlass */
.liquidGlass-wrapper :deep(.glass-card),
.liquidGlass-wrapper :deep(.glass-chip) {
  background: transparent;
  box-shadow: none;
  border: none;
}

/* Дисклеймер как был */
:global(.floating-disclaimer) {
  --disclaimer-offset: 104px;
  --disclaimer-offset-mobile: 140px;
}

@media (max-width: 960px) {
  .ai-app-bar {
    padding-inline: 8px;
  }

  .app-title__inner {
    padding-inline: 14px;
  }

  .portal-shell {
    display: none; /* если селект в портале не нужен на мобилке — опционально */
  }
}
</style>