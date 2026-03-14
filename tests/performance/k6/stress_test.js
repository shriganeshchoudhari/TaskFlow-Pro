/**
 * PT-K6-03 — Stress Test
 * Ramp VUs until the system breaks. Find the ceiling.
 * Stages push beyond normal capacity to identify failure modes.
 *
 * Run: k6 run stress_test.js --env BASE_URL=http://localhost:8080
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { STRESS_THRESHOLDS, BASE_URL } from './config/thresholds.js';

const errorRate      = new Rate('errors');
const requestsTotal  = new Counter('requests_total');
const latencyTrend   = new Trend('stress_latency');

export const options = {
  stages: [
    { duration: '2m',  target: 100  },
    { duration: '2m',  target: 200  },
    { duration: '2m',  target: 400  },
    { duration: '2m',  target: 700  },
    { duration: '2m',  target: 1000 },   // push beyond normal peak
    { duration: '3m',  target: 1500 },   // find the ceiling
    { duration: '5m',  target: 1500 },   // sustain at ceiling
    { duration: '3m',  target: 0    },   // recover — watch error rate fall
  ],
  thresholds: STRESS_THRESHOLDS,
};

export function setup() {
  const h = { 'Content-Type': 'application/json' };
  http.post(`${BASE_URL}/api/v1/auth/register`, JSON.stringify({
    fullName: 'Stress User', email: 'stress@perf.test', password: 'StressPass123!',
  }), { headers: h });

  const res = http.post(`${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: 'stress@perf.test', password: 'StressPass123!' }),
    { headers: h });
  return { token: res.json('accessToken') };
}

export default function (data) {
  const h = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Focus on the two heaviest read paths — most likely to degrade under stress
  const r1 = http.get(`${BASE_URL}/api/v1/projects`, { headers: h });
  latencyTrend.add(r1.timings.duration);
  requestsTotal.add(1);
  const ok1 = check(r1, { 'projects OK': r => r.status === 200 || r.status === 503 });
  errorRate.add(!ok1);

  sleep(0.3);

  const r2 = http.get(`${BASE_URL}/api/v1/tasks/my-tasks`, { headers: h });
  latencyTrend.add(r2.timings.duration);
  requestsTotal.add(1);
  const ok2 = check(r2, { 'my-tasks OK': r => r.status === 200 || r.status === 503 });
  errorRate.add(!ok2);

  sleep(0.2);
}
