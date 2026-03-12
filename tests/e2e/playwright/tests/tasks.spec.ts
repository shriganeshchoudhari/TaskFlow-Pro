import { test, expect } from '@playwright/test';

/**
 * TaskFlow Pro — E2E Task Management Tests
 * Suite covering isolated task interactions (E2E-TASK-03 to E2E-TASK-08)
 */

const TEST_USER = {
  email: 'e2e-task-runner@taskflow.com',
  password: 'TestPass123!',
};

test.describe('Task Management Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Create a dynamic user per test run or use a seeded one
    // For simplicity, we assume the user is registered or we register them
    const uniqueEmail = `e2e_task_${Date.now()}@test.com`;

    await page.goto('/register');
    await page.fill('[data-testid="fullname-input"]', 'Task E2E User');
    await page.fill('[data-testid="email-input"]', uniqueEmail);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    await page.fill('[data-testid="confirm-password-input"]', TEST_USER.password);
    await page.check('[data-testid="terms-checkbox"]');
    await page.click('[data-testid="register-button"]');
    await page.waitForURL('/login');

    // 2. Login
    await page.fill('[data-testid="email-input"]', uniqueEmail);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');

    // 3. Create a project
    await page.goto('/projects');
    await page.click('[data-testid="new-project-button"]');
    await page.fill('[data-testid="project-name-input"]', 'Task Interaction Project');
    await page.click('[data-testid="submit-project-button"]');
    await page.waitForURL(/\/projects\/[a-z0-9-]+$/);

    // 4. Create a task
    await page.click('[data-testid="add-task-button"]');
    await page.fill('[data-testid="task-title-input"]', 'Base Task');
    await page.selectOption('[data-testid="priority-select"]', 'MEDIUM');
    await page.click('[data-testid="submit-task-button"]');
    await expect(page.locator('[data-testid="column-todo"]')).toContainText('Base Task');
  });

  test('TC-E2E-TASK-03 & 04: View task detail and edit title inline', async ({ page }) => {
    // Open Task Detail
    await page.click('[data-testid="task-card"]:has-text("Base Task")');
    await expect(page.locator('[data-testid="task-detail-modal"]')).toBeVisible();

    // Verify breadcrumbs or title
    await expect(page.locator('[data-testid="task-title-display"]')).toHaveText('Base Task');

    // Edit Inline
    await page.click('[data-testid="task-title-display"]');
    await page.fill('[data-testid="task-title-edit-input"]', 'Updated Base Task');
    await page.keyboard.press('Enter'); // or blur

    // Verify updated
    await expect(page.locator('[data-testid="task-title-display"]')).toHaveText('Updated Base Task');
  });

  test('TC-E2E-TASK-05: Change task priority via dropdown', async ({ page }) => {
    // Open Task Detail
    await page.click('[data-testid="task-card"]:has-text("Base Task")');

    // Verify initial priority
    await expect(page.locator('[data-testid="priority-dropdown"]')).toContainText('MEDIUM');

    // Change Priority
    await page.click('[data-testid="priority-dropdown"]');
    await page.click('[data-testid="priority-option-CRITICAL"]');

    // Verify updated
    await expect(page.locator('[data-testid="priority-dropdown"]')).toContainText('CRITICAL');
  });

  test('TC-E2E-TASK-06: Invalid status transition guard', async ({ page }) => {
    // Open Task Detail (Current status is TODO)
    await page.click('[data-testid="task-card"]:has-text("Base Task")');

    // Open status dropdown
    await page.click('[data-testid="task-status-dropdown"]');

    // Should not allow transitioning TODO -> DONE directly
    const doneOption = page.locator('[data-testid="status-option-DONE"]');
    
    // It should either be disabled, or throw an error on click
    if (await doneOption.isEnabled()) {
       await doneOption.click();
       await expect(page.locator('[data-testid="error-alert"], [data-testid="error-toast"]')).toBeVisible();
       // Assert status reverted/stayed
       await expect(page.locator('[data-testid="task-status-dropdown"]')).toContainText('TODO');
    } else {
       await expect(doneOption).toBeDisabled();
    }
  });

  test('TC-E2E-TASK-07: My Tasks page filtering', async ({ page }) => {
    await page.goto('/my-tasks');
    await expect(page.locator('h1')).toContainText('My Tasks');

    // The created task was assigned to self by default in step 4
    await expect(page.locator('[data-testid="task-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="task-card"]')).toContainText('Base Task');
  });

  test('TC-E2E-TASK-08: List view sorting by priority', async ({ page }) => {
    // Add a HIGH priority task
    await page.click('[data-testid="add-task-button"]');
    await page.fill('[data-testid="task-title-input"]', 'High Task');
    await page.selectOption('[data-testid="priority-select"]', 'HIGH');
    await page.click('[data-testid="submit-task-button"]');

    // Switch to List View
    await page.click('[data-testid="tab-list-view"]');

    // Click priority column header to sort descending
    await page.click('[data-testid="sort-header-priority"]');

    // Top row should be HIGH
    const firstRow = page.locator('[data-testid="task-list-row"]').nth(0);
    await expect(firstRow).toContainText('High Task');
  });
});
