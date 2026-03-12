import { test, expect } from '@playwright/test';

/**
 * TaskFlow Pro — E2E Project Management Tests
 * Suite covering isolated project interactions (E2E-PROJ-03 to E2E-PROJ-07)
 */

const TEST_USER = {
  email: 'e2e-project-runner@taskflow.com',
  password: 'TestPass123!',
};

test.describe('Project Interaction Flows', () => {
  let uniqueEmail: string;

  test.beforeEach(async ({ page }) => {
    uniqueEmail = `e2e_proj_${Date.now()}@test.com`;

    // 1. Register & Login User A
    await page.goto('/register');
    await page.fill('[data-testid="fullname-input"]', 'Project E2E User');
    await page.fill('[data-testid="email-input"]', uniqueEmail);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    await page.fill('[data-testid="confirm-password-input"]', TEST_USER.password);
    await page.check('[data-testid="terms-checkbox"]');
    await page.click('[data-testid="register-button"]');
    
    await page.waitForURL('/login');
    await page.fill('[data-testid="email-input"]', uniqueEmail);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');

    // 2. Create Active Project
    await page.goto('/projects');
    await page.click('[data-testid="new-project-button"]');
    await page.fill('[data-testid="project-name-input"]', 'Active Alpha Project');
    await page.click('[data-testid="submit-project-button"]');
    await page.waitForURL(/\/projects\/[a-z0-9-]+$/);

    // 3. Create another Project to Archive later
    await page.goto('/projects');
    await page.click('[data-testid="new-project-button"]');
    await page.fill('[data-testid="project-name-input"]', 'To Be Archived Beta');
    await page.click('[data-testid="submit-project-button"]');
    await page.waitForURL(/\/projects\/[a-z0-9-]+$/);
  });

  test('TC-E2E-PROJ-04: Search projects by name', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('[data-testid="project-card"]')).toHaveCount(2);

    // Search
    await page.fill('[data-testid="project-search-input"]', 'Alpha');

    // Assert filtering
    await expect(page.locator('[data-testid="project-card"]:has-text("Active Alpha Project")')).toBeVisible();
    await expect(page.locator('[data-testid="project-card"]:has-text("To Be Archived Beta")')).not.toBeVisible();
    await expect(page.locator('[data-testid="project-card"]')).toHaveCount(1);
  });

  test('TC-E2E-PROJ-06 & 03: Archive project and filter by status', async ({ page }) => {
    await page.goto('/projects');

    // Click on Beta project card menu 
    // Assuming project card has a kebab menu data-testid="project-menu-btn"
    const betaCard = page.locator('[data-testid="project-card"]:has-text("To Be Archived Beta")');
    await betaCard.locator('[data-testid="project-menu-btn"]').click();
    
    // Archive
    await page.locator('[data-testid="archive-project-action"]').click();
    
    // Accept confirm dialog if any, assume it archives instantly or we wait for success toast
    await expect(page.locator('[data-testid="success-alert"]')).toBeVisible();

    // Verify it's hidden from ACTIVE by default
    await expect(page.locator('[data-testid="project-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="project-card"]:has-text("To Be Archived Beta")')).not.toBeVisible();

    // Click "Archived" status chip filter
    await page.click('[data-testid="status-filter-ARCHIVED"]');

    // Now it should be visible
    await expect(page.locator('[data-testid="project-card"]:has-text("To Be Archived Beta")')).toBeVisible();
  });

  test('TC-E2E-PROJ-05: Invite member by email', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-testid="project-card"]:has-text("Active Alpha Project")');

    // Go to Members Tab
    await page.click('[data-testid="tab-members"]');

    // Invite member
    await page.fill('[data-testid="invite-email-input"]', 'new-dev@example.com');
    await page.click('[data-testid="invite-member-button"]');

    // Verify member appearing in list
    await expect(page.locator('[data-testid="member-row"]:has-text("new-dev@example.com")')).toBeVisible();
    await expect(page.locator('[data-testid="member-row"]:has-text("new-dev@example.com")')).toContainText('MEMBER');
  });

  test('TC-E2E-PROJ-07: Non-member cannot access private project', async ({ page }) => {
     // 1. Get the project URL for the private project owned by User A
     await page.goto('/projects');
     await page.click('[data-testid="project-card"]:has-text("Active Alpha Project")');
     const secretUrl = page.url();

     // 2. Logout User A
     await page.click('[data-testid="user-menu"]');
     await page.click('[data-testid="logout-button"]');

     // 3. Login as newly registered User B
     const userBEmail = `e2e_b_${Date.now()}@test.com`;
     await page.goto('/register');
     await page.fill('[data-testid="fullname-input"]', 'User B');
     await page.fill('[data-testid="email-input"]', userBEmail);
     await page.fill('[data-testid="password-input"]', TEST_USER.password);
     await page.fill('[data-testid="confirm-password-input"]', TEST_USER.password);
     await page.check('[data-testid="terms-checkbox"]');
     await page.click('[data-testid="register-button"]');

     await page.waitForURL('/login');
     await page.fill('[data-testid="email-input"]', userBEmail);
     await page.fill('[data-testid="password-input"]', TEST_USER.password);
     await page.click('[data-testid="login-button"]');
     await page.waitForURL('/dashboard');

     // 4. Navigate directly to User A's project
     const response = await page.goto(secretUrl);

     // 5. Verify access is blocked (either 403, 404, or redirect to home/not-found)
     // App handles this by either redirecting to /projects, showing Not Found, or showing Unauthorized
     await expect(page.locator('body')).not.toContainText('Active Alpha Project');
  });
});
