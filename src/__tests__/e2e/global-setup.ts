/**
 * global-setup.ts — logs in once and saves cookies to e2e-auth.json.
 * All other E2E tests reuse this session instead of logging in each time.
 *
 * Required env vars:
 *   E2E_EMAIL    — test account email     (default: test@example.com)
 *   E2E_PASSWORD — test account password  (default: password123)
 */
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, 'e2e-auth.json');

const EMAIL    = process.env.E2E_EMAIL    ?? 'test@example.com';
const PASSWORD = process.env.E2E_PASSWORD ?? 'password123';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/email/i).fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to dashboard after successful login
  await page.waitForURL('**/dashboard**', { timeout: 15_000 });
  await expect(page).toHaveURL(/dashboard/);

  // Ensure at least one wheel exists so other tests aren't skipped
  const wheelsRes = await page.request.get('/api/wheels');
  const wheelsData = await wheelsRes.json();
  let wheelId: string | null = wheelsData.wheels?.[0]?.id ?? null;

  if (!wheelId) {
    const createRes = await page.request.post('/api/wheels', {
      data: { name: 'E2E Setup Wheel' },
    });
    const created = await createRes.json();
    wheelId = created.wheel?.id ?? null;
  }

  if (wheelId) {
    // Disable lead form on the first wheel so spin tests bypass it
    await page.request.put(`/api/wheels/${wheelId}`, {
      data: { form_config: { enabled: false } },
    });
  }

  // Persist cookies + localStorage so tests can reuse the session
  await page.context().storageState({ path: authFile });
});
