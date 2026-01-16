<template>
  <v-app>
    <NavBar
      :showFavorites="showFavorites"
      @open-auth="authDialog = true"
      @toggle-favorites="toggleFavorites"
      @logout="handleLogout"
    />

    <v-main>
      <v-container>
        <div v-if="showFavorites">
          <div class="d-flex align-center mb-4">
            <v-btn icon @click="showFavorites = false" class="mr-4">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <div class="text-h4">Your Favorites</div>
          </div>
          <FlightList
            :flights="flightStore.favorites"
            :isAuthenticated="authStore.isAuthenticated"
            showRemove
            @remove="removeFavorite"
          />
        </div>

        <div v-else>
          <FlightSearch />
          <v-divider class="my-6"></v-divider>
          <FlightList
            :flights="flightStore.results"
            :favorites="flightStore.favorites"
            allowFavorites
            :isAuthenticated="authStore.isAuthenticated"
            @save="saveFavorite"
          />
        </div>
      </v-container>
    </v-main>

    <AuthDialog v-model="authDialog" @login-success="onLoginSuccess" />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from './stores/auth'
import { useFlightStore } from './stores/flight'
import NavBar from './components/NavBar.vue'
import FlightSearch from './components/FlightSearch.vue'
import FlightList from './components/FlightList.vue'
import AuthDialog from './components/AuthDialog.vue'

const authStore = useAuthStore()
const flightStore = useFlightStore()

const authDialog = ref(false)
const showFavorites = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

// Load favorites when authentication state changes to true
watch(
  () => authStore.isAuthenticated,
  async (isAuth) => {
    if (isAuth && authStore.user) {
      await flightStore.loadFavorites(authStore.user.id)
    }
  }
)

function handleLogout() {
  authStore.logout()
  showFavorites.value = false // Redirect to search
}

function onLoginSuccess() {
  authDialog.value = false
  if (authStore.user) {
    flightStore.loadFavorites(authStore.user.id)
  }
}

async function toggleFavorites() {
  if (showFavorites.value) {
    showFavorites.value = false
  } else {
    // Favorites loaded via watch or login, but good to refresh
    if (authStore.user) {
      await flightStore.loadFavorites(authStore.user.id)
    }
    showFavorites.value = true
  }
}

async function saveFavorite(flight: any) {
  if (!authStore.isAuthenticated) {
    authDialog.value = true
    return
  }

  const res = await flightStore.saveFavorite(authStore.user.id, flight)
  if (res.success) {
    snackbar.value = { show: true, text: 'Flight saved to favorites!', color: 'success' }
  } else {
    snackbar.value = { show: true, text: 'Error saving flight: ' + res.error, color: 'error' }
  }
}

async function removeFavorite(flight: any) {
  // flight object now comes from DB (getFavorites) so it has 'dbId' (which we put there in main.ts)
  // or simply 'id' if we trust better-sqlite3 row id mapping.
  // Wait, in main.ts I mapped it: dbId: r.id.
  const res = await flightStore.removeFavorite(authStore.user.id, flight.dbId)
  if (res.success) {
    snackbar.value = { show: true, text: 'Flight removed from favorites.', color: 'info' }
  } else {
    snackbar.value = { show: true, text: 'Error removing flight: ' + res.error, color: 'error' }
  }
}
</script>
