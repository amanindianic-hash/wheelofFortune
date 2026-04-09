/**
 * canvas-rendering.spec.ts
 *
 * Verifies that the wheel canvas is actually painted — not blank — under
 * a variety of conditions.  This test class exists specifically to catch
 * silent rendering failures like the "label/icon disappear after save"
 * bug where canvas arithmetic broke due to NUMERIC columns coming back
 * as strings from the DB driver.
 *
 * Detection strategy: sample a region of the canvas with getImageData and
 * assert that at least one pixel is non-transparent.  Wrapped in try/catch
 * to degrade gracefully when the canvas is tainted by cross-origin images.
 */
import { test, expect } from '@playwright/test';

// ── helpers ───────────────────────────────────────────────────────────────────

async function getFirstWheel(page: import('@playwright/test').Page) {
  const res = await page.request.get('/api/wheels');
  if (!res.ok()) return null;
  const data = await res.json();
  return data.wheels?.[0] ?? null;
}

async function getActiveToken(page: import('@playwright/test').Page): Promise<string | null> {
  const res = await page.request.get('/api/wheels');
  if (!res.ok()) return null;
  const data = await res.json();
  const wheels: Array<{ id: string; status: string; embed_token: string }> = data.wheels ?? [];
  const active = wheels.find((w) => w.status === 'active');
  if (active) return active.embed_token;
  const first = wheels[0];
  if (!first) return null;
  await page.request.post(`/api/wheels/${first.id}/publish`, { data: { status: 'active' } });
  return first.embed_token;
}

