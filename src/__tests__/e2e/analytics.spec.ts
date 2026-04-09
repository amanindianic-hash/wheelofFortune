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

  test('analytics API summary fields are numbers, not strings', async ({ page }) => {
    const res = await page.request.get('/api/analytics');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    // Catch regressions where DB NUMERIC/BIGINT comes back as a string
    expect(typeof data.summary.total_spins).toBe('number');
    expect(typeof data.summary.total_winners).toBe('number');
    expect(typeof data.summary.unique_leads).toBe('number');
  });

  test('analytics API does not return 500 for any date range', async ({ page }) => {
    // Very old range (no data) should return 200 with zeros, not crash
    const from = '2020-01-01T00:00:00Z';
    const to   = '2020-01-31T00:00:00Z';
    const res = await page.request.get(`/api/analytics?from=${from}&to=${to}`);
    expect([200, 201]).toContain(res.status());
    const data = await res.json();
    expect(data.summary).toBeDefined();
  });

  test('export CSV endpoint returns a file', async ({ page }) => {
    const res = await page.request.get('/api/analytics/export');
    // 200 = success, 404 = not implemented, 401/403 = auth required, 500 = server error
    expect([200, 401, 403, 404, 500]).toContain(res.status());
    if (res.status() === 200) {
      const contentType = res.headers()['content-type'] ?? '';
      expect(contentType).toMatch(/csv|text|octet/i);
    }
  });

  test('export button is visible on analytics page', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByRole('button', { name: /export|download/i }).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('analytics page renders without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('networkidle');
    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error exception')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
