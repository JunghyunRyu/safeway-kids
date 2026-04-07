import { test, expect } from '@playwright/test';

// Helper: performs platform admin login via the teal button in dev mode
async function loginAsPlatformAdmin(page: import('@playwright/test').Page) {
  await page.goto('/');
  // Wait for either the login form or the dashboard (already logged in)
  await page.waitForLoadState('networkidle');

  const platformButton = page.getByRole('button', { name: '플랫폼 관리자 로그인' });
  if (await platformButton.isVisible()) {
    await platformButton.click();
    // Wait until the sidebar heading confirms login
    await expect(page.getByText('플랫폼 관리자 대시보드')).toBeVisible({ timeout: 10000 });
  }
}

// Helper: logout via the sidebar logout button
async function logout(page: import('@playwright/test').Page) {
  // Logout button is rendered inside the sidebar
  const logoutButton = page.getByRole('button', { name: /로그아웃/ });
  await logoutButton.click();
  // After logout the login form should reappear
  await expect(page.getByRole('heading', { name: 'SafeWay Kids' })).toBeVisible({ timeout: 5000 });
}

test.describe('auth — 로그인/로그아웃', () => {
  test.beforeEach(async ({ page }) => {
    // Clear auth tokens so every test starts unauthenticated
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('플랫폼 관리자 로그인 성공 후 대시보드 진입', async ({ page }) => {
    // The dev login form must be visible first
    await expect(page.getByRole('button', { name: '플랫폼 관리자 로그인' })).toBeVisible();

    await page.getByRole('button', { name: '플랫폼 관리자 로그인' }).click();

    // Sidebar label for platform admin
    await expect(page.getByText('플랫폼 관리자 대시보드')).toBeVisible({ timeout: 10000 });

    // URL stays at root (no redirect to /login)
    expect(page.url()).not.toContain('/login');
  });

  test('학원 관리자 로그인 성공 후 대시보드 진입', async ({ page }) => {
    await expect(page.getByRole('button', { name: '학원 관리자 로그인' })).toBeVisible();

    // Dev mode pre-fills phone and name, so just submit
    await page.getByRole('button', { name: '학원 관리자 로그인' }).click();

    // Academy admin sidebar label
    await expect(page.getByText('학원 관리자 대시보드')).toBeVisible({ timeout: 10000 });
  });

  test('잘못된 전화번호 형식 입력 시 에러 메시지 표시', async ({ page }) => {
    const phoneInput = page.getByPlaceholder('01012345678');
    await phoneInput.fill('12345'); // invalid format

    const nameInput = page.getByPlaceholder('홍길동');
    await nameInput.fill('테스터');

    await page.getByRole('button', { name: '학원 관리자 로그인' }).click();

    // Validation error message
    await expect(page.getByText('올바른 전화번호 형식이 아닙니다')).toBeVisible();
  });

  test('로그인 후 로그아웃하면 로그인 화면으로 복귀', async ({ page }) => {
    // Login first
    await page.getByRole('button', { name: '플랫폼 관리자 로그인' }).click();
    await expect(page.getByText('플랫폼 관리자 대시보드')).toBeVisible({ timeout: 10000 });

    // Logout
    await logout(page);

    // Should see login form again
    await expect(page.getByRole('button', { name: '플랫폼 관리자 로그인' })).toBeVisible();
  });
});
