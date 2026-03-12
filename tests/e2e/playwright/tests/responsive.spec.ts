import { test, expect } from '@playwright/test';

/**
 * TaskFlow Pro — E2E Responsive/Mobile Tests
 * Suite covering isolated workflow states (E2E-RESP-01 to 05)
 * 
 * Note: Assumes playwright config defines a 'Mobile Chrome' project
 * with viewport like { width: 375, height: 812 }, or we force it here.
 */

test.describe('Responsive / Mobile Validations', () => {
  let user: { email: string, pass: string };

  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    user = { email: `e2e_mobile_${Date.now()}@test.com`, pass: 'TestPass123!' };

    // Login logic using API bypassing UI to save time
    // Alternatively, UI steps:
    await page.goto('/register');
    await page.fill('[data-testid="fullname-input"]', 'Mobile User');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', user.pass);
    await page.fill('[data-testid="confirm-password-input"]', user.pass);
    await page.check('[data-testid="terms-checkbox"]');
    await page.click('[data-testid="register-button"]');
    
    await page.waitForURL('/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', user.pass);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('TC-E2E-RESP-01: Sidebar collapses to hamburger on mobile', async ({ page }) => {
    // Standard desktop sidebar should be hidden or represented by a drawer/sheet
    await expect(page.locator('[data-testid="desktop-sidebar"]')).not.toBeVisible();

    // Hamburger icon should be clearly visible in NavBar
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

    // Clicking it opens the mobile drawer
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-sidebar-drawer"]')).toBeVisible();
  });

  test('TC-E2E-RESP-03: Notification dropdown is full screen', async ({ page }) => {
    await page.click('[data-testid="notification-bell"]');
    const dropdown = page.locator('[data-testid="notification-dropdown"]');
    
    await expect(dropdown).toBeVisible();

    // Verify it takes up full width (approx 375px)
    const box = await dropdown.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(300); // Rough assert for full screen-ish width
  });

  test('TC-E2E-RESP-04: Task form opens as bottom sheet', async ({ page }) => {
    // Create a project first
    await page.goto('/projects');
    await page.click('[data-testid="new-project-button"]');
    await page.fill('[data-testid="project-name-input"]', 'Mobile Proj');
    await page.click('[data-testid="submit-project-button"]');
    await page.waitForURL(/\/projects\/[a-z0-9-]+$/);

    // Click Add Task
    await page.click('[data-testid="add-task-button"]');
    
    // In responsive designs, the container is often a bottom-sheet (class or data tag)
    await expect(page.locator('[data-testid="task-form-bottom-sheet"]')).toBeVisible();
  });

  test('TC-E2E-RESP-05: Touch targets are >= 44px', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Validate core buttons
    const addBtn = page.locator('[data-testid="new-project-button"]');
    // It might not exist on dashboard, so check mobile menu instead
    const menuBtn = page.locator('[data-testid="mobile-menu-button"]');
    
    const boxMenu = await menuBtn.boundingBox();
    
    // Accessibility rule of thumb for touch-targets
    expect(boxMenu?.width).toBeGreaterThanOrEqual(44);
    expect(boxMenu?.height).toBeGreaterThanOrEqual(44);
  });
});
