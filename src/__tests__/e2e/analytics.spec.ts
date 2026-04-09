/**
 * analytics.spec.ts — Analytics dashboard page flows.
 */
import { test, expect } from '@playwright/test';

test.describe('Analytics', () => {
  test('analytics dashboard page loads', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/analytics|spin|total/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('analytics page shows summary metrics', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    // Metrics like "Total Spins", "Total Winners", etc. should appear
    await expect(
      page.getByText(/total spins|total winners|spins|winners/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('analytics page renders without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('networkidle');

    // Filter out common third-party noise
    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error exception')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('analytics API returns valid structure', async ({ page }) => {
    const res = await page.request.get('/api/analytics');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('summary');
    expect(data).toHaveProperty('daily');
    expect(data).toHaveProperty('prize_breakdown');
    expect(data).toHaveProperty('segment_breakdown');
    expect(data).toHaveProperty('device_breakdown');
    expect(data).toHaveProperty('os_breakdown');
  });

  test('analytics API accepts wheel_id filter', async ({ page }) => {
    const wheelsRes = await page.request.get('/api/wheels');
    const wheelsData = await wheelsRes.json();
    const wheelId = wheelsData.wheels?.[0]?.id;
    if (!wheelId) { test.skip(); return; }

    const res = await page.request.get(`/api/analytics?wheel_id=${wheelId}`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.summary).toBeDefined();
  });

  test('analytics API accepts date range params', async ({ page }) => {
    const from = new Date(Date.now() - 7 * 86400_000).toISOString();
    const to   = new Date().toISOString();
    const res = await page.request.get(`/api/analytics?from=${from}&to=${to}`);
    expect(res.ok()).toBeTruthy();
  });
});
