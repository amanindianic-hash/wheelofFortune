/**
 * embed.spec.ts — Embed code generation and copy flows.
 */
import { test, expect } from '@playwright/test';

async function getFirstWheel(page: import('@playwright/test').Page): Promise<{ id: string; embed_token: string } | null> {
  const res = await page.request.get('/api/wheels');
  if (!res.ok()) return null;
  const data = await res.json();
  return data.wheels?.[0] ?? null;
}

async function openEmbedTab(page: import('@playwright/test').Page, wheelId: string): Promise<void> {
  await page.goto(`/dashboard/wheels/${wheelId}`);
  // Wait for the tab to be rendered then click it (use waitFor so it retries)
  const embedTab = page.getByRole('tab', { name: /embed/i }).first();
  await embedTab.waitFor({ state: 'visible', timeout: 10_000 });
  await embedTab.click();
}

test.describe('Embed code', () => {
  test('embed tab is accessible in wheel editor', async ({ page }) => {
    const wheel = await getFirstWheel(page);
    if (!wheel) { test.skip(); return; }

    await page.goto(`/dashboard/wheels/${wheel.id}`);
    await expect(page.getByRole('tab', { name: /embed/i }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('embed code section shows after clicking embed tab', async ({ page }) => {
    const wheel = await getFirstWheel(page);
    if (!wheel) { test.skip(); return; }

    await openEmbedTab(page, wheel.id);
    // "Embed Code" heading should appear in the tab content
    await expect(page.getByText(/embed code/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('embed code contains the wheel token', async ({ page }) => {
    const wheel = await getFirstWheel(page);
    if (!wheel) { test.skip(); return; }

    await openEmbedTab(page, wheel.id);

    // The embed code is in a <pre> block containing data-token="<token>"
    // Look for the pre/code block that has the token as substring
    const codeBlock = page.locator('pre, code, textarea').filter({ hasText: wheel.embed_token }).first();
    await expect(codeBlock).toBeVisible({ timeout: 8_000 });
  });

  test('copy embed code button exists', async ({ page }) => {
    const wheel = await getFirstWheel(page);
    if (!wheel) { test.skip(); return; }

    await openEmbedTab(page, wheel.id);

    // Button text is "Copy Code" in the embed tab content
    const copyBtn = page.getByRole('button', { name: /copy code/i }).first();
    await expect(copyBtn).toBeVisible({ timeout: 8_000 });
  });

  test('embed_token is present in wheel API response', async ({ page }) => {
    const res = await page.request.get('/api/wheels');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    const wheel = data.wheels?.[0];
    if (!wheel) { test.skip(); return; }
    expect(typeof wheel.embed_token).toBe('string');
    expect(wheel.embed_token.length).toBeGreaterThan(0);
  });
});
