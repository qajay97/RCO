import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !(process.env.CI == null),
  retries: 0,
  reporter: 'html',
  use: {
    baseURL: 'https://deepbluecltd.github.io/RCO/',

    trace: 'on-first-retry',
    headless: true
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
