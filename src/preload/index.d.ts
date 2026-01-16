import { ElectronAPI } from '@electron-toolkit/preload'

export interface Api {
  getApiStatus: () => Promise<any>
  register: (credentials: any) => Promise<any>
  login: (credentials: any) => Promise<any>
  searchFlights: (params: any) => Promise<any>
  saveFavorite: (data: { userId: number; flight: any }) => Promise<any>
  removeFavorite: (data: { userId: number; flightId: number }) => Promise<any>
  getFavorites: (userId: number) => Promise<any>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
