<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        v-if="messageIcon"
        variant="text"
        class="ma-2"
      >
        <v-icon :icon="messageIcon" />
      </v-btn>
    </template>
    <v-list>
      <v-list-item
        @click="onToggleMessage()"
        title="Toggle"
        :prepend-icon="message.is_disabled ? 'toggle_off' : 'toggle_on'"
      />
    </v-list>
  </v-menu>

  <v-menu>
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        icon
        variant="text"
        class="mx-1 ma-2"
      >
        <v-icon icon="more_horiz" />
      </v-btn>
    </template>

    <v-list>
      <v-list-item
        @click="copyMessage()"
        title="Copy"
        prepend-icon="content_copy"
      />
      <v-list-item
        @click="editMessage()"
        title="Edit"
        prepend-icon="edit"
      />
      <v-list-item
        @click="onDeleteMessage()"
        title="Delete"
        prepend-icon="delete"
      />
    </v-list>
  </v-menu>

  <v-snackbar
    v-model="snackbar"
    location="top"
    timeout="2000"
  >
    {{ snackbarText }}
  </v-snackbar>
</template>

<script setup>
import copy from 'copy-to-clipboard'
import {ref} from "vue";
import {useAuthFetch} from "@/compat/fetch.js";

const props = defineProps({
  message: { type: Object, required: true },
  messageIndex: { type: Number, required: true },
  usePrompt: { type: Function, required: true },
  deleteMessage: { type: Function, required: true },
  toggleMessage: { type: Function, required: true }
})

const snackbar = ref(false)
const snackbarText = ref('')

const showSnackbar = (text) => {
  snackbarText.value = text
  snackbar.value = true
}

const copyMessage = () => {
  copy(props.message?.message ?? '')
  showSnackbar('Copied!')
}

const editMessage = () => {
  props.usePrompt(props.message?.message ?? '')
}

// Переименовано, чтобы не конфликтовать с prop.deleteMessage
const onDeleteMessage = async () => {
  const { error } = await useAuthFetch(`/api/chat/messages/${props.message?.id}/`, {
    method: 'DELETE'
  })
  if (!error.value) {
    props.deleteMessage(props.messageIndex)
    showSnackbar('Deleted!')
  } else {
    showSnackbar('Delete failed')
  }
}

const onToggleMessage = async () => {
  const msg = { ...props.message, is_disabled: !props.message?.is_disabled }
  const { error } = await useAuthFetch(`/api/chat/messages/${props.message?.id}/`, {
    method: 'PUT',
    body: JSON.stringify(msg)
  })
  if (!error.value) {
    props.toggleMessage(props.messageIndex)
  } else {
    showSnackbar('Toggle failed')
  }
}

function selectMessageIcon(message) {
  if (message.is_bot) return ''
  if (message.message_type === 100) return 'travel_explore'
  if (message.message_type === 110) return 'local_library'
  if (message.message_type === 120) return 'article'
  return ''
}

const messageIcon = selectMessageIcon(props.message)
</script>