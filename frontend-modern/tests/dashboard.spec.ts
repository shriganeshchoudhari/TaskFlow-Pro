import { test, expect } from '@playwright/test';

test.describe('Dashboard UI', () => {
  test.beforeEach(async ({ page }) => {
    // Assuming the app runs on localhost:5173 which is Vite's default
    await page.goto('http://localhost:5173/');
  });

  test('should render the Luminous Observatory Header', async ({ page }) => {
    // Verify the header text exists
    await expect(page.getByText('Luminous Observatory')).toBeVisible();
  });

  test('should render the main Hero Metric (Global Network Signal)', async ({ page }) => {
    // Verify the large stat
    await expect(page.getByText('Global Network Signal')).toBeVisible();
    await expect(page.getByText('429.8K')).toBeVisible();
  });

  test('should display all three Orbital Metrics stat cards', async ({ page }) => {
    // Verify specific stat titles
    await expect(page.getByText('Active Nodes')).toBeVisible();
    await expect(page.getByText('Efficiency')).toBeVisible();
    await expect(page.getByText('Data Drift')).toBeVisible();
    
    // Check specific values
    await expect(page.getByText('18,502')).toBeVisible();
    await expect(page.getByText('4.2ms')).toBeVisible();
    await expect(page.getByText('0.012')).toBeVisible();
  });

  test('should display Spectral Events section and at least one event', async ({ page }) => {
    await expect(page.getByText('Spectral Events')).toBeVisible();
    await expect(page.getByText('Anomaly Detected: Sector 7G')).toBeVisible();
    
    // Test hover effect by checking if the element exists and can be hovered
    // The exact visual snapshot wouldn't be asserted here without configuration, but we test interaction
    const eventItem = page.getByText('Anomaly Detected: Sector 7G').locator('..');
    await eventItem.hover();
  });

  test('should have a responsive bottom navigation on mobile ONLY', async ({ page, isMobile }) => {
    const mobileNav = page.locator('nav.fixed.bottom-0');
    if (isMobile) {
       await expect(mobileNav).toBeVisible();
    } else {
       await expect(mobileNav).toBeHidden();
    }
  });
});
