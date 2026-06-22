import { test, expect } from './fixtures';

test('pafta aracı bir pafta yerleştirir → pafta paneli açılır', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Pafta', exact: true }).click();
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  // SheetPanel pafta varken görünür → benzersiz antet alanları (placeholder) ile doğrula.
  await expect(page.getByPlaceholder('Pafta adı')).toBeVisible();
  await expect(page.getByPlaceholder('Tarih')).toBeVisible();
});
