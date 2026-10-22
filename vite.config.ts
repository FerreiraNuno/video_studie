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
  build: {
    rollupOptions: {
      // Two pages: the study (index.html) and the evaluators' download page.
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        daten: fileURLToPath(new URL('./daten.html', import.meta.url)),
      },
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
