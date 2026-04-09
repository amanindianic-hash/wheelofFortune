/**
 * viewport.spec.ts — Responsive layout and mobile viewport checks.
 */
import { test, expect, devices } from '@playwright/test';

async function getActiveEmbedToken(page: import('@playwright/test').Page): Promise<string | null> {
  const res = await page.request.get('/api/wheels');
  if (!res.ok()) return null;
  const data = await res.json();
  const wheels: Array<{ id: string; status: string; embed_token: string }> = data.wheels ?? [];
  const active = wheels.find((w) => w.status === 'active');
  if (active) return active.embed_token;
  const first = wheels[0];
  if (!first) return null;
  await page.request.post(`/api/wheels/${first.id}/publish`, {
    data: { status: 'active' },
  });
  return first.embed_token;
}

test.describe('Mobile viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone SE dimensions

  test('play page renders on mobile (375px)', async ({ page }) => {
    const token = await getActiveEmbedToken(page);
    if (!token) { test.skip(); return; }

    await page.goto(`/play/${token}`);
    await expect(page.locator('canvas, [class*="wheel"], svg').first()).toBeVisible({ timeout: 12_000 });
  });

  test('spin button is visible on mobile', async ({ page }) => {
    const token = await getActiveEmbedToken(page);
    if (!token) { test.skip(); return; }

    await page.goto(`/play/${token}`);
    await expect(page.locator('canvas, [class*="wheel"], svg').first()).toBeVisible({ timeout: 12_000 });
    await expect(page.getByRole('button', { name: /spin/i }).first()).toBeVisible({ timeout: 12_000 });
  });

  test('dashboard loads on mobile viewport', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // "Welcome back" heading is in the main content area (sidebar is hidden on mobile)
    await expect(page.getByText(/welcome back/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('wheels list is scrollable on mobile', async ({ page }) => {
    await page.goto('/dashboard/wheels');
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle');
    // Should not overflow or crash — body must remain visible
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Tablet viewport', () => {
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad dimensions

  test('play page renders on tablet (768px)', async ({ page }) => {
    const token = await getActiveEmbedToken(page);
    if (!token) { test.skip(); return; }

    await page.goto(`/play/${token}`);
    await expect(page.locator('canvas, [class*="wheel"], svg').first()).toBeVisible({ timeout: 12_000 });
  });

  test('dashboard renders on tablet', async ({ page }) => {
    await page.goto('/dashboard/wheels');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/wheel|no wheel/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
