import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/signup': 'http://localhost:3000',
      '/user': 'http://localhost:3000',
      '/police': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
    }
  }
})
