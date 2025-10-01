<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <div class="text-center">
          <h2 class="text-h2">
            Welcome to <span class="text-primary">{{ runtimeConfig.public.appName }}</span>
          </h2>
          <p class="text-caption my-5">
            {{ runtimeConfig.public.appName }} helps you ask questions, draft content, and explore ideas faster.
            <br />
          </p>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="10" offset-md="1">
        <v-row>
          <!-- Examples -->
          <v-col cols="12" md="4">
            <v-row>
              <v-col>
                <div class="d-flex flex-column align-center">
                  <v-icon icon="sunny"></v-icon>
                  <h3 class="text-h6">Examples</h3>
                </div>
              </v-col>
            </v-row>
            <WelcomeCard v-for="(example, i) in examples" :key="'ex-'+i" :content="example" />
          </v-col>

          <!-- Capabilities -->
          <v-col cols="12" md="4">
            <v-row>
              <v-col>
                <div class="d-flex flex-column align-center">
                  <v-icon icon="bolt"></v-icon>
                  <h3 class="text-h6">Capabilities</h3>
                </div>
              </v-col>
            </v-row>
            <WelcomeCard v-for="(capability, i) in capabilities" :key="'cap-'+i" :content="capability" />
          </v-col>

          <!-- Limitations -->
          <v-col cols="12" md="4">
            <v-row>
              <v-col>
                <div class="d-flex flex-column align-center">
                  <v-icon icon="warning_amber"></v-icon>
                  <h3 class="text-h6">Limitations</h3>
                </div>
              </v-col>
            </v-row>
            <WelcomeCard v-for="(limitation, i) in limitations" :key="'lim-'+i" :content="limitation" />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
const runtimeConfig = useRuntimeConfig()

// Статические строки вместо $i18n.t(...)
const examples = ref([
  '“Summarize this article in 5 bullet points.”',
  '“Draft a polite email to reschedule a meeting.”',
  '“Explain WebSockets to a junior developer with an example.”'
])

const capabilities = ref([
  'Understands follow-ups and keeps context in the current chat.',
  'Can format answers with lists, code blocks, and tables.',
  'Works with math/LaTeX and basic reasoning tasks.'
])

const limitations = ref([
  'May produce inaccuracies — verify important facts.',
  'No real-time browsing unless explicitly enabled in tools.',
  'Does not retain memories across chats unless you add it.'
])
</script>