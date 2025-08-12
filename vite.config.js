import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 3000,
    allowedHosts: ['all', 'chatbotfrontend-f1ek.onrender.com', '.onrender.com']
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
