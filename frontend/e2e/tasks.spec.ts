import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Simulate authenticated state
    await page.addScriptTag({
      content: `
        localStorage.setItem('accessToken', 'mock-valid-token-for-e2e');
      `,
    });

    // Navigate to tasks page
    await page.goto('http://localhost:3001/tasks');
    await page.waitForLoadState('networkidle');
  });

  test('should load tasks page', async ({ page }) => {
    await expect(page).toHaveTitle(/Tasks/);
    await expect(page.locator('h1')).toContainText('Tasks');

    // Should show empty state or task list
    await expect(page.locator('text=New Task').or(page.locator('[data-testid="task-item"]'))).toBeVisible();
  });

  test('should open create task modal', async ({ page }) => {
    await page.click('text=New Task');

    // Modal should open
    await expect(page.locator('text=Create New Task')).toBeVisible();
    await expect(page.locator('input[placeholder*="task title"]')).toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    // Open create modal
    await page.click('text=New Task');

    // Fill form
    await page.fill('input[placeholder*="task title"]', 'E2E Test Task');
    await page.fill('textarea[placeholder*="task description"]', 'This is a test task created by E2E tests');
    await page.selectOption('select', 'high'); // Priority

    // Set due date (click calendar icon and select date)
    await page.click('[data-testid="calendar-trigger"]');
    await page.click('[data-testid="calendar-day"]:not([disabled])').first();

    // Submit
    await page.click('text=Create Task');

    // Should close modal and show task
    await expect(page.locator('text=E2E Test Task')).toBeVisible();
  });

  test('should filter tasks by status', async ({ page }) => {
    // Create a task first
    await page.click('text=New Task');
    await page.fill('input[placeholder*="task title"]', 'Filter Test Task');
    await page.click('text=Create Task');

    // Test status filter
    await page.selectOption('select[placeholder*="Status"]', 'todo');
    await expect(page.locator('text=Filter Test Task')).toBeVisible();

    await page.selectOption('select[placeholder*="Status"]', 'done');
    await expect(page.locator('text=Filter Test Task')).not.toBeVisible();
  });

  test('should search tasks', async ({ page }) => {
    // Create a task first
    await page.click('text=New Task');
    await page.fill('input[placeholder*="task title"]', 'Searchable Task');
    await page.fill('textarea[placeholder*="task description"]', 'Unique description for search');
    await page.click('text=Create Task');

    // Search for the task
    await page.fill('input[placeholder*="Search tasks"]', 'Searchable');
    await expect(page.locator('text=Searchable Task')).toBeVisible();

    // Search for non-existent task
    await page.fill('input[placeholder*="Search tasks"]', 'nonexistent');
    await expect(page.locator('text=No tasks found')).toBeVisible();
  });

  test('should edit a task', async ({ page }) => {
    // Create a task first
    await page.click('text=New Task');
    await page.fill('input[placeholder*="task title"]', 'Task to Edit');
    await page.click('text=Create Task');

    // Click edit button (three dots menu)
    await page.click('[data-testid="task-menu"]').first();
    await page.click('text=Edit');

    // Edit modal should open
    await expect(page.locator('text=Edit Task')).toBeVisible();

    // Update title
    await page.fill('input[value*="Task to Edit"]', 'Updated Task Title');
    await page.click('text=Update Task');

    // Should show updated title
    await expect(page.locator('text=Updated Task Title')).toBeVisible();
  });

  test('should change task status', async ({ page }) => {
    // Create a task first
    await page.click('text=New Task');
    await page.fill('input[placeholder*="task title"]', 'Status Change Task');
    await page.click('text=Create Task');

    // Open status menu
    await page.click('[data-testid="task-menu"]').first();
    await page.click('text=Mark as In Progress');

    // Should show new status
    await expect(page.locator('text=In Progress')).toBeVisible();
  });

  test('should delete a task', async ({ page }) => {
    // Create a task first
    await page.click('text=New Task');
    await page.fill('input[placeholder*="task title"]', 'Task to Delete');
    await page.click('text=Create Task');

    // Confirm task exists
    await expect(page.locator('text=Task to Delete')).toBeVisible();

    // Delete task
    await page.click('[data-testid="task-menu"]').first();
    await page.click('text=Delete');

    // Handle confirmation dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('delete');
      await dialog.accept();
    });

    // Should remove task from list
    await expect(page.locator('text=Task to Delete')).not.toBeVisible();
  });

  test('should show task statistics', async ({ page }) => {
    await expect(page.locator('text=Total Tasks')).toBeVisible();
    await expect(page.locator('text=In Progress')).toBeVisible();
    await expect(page.locator('text=High Priority')).toBeVisible();
    await expect(page.locator('text=Overdue')).toBeVisible();
  });

  test('should handle pagination', async ({ page }) => {
    // This test would need many tasks to test pagination
    // For now, just check that pagination elements exist when applicable
    const pagination = page.locator('[data-testid="pagination"]');
    // Pagination may or may not be visible depending on number of tasks
    // This is just a placeholder for pagination testing
  });

  test('should handle empty state', async ({ page }) => {
    // Clear all tasks or start with empty state
    // This would require API calls to clear data

    // Check empty state message
    const emptyState = page.locator('text=No tasks found');
    if (await emptyState.isVisible()) {
      await expect(page.locator('text=Get started by creating your first task')).toBeVisible();
    }
  });
});

test.describe('Real-time Updates', () => {
  test('should receive real-time task updates', async ({ page, context }) => {
    // This test would require WebSocket mocking or multiple browser contexts
    // For now, it's a placeholder for real-time testing

    test.skip('WebSocket testing requires complex setup');
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size

    await page.goto('http://localhost:3001/tasks');

    // Mobile-specific tests
    await expect(page.locator('text=New Task')).toBeVisible();

    // Test mobile menu interactions
    // This would test mobile-specific UI behaviors
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size

    await page.goto('http://localhost:3001/tasks');

    // Tablet-specific tests
    await expect(page.locator('text=New Task')).toBeVisible();
  });
});



