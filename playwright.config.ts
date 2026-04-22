import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/__tests__/e2e',
  fullyParallel: false, // serial to reuse auth session
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',

  use: {
    // Port 3001 matches the dev server started with: npm run dev -- -p 3001
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Setup project: logs in and saves auth state
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
    },

    // All other E2E tests depend on setup and reuse the saved session
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'src/__tests__/e2e/e2e-auth.json',
      },
      dependencies: ['setup'],
      testIgnore: /global-setup\.ts/,
    },
  ],

  webServer: {
    command: 'npm run dev -- -p 3001',
    url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001',
    // Always reuse the already-running dev server — never try to start a second instance
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
