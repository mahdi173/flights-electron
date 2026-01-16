<template>
  <v-card class="mb-6 pa-4" elevation="4">
    <v-alert
      v-if="apiStatus.health !== 'ok' && apiStatus.health !== 'no-keys'"
      type="warning"
      variant="tonal"
      class="mb-4"
      density="compact"
    >
      <div class="d-flex align-center">
        <v-icon start>mdi-clock-outline</v-icon>
        <div>
          <strong>API Activation Pending:</strong> Your keys are correct, but Amadeus is still
          activating them.
          <div class="text-caption">Error: {{ apiStatus.health }} (Wait ~30min)</div>
        </div>
      </div>
    </v-alert>

    <v-alert
      :type="apiStatus.realData ? 'success' : 'info'"
      variant="tonal"
      class="mb-6"
      density="compact"
      v-else
    >
      {{ apiStatus.realData ? 'Real-time Mode (Amadeus)' : 'Demo Mode (Mock Simulation)' }}
    </v-alert>
    <v-card-title class="text-h5 mb-4">Find your next destination</v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="from"
            label="From (e.g., BOD)"
            hint="Use 3-letter IATA codes for real data"
            persistent-hint
            prepend-inner-icon="mdi-airplane-takeoff"
            variant="outlined"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="to"
            label="To (e.g., LIL)"
            hint="Use 3-letter IATA codes for real data"
            persistent-hint
            prepend-inner-icon="mdi-airplane-landing"
            variant="outlined"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="date"
            label="Date"
            type="date"
            prepend-inner-icon="mdi-calendar"
            variant="outlined"
          ></v-text-field>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        size="large"
        @click="search"
        :loading="loading"
        prepend-icon="mdi-magnify"
      >
        Search Flights
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFlightStore } from '../stores/flight'

const from = ref('')
const to = ref('')
const date = ref(new Date().toISOString().substr(0, 10))
const loading = ref(false)
const apiStatus = ref({ realData: false, provider: 'Mock', health: 'pending' })

const flightStore = useFlightStore()

onMounted(async () => {
  apiStatus.value = await window.api.getApiStatus()
  // Refresh status every 10 seconds during the activation period
  const interval = setInterval(async () => {
    const status = await window.api.getApiStatus()
    apiStatus.value = status
    if (status.health === 'ok') clearInterval(interval)
  }, 10000)
})

async function search() {
  loading.value = true
  await flightStore.search({ from: from.value, to: to.value, date: date.value })
  loading.value = false
}
</script>
