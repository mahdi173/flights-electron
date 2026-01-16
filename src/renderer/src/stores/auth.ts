import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    isAuthenticated: false
  }),
  actions: {
    async register(email, password) {
      const res = await window.api.register({ email, password })
      if (res.success && res.userId) {
        // Automatically login after register
        return this.login(email, password)
      }
      return res
    },
    async login(email, password) {
      const res = await window.api.login({ email, password })
      if (res.success) {
        this.user = res.user
        this.isAuthenticated = true
      }
      return res
    },
    logout() {
      this.user = null
      this.isAuthenticated = false
    }
  }
})
