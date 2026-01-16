import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFlightStore } from '../flight'

describe('Flight Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Mock window.api
    global.window = {
      api: {
        searchFlights: vi.fn(),
        saveFavorite: vi.fn(),
        removeFavorite: vi.fn(),
        getFavorites: vi.fn()
      }
    } as any
  })

  it('initializes with default state', () => {
    const store = useFlightStore()
    expect(store.results).toEqual([])
    expect(store.favorites).toEqual([])
  })

  it('search updates results', async () => {
    const store = useFlightStore()
    const mockResults = [{ id: '1', price: '100' }]
    ;(window.api.searchFlights as any).mockResolvedValue(mockResults)

    await store.search({ origin: 'NYC' })

    expect(window.api.searchFlights).toHaveBeenCalledWith({ origin: 'NYC' })
    expect(store.results).toEqual(mockResults)
  })

  it('saveFavorite calls api and reloads favorites', async () => {
    const store = useFlightStore()
    const mockFavorites = [{ id: '1' }]
    ;(window.api.saveFavorite as any).mockResolvedValue({ success: true })
    ;(window.api.getFavorites as any).mockResolvedValue(mockFavorites)

    const flight = { id: '1' }
    await store.saveFavorite('user123', flight)

    expect(window.api.saveFavorite).toHaveBeenCalledWith({
      userId: 'user123',
      flight: flight
    })
    expect(store.favorites).toEqual(mockFavorites)
  })

  it('removeFavorite calls api and reloads favorites', async () => {
    const store = useFlightStore()
    const mockFavorites = []
    ;(window.api.removeFavorite as any).mockResolvedValue({ success: true })
    ;(window.api.getFavorites as any).mockResolvedValue(mockFavorites)

    await store.removeFavorite('user123', 'flight1')

    expect(window.api.removeFavorite).toHaveBeenCalledWith({
      userId: 'user123',
      flightId: 'flight1'
    })
    expect(store.favorites).toEqual(mockFavorites)
  })

  it('loadFavorites updates state', async () => {
    const store = useFlightStore()
    const mockFavorites = [{ id: '1' }]
    ;(window.api.getFavorites as any).mockResolvedValue(mockFavorites)

    await store.loadFavorites('user123')

    expect(window.api.getFavorites).toHaveBeenCalledWith('user123')
    expect(store.favorites).toEqual(mockFavorites)
  })
})
