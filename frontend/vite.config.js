import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['leaflet.heat'],
  },
  server: {
    host: true,
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    proxy: {
      '/api': 'http://localhost:5000',
      '/signup': 'http://localhost:5000',
      '/user/login': 'http://localhost:5000',
      '/police/login': 'http://localhost:5000',
      '/auth': 'http://localhost:5000',
      '/sos': 'http://localhost:5000',
    }
  }
})
