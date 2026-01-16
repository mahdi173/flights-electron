import { defineStore } from 'pinia'

export const useFlightStore = defineStore('flight', {
  state: () => ({
    results: [] as any[],
    favorites: [] as any[]
  }),
  actions: {
    async search(params) {
      this.results = await window.api.searchFlights(params)
    },
    async saveFavorite(userId, flight) {
      // Deep clone to remove Vue Proxy and ensure serializability for IPC
      const plainFlight = JSON.parse(JSON.stringify(flight))
      const res = await window.api.saveFavorite({ userId, flight: plainFlight })
      if (res.success) {
        await this.loadFavorites(userId)
      }
      return res
    },
    async removeFavorite(userId, flightId) {
      const res = await window.api.removeFavorite({ userId, flightId })
      if (res.success) {
        await this.loadFavorites(userId)
      }
      return res
    },
    async loadFavorites(userId) {
      this.favorites = await window.api.getFavorites(userId)
    }
  }
})
