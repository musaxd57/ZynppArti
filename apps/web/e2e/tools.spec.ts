import { test, expect } from './fixtures';

test('araç çubuğu: her araç aktifleşir (aria-pressed)', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Duvar', 'Kapı', 'Pencere', 'Ölçü', 'Parsel', 'Metin', 'Pafta']) {
    const b = page.getByRole('button', { name, exact: true });
    await b.click();
    await expect(b).toHaveAttribute('aria-pressed', 'true');
  }
  const sec = page.getByRole('button', { name: 'Seç', exact: true });
  await sec.click();
  await expect(sec).toHaveAttribute('aria-pressed', 'true');
});
