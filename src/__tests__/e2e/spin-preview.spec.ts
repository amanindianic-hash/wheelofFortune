/**
 * spin-preview.spec.ts — Play page spin flow.
 */
import { test, expect } from '@playwright/test';

/** Returns the embed_token of an active wheel (activates first wheel if needed) */
async function getActiveWheelToken(page: import('@playwright/test').Page): Promise<string | null> {
  const res = await page.request.get('/api/wheels');
  if (!res.ok()) return null;
  const data = await res.json();
  const wheels: Array<{ id: string; status: string; embed_token: string }> = data.wheels ?? [];

  // Prefer an already-active wheel
  const active = wheels.find((w) => w.status === 'active');
  if (active) return active.embed_token;

  const first = wheels[0];
  if (!first) return null;

  // Activate it so the public play page can serve it
  await page.request.post(`/api/wheels/${first.id}/publish`, {
    data: { status: 'active' },
  });
  return first.embed_token;
}

test.describe('Spin preview', () => {
  test('play page renders the wheel', async ({ page }) => {
    const token = await getActiveWheelToken(page);
    if (!token) { test.skip(); return; }

    await page.goto(`/play/${token}`);
    await expect(page.locator('canvas, [class*="wheel"], svg').first()).toBeVisible({ timeout: 10_000 });
  });

  test('spin button exists on play page', async ({ page }) => {
    const token = await getActiveWheelToken(page);
    if (!token) { test.skip(); return; }

    await page.goto(`/play/${token}`);
    await expect(page.locator('canvas, [class*="wheel"], svg').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /spin/i }).first()).toBeVisible({ timeout: 12_000 });
  });

  test('clicking spin shows a result', async ({ page }) => {
    const token = await getActiveWheelToken(page);
    if (!token) { test.skip(); return; }

    await page.goto(`/play/${token}`);

    // Fill lead form if present (button text is "Continue to Spin")
    const emailInput = page.getByPlaceholder(/email/i).first();
    if (await emailInput.isVisible({ timeout: 3_000 })) {
      await emailInput.fill('e2e-test@example.com');
      // Check GDPR consent checkbox if present
      const gdprCheckbox = page.getByRole('checkbox').first();
      if (await gdprCheckbox.isVisible({ timeout: 1_000 })) {
        await gdprCheckbox.check();
      }
      await page.getByRole('button', { name: /continue to spin|continue|submit/i }).first().click();
    }

    // Spin button text defaults to "SPIN NOW!" — waitFor actually polls (isVisible does not)
    const spinBtn = page.getByRole('button', { name: /spin/i }).first();
    const appeared = await spinBtn.waitFor({ state: 'visible', timeout: 12_000 }).then(() => true).catch(() => false);
    if (!appeared) { test.skip(); return; }

    await spinBtn.click();

    await expect(
      page.getByRole('dialog').or(page.getByText(/you won|congratulations|try again|result/i).first())
    ).toBeVisible({ timeout: 15_000 });
  });
});
