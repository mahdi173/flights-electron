import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
console.log('Preload script running...')
const api = {
  getApiStatus: (): Promise<any> => ipcRenderer.invoke('app:getApiStatus'),
  register: (credentials): Promise<any> => ipcRenderer.invoke('auth:register', credentials),
  login: (credentials): Promise<any> => ipcRenderer.invoke('auth:login', credentials),
  searchFlights: (params): Promise<any> => ipcRenderer.invoke('flights:search', params),
  saveFavorite: (data): Promise<any> => ipcRenderer.invoke('flights:saveFavorite', data),
  removeFavorite: (data): Promise<any> => ipcRenderer.invoke('flights:removeFavorite', data),
  getFavorites: (userId): Promise<any> => ipcRenderer.invoke('flights:getFavorites', userId)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