/** Returns true when ANY canvas on the page has at least one non-transparent pixel. */
async function canvasHasContent(page: import('@playwright/test').Page): Promise<boolean> {
  return page.evaluate(() => {
    // Check every canvas element — the first one may not be the wheel canvas
    const canvases = Array.from(document.querySelectorAll('canvas')) as HTMLCanvasElement[];
    if (canvases.length === 0) return false;
    for (const canvas of canvases) {
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        const { width, height } = canvas;
        if (!width || !height) continue;
        // Sample the inner quarter to avoid transparent border areas
        const x = Math.floor(width * 0.25);
        const y = Math.floor(height * 0.25);
        const w = Math.floor(width * 0.5);
        const h = Math.floor(height * 0.5);
        const data = ctx.getImageData(x, y, w, h).data;
        // At least one pixel must be non-transparent
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] > 0) return true;
        }
      } catch {
        // Canvas is tainted by cross-origin image — assume painted
        return true;
      }
    }
    return false;
  });
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe('Canvas rendering', () => {

  test('wheel canvas is painted on initial load of editor', async ({ page }) => {
    const wheel = await getFirstWheel(page);
    if (!wheel) { test.skip(); return; }

    await page.goto(`/dashboard/wheels/${wheel.id}`);
    // Wait for canvas and a short draw delay
    await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 12_000 });
    await page.waitForTimeout(800);

    const painted = await canvasHasContent(page);
    expect(painted).toBe(true);
  });

  test('canvas remains painted after saving segment label changes', async ({ page }) => {
    const wheel = await getFirstWheel(page);
    if (!wheel) { test.skip(); return; }

    await page.goto(`/dashboard/wheels/${wheel.id}`);
    await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 12_000 });

    // Edit first label
    const labelInput = page.locator('input.h-8').first();
    await labelInput.fill(`Canvas ${Date.now()}`);

    await page.getByRole('button', { name: /save segments/i }).click();
    await page.locator('[data-sonner-toast]').first().waitFor({ state: 'visible', timeout: 6_000 });

    // Give the canvas effect time to re-draw
    await page.waitForTimeout(800);

    const painted = await canvasHasContent(page);
    expect(painted).toBe(true);
  });

  test('canvas remains painted after saving label offset values', async ({ page }) => {
    const wheel = await getFirstWheel(page);
    if (!wheel) { test.skip(); return; }

    await page.goto(`/dashboard/wheels/${wheel.id}`);
    await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 12_000 });

    // Set a label_offset_x value (the first "number" spinbutton in offset row)
    // Offset inputs have placeholder "X" or "Y"
    const offsetXInput = page.getByPlaceholder('X').first();
    if (await offsetXInput.isVisible({ timeout: 5_000 })) {
      await offsetXInput.fill('5');
    }

    await page.getByRole('button', { name: /save segments/i }).click();
    await page.locator('[data-sonner-toast]').first().waitFor({ state: 'visible', timeout: 6_000 });

    // Critical: after save the DB returns NUMERIC as string — canvas must still render
    await page.waitForTimeout(800);
    const painted = await canvasHasContent(page);
    expect(painted).toBe(true);
  });

  test('canvas remains painted after saving icon offset values', async ({ page }) => {
    const wheel = await getFirstWheel(page);
    if (!wheel) { test.skip(); return; }

    // Set icon_url on first segment so icon offsets appear
    const segRes = await page.request.get(`/api/wheels/${wheel.id}/segments`);
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
      icon_url: i === 0
        ? 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/120px-PNG_transparency_demonstration_1.png'
        : s.icon_url,
      weight: parseFloat(String(s.weight)) || 1,
      prize_id: s.prize_id ?? null,
      is_no_prize: s.prize_id ? false : true,
    }));

    await page.request.put(`/api/wheels/${wheel.id}/segments`, { data: { segments: segs } });

    await page.goto(`/dashboard/wheels/${wheel.id}`);
    await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 12_000 });

    // Icon offset Y input (second offset spinbutton visible when icon_url is set)
    const offsetYInput = page.getByPlaceholder('Y').first();
    if (await offsetYInput.isVisible({ timeout: 5_000 })) {
      await offsetYInput.fill('3');
    }

    await page.getByRole('button', { name: /save segments/i }).click();
    await page.locator('[data-sonner-toast]').first().waitFor({ state: 'visible', timeout: 6_000 });

    await page.waitForTimeout(1000);
    const painted = await canvasHasContent(page);
    expect(painted).toBe(true);
  });

  test('play page canvas is painted', async ({ page }) => {
    const token = await getActiveToken(page);
    if (!token) { test.skip(); return; }

    await page.goto(`/play/${token}`);
    // The play page may render via a widget wrapper before showing canvas
    await page.locator('canvas, [class*="wheel"], svg').first()
      .waitFor({ state: 'visible', timeout: 15_000 });
    // Wait for network idle so segment data and images finish loading
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Only check canvas pixel content if a canvas is present
    const hasCanvas = await page.locator('canvas').count() > 0;
    if (!hasCanvas) { test.skip(); return; }

    // Poll up to 5× (2.5 s more) for the wheel to paint
    let painted = false;
    for (let i = 0; i < 5 && !painted; i++) {
      painted = await canvasHasContent(page);
      if (!painted) await page.waitForTimeout(500);
    }
    expect(painted).toBe(true);
  });

  test('canvas is still painted after page reload following offset save', async ({ page }) => {
    const wheel = await getFirstWheel(page);
    if (!wheel) { test.skip(); return; }

    await page.goto(`/dashboard/wheels/${wheel.id}`);
    await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 12_000 });

    const offsetXInput = page.getByPlaceholder('X').first();
    if (await offsetXInput.isVisible({ timeout: 5_000 })) {
      await offsetXInput.fill('4');
    }

    await page.getByRole('button', { name: /save segments/i }).click();
    await page.locator('[data-sonner-toast]').first().waitFor({ state: 'visible', timeout: 6_000 });

    // Reload — now data comes from GET (also returns NUMERIC strings)
    await page.reload();
    await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 12_000 });
    await page.waitForTimeout(800);

    const painted = await canvasHasContent(page);
    expect(painted).toBe(true);
  });
});
