import { test, expect } from '@playwright/test';

/**
 * TaskFlow Pro — E2E Notification & Comment Tests
 * Suite covering isolated workflow states (E2E-NOTIF-01 to E2E-NOTIF-05)
 */

test.describe('Notification & Comment Workflows', () => {
  let userA: { email: string, pass: string };
  let userB: { email: string, pass: string };
  let projectUrl: string;

  test.beforeEach(async ({ page, browser }) => {
    userA = { email: `e2e_a_${Date.now()}@test.com`, pass: 'TestPass123!' };
    userB = { email: `e2e_b_${Date.now()}@test.com`, pass: 'TestPass123!' };

    // Register User B
    await page.goto('/register');
    await page.fill('[data-testid="fullname-input"]', 'User B (Assignee)');
    await page.fill('[data-testid="email-input"]', userB.email);
    await page.fill('[data-testid="password-input"]', userB.pass);
    await page.fill('[data-testid="confirm-password-input"]', userB.pass);
    await page.check('[data-testid="terms-checkbox"]');
    await page.click('[data-testid="register-button"]');
    await page.waitForURL('/login');

    // Register User A
    await page.goto('/register');
    await page.fill('[data-testid="fullname-input"]', 'User A (Manager)');
    await page.fill('[data-testid="email-input"]', userA.email);
    await page.fill('[data-testid="password-input"]', userA.pass);
    await page.fill('[data-testid="confirm-password-input"]', userA.pass);
    await page.check('[data-testid="terms-checkbox"]');
    await page.click('[data-testid="register-button"]');

    // Login User A
    await page.waitForURL('/login');
    await page.fill('[data-testid="email-input"]', userA.email);
    await page.fill('[data-testid="password-input"]', userA.pass);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');

    // User A creates project
    await page.goto('/projects');
    await page.click('[data-testid="new-project-button"]');
    await page.fill('[data-testid="project-name-input"]', 'Notification Project');
    await page.click('[data-testid="submit-project-button"]');
    await page.waitForURL(/\/projects\/[a-z0-9-]+$/);
    projectUrl = page.url();

    // User A invites User B
    await page.click('[data-testid="tab-members"]');
    await page.fill('[data-testid="invite-email-input"]', userB.email);
    await page.click('[data-testid="invite-member-button"]');
    await expect(page.locator('[data-testid="member-row"]:has-text("User B (Assignee)")')).toBeVisible();

    // User A creates a task and assigns to User B
    await page.click('[data-testid="tab-board"]');
    await page.click('[data-testid="add-task-button"]');
    await page.fill('[data-testid="task-title-input"]', 'Notify Me');
    // Using a select or component to assign:
    await page.click('[data-testid="assignee-select"]');
    await page.click(`[data-testid="user-option"]:has-text("User B (Assignee)")`);
    await page.click('[data-testid="submit-task-button"]');
  });

  test('TC-E2E-NOTIF-01 & 04: Assignment creates notification & bell updates', async ({ browser }) => {
    // Open a second context for User B
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    // Login User B
    await pageB.goto('/login');
    await pageB.fill('[data-testid="email-input"]', userB.email);
    await pageB.fill('[data-testid="password-input"]', userB.pass);
    await pageB.click('[data-testid="login-button"]');
    await pageB.waitForURL('/dashboard');

    // Verify Bell Badge is visible and > 0
    await expect(pageB.locator('[data-testid="unread-badge"]')).toBeVisible();
    
    // Open dropdown
    await pageB.click('[data-testid="notification-bell"]');

    // Verify assignment text exists
    await expect(pageB.locator('[data-testid="notification-dropdown"]')).toContainText('assigned');
    await expect(pageB.locator('[data-testid="notification-dropdown"]')).toContainText('Notify Me');
  });

  test('TC-E2E-NOTIF-02: Clicking notification navigates to item', async ({ browser }) => {
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    await pageB.goto('/login');
    await pageB.fill('[data-testid="email-input"]', userB.email);
    await pageB.fill('[data-testid="password-input"]', userB.pass);
    await pageB.click('[data-testid="login-button"]');
    await pageB.waitForURL('/dashboard');

    await pageB.click('[data-testid="notification-bell"]');
    
    // Click the notification item
    await pageB.click('[data-testid="notification-item"]:has-text("assigned")');

    // Assert that the dropdown closed and the URL updated to the task
    await expect(pageB.locator('[data-testid="notification-dropdown"]')).not.toBeVisible();
    await pageB.waitForURL(/\/projects\/[a-z0-9-]+\/tasks\/[a-z0-9-]+$/);

    // Verify task detail modal is open
    await expect(pageB.locator('[data-testid="task-title-display"]')).toHaveText('Notify Me');
  });

  test('TC-E2E-NOTIF-05: Add and edit own comment', async ({ page }) => {
    // User A acts on task
    await page.goto(projectUrl);
    await page.click('[data-testid="task-card"]:has-text("Notify Me")');

    // Post comment
    await page.fill('[data-testid="comment-input"]', 'This is a test comment');
    await page.click('[data-testid="submit-comment-button"]');

    // Verify comment appears
    await expect(page.locator('[data-testid="comment-text"]:has-text("This is a test comment")')).toBeVisible();

    // Edit Comment
    await page.click('[data-testid="edit-comment-button"]');
    // Using a clear and fill approach
    await page.fill('[data-testid="edit-comment-input"]', 'This is an updated comment');
    await page.click('[data-testid="save-comment-button"]');

    // Verify it updated and shows Edited pill
    await expect(page.locator('[data-testid="comment-text"]:has-text("This is an updated comment")')).toBeVisible();
    await expect(page.locator('[data-testid="edited-indicator"]')).toBeVisible();
  });
});
