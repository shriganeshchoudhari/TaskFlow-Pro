/**
 * PT-K6-06 — Board Scenario
 * End-to-end task board workflow: login → view board → create task → move through statuses
 * Models the most common user journey in the application.
 *
 * Run: k6 run board_scenario.js --env BASE_URL=http://localhost:8080 \
 *                                --env PROJECT_ID=<uuid>
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL } from './config/thresholds.js';

const boardLoadDuration  = new Trend('board_load_duration');
const taskCreateDuration = new Trend('board_task_create_duration');
const statusMoveDuration = new Trend('board_status_move_duration');
const commentDuration    = new Trend('board_comment_duration');
const errorRate          = new Rate('errors');

export const options = {
  scenarios: {
    board_users: {
      executor: 'constant-vus',
      vus:      50,
      duration: '10m',
    },
  },
  thresholds: {
    board_load_duration:    ['p(95)<300'],
    board_task_create_duration: ['p(95)<400'],
    board_status_move_duration: ['p(95)<350'],
    http_req_failed:        ['rate<0.01'],
  },
};

export function setup() {
  const h = { 'Content-Type': 'application/json' };
  http.post(`${BASE_URL}/api/v1/auth/register`, JSON.stringify({
    fullName: 'Board User', email: 'board@perf.test', password: 'BoardPass123!',
  }), { headers: h });

  const login = http.post(`${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: 'board@perf.test', password: 'BoardPass123!' }),
    { headers: h });
  const token = login.json('accessToken');
  const authH = { ...h, 'Authorization': `Bearer ${token}` };

  let projectId = __ENV.PROJECT_ID;
  if (!projectId) {
    const proj = http.post(`${BASE_URL}/api/v1/projects`,
      JSON.stringify({ name: 'Board Perf Project' }), { headers: authH });
    projectId = proj.json('id');
  }
  return { token, projectId };
}

export default function (data) {
  const h = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  group('Load Board', () => {
    const r = http.get(`${BASE_URL}/api/v1/projects/${data.projectId}/tasks`, { headers: h });
    boardLoadDuration.add(r.timings.duration);
    errorRate.add(!check(r, { 'board 200': res => res.status === 200 }));
  });

  sleep(0.5);

  let taskId;
  group('Create Task', () => {
    const r = http.post(
      `${BASE_URL}/api/v1/projects/${data.projectId}/tasks`,
      JSON.stringify({ title: `Board Task ${Date.now()}`, priority: 'HIGH' }),
      { headers: h }
    );
    taskCreateDuration.add(r.timings.duration);
    errorRate.add(!check(r, { 'create 201': res => res.status === 201 }));
    taskId = r.json('id');
  });

  if (!taskId) { sleep(1); return; }
  sleep(0.3);

  group('Move TODO → IN_PROGRESS', () => {
    const r = http.patch(`${BASE_URL}/api/v1/tasks/${taskId}/status`,
      JSON.stringify({ status: 'IN_PROGRESS' }), { headers: h });
    statusMoveDuration.add(r.timings.duration);
    errorRate.add(!check(r, { 'in_progress 200': res => res.status === 200 }));
  });

  sleep(0.3);

  group('Add Comment', () => {
    const r = http.post(`${BASE_URL}/api/v1/tasks/${taskId}/comments`,
      JSON.stringify({ content: 'Performance test comment' }), { headers: h });
    commentDuration.add(r.timings.duration);
    check(r, { 'comment 201': res => res.status === 201 });
  });

  sleep(0.3);

  group('Move IN_PROGRESS → REVIEW', () => {
    const r = http.patch(`${BASE_URL}/api/v1/tasks/${taskId}/status`,
      JSON.stringify({ status: 'REVIEW' }), { headers: h });
    statusMoveDuration.add(r.timings.duration);
    check(r, { 'review 200': res => res.status === 200 });
  });

  sleep(1);
}
