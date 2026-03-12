import { test, expect } from '@playwright/test';

/**
 * TaskFlow Pro — E2E Profile Tests
 * Suite covering isolated workflow states (E2E-PROF-01 to 03)
 */

test.describe('Profile Setting Workflows', () => {
  let user: { email: string, pass: string };

  test.beforeEach(async ({ page }) => {
    user = { email: `e2e_prof_${Date.now()}@test.com`, pass: 'TestPass123!' };

    // Register User
    await page.goto('/register');
    await page.fill('[data-testid="fullname-input"]', 'Profile User');
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
    
    // Go to Profile
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="profile-link"]');
    await page.waitForURL('/profile');
  });

  test('TC-E2E-PROF-01: Update display name', async ({ page }) => {
    await page.fill('[data-testid="profile-name-input"]', 'Updated Profile Name');
    await page.click('[data-testid="save-profile-button"]');

    // Wait for success toast
    await expect(page.locator('[data-testid="success-alert"]')).toBeVisible();

    // Verify NavBar shows updated name immediately
    await expect(page.locator('[data-testid="user-menu"]')).toContainText('Updated Profile Name');
  });

  test('TC-E2E-PROF-03: Wrong current password', async ({ page }) => {
    // Switch to Password Tab if applicable 
    if (await page.locator('[data-testid="tab-password"]').isVisible()) {
        await page.click('[data-testid="tab-password"]');
    }

    await page.fill('[data-testid="current-password-input"]', 'WrongPass123!');
    await page.fill('[data-testid="new-password-input"]', 'NewPass123!');
    await page.fill('[data-testid="confirm-new-password-input"]', 'NewPass123!');
    
    await page.click('[data-testid="change-password-button"]');

    // Should see an error block/alert instead of success
    await expect(page.locator('[data-testid="error-message"], [data-testid="error-alert"], [data-testid="password-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-alert"]')).not.toBeVisible();
  });

  test('TC-E2E-PROF-02: Change password', async ({ page }) => {
    if (await page.locator('[data-testid="tab-password"]').isVisible()) {
        await page.click('[data-testid="tab-password"]');
    }

    await page.fill('[data-testid="current-password-input"]', user.pass);
    await page.fill('[data-testid="new-password-input"]', 'NewSecurePass123!');
    await page.fill('[data-testid="confirm-new-password-input"]', 'NewSecurePass123!');
    
    await page.click('[data-testid="change-password-button"]');

    // Wait for success toast
    await expect(page.locator('[data-testid="success-alert"]')).toBeVisible();

    // Verify old password no longer works by Logging Out and Logging In
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', user.pass);
    await page.click('[data-testid="login-button"]');

    // Should see error
    await expect(page.locator('[data-testid="error-alert"]')).toBeVisible();
  });
});
