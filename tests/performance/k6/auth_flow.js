/**
 * PT-K6-05 — Auth Flow Scenario
 * Models a realistic JWT authentication lifecycle:
 *   register → login → use access token → refresh → logout
 * Run alongside load_test.js to cover auth endpoint latency independently.
 *
 * Run: k6 run auth_flow.js --env BASE_URL=http://localhost:8080
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL } from './config/thresholds.js';

const registerDuration = new Trend('auth_register_duration');
const loginDuration    = new Trend('auth_login_duration');
const refreshDuration  = new Trend('auth_refresh_duration');
const errorRate        = new Rate('errors');

export const options = {
  scenarios: {
    auth_flow: {
      executor:           'ramping-vus',
      startVUs:           0,
      stages: [
        { duration: '1m', target: 50  },
        { duration: '3m', target: 100 },
        { duration: '1m', target: 0   },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    auth_register_duration: ['p(95)<500'],
    auth_login_duration:    ['p(95)<250'],
    auth_refresh_duration:  ['p(95)<200'],
    http_req_failed:        ['rate<0.01'],
  },
};

export default function () {
  const h       = { 'Content-Type': 'application/json' };
  const email   = `vu${__VU}_iter${__ITER}@perf.test`;
  const password = 'AuthFlow123!';

  // 1. Register
  const regStart = Date.now();
  const reg = http.post(`${BASE_URL}/api/v1/auth/register`,
    JSON.stringify({ fullName: 'Auth Flow User', email, password }), { headers: h });
  registerDuration.add(Date.now() - regStart);
  const regOk = check(reg, { 'register 201': r => r.status === 201 });
  errorRate.add(!regOk);
  if (!regOk) return;

  sleep(0.3);

  // 2. Login
  const logStart = Date.now();
  const login = http.post(`${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email, password }), { headers: h });
  loginDuration.add(Date.now() - logStart);
  const loginOk = check(login, { 'login 200': r => r.status === 200 });
  errorRate.add(!loginOk);
  if (!loginOk) return;

  const { accessToken, refreshToken } = login.json();
  const authH = { ...h, 'Authorization': `Bearer ${accessToken}` };

  sleep(0.5);

  // 3. Use the access token — get projects
  const use = http.get(`${BASE_URL}/api/v1/projects`, { headers: authH });
  check(use, { 'authenticated request 200': r => r.status === 200 });

  sleep(0.5);

  // 4. Refresh
  const refStart = Date.now();
  const refresh = http.post(`${BASE_URL}/api/v1/auth/refresh`,
    JSON.stringify({ refreshToken }), { headers: h });
  refreshDuration.add(Date.now() - refStart);
  check(refresh, { 'refresh 200': r => r.status === 200 });

  sleep(0.3);

  // 5. Logout
  const newRefresh = refresh.json('refreshToken') || refreshToken;
  const logout = http.post(`${BASE_URL}/api/v1/auth/logout`,
    JSON.stringify({ refreshToken: newRefresh }), { headers: h });
  check(logout, { 'logout 204': r => r.status === 204 });

  sleep(1);
}
