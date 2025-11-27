<template>
  <v-icon class="mt-3" :class="additionalClass" icon="mdi-content-copy" size="dense" @click="copyMessage()"/>
  <v-snackbar
      v-model="snackbar"
      location="top"
      timeout="2000"
  >
    {{ snackbarText }}
  </v-snackbar>
</template>

<script setup>
import {ref} from "vue";

const props = defineProps({
  message: {type: Object, required: true},
  additionalClass: {type: String, required: false},
})

const snackbar = ref(false)
const snackbarText = ref('')

const showSnackbar = (text) => {
  snackbarText.value = text
  snackbar.value = true
}

const copyMessage = () => {
  const textToCopy = props.message?.content ?? ''

  // Копирование без дополнительных библиотек
  navigator.clipboard.writeText(textToCopy)
      .then(() => {
        showSnackbar('Скопировано в буфер обмена!')
      })
      .catch(err => {
        console.error('Ошибка копирования: ', err)
        showSnackbar('Ошибка копирования')
      })
}
</script>