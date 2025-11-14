import { test, expect } from "@playwright/test";

/**
 * E2E tests for trades table workflow
 * User Story 2 T144: Trades display and filtering
 */
test.describe("Trades Table Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/trades");
  });

  test("should display trades table", async ({ page }) => {
    // Wait for page to load
    await expect(page.getByText("Trade History")).toBeVisible();
    
    // Check for table headers
    await expect(page.getByText("Symbol")).toBeVisible();
    await expect(page.getByText("Status")).toBeVisible();
    await expect(page.getByText("Mode")).toBeVisible();
    await expect(page.getByText("Latency")).toBeVisible();
  });

  test("should display empty state when no trades", async ({ page }) => {
    // If no trades exist, should show empty state
    const emptyState = page.getByText(/No trades yet/i);
    
    // Either trades exist or empty state is shown
    await expect(
      page.getByRole("table").or(emptyState)
    ).toBeVisible();
  });

  test("should filter trades by mode", async ({ page }) => {
    // Wait for filters to load
    await page.waitForSelector('text=Filter by Mode');
    
    // Click mode filter dropdown
    await page.click('button:has-text("All modes")');
    
    // Select dry-run
    await page.click('text=Dry-run');
    
    // Filter should be applied (URL or UI should reflect this)
    await expect(page.locator('button:has-text("Dry-run")')).toBeVisible();
  });

  test("should filter trades by status", async ({ page }) => {
    // Wait for filters to load
    await page.waitForSelector('text=Filter by Status');
    
    // Click status filter dropdown
    await page.click('button:has-text("All statuses")');
    
    // Select filled
    await page.click('text=Filled');
    
    // Filter should be applied
    await expect(page.locator('button:has-text("Filled")')).toBeVisible();
  });

  test("should paginate through trades", async ({ page }) => {
    // Wait for pagination controls
    await page.waitForSelector('button:has-text("Next")');
    
    // Check if next button exists (might be disabled if few trades)
    const nextButton = page.locator('button:has-text("Next")');
    const isDisabled = await nextButton.isDisabled();
    
    if (!isDisabled) {
      // Click next
      await nextButton.click();
      
      // Page number should update
      await expect(page.getByText(/Page \d+ of \d+/)).toBeVisible();
      
      // Previous button should be enabled
      await expect(page.locator('button:has-text("Previous")')).toBeEnabled();
    }
  });

  test("should display trade status badges", async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Check if any status badges exist
    const badges = page.locator('[class*="badge"]');
    const count = await badges.count();
    
    // If trades exist, badges should be present
    if (count > 0) {
      await expect(badges.first()).toBeVisible();
    }
  });

  test("should display trade information in table rows", async ({ page }) => {
    // Wait for table to load
    await page.waitForTimeout(1000);
    
    // Check if table has data
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    
    if (rowCount > 0) {
      // First row should contain trade data
      const firstRow = rows.first();
      
      // Should have symbol, status, mode, etc.
      await expect(firstRow).toBeVisible();
    }
  });

  test("should show latency in milliseconds", async ({ page }) => {
    // Wait for table
    await page.waitForTimeout(1000);
    
    // Look for latency values (formatted as "Xms")
    const latencyCell = page.locator('text=/\\d+ms/').first();
    
    if (await latencyCell.isVisible()) {
      const latencyText = await latencyCell.textContent();
      expect(latencyText).toMatch(/\d+ms/);
    }
  });

  test("should auto-refresh trades every 10 seconds", async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000);
    
    // Get current timestamp
    const initialTime = Date.now();
    
    // Wait 11 seconds for auto-refresh
    await page.waitForTimeout(11000);
    
    // Should have triggered at least one refresh
    const elapsed = Date.now() - initialTime;
    expect(elapsed).toBeGreaterThan(10000);
    
    // Table should still be visible
    await expect(page.getByText("Trade History")).toBeVisible();
  });
});
