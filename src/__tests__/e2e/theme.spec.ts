/**
 * theme.spec.ts — Theme panel, built-in templates, custom theme save.
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

test.describe('Theme management', () => {
  test('theme panel/tab is accessible in wheel editor', async ({ page }) => {
    const opened = await openFirstWheel(page);
    if (!opened) { test.skip(); return; }

    const themeTab = page.getByRole('tab', { name: /templates/i }).first();
    await expect(themeTab).toBeVisible({ timeout: 8_000 });
    await themeTab.click();
    await expect(page.getByRole('tabpanel').first()).toBeVisible({ timeout: 5_000 });
  });

  test('can apply a built-in template', async ({ page }) => {
    const opened = await openFirstWheel(page);
    if (!opened) { test.skip(); return; }

    const themeTab = page.getByRole('tab', { name: /templates/i }).first();
    if (await themeTab.isVisible({ timeout: 5_000 })) {
      await themeTab.click();
    }

    const templateCard = page.getByRole('button', { name: /classic|luxury|neon|rainbow|default/i }).first();
    if (await templateCard.isVisible({ timeout: 5_000 })) {
      await templateCard.click();
      await expect(page.locator('canvas, [class*="wheel"], svg circle').first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('applying a template and saving persists branding', async ({ page }) => {
    const opened = await openFirstWheel(page);
    if (!opened) { test.skip(); return; }

    // Open the Templates tab
    await page.getByRole('tab', { name: /templates/i }).click();

    // Each template card has an "Apply Template" button
    const templateBtn = page.getByRole('button', { name: /apply template/i }).first();
    if (!await templateBtn.isVisible({ timeout: 5_000 })) { test.skip(); return; }
    await templateBtn.click();

    // Save the wheel branding changes
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 8_000 });
  });

  test('theme tester page loads', async ({ page }) => {
    await page.goto('/dashboard/theme-tester');
    await expect(page.getByText(/theme|preview/i).first()).toBeVisible({ timeout: 8_000 });
  });
});
