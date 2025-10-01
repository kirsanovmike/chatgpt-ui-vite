<template>
  <v-navigation-drawer
    v-model="drawer"
    :permanent="drawerPermanent"
    width="300"
  >
    <template v-slot:prepend v-if="user">
      <v-list>
        <v-list-item
          :title="user.username"
          :subtitle="user.email"
        >
          <template v-slot:prepend>
            <v-icon icon="face" size="x-large"></v-icon>
          </template>
          <template v-slot:append>
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="small"
                  variant="text"
                  icon="expand_more"
                ></v-btn>
              </template>
              <v-list>
                <v-list-item
                  title="Reset password"
                  to="/account/resetPassword"
                />
                <v-list-item
                  title="Sign out"
                  @click="signOut"
                />
              </v-list>
            </v-menu>
          </template>
        </v-list-item>
      </v-list>

      <v-divider></v-divider>
    </template>

    <div class="px-2">
      <v-list>
        <v-list-item v-show="loadingConversations">
          <v-list-item-title class="d-flex justify-center">
            <v-progress-circular indeterminate></v-progress-circular>
          </v-list-item-title>
        </v-list-item>
      </v-list>

      <v-list>
        <template
          v-for="(conversation, cIdx) in conversations"
          :key="conversation.id"
        >
          <v-list-item
            active-color="primary"
            rounded="xl"
            v-if="editingConversation && editingConversation.id === conversation.id"
          >
            <v-text-field
              v-model="editingConversation.topic"
              :loading="editingConversation.updating"
              variant="underlined"
              append-icon="done"
              hide-details
              density="compact"
              autofocus
              @keyup.enter="updateConversation(cIdx)"
              @click:append="updateConversation(cIdx)"
            ></v-text-field>
          </v-list-item>

          <v-hover
            v-else
            v-slot="{ isHovering, props }"
          >
            <v-list-item
              rounded="xl"
              active-color="primary"
              :to="conversation.id ? `/${conversation.id}` : '/'"
              v-bind="props"
            >
              <v-list-item-title>
                {{ (conversation.topic && conversation.topic !== '') ? conversation.topic : 'New conversation' }}
              </v-list-item-title>

              <template v-slot:append>
                <div v-show="isHovering && conversation.id">
                  <v-btn
                    icon="edit"
                    size="small"
                    variant="text"
                    @click.prevent="editConversation(cIdx)"
                  />
                  <v-btn
                    icon="delete"
                    size="small"
                    variant="text"
                    :loading="deletingConversationIndex === cIdx"
                    @click.prevent="deleteConversation(cIdx)"
                  />
                  <v-btn
                    icon="download"
                    size="small"
                    variant="text"
                    @click.prevent="exportConversation(cIdx)"
                  />
                </div>
              </template>
            </v-list-item>
          </v-hover>
        </template>
      </v-list>
    </div>

    <template v-slot:append>
      <v-divider></v-divider>

      <v-expansion-panels style="flex-direction: column;">
        <v-expansion-panel rounded="rounded-pill">
          <v-expansion-panel-title expand-icon="add" collapse-icon="close">
            <v-icon icon="settings" class="mr-4"></v-icon> Settings
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <div class="px-1">
              <v-list density="compact">
                <!-- Clear all -->
                <v-dialog v-model="clearConfirmDialog" persistent>
                  <template v-slot:activator="{ props }">
                    <v-list-item
                      v-bind="props"
                      rounded="xl"
                      prepend-icon="delete_forever"
                      title="Clear conversations"
                    />
                  </template>

                  <v-card>
                    <v-card-title class="text-h5">
                      Are you sure you want to delete all conversations?
                    </v-card-title>
                    <v-card-text>
                      This will be a permanent deletion and cannot be retrieved once deleted. Please proceed with caution.
                    </v-card-text>
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn
                        color="green-darken-1"
                        variant="text"
                        @click="clearConfirmDialog = false"
                        class="text-none"
                      >
                        Cancel deletion
                      </v-btn>
                      <v-btn
                        color="green-darken-1"
                        variant="text"
                        @click="clearConversations"
                        class="text-none"
                        :loading="deletingConversations"
                      >
                        Confirm deletion
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>

                <!-- Import -->
                <v-list-item
                  rounded="xl"
                  prepend-icon="input"
                  title="Import conversations"
                  @click="openImportFileChooser()"
                />

                <!-- API key (conditional) -->
                <ApiKeyDialog v-if="$settings.open_api_key_setting === 'True'" />

                <!-- Model parameters -->
                <ModelParameters/>

                <!-- Theme -->
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-list-item
                      v-bind="props"
                      rounded="xl"
                      title="Theme"
                    >
                      <template v-slot:prepend>
                        <v-icon
                          v-show="colorMode.value === 'light'"
                          icon="light_mode"
                        />
                        <v-icon
                          v-show="colorMode.value !== 'light'"
                          icon="dark_mode"
                        />
                      </template>
                    </v-list-item>
                  </template>

                  <v-list bg-color="white">
                    <v-list-item
                      v-for="(theme, idx) in themes"
                      :key="idx"
                      @click="setTheme(theme.value)"
                    >
                      <v-list-item-title>{{ theme.title }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>

                <!-- Languages selector can stay (now cosmetic/static if i18n removed) -->
                <SettingsLanguages/>

                <!-- Feedback -->
                <v-list-item
                  rounded="xl"
                  prepend-icon="help_outline"
                  title="Feedback"
                  @click="feedback"
                />
              </v-list>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>
  </v-navigation-drawer>

  <v-snackbar v-model="snackbar" multi-line location="top">
    {{ snackbarText }}
    <template v-slot:actions>
      <v-btn color="red" variant="text" @click="snackbar = false" density="compact" size="default">
        Close
      </v-btn>
    </template>
  </v-snackbar>

  <input
    type="file"
    id="import_conversation_input"
    style="display:none"
    accept="text/plain, text/json"
    multiple
    @change="importConversation"
  >
</template>

<script setup>
import { useDisplay } from 'vuetify'
import { useDrawer } from '../composables/states'

const route = useRoute()
const { $settings } = useNuxtApp()
const colorMode = useColorMode()
const { mdAndUp } = useDisplay()

const drawerPermanent = computed(() => mdAndUp.value)
const user = useUser()

// статические темы без i18n
const themes = ref([
  { title: 'Light mode', value: 'light' },
  { title: 'Dark mode', value: 'dark' },
  { title: 'Follow system', value: 'system' }
])

const setTheme = (theme) => {
  colorMode.preference = theme
}

const feedback = () => {
  window.open('https://github.com/WongSaang/chatgpt-ui/issues', '_blank')
}

// Удалены useI18n/locale; SettingsLanguages может оставаться как визуальный переключатель, если нужно

const conversations = useConversations()
const editingConversation = ref(false)
const deletingConversationIndex = ref(null)

const editConversation = (index) => {
  editingConversation.value = conversations.value[index]
}

const updateConversation = async (index) => {
  editingConversation.value.updating = true
  const { data, error } = await useAuthFetch(`/api/chat/conversations/${editingConversation.value.id}/`, {
    method: 'PUT',
    body: JSON.stringify({ topic: editingConversation.value.topic })
  })
  if (!error.value) {
    editingConversation.value.updating = false
    conversations.value[index] = editingConversation.value
  }
  conversations.value[index].updating = false
  editingConversation.value = false
}

const deleteConversation = async (index) => {
  deletingConversationIndex.value = index
  const { data, error } = await useAuthFetch(`/api/chat/conversations/${conversations.value[index].id}/`, {
    method: 'DELETE'
  })
  deletingConversationIndex.value = null
  if (!error.value) {
    const deletingConversation = conversations.value[index]
    conversations.value.splice(index, 1)
    if (route.params.id && parseInt(route.params.id) === deletingConversation.id) {
      await navigateTo('/')
    }
  }
}

const snackbar = ref(false)
const snackbarText = ref('')
const showSnackbar = (text) => {
  snackbarText.value = text
  snackbar.value = true
}

const loadMessage = async (conversation_id) => {
  const { data, error } = await useAuthFetch(`/api/chat/messages/?conversationId=${conversation_id}`)
  if (!error.value) return data.value
  return error.value
}

const exportConversation = async (index) => {
  const conversation = conversations.value[index]
  const data = { conversation_topic: conversation.topic, messages: [] }

  const messages = await loadMessage(conversation.id)
  for (const message of messages) {
    data.messages.push({
      role: message.is_bot ? 'assistant' : 'user',
      content: message.message
    })
  }

  const file_content = JSON.stringify(data)
  const file_name = `${conversation.topic}_${new Date()}`.replace(/[\/\\:*?"<>]/g, '_')

  const element = document.createElement('a')
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(file_content))
  element.setAttribute('download', file_name)
  element.style.display = 'none'
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

const openImportFileChooser = async () => {
  const input_element = document.getElementById('import_conversation_input')
  input_element?.click()
}

const importConversation = async () => {
  const input_element = document.getElementById('import_conversation_input')
  const fileHandles = input_element?.files
  const imports = []
  const reader = new FileReader()

  for (const handle of fileHandles ?? []) {
    const content = await new Promise((resolve, reject) => {
      reader.readAsText(handle)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (eror) => reject(eror)
    })
    const json = JSON.parse(content)
    imports.push(json)
  }

  try {
    const { data, error } = await useAuthFetch('/api/upload_conversations/', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imports })
    })
    if (!error.value) {
      // const new_conversation_ids = data.value
      loadConversations()
    } else {
      console.log(error.value)
      showSnackbar(error.value?.message ?? 'Import failed')
    }
  } catch (err) {
    console.log(err?.message)
    showSnackbar(err?.message ?? 'Import failed')
  }
}

const clearConversations = async () => {
  deletingConversations.value = true
  const { data, error } = await useAuthFetch(`/api/chat/conversations/delete_all`, {
    method: 'DELETE'
  })
  if (!error.value) {
    loadConversations()
    clearConfirmDialog.value = false
  }
  deletingConversations.value = false
}

const clearConfirmDialog = ref(false)
const deletingConversations = ref(false)
const loadingConversations = ref(false)

const loadConversations = async () => {
  loadingConversations.value = true
  conversations.value = await getConversations()
  loadingConversations.value = false
}

const signOut = async () => {
  const { data, error } = await useFetch('/api/account/logout/', { method: 'POST' })
  if (!error.value) await logout()
}

onNuxtReady(async () => {
  loadConversations()
})

const drawer = useDrawer()
</script>

<style>
.v-navigation-drawer__content::-webkit-scrollbar {
  width: 0;
}
.v-navigation-drawer__content:hover::-webkit-scrollbar {
  width: 6px;
}
.v-navigation-drawer__content:hover::-webkit-scrollbar-thumb {
  background-color: #999;
  border-radius: 3px;
}
</style>