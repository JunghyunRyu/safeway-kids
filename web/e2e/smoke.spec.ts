import { test, expect } from '@playwright/test';

/**
 * Smoke test — 주요 페이지가 에러 없이 로드되는지 순회 확인
 */

async function loginAsPlatformAdmin(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const btn = page.getByRole('button', { name: '플랫폼 관리자 로그인' });
  if (await btn.isVisible()) {
    await btn.click();
    await expect(page.getByText('플랫폼 관리자 대시보드')).toBeVisible({ timeout: 10000 });
  }
}

const PLATFORM_PAGES = [
  { name: '대시보드', path: '/' },
  { name: '학원 관리', path: '/platform/academies' },
  { name: '사용자 관리', path: '/platform/users' },
  { name: '차량 관리', path: '/platform/vehicles' },
  { name: '청구 관리', path: '/platform/billing' },
  { name: '감사 로그', path: '/platform/audit-logs' },
];

test.describe('smoke — 플랫폼 관리자 페이지 순회', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    await loginAsPlatformAdmin(page);
  });

  for (const { name, path } of PLATFORM_PAGES) {
    test(`${name} (${path}) 페이지 로드 성공`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // No critical error boundary triggered
      await expect(page.getByText(/Something went wrong|에러가 발생/i)).not.toBeVisible();

      // Main content area is rendered
      await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 8000 });
    });
  }
});
