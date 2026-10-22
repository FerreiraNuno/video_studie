import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end run of the whole study in a real browser (see e2e/study.spec.ts).
 *
 * The app is pointed at a Supabase URL on the dev server's own origin; the
 * test intercepts every request under it with an in-memory PostgREST, so no
 * data ever reaches the real project and no cleanup is needed. Media files
 * are swapped for sub-second fixtures by request interception.
 */
const PORT = 5174

export default defineConfig({
  testDir: 'e2e',
  timeout: 240_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_API_BACKEND_URL: `http://localhost:${PORT}/supabase`,
      VITE_API_BACKEND_KEY: 'e2e-anon-key',
    },
  },
})
