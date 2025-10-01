<template>
  <v-dialog
    v-model="dialog"
    fullscreen
    :scrim="false"
    transition="dialog-bottom-transition"
  >
    <template v-slot:activator="{ props }">
      <v-list-item
        v-bind="props"
        rounded="xl"
        prepend-icon="language"
        title="Language"
      ></v-list-item>
    </template>
    <v-card>
      <v-toolbar>
        <v-btn icon @click="dialog = false">
          <v-icon icon="close"></v-icon>
        </v-btn>
        <v-toolbar-title>Language</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-items>
          <v-btn variant="text" @click="dialog = false">
            Save
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>

      <v-list>
        <v-list-item
          v-for="l in locales"
          :key="l.code"
          :title="l.name"
          :append-icon="radioIcon(l.code)"
          @click="updateLocale(l.code)"
        />
      </v-list>
    </v-card>
  </v-dialog>
</template>

<script setup>
const dialog = ref(false)

// Просто статичный список языков
const locales = [
  { code: 'ru', name: 'Русский' },
]

const currentLocale = ref('en')

const updateLocale = (lang) => {
  currentLocale.value = lang
}

const radioIcon = (code) => {
  return code === currentLocale.value
    ? 'radio_button_checked'
    : 'radio_button_unchecked'
}
</script>