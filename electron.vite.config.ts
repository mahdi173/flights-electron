import { resolve } from 'path'
import { defineConfig, loadEnv } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const isProd = mode === 'production'

  return {
    main: {
      define: {
        'process.env.MAIN_VITE_AMADEUS_CLIENT_ID': JSON.stringify(env.MAIN_VITE_AMADEUS_CLIENT_ID),
        'process.env.MAIN_VITE_AMADEUS_CLIENT_SECRET': JSON.stringify(
          env.MAIN_VITE_AMADEUS_CLIENT_SECRET
        )
      },
      esbuild: {
        drop: isProd ? ['console', 'debugger'] : []
      }
    },
    preload: {},
    renderer: {
      resolve: {
        alias: {
          '@renderer': resolve('src/renderer/src')
        }
      },
      plugins: [vue(), vuetify({ autoImport: true })],
      esbuild: {
        drop: isProd ? ['console', 'debugger'] : []
      }
    }
  }
})
