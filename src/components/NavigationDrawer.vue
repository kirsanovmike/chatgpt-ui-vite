<!-- src/components/NavigationDrawer.vue -->
<template>
  <v-navigation-drawer v-model="drawer" :permanent="mdAndUp" width="300">
    <!-- user header (можно скрыть если нет user) -->
    <template v-if="user" #prepend>
      <v-list>
        <v-list-item :title="user.username" :subtitle="user.email">
          <template #prepend>
            <v-icon icon="mdi-account" size="x-large" />
          </template>
          <template #append>
            <v-menu>
              <template #activator="{ props }">
                <v-btn v-bind="props" size="small" variant="text" icon="mdi-chevron-down" />
              </template>
              <v-list>
                <v-list-item title="Reset password" to="/account/reset-password" />
                <v-list-item title="Sign out" @click="signOut" />
              </v-list>
            </v-menu>
          </template>
        </v-list-item>
      </v-list>
      <v-divider />
    </template>

    <!-- список диалогов (заглушки можно убрать) -->
    <div class="px-2">
      <v-list>
        <v-list-item v-show="loadingConversations">
          <v-list-item-title class="d-flex justify-center">
            <v-progress-circular indeterminate />
          </v-list-item-title>
        </v-list-item>
      </v-list>

      <v-list>
        <template v-for="(c, i) in conversations" :key="c.id">
          <v-list-item
            rounded="xl"
            active-color="primary"
            :to="c.id ? `/${c.id}` : '/'"
          >
            <v-list-item-title>{{ c.topic && c.topic !== '' ? c.topic : 'New conversation' }}</v-list-item-title>
          </v-list-item>
        </template>
      </v-list>
    </div>

    <template #append>
      <v-divider />
      <v-expansion-panels>
        <v-expansion-panel rounded="rounded-pill">
          <v-expansion-panel-title expand-icon="mdi-plus" collapse-icon="mdi-close">
            <v-icon icon="mdi-cog" class="mr-4" /> {{$textVariables.settings}}
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list density="compact">
              <!-- Theme -->
              <v-menu>
                <template #activator="{ props }">
                  <v-list-item v-bind="props" rounded="xl" :title="$textVariables.theme">
                    <template #prepend>
                      <v-icon v-if="theme.mode === 'light'" icon="mdi-white-balance-sunny" />
                      <v-icon v-else-if="theme.mode === 'dark'" icon="mdi-weather-night" />
                      <v-icon v-else icon="mdi-theme-light-dark" />
                    </template>
                  </v-list-item>
                </template>

                <v-list>
                  <v-list-item v-for="t in themeItems" :key="t.value" @click="theme.setMode(t.value)">
                    <v-list-item-title>{{ t.title }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>

              <!-- Пример: Параметры модели / API ключ — подключишь когда нужен бек -->
              <!-- <ModelParameters /> -->
              <!-- <ApiKeyDialog /> -->

              <v-list-item rounded="xl" prepend-icon="mdi-help-circle-outline" :title="$textVariables.feedback"
                           @click="window.open('https://github.com/WongSaang/chatgpt-ui/issues','_blank')" />
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDisplay } from 'vuetify'
import { useConversations, useDrawer, useUser } from '@/composables/states'
import { useThemeMode } from '@/composables/theme'
import { getCurrentInstance } from 'vue'

// достаём appContext
const { appContext } = getCurrentInstance()!
const textVariables = appContext.config.globalProperties.$textVariables

const { mdAndUp } = useDisplay()

// глобальные состояния
const drawer = useDrawer()
const user = useUser()
const conversations = useConversations()

// заглушки загрузки
const loadingConversations = ref(false)
onMounted(async () => {
  // тут можешь дернуть загрузку диалогов с бека; сейчас — пусто
  loadingConversations.value = false
})

// темы
const theme = useThemeMode()
const themeItems = [
  { title: textVariables.lightMode, value: 'light' as const },
  { title: textVariables.darkMode, value: 'dark' as const },
  { title: textVariables.followSystem, value: 'system' as const }
]

// sign out — потом подключишь бекенд
const signOut = async () => {
  // await fetch('/api/account/logout/', { method: 'POST' })
  // await logout()
  console.log('signOut() clicked')
}
</script>

<style>
.v-navigation-drawer__content::-webkit-scrollbar { width: 0; }
.v-navigation-drawer__content:hover::-webkit-scrollbar { width: 6px; }
.v-navigation-drawer__content:hover::-webkit-scrollbar-thumb { background-color: #999; border-radius: 3px; }
</style>