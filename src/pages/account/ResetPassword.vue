<template>
  <v-card style="height: 100vh">
    <v-container>
      <v-row>
        <v-col sm="9" offset-sm="1" md="6" offset-md="3">
          <v-card class="mt-15" elevation="0">
            <div class="text-center text-h4">Reset password</div>

            <v-card-text>
              <v-form ref="resetForm">
                <v-text-field
                  v-model="formData.old_password"
                  :rules="formRules.old_password"
                  :error-messages="fieldErrors.old_password"
                  @update:modelValue="handleFieldUpdate('old_password')"
                  label="Current password"
                  variant="underlined"
                  clearable
                />
                <v-text-field
                  v-model="formData.new_password1"
                  :rules="formRules.new_password1"
                  :error-messages="fieldErrors.new_password1"
                  @update:modelValue="handleFieldUpdate('new_password1')"
                  label="New password"
                  variant="underlined"
                  clearable
                />
                <v-text-field
                  v-model="formData.new_password2"
                  :rules="formRules.new_password2"
                  :error-messages="fieldErrors.new_password2"
                  @update:modelValue="handleFieldUpdate('new_password2')"
                  label="Confirm password"
                  variant="underlined"
                  clearable
                />
              </v-form>

              <div v-if="errorMsg" class="text-red">{{ errorMsg }}</div>

              <div class="mt-5 d-flex justify-space-between">
                <v-btn
                  block
                  color="primary"
                  :loading="submitting"
                  @click="submit"
                  size="large"
                >
                  Submit
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-card>

  <v-dialog v-model="successDialog" persistent width="auto">
    <v-card>
      <v-card-title class="text-h5">
        Your password has been reset
      </v-card-title>
      <v-card-text>
        You need to sign in again.
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="green-darken-1" variant="text" @click="signOut">
          OK
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
definePageMeta({
  middleware: ['auth']
})

const formData = ref({
  old_password: '',
  new_password1: '',
  new_password2: ''
})

const formRules = ref({
  old_password: [v => !!v || 'Current password is required'],
  new_password1: [v => !!v || 'New password is required'],
  new_password2: [
    v => !!v || 'Confirm password is required',
    v => v === formData.value.new_password1 || 'Passwords do not match'
  ]
})

const fieldErrors = ref({
  old_password: '',
  new_password1: '',
  new_password2: ''
})

const errorMsg = ref(null)
const resetForm = ref(null)
const submitting = ref(false)
const route = useRoute()

const signOut = async () => {
  const { error } = await useFetch('/api/account/logout/', { method: 'POST' })
  if (!error.value) {
    await logout()
  }
}

const submit = async () => {
  errorMsg.value = null
  const { valid } = await resetForm.value.validate()
  if (!valid) return

  submitting.value = true
  const { error } = await useFetch('/api/account/password/change/', {
    method: 'POST',
    body: JSON.stringify(formData.value)
  })
  submitting.value = false

  if (error.value) {
    if (error.value.statusCode === 400) {
      for (const key in formData.value) {
        if (error.value.data?.[key]) {
          fieldErrors.value[key] = error.value.data[key][0]
        }
      }
      if (error.value.data?.non_field_errors) {
        errorMsg.value = error.value.data.non_field_errors[0]
      }
    } else {
      errorMsg.value = error.value.data?.detail || 'Something went wrong. Please try again.'
    }
  } else {
    successDialog.value = true
  }
}

const handleFieldUpdate = (field) => {
  fieldErrors.value[field] = ''
}

const successDialog = ref(false)
</script>