/**
 * auth.spec.ts — Login/logout flow tests.
 */
import { test, expect } from '@playwright/test';

// Override storageState — test unauthenticated browser
test.use({ storageState: { cookies: [], origins: [] } });

const EMAIL    = process.env.E2E_EMAIL    ?? 'test@example.com';
const PASSWORD = process.env.E2E_PASSWORD ?? 'password123';

test.describe('Login page', () => {
  test('shows login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should stay on login page
    await expect(page).toHaveURL(/login/);
    // Toast or inline error should appear
    await expect(page.locator('[data-sonner-toast], [role="alert"]').first()).toBeVisible({ timeout: 5_000 });
  });

  test('redirects to dashboard on valid login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForURL('**/dashboard**', { timeout: 15_000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('redirects unauthenticated users from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login**', { timeout: 10_000 });
    await expect(page).toHaveURL(/login/);
  });
});
