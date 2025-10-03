<!-- src/components/Welcome.vue -->
<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <div class="text-center">
          <h2 class="text-h2">
            {{ $textVariables.welcomeTo }} <span class="text-primary">{{ APP_NAME }}</span>
          </h2>Ò
          <p class="text-caption my-5">
            {{ APP_NAME }} помогает Вам обзаться с большими языковыми моделями.
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
                  <v-icon icon="sunny" />
                  <h3 class="text-h6"> {{ $textVariables.welcomeScreen.examples.title }}
                  </h3>
                </div>
              </v-col>
            </v-row>
            <WelcomeCard v-for="(example, i) in $textVariables.welcomeScreen.examples.items" :key="'ex-' + i" :content="example" />
          </v-col>

          <!-- Capabilities -->
          <v-col cols="12" md="4">
            <v-row>
              <v-col>
                <div class="d-flex flex-column align-center">
                  <v-icon icon="bolt" />
                  <h3 class="text-h6">{{$textVariables.welcomeScreen.capabilities.title}}</h3>
                </div>
              </v-col>
            </v-row>
            <WelcomeCard v-for="(cap, i) in $textVariables.welcomeScreen.capabilities.items" :key="'cap-' + i" :content="cap" />
          </v-col>

          <!-- Limitations -->
          <v-col cols="12" md="4">
            <v-row>
              <v-col>
                <div class="d-flex flex-column align-center">
                  <v-icon icon="warning_amber" />
                  <h3 class="text-h6">{{$textVariables.welcomeScreen.limitations.title}}</h3>
                </div>
              </v-col>
            </v-row>
            <WelcomeCard v-for="(lim, i) in $textVariables.welcomeScreen.limitations.items" :key="'lim-' + i" :content="lim" />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import WelcomeCard from '@/components/WelcomeCard.vue'

const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'ТНЭ чат'
</script>