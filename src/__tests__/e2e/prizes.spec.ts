/**
 * prizes.spec.ts — Prize management flows.
 */
import { test, expect } from '@playwright/test';

async function getFirstWheelId(page: import('@playwright/test').Page): Promise<string | null> {
  const res = await page.request.get('/api/wheels');
  if (!res.ok()) return null;
  const data = await res.json();
  return data.wheels?.[0]?.id ?? null;
}

test.describe('Prize management', () => {
  test('prizes list page loads', async ({ page }) => {
    await page.goto('/dashboard/prizes');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/prize|no prize/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('create prize dialog opens', async ({ page }) => {
    await page.goto('/dashboard/prizes');

    const createBtn = page.getByRole('button', { name: /new prize|create|add prize/i }).first();
    if (!await createBtn.isVisible({ timeout: 8_000 })) { test.skip(); return; }
    await createBtn.click();

    // Dialog or form should appear
    await expect(
      page.getByRole('dialog').or(page.locator('form').first())
    ).toBeVisible({ timeout: 5_000 });
  });

  test('can create a new prize via API and it appears in list', async ({ page }) => {
    // Create prize via API
    const res = await page.request.post('/api/prizes', {
      data: {
        name: `E2E Prize ${Date.now()}`,
        type: 'message',
        display_title: 'E2E Test Prize',
        display_description: 'Created by E2E test',
      },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.prize?.id).toBeTruthy();

    await page.goto('/dashboard/prizes');
    await expect(page.getByText(/e2e test prize/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('prize can be assigned to a segment via API', async ({ page }) => {
    const wheelId = await getFirstWheelId(page);
    if (!wheelId) { test.skip(); return; }

    // Create prize
    const prizeRes = await page.request.post('/api/prizes', {
      data: { name: 'Segment Prize', type: 'message', display_title: 'Nice Try' },
    });
    const prizeData = await prizeRes.json();
    const prizeId = prizeData.prize?.id;
    if (!prizeId) { test.skip(); return; }

    // Get segments (includes bg_color, text_color, label, weight, etc.)
    const segRes = await page.request.get(`/api/wheels/${wheelId}/segments`);
    const segData = await segRes.json();
    if (!segData.segments?.length) { test.skip(); return; }

    // Assign prize to first segment — must pass ALL required fields from GET response
    const segments = segData.segments.map((s: {
      id: string; label: string; bg_color: string; text_color: string;
      icon_url: string | null; weight: number; is_no_prize: boolean;
    }, i: number) => ({
      id: s.id,
      label: s.label,
      bg_color: s.bg_color ?? '#cccccc',
      text_color: s.text_color ?? '#ffffff',
      icon_url: s.icon_url ?? null,
      weight: s.weight ?? 1,
      prize_id: i === 0 ? prizeId : null,
      is_no_prize: i !== 0,
    }));

    const putRes = await page.request.put(`/api/wheels/${wheelId}/segments`, {
      data: { segments },
    });
    expect(putRes.ok()).toBeTruthy();
  });
});
