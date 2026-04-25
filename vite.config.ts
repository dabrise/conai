import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/conai/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
}))
