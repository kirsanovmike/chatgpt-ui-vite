<template>
  <v-app :theme="colorMode.value">
    <slot />
  </v-app>
</template>

<script setup>
const colorMode = useColorMode()
</script>