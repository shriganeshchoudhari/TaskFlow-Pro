import { test, expect } from '@playwright/test';

/**
 * TaskFlow Pro — E2E Dashboard Tests
 * Suite covering isolated workflow states (E2E-DASH-01 to 03)
 */

test.describe('Dashboard Workflows', () => {
  let user: { email: string, pass: string };

  test.beforeEach(async ({ page }) => {
    user = { email: `e2e_dash_${Date.now()}@test.com`, pass: 'TestPass123!' };

    // Register User
    await page.goto('/register');
    await page.fill('[data-testid="fullname-input"]', 'Dashboard User');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', user.pass);
    await page.fill('[data-testid="confirm-password-input"]', user.pass);
    await page.check('[data-testid="terms-checkbox"]');
    await page.click('[data-testid="register-button"]');
    await page.waitForURL('/login');

    // Login
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', user.pass);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('TC-E2E-DASH-01: Dashboard loads correctly without skeletons', async ({ page }) => {
    // Wait for the dashboard grid to be visible
    await expect(page.locator('[data-testid="dashboard-summary-grid"]')).toBeVisible();

    // Ensure skeletons are removed and actual cards are loaded
    await expect(page.locator('[data-testid="skeleton-loader"]')).toHaveCount(0);
    
    // There should be 4 stat cards (Active Projects, My Tasks, etc.)
    await expect(page.locator('[data-testid="stat-card"]')).toHaveCount(4);
    
    // Check initial text
    await expect(page.locator('[data-testid="stat-card"]:has-text("Active Projects")')).toBeVisible();
  });

  test('TC-E2E-DASH-02: My Tasks widget links to task details', async ({ page }) => {
    // 1. Create Project and Task to populate widget
    await page.goto('/projects');
    await page.click('[data-testid="new-project-button"]');
    await page.fill('[data-testid="project-name-input"]', 'Dash Project');
    await page.click('[data-testid="submit-project-button"]');
    await page.waitForURL(/\/projects\/[a-z0-9-]+$/);

    await page.click('[data-testid="add-task-button"]');
    await page.fill('[data-testid="task-title-input"]', 'Dash Task');
    await page.selectOption('[data-testid="priority-select"]', 'HIGH');
    await page.click('[data-testid="submit-task-button"]');

    // 2. Go back to Dashboard
    await page.goto('/dashboard');
    
    // 3. Click the task row in the widget
    await expect(page.locator('[data-testid="my-tasks-widget"]')).toBeVisible();
    await page.click('[data-testid="my-tasks-item"]:has-text("Dash Task")');

    // 4. Verify Navigation to the created task
    await page.waitForURL(/\/projects\/[a-z0-9-]+\/tasks\/[a-z0-9-]+$/);
    await expect(page.locator('[data-testid="task-title-display"]')).toHaveText('Dash Task');
  });

  test('TC-E2E-DASH-03: My Projects See all link', async ({ page }) => {
    // Directly click the See all link
    await page.click('[data-testid="see-all-projects-link"]');

    // Assert navigation
    await page.waitForURL(/\/projects$/);
    await expect(page.locator('h1')).toHaveText('Projects');
  });
});
