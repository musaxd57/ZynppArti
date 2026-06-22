import { test, expect } from './fixtures';

test('Kesit aracı aktifleşir + kesit paneli mevcut', async ({ page }) => {
  await page.goto('/');
  const b = page.getByRole('button', { name: 'Kesit', exact: true });
  await b.click();
  await expect(b).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /Kesit \(şematik\)/ })).toBeVisible();
});

test('sağ-tık bağlam menüsü açılır', async ({ page }) => {
  await page.goto('/');
  // canvas hazır olsun (Pixi mount + handler kaydı).
  await expect(page.getByRole('button', { name: 'Seç', exact: true })).toBeVisible();
  await page.locator('canvas').click({ button: 'right', position: { x: 200, y: 200 } });
  await expect(page.getByRole('button', { name: 'Tümünü seç' })).toBeVisible();
});
