<template>
  <v-container class="h-100vh">
    <v-row class="fill-height" align-content="center" justify="center">
      <!-- Progress -->
      <v-col cols="12" v-if="verifying" class="text-subtitle-1 text-center" aria-live="polite">
        Verifying your email…
      </v-col>
      <v-col cols="6" v-if="verifying">
        <v-progress-linear
          color="deep-purple-accent-4"
          indeterminate
          rounded
          height="6"
        />
      </v-col>

      <!-- Success -->
      <v-col cols="12" v-if="status === 'success'" class="text-center">
        <h2 class="text-h4">Your email has been verified.</h2>
        <p class="text-subtitle-1">You can now sign in to your account.</p>
        <v-btn color="primary" variant="text" :disabled="verifying" @click="goSignIn">
          Sign in
        </v-btn>
      </v-col>

      <!-- Error -->
      <v-col cols="12" v-if="status === 'error'" class="text-center">
        <h2 class="text-h4">There was an error verifying your email.</h2>
        <p v-if="errorMsg" class="text-subtitle-2 text-red">{{ errorMsg }}</p>
        <v-btn color="primary" variant="text" :disabled="verifying" @click="resend">
          Resend email
        </v-btn>
      </v-col>

      <!-- Missing token -->
      <v-col cols="12" v-if="status === 'missing_token'" class="text-center">
        <h2 class="text-h4">Verification link is invalid.</h2>
        <v-btn color="primary" variant="text" :disabled="verifying" @click="resend">
          Resend email
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import {onMounted, ref} from "vue";
import {useRoute} from "vue-router";
import {navigateTo} from "@/compat/router.js";

// definePageMeta({
//   layout: 'vuetify-app',
//   path: '/account/verify-email/:token',
//   title: 'Verify Email'
// })

const route = useRoute()
const verifying = ref(false)
const status = ref('')
const errorMsg = ref(null)

const verifyEmail = async () => {
  const token = route.params.token
  if (!token || typeof token !== 'string') {
    status.value = 'missing_token'
    return
  }

  verifying.value = true
  errorMsg.value = null
  try {
    const { data, error } = await useFetch('/api/account/verify-email/', {
      method: 'POST',
      body: JSON.stringify({ key: token })
    })

    if (!error.value && data.value?.detail === 'ok') {
      status.value = 'success'
    } else {
      status.value = 'error'
      // покажем деталь, если есть
      errorMsg.value = error.value?.data?.detail || 'Unable to verify email with the provided link.'
    }
  } catch (e) {
    status.value = 'error'
    errorMsg.value = 'Network error. Please try again.'
  } finally {
    verifying.value = false
  }
}

const goSignIn = async () => {
  await navigateTo('/account/signin')
}

const resend = async () => {
  await navigateTo('/account/onboarding?resend=1')
}

onMounted(() => {
  verifyEmail()
})
</script>

<style scoped>
.h-100vh { height: 100vh; }
</style>