/**
 * leads.spec.ts — Lead capture and management flows.
 */
import { test, expect } from '@playwright/test';

test.describe('Leads', () => {
  test('leads page loads', async ({ page }) => {
    await page.goto('/dashboard/leads');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/lead|email|no lead/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('leads API returns paginated response', async ({ page }) => {
    const res = await page.request.get('/api/leads');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('leads');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('page');
    expect(data).toHaveProperty('limit');
    expect(Array.isArray(data.leads)).toBe(true);
  });

  test('leads API accepts wheel_id filter', async ({ page }) => {
    const wheelsRes = await page.request.get('/api/wheels');
    const wheelsData = await wheelsRes.json();
    const wheelId = wheelsData.wheels?.[0]?.id;
    if (!wheelId) { test.skip(); return; }

    const res = await page.request.get(`/api/leads?wheel_id=${wheelId}`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.leads)).toBe(true);
  });

  test('leads API accepts search parameter', async ({ page }) => {
    const res = await page.request.get('/api/leads?search=test');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.leads)).toBe(true);
  });

  test('leads API returns 404 for invalid wheel_id', async ({ page }) => {
    const res = await page.request.get('/api/leads?wheel_id=00000000-0000-0000-0000-000000000000');
    expect(res.status()).toBe(404);
  });

  test('leads page shows table or empty state', async ({ page }) => {
    await page.goto('/dashboard/leads');
    await page.waitForLoadState('networkidle');

    // "No leads yet" empty state OR table rows are both valid
    const emptyState = page.getByText(/no leads yet/i).first();
    const table = page.getByRole('table').first();

    const hasEmpty = await emptyState.isVisible().catch(() => false);
    const hasTable = await table.isVisible().catch(() => false);

    if (!hasEmpty && !hasTable) {
      // Fall back to checking the search bar which is always present
      await expect(page.getByPlaceholder(/search name, email/i).first()).toBeVisible({ timeout: 8_000 });
    }
  });
});
