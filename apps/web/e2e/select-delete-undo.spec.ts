import { test, expect } from './fixtures';

test('Ctrl+A + Delete siler, Ctrl+Z geri alır, Ctrl+Y yineler', async ({ page }) => {
  await page.goto('/');
  // Tohum mahal → RoomList "Toplam" etiketi görünür.
  const toplam = page.getByText('Toplam', { exact: true });
  await expect(toplam).toBeVisible();

  // Tuvale odaklan (köşe — entity yok), tümünü seç + sil.
  await page.locator('canvas').click({ position: { x: 6, y: 6 } });
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Delete');
  // Duvarlar silindi → mahal kalmadı → RoomList gizlendi.
  await expect(page.getByText('Toplam', { exact: true })).toHaveCount(0);

  // Geri al → duvarlar + mahal döner.
  await page.keyboard.press('Control+z');
  await expect(page.getByText('Toplam', { exact: true })).toBeVisible();

  // Yinele → tekrar silinir.
  await page.keyboard.press('Control+y');
  await expect(page.getByText('Toplam', { exact: true })).toHaveCount(0);
});
