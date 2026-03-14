/**
 * PT-K6-01 — Smoke Test
 * 5 VUs · 30 seconds · runs on EVERY pull request
 *
 * Purpose: verify the API is reachable and the core happy paths work
 * before any heavier test runs. A smoke failure means "don't merge".
 *
 * Run: k6 run smoke.js --env BASE_URL=http://localhost:8080
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SMOKE_THRESHOLDS, BASE_URL } from './config/thresholds.js';

export const options = {
  vus:        5,
  duration:   '30s',
  thresholds: SMOKE_THRESHOLDS,
};

// ── Setup: register + login a smoke user ──────────────────────────────────────
export function setup() {
  const headers = { 'Content-Type': 'application/json' };

  // Register (idempotent — ignore 409)
  http.post(`${BASE_URL}/api/v1/auth/register`, JSON.stringify({
    fullName: 'Smoke User',
    email:    'smoke@perf.test',
    password: 'SmokePass123!',
  }), { headers });

  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email:    'smoke@perf.test',
    password: 'SmokePass123!',
  }), { headers });

  check(loginRes, { 'smoke login 200': r => r.status === 200 });
  return { token: loginRes.json('accessToken') };
}

// ── Default: minimal critical path ───────────────────────────────────────────
export default function (data) {
  const headers = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // 1. Health
  const health = http.get(`${BASE_URL}/actuator/health`);
  check(health, { 'health UP': r => r.status === 200 && r.json('status') === 'UP' });

  // 2. List projects
  const projects = http.get(`${BASE_URL}/api/v1/projects`, { headers });
  check(projects, { 'projects 200': r => r.status === 200 });

  // 3. My tasks
  const tasks = http.get(`${BASE_URL}/api/v1/tasks/my-tasks`, { headers });
  check(tasks, { 'my-tasks 200': r => r.status === 200 });

  // 4. Notifications
  const notifs = http.get(`${BASE_URL}/api/v1/notifications`, { headers });
  check(notifs, { 'notifications 200': r => r.status === 200 });

  sleep(1);
}
