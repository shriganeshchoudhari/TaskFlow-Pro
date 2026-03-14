import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup — runs once before the entire Playwright test suite.
 *
 * Responsibilities:
 *  1. Wait for the backend health endpoint to return {"status":"UP"}
 *     (prevents tests from starting against a cold or not-yet-ready stack)
 *  2. Pre-create the shared E2E test user so Auth tests can rely on it existing
 *
 * Configured via environment variables:
 *   BACKEND_URL   — base URL for the backend API (default: http://localhost:8080)
 *   PLAYWRIGHT_BASE_URL — base URL for the frontend    (default: http://localhost:5173)
 */

const BACKEND_URL  = process.env.BACKEND_URL        ?? 'http://localhost:8080';
const MAX_ATTEMPTS = 30;
const RETRY_DELAY  = 5_000; // ms

const E2E_USER = {
  fullName: 'E2E Test User',
  email:    'e2e-test@taskflow.com',
  password: 'TestPass123!',
};

async function waitForBackend(): Promise<void> {
  const healthUrl = `${BACKEND_URL}/actuator/health`;
  console.log(`[global-setup] Waiting for backend at ${healthUrl} ...`);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(healthUrl, { signal: AbortSignal.timeout(4_000) });
      if (res.ok) {
        const body = await res.json() as { status?: string };
        if (body.status === 'UP') {
          console.log(`[global-setup] Backend is UP (attempt ${attempt})`);
          return;
        }
      }
    } catch {
      // Connection refused or timeout — expected while the service is booting
    }

    if (attempt === MAX_ATTEMPTS) {
      throw new Error(
        `[global-setup] Backend did not become healthy after ${MAX_ATTEMPTS * RETRY_DELAY / 1000}s`
      );
    }

    console.log(`[global-setup] Not ready yet, retrying in ${RETRY_DELAY / 1000}s ... (${attempt}/${MAX_ATTEMPTS})`);
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  }
}

async function seedE2EUser(): Promise<void> {
  const registerUrl = `${BACKEND_URL}/api/v1/auth/register`;
  try {
    const res = await fetch(registerUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(E2E_USER),
      signal:  AbortSignal.timeout(10_000),
    });

    if (res.status === 201) {
      console.log(`[global-setup] E2E test user created: ${E2E_USER.email}`);
    } else if (res.status === 409) {
      console.log(`[global-setup] E2E test user already exists — skipping seed`);
    } else {
      console.warn(`[global-setup] Unexpected status ${res.status} seeding E2E user`);
    }
  } catch (err) {
    console.warn(`[global-setup] Could not seed E2E user: ${err}`);
  }
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  await waitForBackend();
  await seedE2EUser();
  console.log('[global-setup] Done — starting tests');
}
