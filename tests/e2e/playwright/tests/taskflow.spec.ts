import { test, expect } from '@playwright/test';

/**
 * TaskFlow Pro — E2E Authentication Tests
 * Tests the complete login, register, and logout flows
 */

const TEST_USER = {
  email: 'e2e-test@taskflow.com',
  password: 'TestPass123!',
  fullName: 'E2E Test User',
};

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh from login page
    await page.goto('/login');
  });

  test('TC-E2E-AUTH-001: User can log in with valid credentials', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', TEST_USER.email);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('TC-E2E-AUTH-002: Invalid credentials show error', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', TEST_USER.email);
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="error-alert"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-alert"]')).toContainText('Invalid');
    await expect(page).toHaveURL('/login');
  });

  test('TC-E2E-AUTH-003: Register a new account', async ({ page }) => {
    const uniqueEmail = `e2e_${Date.now()}@test.com`;

    await page.goto('/register');
    await page.fill('[data-testid="fullname-input"]', 'New Test User');
    await page.fill('[data-testid="email-input"]', uniqueEmail);
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'TestPass123!');
    await page.check('[data-testid="terms-checkbox"]');
    await page.click('[data-testid="register-button"]');

    await expect(page).toHaveURL('/login');
    await expect(page.locator('[data-testid="success-alert"]')).toContainText('created');
  });

  test('TC-E2E-AUTH-004: Unauthenticated redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');

    await page.goto('/projects');
    await expect(page).toHaveURL('/login');
  });

  test('TC-E2E-AUTH-005: User can log out', async ({ page }) => {
    // First login
    await page.fill('[data-testid="email-input"]', TEST_USER.email);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    await expect(page).toHaveURL('/login');

    // Verify protected route redirects
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Project Management Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each project test
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', TEST_USER.email);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('TC-E2E-PROJ-001: Create a new project', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-testid="new-project-button"]');

    await page.fill('[data-testid="project-name-input"]', `E2E Project ${Date.now()}`);
    await page.fill('[data-testid="project-description-input"]', 'Created by Playwright');
    await page.click('[data-testid="submit-project-button"]');

    await page.waitForURL(/\/projects\/[a-z0-9-]+$/);
    await expect(page.locator('[data-testid="project-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="project-status-badge"]'))
      .toContainText('ACTIVE');
  });

  test('TC-E2E-PROJ-002: View project board with task columns', async ({ page }) => {
    await page.goto('/projects');

    // Click first project
    await page.click('[data-testid="project-card"]:first-child');

    // Verify all 4 board columns exist
    await expect(page.locator('[data-testid="column-todo"]')).toBeVisible();
    await expect(page.locator('[data-testid="column-inprogress"]')).toBeVisible();
    await expect(page.locator('[data-testid="column-review"]')).toBeVisible();
    await expect(page.locator('[data-testid="column-done"]')).toBeVisible();
  });
});

test.describe('Task Management Flows', () => {
  let projectId: string;

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', TEST_USER.email);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('TC-E2E-TASK-001: Create a task in a project', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-testid="project-card"]:first-child');

    await page.click('[data-testid="add-task-button"]');
    await page.fill('[data-testid="task-title-input"]', 'E2E Created Task');
    await page.selectOption('[data-testid="priority-select"]', 'HIGH');
    await page.click('[data-testid="submit-task-button"]');

    await expect(page.locator('[data-testid="column-todo"]'))
      .toContainText('E2E Created Task');
  });

  test('TC-E2E-TASK-002: Update task status', async ({ page }) => {
    // Navigate to a task detail page
    await page.goto('/projects');
    await page.click('[data-testid="project-card"]:first-child');
    await page.click('[data-testid="task-card"]:first-child');

    const taskUrl = page.url();

    // Update status
    await page.click('[data-testid="task-status-dropdown"]');
    await page.click('[data-testid="status-option-IN_PROGRESS"]');

    await expect(page.locator('[data-testid="task-status-dropdown"]'))
      .toContainText('IN_PROGRESS');
    await expect(page.locator('[data-testid="activity-feed"]'))
      .toContainText('status');
  });
});

test.describe('Notification Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', TEST_USER.email);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('TC-E2E-NOTIF-001: Notification bell is visible', async ({ page }) => {
    await expect(page.locator('[data-testid="notification-bell"]')).toBeVisible();
  });

  test('TC-E2E-NOTIF-002: Open notification dropdown', async ({ page }) => {
    await page.click('[data-testid="notification-bell"]');
    await expect(page.locator('[data-testid="notification-dropdown"]')).toBeVisible();
  });

  test('TC-E2E-NOTIF-003: Mark all notifications read', async ({ page }) => {
    await page.click('[data-testid="notification-bell"]');

    const markAllBtn = page.locator('[data-testid="mark-all-read-button"]');
    if (await markAllBtn.isVisible()) {
      await markAllBtn.click();
      await expect(page.locator('[data-testid="unread-badge"]')).not.toBeVisible();
    }
  });
});
