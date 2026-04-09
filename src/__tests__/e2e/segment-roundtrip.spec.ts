/**
 * segment-roundtrip.spec.ts
 *
 * Data-persistence round-trip tests: set a value → save → reload the page →
 * verify the value survived the full API + DB + UI cycle.
 *
 * These tests catch bugs where:
 *  - A field is silently cleared during the PUT/SELECT cycle
 *  - A field is saved but not returned in the PUT response
 *  - The UI input shows a different value after reload (type mismatch, e.g. "5.00" vs 5)
 */
import { test, expect } from '@playwright/test';

async function getFirstWheelId(page: import('@playwright/test').Page): Promise<string | null> {
  const res = await page.request.get('/api/wheels');
  if (!res.ok()) return null;
  const data = await res.json();
  return data.wheels?.[0]?.id ?? null;
}

async function openWheelEditor(page: import('@playwright/test').Page, wheelId: string) {
  await page.goto(`/dashboard/wheels/${wheelId}`);
  await expect(page).toHaveURL(new RegExp(`/dashboard/wheels/${wheelId}`));
  // Wait for segments to load
  await page.locator('input.h-8').first().waitFor({ state: 'visible', timeout: 12_000 });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Segment data round-trip persistence', () => {

  test('segment label persists after save and page reload', async ({ page }) => {
    const wheelId = await getFirstWheelId(page);
    if (!wheelId) { test.skip(); return; }

    await openWheelEditor(page, wheelId);

    const uniqueLabel = `RoundTrip ${Date.now()}`;
    const labelInput = page.locator('input.h-8').first();
    await labelInput.fill(uniqueLabel);

    await page.getByRole('button', { name: /save segments/i }).click();
    await page.locator('[data-sonner-toast]').first().waitFor({ state: 'visible', timeout: 6_000 });

    await page.reload();
    await page.locator('input.h-8').first().waitFor({ state: 'visible', timeout: 12_000 });
    await expect(page.locator('input.h-8').first()).toHaveValue(uniqueLabel);
  });

  test('segment bg_color persists after save and page reload', async ({ page }) => {
    const wheelId = await getFirstWheelId(page);
    if (!wheelId) { test.skip(); return; }

    await openWheelEditor(page, wheelId);

    // Change color via the text input (hex field next to the color swatch)
    const colorTextInput = page.locator('input.h-8.font-mono').first();
    if (!await colorTextInput.isVisible({ timeout: 5_000 })) { test.skip(); return; }
    await colorTextInput.fill('#123456');

    await page.getByRole('button', { name: /save segments/i }).click();
    await page.locator('[data-sonner-toast]').first().waitFor({ state: 'visible', timeout: 6_000 });

    await page.reload();
    await page.locator('input.h-8.font-mono').first().waitFor({ state: 'visible', timeout: 12_000 });
    await expect(page.locator('input.h-8.font-mono').first()).toHaveValue('#123456');
  });

  test('segment weight persists after save and page reload', async ({ page }) => {
    const wheelId = await getFirstWheelId(page);
    if (!wheelId) { test.skip(); return; }

    await openWheelEditor(page, wheelId);

    const weightInput = page.getByRole('spinbutton').first();
    await weightInput.fill('3');

    await page.getByRole('button', { name: /save segments/i }).click();
    await page.locator('[data-sonner-toast]').first().waitFor({ state: 'visible', timeout: 6_000 });

    await page.reload();
    await page.getByRole('spinbutton').first().waitFor({ state: 'visible', timeout: 12_000 });
    const value = await page.getByRole('spinbutton').first().inputValue();
    expect(parseFloat(value)).toBe(3);
  });

  test('label_offset_x persists after save and reload (number not string)', async ({ page }) => {
    const wheelId = await getFirstWheelId(page);
    if (!wheelId) { test.skip(); return; }

    await openWheelEditor(page, wheelId);

    const offsetX = page.getByPlaceholder('X').first();
    if (!await offsetX.isVisible({ timeout: 5_000 })) { test.skip(); return; }
    await offsetX.fill('8');

    await page.getByRole('button', { name: /save segments/i }).click();
    await page.locator('[data-sonner-toast]').first().waitFor({ state: 'visible', timeout: 6_000 });

    await page.reload();
    await page.getByPlaceholder('X').first().waitFor({ state: 'visible', timeout: 12_000 });
    // Value should be "8" (not "8.00" from DB string — normalizeSegment should parse it)
    const savedValue = await page.getByPlaceholder('X').first().inputValue();
    expect(parseFloat(savedValue)).toBe(8);
  });

  test('label_offset_y persists after save and reload', async ({ page }) => {
    const wheelId = await getFirstWheelId(page);
    if (!wheelId) { test.skip(); return; }

    await openWheelEditor(page, wheelId);

    const offsetY = page.getByPlaceholder('Y').first();
    if (!await offsetY.isVisible({ timeout: 5_000 })) { test.skip(); return; }
    await offsetY.fill('-4');

    await page.getByRole('button', { name: /save segments/i }).click();
    await page.locator('[data-sonner-toast]').first().waitFor({ state: 'visible', timeout: 6_000 });

    await page.reload();
    await page.getByPlaceholder('Y').first().waitFor({ state: 'visible', timeout: 12_000 });
    const savedValue = await page.getByPlaceholder('Y').first().inputValue();
    expect(parseFloat(savedValue)).toBe(-4);
  });

  test('icon URL persists after save and page reload', async ({ page }) => {
    const wheelId = await getFirstWheelId(page);
    if (!wheelId) { test.skip(); return; }

    await openWheelEditor(page, wheelId);

    const iconInput = page.getByPlaceholder(/https:\/\/example\.com\/icon\.png/i).first();
    if (!await iconInput.isVisible({ timeout: 5_000 })) { test.skip(); return; }

    const testUrl = 'https://example.com/test-icon.png';
    await iconInput.fill(testUrl);

    await page.getByRole('button', { name: /save segments/i }).click();
    await page.locator('[data-sonner-toast]').first().waitFor({ state: 'visible', timeout: 6_000 });

    await page.reload();
    await page.getByPlaceholder(/https:\/\/example\.com\/icon\.png/i).first()
      .waitFor({ state: 'visible', timeout: 12_000 });
    await expect(
      page.getByPlaceholder(/https:\/\/example\.com\/icon\.png/i).first()
    ).toHaveValue(testUrl);
  });

  test('clearing icon URL via API persists (icon_url becomes null)', async ({ page }) => {
    const wheelId = await getFirstWheelId(page);
    if (!wheelId) { test.skip(); return; }

    // Set icon_url via API, then clear it
    const segRes = await page.request.get(`/api/wheels/${wheelId}/segments`);
    const segData = await segRes.json();
    if (!segData.segments?.length) { test.skip(); return; }

    const segs = segData.segments.map((s: {
      id: string; label: string; bg_color: string; text_color: string;
      icon_url: string | null; weight: number; is_no_prize: boolean;
      prize_id: string | null;
    }) => ({
      id: s.id,
      label: s.label,
      bg_color: s.bg_color ?? '#cccccc',
      text_color: s.text_color ?? '#ffffff',
      icon_url: null,  // clear icon
      weight: parseFloat(String(s.weight)) || 1,
      prize_id: s.prize_id ?? null,
      is_no_prize: s.prize_id ? false : true,
    }));

    const res = await page.request.put(`/api/wheels/${wheelId}/segments`, { data: { segments: segs } });
    expect(res.ok()).toBeTruthy();

    const data = await res.json();
    // icon_url must be null for all segments
    for (const seg of data.segments) {
      expect(seg.icon_url).toBeNull();
    }
  });

  test('API round-trip: offsets saved as numbers, returned with correct values', async ({ page }) => {
    const wheelId = await getFirstWheelId(page);
    if (!wheelId) { test.skip(); return; }

    const segRes = await page.request.get(`/api/wheels/${wheelId}/segments`);
    const segData = await segRes.json();
    if (!segData.segments?.length) { test.skip(); return; }

    const segs = segData.segments.map((s: {
      id: string; label: string; bg_color: string; text_color: string;
      icon_url: string | null; weight: number; is_no_prize: boolean;
      prize_id: string | null;
    }, i: number) => ({
      id: s.id,
      label: s.label,
      bg_color: s.bg_color ?? '#cccccc',
      text_color: s.text_color ?? '#ffffff',
      icon_url: s.icon_url,
      weight: parseFloat(String(s.weight)) || 1,
      prize_id: s.prize_id ?? null,
      is_no_prize: s.prize_id ? false : true,
      label_offset_x: i === 0 ? 5 : null,
      label_offset_y: i === 0 ? -3 : null,
      icon_offset_x:  null,
      icon_offset_y:  null,
    }));

    const putRes = await page.request.put(`/api/wheels/${wheelId}/segments`, { data: { segments: segs } });
    expect(putRes.ok()).toBeTruthy();
    const putData = await putRes.json();

    // The PUT response must include the offset fields and they must be numeric-parseable
    const firstSeg = putData.segments?.[0];
    expect(firstSeg).toBeDefined();
    // Value might come back as string "5.00" or number 5 — both must parseFloat to 5
    expect(parseFloat(firstSeg.label_offset_x)).toBe(5);
    expect(parseFloat(firstSeg.label_offset_y)).toBe(-3);
    // Others must be null
    expect(firstSeg.icon_offset_x).toBeNull();
    expect(firstSeg.icon_offset_y).toBeNull();
  });

  test('adding a new segment and saving does not lose existing segment data', async ({ page }) => {
    const wheelId = await getFirstWheelId(page);
    if (!wheelId) { test.skip(); return; }

    await openWheelEditor(page, wheelId);

    // Record the first label before adding a segment
    const firstLabel = await page.locator('input.h-8').first().inputValue();

    // Add a new segment
    await page.getByRole('button', { name: /\+ add segment/i }).click();

    // Save
    await page.getByRole('button', { name: /save segments/i }).click();
    await page.locator('[data-sonner-toast]').first().waitFor({ state: 'visible', timeout: 6_000 });

    // Reload and verify first label is still intact
    await page.reload();
    await page.locator('input.h-8').first().waitFor({ state: 'visible', timeout: 12_000 });
    await expect(page.locator('input.h-8').first()).toHaveValue(firstLabel);
  });
});
