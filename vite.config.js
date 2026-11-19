import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const repoSlug = process.env.GITHUB_REPOSITORY?.split('/')?.[1] || 'arza-sport-studio'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? `/${repoSlug}/` : './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    watch: {
      ignored: ['**/rea-captures/**', '**/tools/**'],
    },
  },
})
