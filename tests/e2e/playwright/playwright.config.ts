import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for TaskFlow Pro E2E tests.
 *
 * Environment variables:
 *   PLAYWRIGHT_BASE_URL  — frontend base URL (default: http://localhost:5173 for dev, 80 in CI)
 *   BACKEND_URL          — backend base URL  (default: http://localhost:8080)
 */

export default defineConfig({
  testDir: './tests',

  // Run tests in parallel within a file; files run sequentially by default
  fullyParallel: false,
  forbidOnly: !!process.env.CI,

  // Retry once on CI to reduce flakiness from timing issues
  retries: process.env.CI ? 1 : 0,

  // Limit concurrency in CI to avoid resource contention with Docker
  workers: process.env.CI ? 2 : undefined,

  // Reporter: list in dev, HTML in CI (uploaded as artifact)
  reporter: process.env.CI
    ? [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']]
    : [['list']],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',

    // Capture traces on first retry — uploaded as CI artifact on failure
    trace: 'on-first-retry',

    // Screenshot on failure for debugging
    screenshot: 'only-on-failure',

    // Video on first retry
    video: 'on-first-retry',

    // Generous action timeout for CI environments with cold starts
    actionTimeout: 15_000,
  },

  // Run the global setup before any tests (waits for backend health + seeds E2E user)
  globalSetup: './global-setup.ts',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Maximum time one test can run
  timeout: 30_000,

  // Output directory for test artifacts
  outputDir: './test-results',
});
