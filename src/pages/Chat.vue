<template>
  <v-app-bar class="ai-app-bar d-flex"
             style="
               border-bottom: 1px solid rgb(var(--v-theme-surface));
               background-color: rgb(var(--v-theme-header-bg));
               box-shadow: 0px 10px 15px rgba(0, 0, 0, 0.05);
             "
  >
    <div class="d-flex align-center">
      <v-app-bar-nav-icon @click="toggleDrawer" />

      <v-toolbar-title>{{ navTitle }}</v-toolbar-title>
    </div>

    <div id="portal-target"></div>

    <v-btn
      title="Новый чат"
      icon="add"
      class="d-md-none ma-3"
      @click="createNewConversation"
    />
    <v-btn
      variant="outlined"
      class="text-none d-none d-md-block"
      @click="createNewConversation"
    >
      {{$textVariables.newConversation}}
    </v-btn>
  </v-app-bar>

  <v-main>
    <Welcome v-if="!route.params.id && (conversation.messages?.length ?? 0) === 0" />
    <Conversation :conversation="conversation" />
  </v-main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Welcome from '@/components/Welcome.vue'
import Conversation from '@/components/Conversation.vue'
import { useDrawer } from '@/composables/states'

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
  conversation.value = { ...getDefaultConversationData(), topic: 'Новый чат' }
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

<style>
/* стили по желанию */
.ai-app-bar.v-toolbar {
  .v-toolbar__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}
</style>