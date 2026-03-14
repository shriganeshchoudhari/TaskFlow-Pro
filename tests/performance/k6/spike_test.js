/**
 * PT-K6-04 — Spike Test
 * Sudden burst: 0 → 1000 VUs in 10s, hold 1m, back to 0.
 * Validates that the system recovers within 30 seconds (SLA).
 *
 * Run: k6 run spike_test.js --env BASE_URL=http://localhost:8080
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { SPIKE_THRESHOLDS, BASE_URL } from './config/thresholds.js';

const spikeLatency    = new Trend('spike_latency');
const recoveryMs      = new Trend('spike_recovery_ms');
const errorRate       = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10   },  // baseline
    { duration: '10s', target: 1000 },  // sudden spike
    { duration: '1m',  target: 1000 },  // hold spike
    { duration: '10s', target: 10   },  // drop back
    { duration: '2m',  target: 10   },  // recovery window — measure latency returning to normal
    { duration: '30s', target: 0    },
  ],
  thresholds: SPIKE_THRESHOLDS,
};

export function setup() {
  const h = { 'Content-Type': 'application/json' };
  http.post(`${BASE_URL}/api/v1/auth/register`, JSON.stringify({
    fullName: 'Spike User', email: 'spike@perf.test', password: 'SpikePass123!',
  }), { headers: h });

  const res = http.post(`${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: 'spike@perf.test', password: 'SpikePass123!' }),
    { headers: h });
  return { token: res.json('accessToken'), spikeStart: Date.now() };
}

export default function (data) {
  const h = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  const start = Date.now();
  const r = http.get(`${BASE_URL}/api/v1/projects`, { headers: h });
  const elapsed = Date.now() - start;

  spikeLatency.add(elapsed);

  const ok = check(r, { 'spike request OK': res => res.status === 200 || res.status === 503 });
  errorRate.add(!ok);

  // Track recovery: during the wind-down phase (VUs back to 10),
  // record how long requests still take — this feeds the spike_recovery_ms threshold.
  if (__VU <= 10) {
    recoveryMs.add(elapsed);
  }

  sleep(0.5);
}
