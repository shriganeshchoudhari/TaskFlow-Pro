/**
 * PT-K6-02 — Load Test
 * Ramp 0→100→500→500→0 VUs over 15 minutes
 * P95 < 300 ms · error rate < 1%  (hard CI gate)
 *
 * Run: k6 run load_test.js --env BASE_URL=http://localhost:8080
 *      k6 run load_test.js --env BASE_URL=http://localhost:8080 \
 *                          --env PROJECT_ID=<uuid>
 */
import http    from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate }  from 'k6/metrics';
import { LOAD_THRESHOLDS, BASE_URL } from './config/thresholds.js';

// ── Custom per-endpoint metrics ───────────────────────────────────────────────
const loginDuration      = new Trend('login_duration');
const projectsDuration   = new Trend('get_projects_duration');
const tasksDuration      = new Trend('get_tasks_duration');
const createTaskDuration = new Trend('create_task_duration');
const statusDuration     = new Trend('update_status_duration');
const notifDuration      = new Trend('get_notifications_duration');
const dashboardDuration  = new Trend('get_dashboard_duration');
const errorRate          = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m',  target: 100  },  // ramp up
    { duration: '3m',  target: 500  },  // ramp to peak
    { duration: '5m',  target: 500  },  // sustain
    { duration: '3m',  target: 100  },  // ramp down
    { duration: '2m',  target: 0    },  // cool down
  ],
  thresholds: LOAD_THRESHOLDS,
};

// ── Setup: create load-test user + one project ────────────────────────────────
export function setup() {
  const h = { 'Content-Type': 'application/json' };

  http.post(`${BASE_URL}/api/v1/auth/register`, JSON.stringify({
    fullName: 'Load Test User', email: 'loadtest@perf.test', password: 'LoadTest123!',
  }), { h });

  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: 'loadtest@perf.test', password: 'LoadTest123!' }),
    { headers: h });

  const token = loginRes.json('accessToken');
  const authH = { ...h, 'Authorization': `Bearer ${token}` };

  // Reuse injected PROJECT_ID or create a new project
  let projectId = __ENV.PROJECT_ID;
  if (!projectId) {
    const projRes = http.post(`${BASE_URL}/api/v1/projects`,
      JSON.stringify({ name: 'Load Test Project', description: 'k6 load test' }),
      { headers: authH });
    projectId = projRes.json('id');
  }
  return { token, projectId };
}

// ── Default: realistic mixed read/write workload ──────────────────────────────
export default function (data) {
  const h = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Weight: 60% reads, 30% writes, 10% dashboard
  const roll = Math.random();

  if (roll < 0.30) {
    // --- Read path ---
    const p = http.get(`${BASE_URL}/api/v1/projects`, { headers: h });
    projectsDuration.add(p.timings.duration);
    errorRate.add(!check(p, { 'projects 200': r => r.status === 200 }));
    sleep(0.5);

    const t = http.get(`${BASE_URL}/api/v1/projects/${data.projectId}/tasks`, { headers: h });
    tasksDuration.add(t.timings.duration);
    errorRate.add(!check(t, { 'tasks 200': r => r.status === 200 }));

  } else if (roll < 0.60) {
    // --- Notification read ---
    const n = http.get(`${BASE_URL}/api/v1/notifications`, { headers: h });
    notifDuration.add(n.timings.duration);
    errorRate.add(!check(n, { 'notifs 200': r => r.status === 200 }));
    sleep(0.3);

    const d = http.get(`${BASE_URL}/api/v1/dashboard/summary`, { headers: h });
    dashboardDuration.add(d.timings.duration);
    errorRate.add(!check(d, { 'dashboard 200': r => r.status === 200 }));

  } else if (roll < 0.90) {
    // --- Write path: create task ---
    const c = http.post(`${BASE_URL}/api/v1/projects/${data.projectId}/tasks`,
      JSON.stringify({ title: `Load Task ${Date.now()}`, priority: 'MEDIUM' }),
      { headers: h });
    createTaskDuration.add(c.timings.duration);
    errorRate.add(!check(c, { 'create task 201': r => r.status === 201 }));

    // Update status on the newly created task
    const taskId = c.json('id');
    if (taskId) {
      const s = http.patch(`${BASE_URL}/api/v1/tasks/${taskId}/status`,
        JSON.stringify({ status: 'IN_PROGRESS' }), { headers: h });
      statusDuration.add(s.timings.duration);
      errorRate.add(!check(s, { 'status update 200': r => r.status === 200 }));
    }

  } else {
    // --- Auth refresh ---
    const l = http.post(`${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({ email: 'loadtest@perf.test', password: 'LoadTest123!' }),
      { headers: { 'Content-Type': 'application/json' } });
    loginDuration.add(l.timings.duration);
    errorRate.add(!check(l, { 'login 200': r => r.status === 200 }));
  }

  sleep(1);
}
