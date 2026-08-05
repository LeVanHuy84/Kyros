import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load local environment variables from the monorepo root directory
  const env = loadEnv(mode, path.resolve(import.meta.dirname, '..'), '')
  const apiTarget = env.VITE_API_URL || 'http://localhost:8080'

  const frontendPort = env.FRONTEND_PORT ? parseInt(env.FRONTEND_PORT, 10) : 3000

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})
