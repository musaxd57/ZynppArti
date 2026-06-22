import { test, expect } from './fixtures';

test('uygulama yükleniyor: tuval + araç çubuğu + tohum mahal', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Seç', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Duvar', exact: true })).toBeVisible();
  // Demo seed bir mahal üretir → Mahal Listesi'nde m² görünür.
  await expect(page.getByText(/m²/).first()).toBeVisible();
});
