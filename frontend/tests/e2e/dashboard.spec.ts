import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should load dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check page loaded
    await expect(page.locator('h1')).toContainText('MEXC Sniper Bot');
    
    // Check main components are visible
    await expect(page.getByText('Bot Status')).toBeVisible();
    await expect(page.getByText('Monitor Controls')).toBeVisible();
    await expect(page.getByText('Recent Listings')).toBeVisible();
  });

  test('should show monitor controls', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check start/stop buttons exist
    await expect(page.getByRole('button', { name: /start/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /stop/i })).toBeVisible();
  });

  test('should display empty state when no listings', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for potential data loading
    await page.waitForTimeout(4000); // Wait for initial query
    
    // Check for empty state or listings table
    const hasEmptyState = await page.getByText('No listings yet').isVisible().catch(() => false);
    const hasListings = await page.getByRole('table').isVisible().catch(() => false);
    
    // One of these should be true
    expect(hasEmptyState || hasListings).toBeTruthy();
  });
});

test.describe('Health Page', () => {
  test('should load health check page', async ({ page }) => {
    await page.goto('/health');
    
    // Health page should load
    await expect(page.locator('body')).toBeVisible();
  });
});
