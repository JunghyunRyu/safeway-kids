import { NavLink, Outlet } from 'react-router-dom';
import type { User } from '../types';

const navItems = [
  { to: '/', label: '대시보드', icon: '📊' },
  { to: '/students', label: '학생 관리', icon: '👨‍🎓' },
  { to: '/schedules', label: '스케줄', icon: '📅' },
  { to: '/vehicles', label: '차량 관리', icon: '🚐' },
  { to: '/billing', label: '청구 관리', icon: '💰' },
];

export default function Layout({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-blue-600">SafeWay Kids</h1>
          <p className="text-xs text-gray-500">학원 관리자 대시보드</p>
        </div>
        <nav className="flex-1 p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="text-sm text-gray-700 mb-2">{user.name}</div>
          <button
            onClick={onLogout}
            className="text-xs text-red-500 hover:text-red-700"
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
