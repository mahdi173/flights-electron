<template>
  <v-row>
    <v-col cols="12" class="d-flex justify-end mb-2" v-if="flights.length > 0 && !showRemove">
      <span class="mr-2 text-subtitle-2 align-self-center">Sort by:</span>
      <v-chip-group v-model="sortSelection" selected-class="text-primary" mandatory>
        <v-chip value="cheapest" filter variant="outlined">Cheapest</v-chip>
        <v-chip value="fastest" filter variant="outlined">Fastest</v-chip>
        <v-chip value="best" filter variant="outlined">Best</v-chip>
      </v-chip-group>
    </v-col>

    <v-col v-for="flight in sortedFlights" :key="flight.id" cols="12">
      <v-card elevation="2" class="flight-card">
        <v-row no-gutters align="center">
          <v-col cols="12" md="2" class="pa-4 text-center">
            <div class="text-h6 text-primary">{{ flight.airline }}</div>
            <div class="text-caption">{{ flight.flightNumber }}</div>
          </v-col>

          <v-col cols="12" md="5" class="pa-4">
            <div class="d-flex align-center justify-space-between">
              <div class="text-center">
                <div class="text-h5">{{ flight.departureTime }}</div>
                <div class="text-caption">{{ flight.from }}</div>
              </div>

              <div class="d-flex flex-column align-center flex-grow-1 mx-4">
                <div class="text-caption text-grey mb-1">{{ flight.duration }}</div>
                <div style="width: 100%; height: 2px; background-color: grey; position: relative">
                  <v-icon
                    size="small"
                    color="primary"
                    style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%)"
                  >
                    mdi-airplane
                  </v-icon>
                </div>
                <div class="text-caption text-grey mt-1">{{ flight.stops }}</div>
              </div>

              <div class="text-center">
                <div class="text-h5">{{ flight.arrivalTime }}</div>
                <div class="text-caption">{{ flight.to }}</div>
              </div>
            </div>
            <div class="text-center text-caption mt-1 text-grey">
              {{ flight.date }}
            </div>
          </v-col>

          <v-col cols="12" md="3" class="pa-4 text-center">
            <div class="text-h4 font-weight-bold text-success">${{ flight.price }}</div>
          </v-col>

          <v-col cols="12" md="2" class="pa-4 d-flex flex-column align-center justify-center">
            <v-btn
              :href="flight.link"
              target="_blank"
              color="primary"
              variant="flat"
              block
              class="mb-2"
            >
              Book
            </v-btn>

            <template v-if="showRemove">
              <v-btn
                @click="$emit('remove', flight)"
                color="error"
                variant="text"
                prepend-icon="mdi-delete"
              >
                Remove
              </v-btn>
            </template>

            <template v-else>
              <v-btn
                v-if="allowFavorites && isAuthenticated && !isSaved(flight)"
                @click="$emit('save', flight)"
                color="pink"
                variant="text"
                prepend-icon="mdi-heart-plus"
              >
                Save
              </v-btn>
              <v-chip v-if="isSaved(flight)" color="success" variant="outlined" size="small">
                <v-icon start>mdi-check</v-icon> Saved
              </v-chip>
            </template>
          </v-col>
        </v-row>
      </v-card>
    </v-col>

    <v-col v-if="flights.length === 0" cols="12" class="text-center mt-5">
      <div class="text-h6 text-grey">No flights found</div>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  flights: any[]
  favorites?: any[] // Add favorites prop
  allowFavorites?: boolean
  isAuthenticated?: boolean
  showRemove?: boolean // New prop to enable remove button
}>()

const emit = defineEmits(['save', 'remove'])

const sortSelection = ref('cheapest')

const sortedFlights = computed(() => {
  // If showing favorites or empty, don't sort or just return original
  // But user might want to sort favorites too. Let's allowing sorting always if list > 0
  if (!props.flights || props.flights.length === 0) return []

  const copy = [...props.flights]

  if (sortSelection.value === 'cheapest') {
    return copy.sort((a, b) => a.price - b.price)
  } else if (sortSelection.value === 'fastest') {
    // Parse duration string e.g., "PT2H", but our mock is "2h 00m"
    // Mock duration is like "2h 00m" -> parse hours
    return copy.sort((a, b) => {
      const getDuration = (s: string) => parseInt(s.split('h')[0])
      return getDuration(a.duration) - getDuration(b.duration)
    })
  } else if (sortSelection.value === 'best') {
    // Hybrid: Price + (Duration * 10) ? Just a simple heuristic mock
    return copy.sort((a, b) => {
      const scoreA = a.price + parseInt(a.duration.split('h')[0]) * 20
      const scoreB = b.price + parseInt(b.duration.split('h')[0]) * 20
      return scoreA - scoreB
    })
  }
  return copy
})

function isSaved(flight: any) {
  if (!props.favorites) return false
  return props.favorites.some(
    (f) => f.id === flight.id || (f.date === flight.date && f.flightNumber === flight.flightNumber)
  )
}
</script>

<style scoped>
.flight-card {
  transition: transform 0.2s;
}
.flight-card:hover {
  transform: translateY(-2px);
}
</style>
