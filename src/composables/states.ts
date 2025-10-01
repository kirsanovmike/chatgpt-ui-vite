import { ref, type Ref } from 'vue'

export type Conversation = {
  id: number | null
  topic: string | null
  messages: any[]
  loadingMessages: boolean
}

const _apiKey: Ref<string | null> = ref(null)
const _currentModel: Ref<any | null> = ref(null) // если нужно объектом; можно типизировать
const _conversations: Ref<Conversation[]> = ref([])
const _user: Ref<any | null> = ref(null)
const _drawer: Ref<boolean> = ref(false)

export const useApiKey = () => _apiKey
export const useCurrentModel = () => _currentModel
export const useConversations = () => _conversations
export const useUser = () => _user
export const useDrawer = () => _drawer
