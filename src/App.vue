<!-- src/App.vue -->
<template>
  <!-- передаем текущую тему -->
  <v-app :theme="themeName">
    <NavigationDrawer/>
    <router-view/>
  </v-app>


</template>

<script lang="ts" setup>
import { useThemeMode } from '@/composables/theme'
import NavigationDrawer from '@/components/NavigationDrawer.vue'

const { themeName } = useThemeMode()
</script>