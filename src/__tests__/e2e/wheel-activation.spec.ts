/**
 * wheel-activation.spec.ts — Publish/pause wheel status flows.
 */
import { test, expect } from '@playwright/test';

async function getFirstWheel(page: import('@playwright/test').Page): Promise<{ id: string; status: string } | null> {
  const res = await page.request.get('/api/wheels');
  if (!res.ok()) return null;
  const data = await res.json();
  return data.wheels?.[0] ?? null;
}

test.describe('Wheel activation', () => {
  test('can activate a wheel via API', async ({ page }) => {
    const wheel = await getFirstWheel(page);
    if (!wheel) { test.skip(); return; }

    const res = await page.request.post(`/api/wheels/${wheel.id}/publish`, {
      data: { status: 'active' },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.wheel?.status).toBe('active');
  });

  test('can pause an active wheel via API', async ({ page }) => {
    const wheel = await getFirstWheel(page);
    if (!wheel) { test.skip(); return; }

    // First activate
    await page.request.post(`/api/wheels/${wheel.id}/publish`, {
      data: { status: 'active' },
    });

    // Then pause
    const res = await page.request.post(`/api/wheels/${wheel.id}/publish`, {
      data: { status: 'paused' },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.wheel?.status).toBe('paused');
  });

  test('wheel editor shows publish/status controls', async ({ page }) => {
    const wheel = await getFirstWheel(page);
    if (!wheel) { test.skip(); return; }

    await page.goto(`/dashboard/wheels/${wheel.id}`);
    await expect(page.locator('body')).toBeVisible();

    // Button toggles: "Pause" when active, "Activate" when paused/draft
    await expect(
      page.getByRole('button', { name: /pause|activate/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('paused wheel returns 503 on public play page', async ({ page }) => {
    const wheel = await getFirstWheel(page);
    if (!wheel) { test.skip(); return; }

    // Pause the wheel
    await page.request.post(`/api/wheels/${wheel.id}/publish`, {
      data: { status: 'paused' },
    });

    // Get embed_token
    const wheelRes = await page.request.get('/api/wheels');
    const wheelData = await wheelRes.json();
    const embedToken = wheelData.wheels?.find((w: { id: string; embed_token: string }) => w.id === wheel.id)?.embed_token;
    if (!embedToken) { test.skip(); return; }

    // Try to create session for paused wheel (should fail)
    const sessionRes = await page.request.post('/api/spin/session', {
      data: { embed_token: embedToken },
    });
    expect(sessionRes.status()).toBe(503);

    // Re-activate for other tests
    await page.request.post(`/api/wheels/${wheel.id}/publish`, {
      data: { status: 'active' },
    });
  });
});
