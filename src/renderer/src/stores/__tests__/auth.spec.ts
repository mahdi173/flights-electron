import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Mock window.api
    global.window = {
      api: {
        register: vi.fn(),
        login: vi.fn()
      }
    } as any
  })

  it('initializes with default state', () => {
    const store = useAuthStore()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('login updates state on success', async () => {
    const store = useAuthStore()
    const mockUser = { id: 1, email: 'test@example.com' }
    ;(window.api.login as any).mockResolvedValue({ success: true, user: mockUser })

    const result = await store.login('test@example.com', 'password')

    expect(result.success).toBe(true)
    expect(store.user).toEqual(mockUser)
    expect(store.isAuthenticated).toBe(true)
  })

  it('register calls login on success', async () => {
    const store = useAuthStore()
    const mockUser = { id: 1, email: 'test@example.com' }
    ;(window.api.register as any).mockResolvedValue({ success: true, userId: 1 })
    ;(window.api.login as any).mockResolvedValue({ success: true, user: mockUser })

    const result = await store.register('test@example.com', 'password')

    expect(window.api.register).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    })
    expect(store.user).toEqual(mockUser)
    expect(store.isAuthenticated).toBe(true)
  })

  it('logout resets state', () => {
    const store = useAuthStore()
    store.user = { id: 1 }
    store.isAuthenticated = true

    store.logout()

    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })
})
