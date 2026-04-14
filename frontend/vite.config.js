import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5173',
      '/signup': 'http://localhost:5173',
      '/user': 'http://localhost:5173',
      '/police': 'http://localhost:5173',
      '/auth': 'http://localhost:5173',
    }
  }
})
