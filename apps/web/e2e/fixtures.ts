import { test as base, expect } from '@playwright/test';

/**
 * Ortak test temeli: her testte sayfa **çökmesini** (uncaught exception = `pageerror`) toplar ve
 * test bitiminde boş olmasını şart koşar (auto fixture → her testte otomatik çalışır). "Çalışıyor mu,
 * çökme var mı" güvencesi buradan gelir. Konsol `error`'ları da toplanır ama hard-fail etmez (gürültü).
 */
export const test = base.extend<{ crashGuard: void }>({
  crashGuard: [
    async ({ page }, use) => {
      const crashes: string[] = [];
      page.on('pageerror', (e) => crashes.push(String(e)));
      await use();
      expect(crashes, 'sayfada uncaught hata (çökme) olmamalı:\n' + crashes.join('\n')).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
