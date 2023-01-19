import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": {
        target: process.env.PROXY_BACKEND_URL,
        changeOrigin: true
      }
    }
  }
})
