import { test, expect } from './fixtures';

test('panel katla/aç (Katmanlar)', async ({ page }) => {
  await page.goto('/');
  const mimari = page.getByText('Mimari', { exact: true });
  await expect(mimari).toBeVisible(); // katman içeriği açık
  const header = page.getByRole('button', { name: /Katmanlar/ });
  await header.click();
  await expect(mimari).toBeHidden(); // katlandı
  await header.click();
  await expect(mimari).toBeVisible(); // tekrar açıldı
});
