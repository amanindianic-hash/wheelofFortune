/**
 * segments.spec.ts — Edit segment label, weight and verify persistence.
 */
import { test, expect } from '@playwright/test';

async function openFirstWheel(page: import('@playwright/test').Page): Promise<boolean> {
  const res = await page.request.get('/api/wheels');
  if (!res.ok()) return false;
  const data = await res.json();
  const wheelId = data.wheels?.[0]?.id;
  if (!wheelId) return false;
  await page.goto(`/dashboard/wheels/${wheelId}`);
  await expect(page).toHaveURL(/\/dashboard\/wheels\/.+/);
  return true;
}

test.describe('Segment editing', () => {
  test('segment list is visible in wheel editor', async ({ page }) => {
    const opened = await openFirstWheel(page);
    if (!opened) { test.skip(); return; }

    await expect(page.getByText(/segment/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('can edit segment label', async ({ page }) => {
    const opened = await openFirstWheel(page);
    if (!opened) { test.skip(); return; }

    // Label inputs render as plain text inputs with class "h-8 text-sm" — no placeholder
    const labelInput = page.locator('input.h-8').first();
    await expect(labelInput).toBeVisible({ timeout: 8_000 });

    const newLabel = `Win ${Date.now()}`;
    await labelInput.fill(newLabel);

    await page.getByRole('button', { name: /save segments/i }).click();
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 5_000 });
  });

  test('can change segment weight', async ({ page }) => {
    const opened = await openFirstWheel(page);
    if (!opened) { test.skip(); return; }

    // Weight inputs are spinbuttons (type="number")
    const weightInput = page.getByRole('spinbutton').first();
    await expect(weightInput).toBeVisible({ timeout: 8_000 });

    await weightInput.fill('2');
    await page.getByRole('button', { name: /save segments/i }).click();
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 5_000 });
  });

  test('save persists changes across page reload', async ({ page }) => {
    const opened = await openFirstWheel(page);
    if (!opened) { test.skip(); return; }

    const labelInput = page.locator('input.h-8').first();
    await expect(labelInput).toBeVisible({ timeout: 8_000 });

    const uniqueLabel = `Persist ${Date.now()}`;
    await labelInput.fill(uniqueLabel);

    await page.getByRole('button', { name: /save segments/i }).click();
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 5_000 });

    await page.reload();
    await expect(page.locator('input.h-8').first()).toHaveValue(uniqueLabel, { timeout: 8_000 });
  });
});
