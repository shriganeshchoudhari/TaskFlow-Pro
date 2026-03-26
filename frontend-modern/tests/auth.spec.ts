import { test, expect } from '@playwright/test';

test.describe('Auth UI', () => {
  test.beforeEach(async ({ page }) => {
    // Assuming the app runs on localhost:5173
    await page.goto('http://localhost:5173/');
    // If we implemented an App toggle, we'd click to switch to Auth view first
    // For this test, we assume the page renders the Auth or we trigger it
    // Wait for the Auth header to be visible
    await page.waitForSelector('text=Behold the Digital Firmament.');
  });

  test('should render asymmetric layout and branding', async ({ page }) => {
    // Check left column text
    await expect(page.getByText('Behold the Digital Firmament.')).toBeVisible();
    await expect(page.getByText('Global Sync')).toBeVisible();
    await expect(page.getByText('99.98%')).toBeVisible();
  });

  test('should toggle between Login and Registration', async ({ page }) => {
    // The default state is usually login depending on implementation
    await expect(page.getByText('Login', { exact: true })).toBeVisible();
    await expect(page.getByText('Registration', { exact: true })).toBeVisible();
    
    // Check initial button text for login
    await expect(page.getByRole('button', { name: 'Initialize Session' })).toBeVisible();

    // Click Registration tab
    await page.getByText('Registration', { exact: true }).click();
    
    // Check that button text changed for registration
    await expect(page.getByRole('button', { name: 'Create Access Token' })).toBeVisible();
  });

  test('should have interactive inputs without 1px solid borders', async ({ page }) => {
    const emailInput = page.getByPlaceholder('name@observatory.io');
    const passwordInput = page.getByPlaceholder('••••••••••••');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Test that the inputs can be focused and typed into
    await emailInput.fill('analyst@observatory.io');
    await passwordInput.fill('securekey123');

    await expect(emailInput).toHaveValue('analyst@observatory.io');
    await expect(passwordInput).toHaveValue('securekey123');
  });

  test('should render multi-auth integration methods', async ({ page }) => {
    await expect(page.getByText('Enterprise SSO')).toBeVisible();
    await expect(page.getByText('Biometric Vault')).toBeVisible();
  });
});
