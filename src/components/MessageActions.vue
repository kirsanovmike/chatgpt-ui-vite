<template>
  <div class="">
<!--    <v-menu>-->
<!--      <template #activator="{ props }">-->
<!--        <v-btn-->
<!--            v-bind="props"-->
<!--            icon-->
<!--            variant="text"-->
<!--            class="mx-1 ma-2"-->
<!--        >-->
<!--          <v-icon icon="mdi-dots-horizontal" />-->
<!--        </v-btn>-->
<!--      </template>-->

<!--      <v-list>-->
<!--        <v-list-item-->
<!--            -->
<!--            title="Копировать"-->
<!--            prepend-icon="mdi-content-copy"-->
<!--        />-->
<!--      </v-list>-->
<!--    </v-menu>-->

    <v-icon @click="copyMessage()" size="dense" icon="mdi-content-copy" />
    <v-snackbar
        v-model="snackbar"
        location="top"
        timeout="2000"
    >
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup>
import {ref} from "vue";

const props = defineProps({
  message: { type: Object, required: true }
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