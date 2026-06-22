import { test, expect } from './fixtures';

test('duvar çiz → kapalı döngü → mahal oluşur', async ({ page }) => {
  await page.goto('/');
  // "Yeni" → onay modalı (DialogHost) → Evet ile temizle.
  await page.getByRole('button', { name: 'Yeni', exact: true }).click();
  await page.getByRole('button', { name: 'Evet', exact: true }).click();
  // Temizlendi → mahal (m²) kalmadı.
  await expect(page.getByText('Toplam', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Duvar', exact: true }).click();
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  const cx = box!.x + box!.width / 2;
  const cy = box!.y + box!.height / 2;
  // Izgaraya yakalanan bir dikdörtgen çiz; son tık ilk noktaya kapanır (uç-snap).
  const corners: [number, number][] = [
    [-160, -120],
    [160, -120],
    [160, 120],
    [-160, 120],
    [-160, -120],
  ];
  for (const [dx, dy] of corners) {
    await page.mouse.click(cx + dx, cy + dy);
  }
  await page.keyboard.press('Escape'); // zinciri bitir

  // Kapalı duvarlardan mahal türemeli → Mahal Listesi m² gösterir.
  await expect(page.getByText(/m²/).first()).toBeVisible();
});
