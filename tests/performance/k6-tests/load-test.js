import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const projectLatency = new Trend('project_list_latency');
const taskCreateLatency = new Trend('task_create_latency');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 500 },   // Sustain 500 VUs
    { duration: '3m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],   // P95 < 300ms — hard gate
    errors: ['rate<0.01'],              // Error rate < 1%
    http_req_failed: ['rate<0.01'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:8080';

// Login once per VU and reuse token
export function setup() {
  // Register a load test user (idempotent — ignores 409 if already exists)
  http.post(`${BASE}/api/v1/auth/register`, JSON.stringify({
    fullName: 'Load Test User',
    email: 'loadtest@taskflow.com',
    password: 'LoadTest123!',
  }), { headers: { 'Content-Type': 'application/json' } });

  const res = http.post(`${BASE}/api/v1/auth/login`, JSON.stringify({
    email: 'loadtest@taskflow.com',
    password: 'LoadTest123!',
  }), { headers: { 'Content-Type': 'application/json' } });

  const body = res.json();
  if (!body.accessToken) {
    throw new Error(`Login failed: ${res.status} ${res.body}`);
  }
  return { token: body.accessToken };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // GET /projects — read-heavy path
  const projectRes = http.get(`${BASE}/api/v1/projects`, { headers });
  projectLatency.add(projectRes.timings.duration);
  errorRate.add(!check(projectRes, { 'projects status 200': r => r.status === 200 }));

  sleep(1);

  // GET /tasks/my-tasks — another read path
  const myTasksRes = http.get(`${BASE}/api/v1/tasks/my-tasks`, { headers });
  errorRate.add(!check(myTasksRes, { 'my-tasks status 200': r => r.status === 200 }));

  sleep(1);
}
