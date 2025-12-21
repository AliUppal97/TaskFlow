import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing state
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('should load login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveTitle(/Login - TaskFlow/);
    await expect(page.locator('h1')).toContainText('Sign in to TaskFlow');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');

    await page.click('button[type="submit"]');

    // Wait for validation errors
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid email address')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');

    await page.click('text=Sign up');
    await expect(page).toHaveURL(/\/register/);
  });

  test('should redirect authenticated users from login to dashboard', async ({ page }) => {
    // Simulate authenticated state
    await page.addScriptTag({
      content: `
        localStorage.setItem('accessToken', 'mock-valid-token');
      `,
    });

    await page.goto('/login');

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Landing Page', () => {
  test('should load landing page for unauthenticated users', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/TaskFlow/);
    await expect(page.locator('h1')).toContainText('TaskFlow');
    await expect(page.locator('text=Get Started')).toBeVisible();
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('should redirect authenticated users to dashboard', async ({ page }) => {
    // Simulate authenticated state
    await page.addScriptTag({
      content: `
        localStorage.setItem('accessToken', 'mock-valid-token');
      `,
    });

    await page.goto('/');

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Simulate authenticated state
    await page.addScriptTag({
      content: `
        localStorage.setItem('accessToken', 'mock-valid-token');
      `,
    });
  });

  test('should load dashboard for authenticated users', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveTitle(/Dashboard - TaskFlow/);
    await expect(page.locator('h1')).toContainText('TaskFlow Dashboard');
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Clear authentication
    await page.evaluate(() => localStorage.clear());

    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/\/login/);
  });
});




