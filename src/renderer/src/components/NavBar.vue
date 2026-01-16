<template>
  <v-app-bar app color="primary" dark>
    <v-toolbar-title class="font-weight-bold">
      <v-icon left class="mr-2">mdi-airplane</v-icon>
      Flight Search
    </v-toolbar-title>

    <v-spacer></v-spacer>

    <template v-if="authStore.isAuthenticated">
      <span class="mr-4 text-subtitle-2">Hello, {{ authStore.user.email }}</span>

      <v-btn icon @click="$emit('toggle-favorites')" :color="showFavorites ? 'pink' : ''">
        <v-icon>mdi-heart</v-icon>
      </v-btn>

      <v-btn icon @click="$emit('logout')">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </template>

    <template v-else>
      <v-btn outlined @click="$emit('open-auth')"> Login / Register </v-btn>
    </template>
  </v-app-bar>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth'

defineProps<{ showFavorites: boolean }>()
const authStore = useAuthStore()
</script>
