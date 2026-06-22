import { defineConfig, devices } from '@playwright/test';

/**
 * E2E (uçtan-uca) UI testleri — gerçek tarayıcıda temel akışları kontrol eder.
 * Sunucu: `pnpm dev` (Next 15.5; Segment Explorer kapalı → stale-manifest yok). Yerelde varsa
 * mevcut sunucu yeniden kullanılır; CI'da Playwright kendi başlatır.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
