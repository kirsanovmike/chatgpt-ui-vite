<template>
  <v-app-bar class="ai-app-bar glass-app-bar" flat>
    <div class="d-flex align-center app-bar-left">
      <div class="app-title liquidGlass-wrapper badge-shell px-4 py-2">
        <div class="liquidGlass-effect"></div>
        <div class="liquidGlass-tint"></div>
        <div class="liquidGlass-shine"></div>
        <div class="liquidGlass-text">
          <v-toolbar-title class="text-subtitle-1 text-md-subtitle-1 font-weight-medium">
            {{ navTitle }}
          </v-toolbar-title>
        </div>
      </div>
    </div>

    <div class="d-flex align-center app-bar-right">
      <div id="portal-target" class="ml-3" />

      <div class="liquidGlass-wrapper hoverable badge-shell d-md-none ml-2" @click="createNewConversation">
        <div class="liquidGlass-effect"></div>
        <div class="liquidGlass-tint"></div>
        <div class="liquidGlass-shine"></div>
        <div class="liquidGlass-text">
          <v-btn title="Новый чат" icon="add" variant="text" class="ma-1" />
        </div>
      </div>
      <div class="liquidGlass-wrapper hoverable badge-shell d-none d-md-flex" @click="createNewConversation">
        <div class="liquidGlass-effect"></div>
        <div class="liquidGlass-tint"></div>
        <div class="liquidGlass-shine"></div>
        <div class="liquidGlass-text px-3">
          <v-btn
            variant="text"
            class="text-none new-chat-btn"
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
  </v-main>

  <FloatingDisclaimer />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Welcome from '@/components/Welcome.vue'
import Conversation from '@/components/Conversation.vue'
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
  min-height: 52px;
}

.app-bar-right {
  gap: 12px;
}

.new-chat-btn {
  border-radius: 999px;
  padding-inline: 18px;
}

.badge-shell :deep(.v-btn) {
  min-width: auto;
  padding: 0 10px;
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
</style>