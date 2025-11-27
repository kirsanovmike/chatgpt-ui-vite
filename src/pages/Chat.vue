<template>
  <v-app-bar class="ai-app-bar d-flex mt-4" style="background-color: transparent">
    <div class="d-flex align-center">
      <div class="liquidGlass-wrapper liquidGlass-wrapper--lg">
        <div class="liquidGlass-effect"></div>
        <div class="liquidGlass-tint"></div>
        <div class="liquidGlass-shine"></div>
        <div class="liquidGlass-text">
          <v-app-bar-nav-icon
              @click="toggleDrawer"/>
          <v-toolbar-title class="pr-4">{{ navTitle }}</v-toolbar-title>
        </div>
      </div>
    </div>
    <div class="d-flex align-center">
      <div class="liquidGlass-wrapper liquidGlass-wrapper--lg" style="min-height: 61px;">
        <div class="liquidGlass-effect"></div>
        <div class="liquidGlass-tint"></div>
        <div class="liquidGlass-shine"></div>
        <div class="liquidGlass-text">
          <div id="portal-target"></div>
        </div>
      </div>
      <div
          class="liquidGlass-wrapper liquidGlass-wrapper--lg liquidGlass-wrapper--new-chat ml-4"
          @click="createNewConversation"
      >
        <div class="liquidGlass-effect"></div>
        <div class="liquidGlass-tint"></div>
        <div class="liquidGlass-shine"></div>
        <div class="liquidGlass-text">
          <!-- мобилка: только плюс -->
          <v-btn
              class="d-md-none appbar-icon-btn"
              icon="add"
              title="Новый чат"
          />
          <!-- десктоп: текстовая кнопка -->
          <v-btn
              class="text-none d-none d-md-block"
          >
            {{ $textVariables.newConversation }}
          </v-btn>
        </div>
      </div>
    </div>
  </v-app-bar>

  <v-main>
    <Welcome v-if="!route.params.id && (conversation.messages?.length ?? 0) === 0"/>
    <Conversation :conversation="conversation"/>
  </v-main>
</template>

<script lang="ts" setup>
import {computed, onMounted, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useDrawer} from '@/composables/states'
import Welcome from '@/components/Welcome.vue'
import Conversation from '@/components/Conversation.vue'

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
const toggleDrawer = () => {
  drawer.value = !drawer.value
}

const createNewConversation = () => {
  if (route.path !== '/') {
    router.push({path: '/', query: {new: '1'}})
    return
  }
  conversation.value = {...getDefaultConversationData(), topic: 'ТНЭ чат'}
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
    () => ({path: route.path, q: route.query}),
    ({path, q}) => {
      if (path === '/' && q?.new !== undefined) {
        createNewConversation()
      }
    },
    {immediate: true}
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
/* Общие настройки app-bar */
.ai-app-bar.v-toolbar {
  /* отступы слева/справа у всего бара */
  padding-left: 16px;
  padding-right: 16px;
}

/* Контейнер контента внутри app-bar */
.ai-app-bar .v-toolbar__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px; /* расстояние между стеклянными блоками */
}

/* Чтоб стеклянные «пилюли» не липли к краю контента */
.ai-app-bar .liquidGlass-wrapper {
  margin-inline: 4px;
}
</style>