import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import type { User } from '../types';
import { useDarkMode } from '../hooks/useDarkMode';

const academyNavItems = [
  { to: '/', label: '대시보드', icon: '📊' },
  { to: '/students', label: '학생 관리', icon: '👨‍🎓' },
  { to: '/schedules', label: '스케줄', icon: '📅' },
  { to: '/vehicles', label: '차량 관리', icon: '🚐' },
  { to: '/drivers', label: '기사 관리', icon: '🚗' },
  { to: '/billing', label: '청구 관리', icon: '💰' },
  { to: '/upload', label: '엑셀 업로드', icon: '📤' },
  { to: '/map', label: '관제 센터', icon: '🗺️' },
];

const platformNavItems = [
  { to: '/', label: '대시보드', icon: '📊' },
  { to: '/academies', label: '학원 관리', icon: '🏫' },
  { to: '/users', label: '사용자 관리', icon: '👥' },
  { to: '/student-search', label: '학생 조회', icon: '🔎' },
  { to: '/vehicles', label: '차량 관리', icon: '🚐' },
  { to: '/drivers', label: '기사 관리', icon: '🚗' },
  { to: '/billing', label: '청구 관리', icon: '💰' },
  { to: '/upload', label: '엑셀 업로드', icon: '📤' },
  { to: '/compliance', label: '컴플라이언스', icon: '📋' },
  { to: '/notification-logs', label: '알림 이력', icon: '🔔' },
  { to: '/seed', label: '시드 데이터', icon: '🌱' },
  { to: '/audit-logs', label: '감사 로그', icon: '🔍' },
  { to: '/map', label: '관제 센터', icon: '🗺️' },
];

export default function Layout({ user, onLogout }: { user: User; onLogout: () => void }) {
  const isPlatformAdmin = user.role === 'platform_admin';
  const navItems = isPlatformAdmin
    ? (import.meta.env.PROD ? platformNavItems.filter((i) => i.to !== '/seed') : platformNavItems)
    : academyNavItems;
  const [dark, setDark] = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 flex">
      {/* Skip to main content link */}
      <a href="#main-content" className="skip-to-main">
        본문으로 건너뛰기
      </a>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h1 className={`text-lg font-bold ${isPlatformAdmin ? 'text-teal-600 dark:text-teal-400' : 'text-blue-600 dark:text-blue-400'}`}>SafeWay Kids</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isPlatformAdmin ? '플랫폼 관리자 대시보드' : '학원 관리자 대시보드'}
            </p>
          </div>
          {/* Close sidebar on mobile */}
          <button
            type="button"
            className="md:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setSidebarOpen(false)}
            aria-label="사이드바 닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 p-2" role="navigation" aria-label="메인 네비게이션">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  isActive
                    ? isPlatformAdmin
                      ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium'
                      : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">{user.name}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">{isPlatformAdmin ? '플랫폼 관리자' : '학원 관리자'}</div>
          <button
            onClick={onLogout}
            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="메뉴 열기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className={`text-sm font-bold ${isPlatformAdmin ? 'text-teal-600 dark:text-teal-400' : 'text-blue-600 dark:text-blue-400'}`}>
            SafeWay Kids
          </span>
          {/* Dark mode toggle (mobile) */}
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={dark ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {dark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </header>

        {/* Desktop dark mode toggle (top-right corner) */}
        <div className="hidden md:flex justify-end px-6 pt-4">
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label={dark ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {dark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {/* Main content */}
        <main id="main-content" role="main" className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
