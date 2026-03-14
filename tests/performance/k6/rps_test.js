/**
 * PT-K6-10 — Constant Arrival-Rate (RPS) Test
 * Uses the arrival-rate executor to drive a fixed request-per-second rate,
 * regardless of how many VUs are needed to sustain it.
 * Validates the throughput targets from the SLA table.
 *
 * Run: k6 run rps_test.js --env BASE_URL=http://localhost:8080 \
 *                          --env TARGET_RPS=300
 */
import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL } from './config/thresholds.js';

const targetRps = parseInt(__ENV.TARGET_RPS || '300');
const errorRate = new Rate('rps_errors');
const latency   = new Trend('rps_latency');

export const options = {
  scenarios: {
    constant_request_rate: {
      executor:            'constant-arrival-rate',
      rate:                targetRps,
      timeUnit:            '1s',
      duration:            '5m',
      preAllocatedVUs:     200,
      maxVUs:              1000,
    },
  },
  thresholds: {
    rps_latency:  ['p(95)<300'],
    rps_errors:   ['rate<0.01'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  const h = { 'Content-Type': 'application/json' };
  http.post(`${BASE_URL}/api/v1/auth/register`, JSON.stringify({
    fullName: 'RPS User', email: 'rps@perf.test', password: 'RpsTest123!',
  }), { headers: h });

  const res = http.post(`${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: 'rps@perf.test', password: 'RpsTest123!' }),
    { headers: h });
  return { token: res.json('accessToken') };
}

export default function (data) {
  const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` };

  // Rotate across endpoints to validate all throughput SLAs in one run
  const endpoints = [
    () => http.get(`${BASE_URL}/api/v1/projects`, { headers: h }),
    () => http.get(`${BASE_URL}/api/v1/tasks/my-tasks`, { headers: h }),
    () => http.get(`${BASE_URL}/api/v1/notifications`, { headers: h }),
    () => http.get(`${BASE_URL}/api/v1/dashboard/summary`, { headers: h }),
  ];

  const fn = endpoints[__ITER % endpoints.length];
  const r  = fn();
  latency.add(r.timings.duration);
  errorRate.add(!check(r, { 'rps 200': res => res.status === 200 }));
}
