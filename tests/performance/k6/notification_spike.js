/**
 * PT-K6-07 — Notification Spike Test
 * Simulates a fan-out event: many users simultaneously receive and fetch notifications.
 * Models the worst case — e.g. a project manager assigns 500 tasks at once.
 *
 * Run: k6 run notification_spike.js --env BASE_URL=http://localhost:8080
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { SPIKE_THRESHOLDS, BASE_URL } from './config/thresholds.js';

const notifPollDuration = new Trend('notif_poll_duration');
const markReadDuration  = new Trend('notif_mark_read_duration');
const errorRate         = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10   },  // quiet baseline
    { duration: '5s',  target: 500  },  // fan-out spike — all users poll at once
    { duration: '2m',  target: 500  },  // sustained high poll rate
    { duration: '5s',  target: 10   },
    { duration: '1m',  target: 10   },  // recovery
    { duration: '30s', target: 0    },
  ],
  thresholds: {
    notif_poll_duration:      ['p(95)<200'],
    notif_mark_read_duration: ['p(95)<300'],
    http_req_failed:          ['rate<0.05'],
  },
};

export function setup() {
  const h = { 'Content-Type': 'application/json' };
  http.post(`${BASE_URL}/api/v1/auth/register`, JSON.stringify({
    fullName: 'Notif User', email: 'notif@perf.test', password: 'NotifPass123!',
  }), { headers: h });

  const res = http.post(`${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: 'notif@perf.test', password: 'NotifPass123!' }),
    { headers: h });
  return { token: res.json('accessToken') };
}

export default function (data) {
  const h = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Poll notifications (what the NavBar bell does every 60s)
  const poll = http.get(`${BASE_URL}/api/v1/notifications?isRead=false&page=0&size=20`, { headers: h });
  notifPollDuration.add(poll.timings.duration);
  errorRate.add(!check(poll, { 'notif poll 200': r => r.status === 200 }));

  sleep(0.2);

  // Mark all read (user clicks the bell)
  const mark = http.patch(`${BASE_URL}/api/v1/notifications/read-all`, null, { headers: h });
  markReadDuration.add(mark.timings.duration);
  check(mark, { 'mark-all-read OK': r => r.status === 200 || r.status === 204 });

  sleep(1);
}
