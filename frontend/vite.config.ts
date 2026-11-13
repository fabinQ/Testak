import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // jsdom: DOMPurify i testy komponentów potrzebują DOM-u
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
