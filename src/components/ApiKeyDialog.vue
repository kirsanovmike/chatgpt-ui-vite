<template>
  <v-dialog
    v-model="dialog"
    persistent
  >
    <template #activator="{ props }">
      <v-list-item
        rounded="xl"
        v-bind="props"
        prepend-icon="vpn_key"
        color="primary"
      >
        Set API key
      </v-list-item>
    </template>

    <v-card>
      <v-card-title>
        <span class="text-h5">OpenAI API key</span>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <div>
          Get a key:
          <a target="_blank" href="https://platform.openai.com/account/api-keys">
            https://platform.openai.com/account/api-keys
          </a>
        </div>

        <div class="mt-5 d-flex align-center">
          <v-text-field
            v-model="apiKey"
            label="API key"
            hide-details
            clearable
            :disabled="!editable"
          />
          <div v-if="editable">
            <v-btn class="ml-3" icon="done" @click="save" />
          </div>
          <div v-else>
            <v-btn class="ml-3" icon="edit" @click="editable = true" />
          </div>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-alert
          v-if="warningText"
          density="compact"
          type="warning"
          :text="warningText"
        />
        <v-spacer />
        <v-btn color="primary" @click="dialog = false">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const dialog = ref(false)
const apiKey = useApiKey()     // оставляю как в проекте (ваш composable)
const editable = ref(false)
const warningText = ref(null)

const showWarning = (text) => {
  warningText.value = text
  setTimeout(() => (warningText.value = null), 3000)
}

const save = async () => {
  // предполагаю, что setApiKey доступен из того же контекста/плагина
  setApiKey(apiKey.value)
  editable.value = false
}
</script>