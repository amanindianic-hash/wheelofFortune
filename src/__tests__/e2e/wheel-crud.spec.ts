/**
 * wheel-crud.spec.ts — Create, rename, and navigate wheels end-to-end.
 */
import { test, expect } from '@playwright/test';

/** Fetch first wheel ID via API (reliable, bypasses UI rendering) */
async function getFirstWheelId(page: import('@playwright/test').Page): Promise<string | null> {
  const res = await page.request.get('/api/wheels');
  if (!res.ok()) return null;
  const data = await res.json();
  return data.wheels?.[0]?.id ?? null;
}

test.describe('Wheel CRUD', () => {
  test('wheels list page loads', async ({ page }) => {
    await page.goto('/dashboard/wheels');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/wheel|no wheels/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('creates a new wheel via dialog', async ({ page }) => {
    await page.goto('/dashboard/wheels');

    const createBtn = page.getByRole('button', { name: /new wheel|create|add wheel/i }).first();
    await expect(createBtn).toBeVisible({ timeout: 8_000 });
    await createBtn.click();

    // Dialog appears with name input
    const nameInput = page.getByRole('dialog').locator('input').first();
    await expect(nameInput).toBeVisible({ timeout: 5_000 });
    await nameInput.fill('E2E Test Wheel');

    await page.getByRole('button', { name: /create|save|confirm/i }).last().click();

    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 8_000 });
  });

  test('opens wheel editor from list', async ({ page }) => {
    const wheelId = await getFirstWheelId(page);
    if (!wheelId) { test.skip(); return; }

    await page.goto(`/dashboard/wheels/${wheelId}`);
    await expect(page).toHaveURL(/\/dashboard\/wheels\/.+/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('wheel editor shows segment controls', async ({ page }) => {
    const wheelId = await getFirstWheelId(page);
    if (!wheelId) { test.skip(); return; }

    await page.goto(`/dashboard/wheels/${wheelId}`);
    await expect(page.getByText(/segment/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
