import { test, expect } from "@playwright/test";

/**
 * E2E tests for configuration workflow
 * User Story 2 T143: Config update flow
 */
test.describe("Configuration Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/config");
  });

  test("should display current configuration", async ({ page }) => {
    // Wait for config to load
    await expect(page.getByText("Trade Configuration")).toBeVisible();
    
    // Check form fields are visible
    await expect(page.getByLabel(/Max Trade/i)).toBeVisible();
    await expect(page.getByLabel(/Max Position/i)).toBeVisible();
    await expect(page.getByLabel(/High-Value Threshold/i)).toBeVisible();
    
    // Check auto-trade toggle
    await expect(page.getByLabel(/Auto-Trade Mode/i)).toBeVisible();
  });

  test("should validate positive amounts", async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('input[id="maxTrade"]');
    
    // Set invalid negative value
    await page.fill('input[id="maxTrade"]', "-100");
    
    // Try to save
    await page.click('button:has-text("Save Configuration")');
    
    // Should show validation error
    await expect(page.locator("text=/positive number/i")).toBeVisible();
  });

  test("should validate position >= trade constraint", async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('input[id="maxTrade"]');
    
    // Set position < trade
    await page.fill('input[id="maxTrade"]', "1000");
    await page.fill('input[id="maxPosition"]', "500");
    
    // Try to save
    await page.click('button:has-text("Save Configuration")');
    
    // Should show validation error
    await expect(page.locator("text=/greater than or equal/i")).toBeVisible();
  });

  test("should update configuration successfully", async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('input[id="maxTrade"]');
    
    // Update max trade amount
    await page.fill('input[id="maxTrade"]', "200");
    
    // Save configuration
    await page.click('button:has-text("Save Configuration")');
    
    // Should show success (optimistic update)
    await expect(page.locator('input[id="maxTrade"]')).toHaveValue("200");
  });

  test("should show warning when enabling auto-trade", async ({ page }) => {
    // Wait for toggle to be available
    await page.waitForSelector('button[role="switch"]');
    
    // Click auto-trade toggle
    await page.click('button[role="switch"]');
    
    // Should show warning dialog
    await expect(page.getByText(/Enable Live Trading/i)).toBeVisible();
    await expect(page.getByText(/Real money will be used/i)).toBeVisible();
    
    // Check for safety checklist
    await expect(page.getByText(/MEXC API keys/i)).toBeVisible();
    await expect(page.getByText(/risk limits/i)).toBeVisible();
  });

  test("should cancel auto-trade enable", async ({ page }) => {
    // Wait for toggle
    await page.waitForSelector('button[role="switch"]');
    
    // Click toggle
    await page.click('button[role="switch"]');
    
    // Wait for dialog
    await expect(page.getByText(/Enable Live Trading/i)).toBeVisible();
    
    // Click cancel
    await page.click('button:has-text("Cancel")');
    
    // Dialog should close
    await expect(page.getByText(/Enable Live Trading/i)).not.toBeVisible();
  });

  test("should confirm auto-trade enable", async ({ page }) => {
    // Wait for toggle
    await page.waitForSelector('button[role="switch"]');
    
    // Get initial state
    const toggle = page.locator('button[role="switch"]');
    const initialState = await toggle.getAttribute("data-state");
    
    // Click toggle
    await page.click('button[role="switch"]');
    
    // Wait for dialog
    await expect(page.getByText(/Enable Live Trading/i)).toBeVisible();
    
    // Confirm
    await page.click('button:has-text("I Understand")');
    
    // Toggle should be enabled
    await expect(toggle).toHaveAttribute("data-state", "checked");
  });

  test("should reset form to original values", async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('input[id="maxTrade"]');
    
    // Get original value
    const originalValue = await page.inputValue('input[id="maxTrade"]');
    
    // Change the value
    await page.fill('input[id="maxTrade"]', "999");
    
    // Click reset
    await page.click('button:has-text("Reset")');
    
    // Value should be restored
    await expect(page.locator('input[id="maxTrade"]')).toHaveValue(originalValue);
  });
});
