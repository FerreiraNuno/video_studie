import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  test: {
    // Pure modules run in node; component tests opt into the DOM with a
    // `// @vitest-environment happy-dom` pragma. The Playwright suite in
    // e2e/ has its own runner.
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
})
