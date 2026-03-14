import { FullConfig } from '@playwright/test';

/**
 * Global setup — runs ONCE before the entire Playwright test suite.
 *
 * Responsibilities:
 *  1. Wait for the backend health endpoint to return {"status":"UP"}
 *     (prevents tests starting against a cold or not-yet-ready stack)
 *  2. Ensure the shared E2E test user exists (idempotent — 409 is ignored)
 *  3. Ensure the E2E test user has at least one project and one assigned task
 *     so Dashboard and My Tasks tests see real data, not all-zero widgets
 *
 * Environment variables:
 *   BACKEND_URL          — backend base URL  (default: http://localhost:8080)
 *   PLAYWRIGHT_BASE_URL  — frontend base URL (default: http://localhost:5173)
 */

const BACKEND_URL  = process.env.BACKEND_URL ?? 'http://localhost:8080';
const API          = `${BACKEND_URL}/api/v1`;

const MAX_HEALTH_ATTEMPTS = 30;
const RETRY_DELAY_MS      = 5_000;

const E2E_USER = {
  fullName: 'E2E Test User',
  email:    'e2e-test@taskflow.com',
  password: 'TestPass123!',
};

// ── helpers ──────────────────────────────────────────────────────────────────

async function post(path: string, body: unknown, token?: string): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API}${path}`, {
    method:  'POST',
    headers,
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(10_000),
  });
}

async function get(path: string, token: string): Promise<Response> {
  return fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal:  AbortSignal.timeout(10_000),
  });
}

// ── Step 1: wait for backend ──────────────────────────────────────────────────

async function waitForBackend(): Promise<void> {
  const healthUrl = `${BACKEND_URL}/actuator/health`;
  console.log(`[global-setup] Waiting for backend at ${healthUrl} ...`);

  for (let attempt = 1; attempt <= MAX_HEALTH_ATTEMPTS; attempt++) {
    try {
      const res  = await fetch(healthUrl, { signal: AbortSignal.timeout(4_000) });
      const body = await res.json() as { status?: string };
      if (res.ok && body.status === 'UP') {
        console.log(`[global-setup] Backend is UP (attempt ${attempt})`);
        return;
      }
    } catch {
      // Connection refused or timeout — expected while the service is booting
    }

    if (attempt === MAX_HEALTH_ATTEMPTS) {
      throw new Error(
        `[global-setup] Backend did not become healthy after ${MAX_HEALTH_ATTEMPTS * RETRY_DELAY_MS / 1000}s`
      );
    }
    console.log(`[global-setup] Not ready yet, retrying in ${RETRY_DELAY_MS / 1000}s ... (${attempt}/${MAX_HEALTH_ATTEMPTS})`);
    await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
  }
}

// ── Step 2: ensure E2E user exists ───────────────────────────────────────────

async function ensureE2EUser(): Promise<void> {
  const res = await post('/auth/register', E2E_USER);
  if (res.status === 201)      console.log(`[global-setup] E2E user created: ${E2E_USER.email}`);
  else if (res.status === 409) console.log(`[global-setup] E2E user already exists — skipping`);
  else console.warn(`[global-setup] Unexpected status ${res.status} registering E2E user`);
}

// ── Step 3: login and return access token ────────────────────────────────────

async function loginE2EUser(): Promise<string> {
  const res  = await post('/auth/login', { email: E2E_USER.email, password: E2E_USER.password });
  if (res.status !== 200) throw new Error(`[global-setup] E2E user login failed: ${res.status}`);
  const data = await res.json() as { accessToken: string };
  console.log(`[global-setup] E2E user logged in successfully`);
  return data.accessToken;
}

// ── Step 4: ensure at least one project exists for the E2E user ───────────────

async function ensureE2EProject(token: string): Promise<string> {
  // Check if a project already exists
  const listRes  = await get('/projects?page=0&size=1', token);
  const listData = await listRes.json() as { totalElements?: number; content?: Array<{ id: string }> };

  if ((listData.totalElements ?? 0) > 0 && listData.content?.[0]?.id) {
    const id = listData.content[0].id;
    console.log(`[global-setup] E2E project already exists: ${id}`);
    return id;
  }

  const res  = await post('/projects', {
    name:       'E2E Test Project',
    description:'Created by global-setup for E2E dashboard and task tests',
    visibility: 'PRIVATE',
  }, token);

  if (res.status !== 201) throw new Error(`[global-setup] Failed to create E2E project: ${res.status}`);
  const data = await res.json() as { id: string };
  console.log(`[global-setup] E2E project created: ${data.id}`);
  return data.id;
}

// ── Step 5: ensure at least one task is assigned to the E2E user ──────────────

async function ensureE2ETasks(token: string, projectId: string): Promise<void> {
  // Check if tasks already exist
  const listRes  = await get(`/projects/${projectId}/tasks?page=0&size=1`, token);
  const listData = await listRes.json() as { totalElements?: number };

  if ((listData.totalElements ?? 0) >= 3) {
    console.log(`[global-setup] E2E tasks already exist (${listData.totalElements})`);
    return;
  }

  // Seed 3 tasks in different statuses so My Tasks widget and Board view have data
  const tasks = [
    { title: 'E2E: Setup project structure',   priority: 'HIGH',   status: 'TODO',        dueDate: futureDateStr(2) },
    { title: 'E2E: Implement core features',   priority: 'MEDIUM', status: 'IN_PROGRESS', dueDate: futureDateStr(5) },
    { title: 'E2E: Write unit tests',          priority: 'LOW',    status: 'REVIEW',      dueDate: futureDateStr(7) },
  ];

  for (const t of tasks) {
    const res = await post(`/projects/${projectId}/tasks`, t, token);
    if (res.status === 201) console.log(`[global-setup] E2E task created: "${t.title}"`);
    else console.warn(`[global-setup] Unexpected status ${res.status} creating task "${t.title}"`);
  }
}

function futureDateStr(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// ── Entry point ───────────────────────────────────────────────────────────────

export default async function globalSetup(_config: FullConfig): Promise<void> {
  await waitForBackend();
  await ensureE2EUser();

  const token     = await loginE2EUser();
  const projectId = await ensureE2EProject(token);
  await ensureE2ETasks(token, projectId);

  console.log('[global-setup] Done — starting tests');
}
