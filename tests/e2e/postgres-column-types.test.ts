import { test, expect } from '@playwright/test';

test.describe('PostgreSQL Column Types', () => {
  test('should display proper column types in node dialog', async ({ page }) => {
    // Navigate to the chat page
    await page.goto('/chat');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="workflow-editor"]', { timeout: 10000 });
    
    // Add a PostgreSQL input node
    await page.click('[data-testid="add-node-button"]');
    await page.click('text=PostgreSQL Input');
    
    // Wait for the node to be added
    await page.waitForSelector('[data-testid="postgres-input-node"]');
    
    // Open the node dialog
    await page.click('[data-testid="postgres-input-node"]');
    await page.click('text=Configure');
    
    // Wait for the dialog to open
    await page.waitForSelector('[data-testid="postgres-dialog"]');
    
    // Fill in connection details (using test database)
    await page.fill('[data-testid="host-input"]', 'localhost');
    await page.fill('[data-testid="database-input"]', 'testdb');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'testpass');
    
    // Click fetch tables
    await page.click('text=Fetch Tables');
    
    // Wait for tables to load
    await page.waitForSelector('[data-testid="table-list"]', { timeout: 10000 });
    
    // Select a table
    await page.click('[data-testid="table-item"]');
    
    // Wait for table data to load
    await page.waitForSelector('[data-testid="table-preview"]', { timeout: 10000 });
    
    // Check that column types are displayed (not "unknown")
    const columnTypes = await page.locator('[data-testid="column-type"]').allTextContents();
    
    // Verify that at least some column types are not "unknown"
    const hasValidTypes = columnTypes.some(type => type !== 'unknown' && type !== '');
    expect(hasValidTypes).toBe(true);
    
    // Check the node view as well
    await page.click('text=Close');
    await page.waitForSelector('[data-testid="node-view"]');
    
    // Verify column types in the view
    const viewColumnTypes = await page.locator('[data-testid="view-column-type"]').allTextContents();
    const viewHasValidTypes = viewColumnTypes.some(type => type !== 'unknown' && type !== '');
    expect(viewHasValidTypes).toBe(true);
  });
});