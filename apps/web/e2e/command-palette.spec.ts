import { test, expect } from './fixtures';

test('Ctrl+K komut paleti açılır ve araç çalıştırır', async ({ page }) => {
  await page.goto('/');
  await page.locator('canvas').click({ position: { x: 6, y: 6 } }); // odak
  await page.keyboard.press('Control+k');
  const input = page.getByPlaceholder(/Komut ara/);
  await expect(input).toBeVisible();
  await input.fill('Duvar');
  await page.keyboard.press('Enter');
  // İlk eşleşme "Araç: Duvar" → duvar aracı aktif olmalı.
  await expect(page.getByRole('button', { name: 'Duvar', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
