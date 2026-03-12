import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * TaskFlow Pro — E2E Advanced Features Tests
 * Suite covering File Attachments, Subtasks, and Time Tracking
 */

const TEST_USER = {
  email: 'e2e-adv-runner@taskflow.com',
  password: 'TestPass123!',
};

test.describe('Advanced Task Features Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Create a dynamic user per test run or use a seeded one
    const uniqueEmail = `e2e_adv_${Date.now()}@test.com`;

    await page.goto('/register');
    await page.fill('[data-testid="fullname-input"]', 'Advanced E2E User');
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
    await page.fill('[data-testid="project-name-input"]', 'Advanced Features Project');
    await page.click('[data-testid="submit-project-button"]');
    await page.waitForURL(/\/projects\/[a-z0-9-]+$/);

    // 4. Create a task
    await page.click('[data-testid="add-task-button"]');
    await page.fill('[data-testid="task-title-input"]', 'Advanced Task');
    await page.fill('[data-testid="task-estimated-hours-input"]', '10');
    await page.selectOption('[data-testid="priority-select"]', 'HIGH');
    await page.click('[data-testid="submit-task-button"]');
    await expect(page.locator('[data-testid="column-todo"]')).toContainText('Advanced Task');
  });

  test('TC-E2E-ADV-01: Upload and view a file attachment', async ({ page }) => {
    // Open Task Detail
    await page.click('[data-testid="task-card"]:has-text("Advanced Task")');
    await expect(page.locator('[data-testid="task-detail-modal"]')).toBeVisible();

    // Upload file
    const fileChooserPromise = page.waitForEvent('filechooser');
    // Using double click or triggering the dropzone click manually
    await page.click('[data-testid="file-upload-zone"]');
    const fileChooser = await fileChooserPromise;
    // Create a dummy file path to upload
    await fileChooser.setFiles({
      name: 'test-attachment.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This is a test attachment content for E2E testing.')
    });

    // Wait for the upload message or attachment to appear
    await expect(page.locator('[data-testid="attachment-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="attachment-item"]')).toContainText('test-attachment.txt');
  });

  test('TC-E2E-ADV-02: Manage subtasks (Checklist)', async ({ page }) => {
    // Open Task Detail
    await page.click('[data-testid="task-card"]:has-text("Advanced Task")');
    await expect(page.locator('[data-testid="task-detail-modal"]')).toBeVisible();

    // Add first subtask
    await page.fill('[data-testid="new-subtask-input"]', 'Draft design document');
    await page.click('[data-testid="add-subtask-button"]');
    
    // Add second subtask
    await page.fill('[data-testid="new-subtask-input"]', 'Review with stakeholder');
    await page.click('[data-testid="add-subtask-button"]');

    await expect(page.locator('[data-testid="subtask-item"]')).toHaveCount(2);

    // Check progress text
    await expect(page.locator('[data-testid="subtask-progress-text"]')).toHaveText('0 / 2');

    // Toggle a subtask
    await page.locator('[data-testid="subtask-checkbox"]').nth(0).click();

    // Wait for progress update
    await expect(page.locator('[data-testid="subtask-progress-text"]')).toHaveText('1 / 2');

    // Delete a subtask
    await page.locator('[data-testid="delete-subtask-button"]').nth(1).click();
    await expect(page.locator('[data-testid="subtask-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="subtask-progress-text"]')).toHaveText('1 / 1');
  });

  test('TC-E2E-ADV-03: Log time and view progress', async ({ page }) => {
    // Open Task Detail
    await page.click('[data-testid="task-card"]:has-text("Advanced Task")');
    await expect(page.locator('[data-testid="task-detail-modal"]')).toBeVisible();

    // Check initial estimates (10 hours set in beforeEach)
    await expect(page.locator('[data-testid="time-tracker-estimated"]')).toContainText('10h estimated');
    await expect(page.locator('[data-testid="time-tracker-logged"]')).toContainText('0h logged');

    // Log time
    await page.fill('[data-testid="log-time-input"]', '3.5');
    await page.click('[data-testid="log-time-button"]');

    // Wait for logged time to update
    await expect(page.locator('[data-testid="time-tracker-logged"]')).toContainText('3.5h logged');
    
    // Log more time
    await page.fill('[data-testid="log-time-input"]', '1.5');
    await page.click('[data-testid="log-time-button"]');

    // Expected total logged: 5
    await expect(page.locator('[data-testid="time-tracker-logged"]')).toContainText('5h logged');
  });
});
