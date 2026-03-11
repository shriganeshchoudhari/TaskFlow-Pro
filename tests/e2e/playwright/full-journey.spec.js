// @ts-check
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:80';
const API  = process.env.API_URL  || 'http://localhost:8080';

const randomEmail = () => `e2e_${Date.now()}_${Math.random().toString(36).slice(2,7)}@test.com`;
const PASSWORD = 'E2eTestPass123!';

test.describe('Full User Journey', () => {
  let email;

  test.beforeAll(() => {
    email = randomEmail();
  });

  test('1. Register a new account', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/auth/register`, {
      data: { fullName: 'E2E Test User', email, password: PASSWORD },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.email).toBe(email);
    expect(body.role).toBe('MEMBER');
  });

  test('2. Login and receive tokens', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/auth/login`, {
      data: { email, password: PASSWORD },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
    expect(body.tokenType).toBe('Bearer');
  });

  test('3. Create a project', async ({ request }) => {
    // Login first
    const login = await request.post(`${API}/api/v1/auth/login`, {
      data: { email, password: PASSWORD },
    });
    const { accessToken } = await login.json();

    const res = await request.post(`${API}/api/v1/projects`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'E2E Project', description: 'Created by Playwright' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('E2E Project');
  });

  test('4. Create a task in the project', async ({ request }) => {
    const login = await request.post(`${API}/api/v1/auth/login`, {
      data: { email, password: PASSWORD },
    });
    const { accessToken } = await login.json();

    // Get project ID
    const projRes = await request.get(`${API}/api/v1/projects`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const projects = await projRes.json();
    const projectId = projects.content[0].id;

    // Create task
    const res = await request.post(`${API}/api/v1/projects/${projectId}/tasks`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: 'E2E Task', priority: 'HIGH' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.title).toBe('E2E Task');
    expect(body.status).toBe('TODO');
  });

  test('5. Transition task: TODO → IN_PROGRESS → REVIEW → DONE', async ({ request }) => {
    const login = await request.post(`${API}/api/v1/auth/login`, {
      data: { email, password: PASSWORD },
    });
    const { accessToken } = await login.json();

    // Get first task
    const myTasks = await request.get(`${API}/api/v1/tasks/my-tasks`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const tasks = await myTasks.json();
    const taskId = tasks.content[0].id;

    // TODO → IN_PROGRESS
    let res = await request.patch(`${API}/api/v1/tasks/${taskId}/status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { status: 'IN_PROGRESS' },
    });
    expect(res.status()).toBe(200);

    // IN_PROGRESS → REVIEW
    res = await request.patch(`${API}/api/v1/tasks/${taskId}/status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { status: 'REVIEW' },
    });
    expect(res.status()).toBe(200);

    // REVIEW → DONE
    res = await request.patch(`${API}/api/v1/tasks/${taskId}/status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { status: 'DONE' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('DONE');
  });

  test('6. Add a comment and verify', async ({ request }) => {
    const login = await request.post(`${API}/api/v1/auth/login`, {
      data: { email, password: PASSWORD },
    });
    const { accessToken } = await login.json();

    const myTasks = await request.get(`${API}/api/v1/tasks/my-tasks`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const tasks = await myTasks.json();
    const taskId = tasks.content[0].id;

    // Add comment
    const res = await request.post(`${API}/api/v1/tasks/${taskId}/comments`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { content: 'E2E comment via Playwright' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.content).toBe('E2E comment via Playwright');
  });

  test('7. Logout revokes token', async ({ request }) => {
    const login = await request.post(`${API}/api/v1/auth/login`, {
      data: { email, password: PASSWORD },
    });
    const { accessToken, refreshToken } = await login.json();

    // Logout
    const logoutRes = await request.post(`${API}/api/v1/auth/logout`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { refreshToken },
    });
    expect(logoutRes.status()).toBe(204);

    // Refresh with revoked token should fail
    const refreshRes = await request.post(`${API}/api/v1/auth/refresh`, {
      data: { refreshToken },
    });
    expect(refreshRes.status()).toBe(401);
  });
});
