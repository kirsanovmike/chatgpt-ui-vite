<template>
  <div>
    <v-menu v-model="menu" :close-on-content-click="false">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" icon>
          <v-icon icon="speaker_notes"></v-icon>
        </v-btn>
      </template>

      <v-container>
        <v-card min-width="300" max-width="500">
          <v-card-title>
            <span class="headline">Saved prompts</span>
          </v-card-title>

          <v-divider></v-divider>

          <v-list>
            <v-list-item v-show="loadingPrompts">
              <v-list-item-title class="d-flex justify-center">
                <v-progress-circular indeterminate></v-progress-circular>
              </v-list-item-title>
            </v-list-item>

            <template v-for="(prompt, idx) in prompts" :key="prompt.id">
              <!-- Режим редактирования -->
              <v-list-item
                active-color="primary"
                v-if="editingPrompt && editingPrompt.id === prompt.id"
              >
                <div class="d-flex flex-row" :style="{ marginTop: '5px' }">
                  <div class="flex-grow-1">
                    <v-text-field
                      v-model="editingPrompt.title"
                      :loading="editingPrompt.updating"
                      label="Title"
                      variant="underlined"
                      density="compact"
                      hide-details
                    />
                    <v-textarea
                      rows="2"
                      v-model="editingPrompt.prompt"
                      :loading="editingPrompt.updating"
                      label="Prompt"
                      variant="underlined"
                      density="compact"
                      hide-details
                    />
                  </div>
                  <div>
                    <div class="d-flex flex-column">
                      <v-btn
                        icon="done"
                        variant="text"
                        :loading="editingPrompt.updating"
                        @click="updatePrompt(idx)"
                      />
                      <v-btn
                        icon="close"
                        variant="text"
                        @click="cancelEditPrompt()"
                      />
                    </div>
                  </div>
                </div>
              </v-list-item>

              <!-- Режим просмотра -->
              <v-list-item
                v-else
                rounded="xl"
                active-color="primary"
                @click="selectPrompt(prompt)"
              >
                <v-list-item-title>{{ prompt.title ? prompt.title : prompt.prompt }}</v-list-item-title>
                <template v-slot:append>
                  <v-btn
                    icon="edit"
                    size="small"
                    variant="text"
                    @click.stop="editPrompt(idx)"
                  />
                  <v-btn
                    icon="delete"
                    size="small"
                    variant="text"
                    :loading="deletingPromptIndex === idx"
                    @click.stop="deletePrompt(idx)"
                  />
                </template>
              </v-list-item>
            </template>

            <!-- Новый промпт: заголовок -->
            <v-list-item active-color="primary">
              <div class="pt-3">
                <v-text-field
                  rows="1"
                  v-model="newTitlePrompt"
                  label="Title"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                />
              </div>
            </v-list-item>

            <!-- Новый промпт: текст -->
            <v-list-item active-color="primary">
              <div class="pt-3">
                <v-textarea
                  rows="2"
                  v-model="newPrompt"
                  label="Add a new prompt"
                  variant="outlined"
                  density="compact"
                  :error-messages="promptInputErrorMessage"
                  @update:modelValue="promptInputErrorMessage = ''"
                  clearable
                />
              </div>
            </v-list-item>

            <!-- Кнопка Добавить -->
            <v-list-item>
              <v-btn
                variant="text"
                block
                :loading="submittingNewPrompt"
                @click="addPrompt()"
              >
                <v-icon icon="add"></v-icon>
                Add prompt
              </v-btn>
            </v-list-item>
          </v-list>
        </v-card>
      </v-container>
    </v-menu>
  </div>
</template>

<script setup>
const menu = ref(false)
const prompts = ref([])
const editingPrompt = ref(null)
const newTitlePrompt = ref(null)
const newPrompt = ref('')
const submittingNewPrompt = ref(false)
const promptInputErrorMessage = ref('')
const loadingPrompts = ref(false)
const deletingPromptIndex = ref(null)

const props = defineProps({
  usePrompt: { type: Function, required: true }
})

const addPrompt = async () => {
  const title = newTitlePrompt.value?.trim() || null
  const promptBody = newPrompt.value?.trim() || ''
  if (!promptBody) {
    promptInputErrorMessage.value = 'Please enter a prompt'
    return
  }
  submittingNewPrompt.value = true
  const { data, error } = await useAuthFetch('/api/chat/prompts/', {
    method: 'POST',
    body: JSON.stringify({ title, prompt: promptBody })
  })
  if (!error.value) {
    prompts.value.push(data.value)
    newTitlePrompt.value = null
    newPrompt.value = ''
    promptInputErrorMessage.value = ''
  }
  submittingNewPrompt.value = false
}

const editPrompt = (index) => {
  editingPrompt.value = Object.assign({}, prompts.value[index])
}

const updatePrompt = async (index) => {
  editingPrompt.value.updating = true
  const { data, error } = await useAuthFetch(`/api/chat/prompts/${editingPrompt.value.id}/`, {
    method: 'PUT',
    body: JSON.stringify({
      title: editingPrompt.value.title,
      prompt: editingPrompt.value.prompt
    })
  })
  if (!error.value) {
    prompts.value[index] = editingPrompt.value
  }
  editingPrompt.value.updating = false
  editingPrompt.value = null
}

const cancelEditPrompt = () => {
  editingPrompt.value = null
}

const deletePrompt = async (index) => {
  deletingPromptIndex.value = index
  const { data, error } = await useAuthFetch(`/api/chat/prompts/${prompts.value[index].id}/`, {
    method: 'DELETE'
  })
  deletingPromptIndex.value = null
  if (!error.value) {
    prompts.value.splice(index, 1)
  }
}

const loadPrompts = async () => {
  loadingPrompts.value = true
  const { data, error } = await useAuthFetch('/api/chat/prompts/')
  if (!error.value) {
    prompts.value = data.value
  }
  loadingPrompts.value = false
}

const selectPrompt = (prompt) => {
  props.usePrompt(prompt.prompt)
  menu.value = false
}

onNuxtReady(() => {
  loadPrompts()
})
</script>

<style scoped>
</style>