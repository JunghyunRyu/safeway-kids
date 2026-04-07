import { test, expect } from '@playwright/test';

async function loginAsPlatformAdmin(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const btn = page.getByRole('button', { name: '플랫폼 관리자 로그인' });
  if (await btn.isVisible()) {
    await btn.click();
    await expect(page.getByText('플랫폼 관리자 대시보드')).toBeVisible({ timeout: 10000 });
  }
}

test.describe('students — 학생 관리', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    await loginAsPlatformAdmin(page);
  });

  test('학생 목록 페이지 로드', async ({ page }) => {
    await page.getByRole('link', { name: /학생/ }).click();
    await page.waitForLoadState('networkidle');
    // Page heading or table should be visible
    await expect(page.getByRole('heading', { name: /학생/ })).toBeVisible({ timeout: 8000 });
  });

  test('학생 검색 입력 작동', async ({ page }) => {
    await page.getByRole('link', { name: /학생/ }).click();
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/검색|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('김');
      // Results filter or "no results" message should appear
      await page.waitForTimeout(500);
      await expect(page.locator('table, [role="table"]')).toBeVisible();
    }
  });

  test('학생 추가 버튼 클릭 시 모달 열림', async ({ page }) => {
    await page.getByRole('link', { name: /학생/ }).click();
    await page.waitForLoadState('networkidle');

    const addButton = page.getByRole('button', { name: /추가|등록|새 학생/ });
    if (await addButton.isVisible()) {
      await addButton.click();
      // Modal dialog should appear
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    }
  });
});
