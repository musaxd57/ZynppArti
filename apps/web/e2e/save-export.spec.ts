import { test, expect } from './fixtures';

/** Uygulama mount olana kadar bekle + tuvale odaklan (klavye kısayolları sayfaya ulaşsın). */
async function ready(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Kaydet', exact: true })).toBeVisible();
  await page.locator('canvas').click({ position: { x: 6, y: 6 } });
}

test('Kaydet → JSON indirir (Ctrl+S)', async ({ page }) => {
  await ready(page);
  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    page.keyboard.press('Control+s'),
  ]);
  expect(dl.suggestedFilename()).toMatch(/\.json$/);
});

test('Aç → dosya seçici açar (Ctrl+O)', async ({ page }) => {
  await ready(page);
  const [fc] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.keyboard.press('Control+o'),
  ]);
  expect(fc).toBeTruthy();
});

// NOT: PNG/PDF export tuval WebGL extract'ine dayanır; headless-shell'de güvenilmez (gerçek
// tarayıcıda çalışır). E2E'de saf-TS, deterministik DXF + SVG export'unu doğruluyoruz.
test('DXF ve SVG dışa aktarımı indirir', async ({ page }) => {
  await ready(page);
  const cases: [string, RegExp][] = [
    ['DXF İndir', /\.dxf$/],
    ['SVG İndir', /\.svg$/],
  ];
  for (const [name, ext] of cases) {
    const [dl] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name, exact: true }).click(),
    ]);
    expect(dl.suggestedFilename(), `${name} → ${ext}`).toMatch(ext);
  }
});
