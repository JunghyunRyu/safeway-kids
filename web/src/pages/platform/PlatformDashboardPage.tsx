import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import KpiCard from '../../components/KpiCard';
import { StatusPieChart } from '../../components/Charts';
import type { User } from '../../types';

interface Stats {
  academies: number;
  users: number;
  vehicles: number;
  students: number;
  unpaidInvoices: number;
  expiringDocs: number;
}

const QUICK_ACTIONS = [
  { to: '/seed', label: '시드 데이터 생성', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
  { to: '/academies', label: '학원 관리', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { to: '/users', label: '사용자 관리', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { to: '/upload', label: '엑셀 업로드', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
  { to: '/billing', label: '청구 관리', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  { to: '/compliance', label: '컴플라이언스', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
];

export default function PlatformDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    academies: 0,
    users: 0,
    vehicles: 0,
    students: 0,
    unpaidInvoices: 0,
    expiringDocs: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [acadRes, usersRes, vehiclesRes, studentsRes, invoicesRes, expiringRes] =
          await Promise.allSettled([
            api.get('/academies'),
            api.get('/auth/users'),
            api.get('/telemetry/vehicles'),
            api.get('/students'),
            api.get('/billing/invoices'),
            api.get('/compliance/documents/expiring'),
          ]);

        const toArr = (r: PromiseSettledResult<{ data: unknown }>) =>
          r.status === 'fulfilled' && Array.isArray(r.value.data) ? r.value.data : [];

        const userList = toArr(usersRes) as User[];
        setUsers(userList);

        const invoices = toArr(invoicesRes);
        const unpaidInvoices = invoices.filter(
          (i: Record<string, unknown>) => i.status === 'pending' || i.status === 'overdue'
        ).length;

        setStats({
          academies: toArr(acadRes).length,
          users: toArr(usersRes).length,
          vehicles: toArr(vehiclesRes).length,
          students: toArr(studentsRes).length,
          unpaidInvoices,
          expiringDocs: toArr(expiringRes).length,
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const roleDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    const colorMap: Record<string, string> = {
      parent: '#2563EB',
      driver: '#F59E0B',
      escort: '#9333EA',
      admin: '#0F7A7A',
      platform_admin: '#DC2626',
    };
    const labelMap: Record<string, string> = {
      parent: '학부모',
      driver: '운전기사',
      escort: '보호자(동승)',
      admin: '학원관리자',
      platform_admin: '플랫폼관리자',
    };
    return Object.entries(counts).map(([role, value]) => ({
      name: labelMap[role] || role,
      value,
      color: colorMap[role] || '#6B7280',
    }));
  }, [users]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">플랫폼 대시보드</h2>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="총 학원 수"
          value={stats.academies}
          subtitle="운영 중인 학원"
          color="#0F7A7A"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <KpiCard
          title="총 사용자 수"
          value={stats.users}
          subtitle="등록된 사용자"
          color="#2563EB"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <KpiCard
          title="총 차량 수"
          value={stats.vehicles}
          subtitle="등록된 차량"
          color="#16A34A"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-4-10l-4 4m0 0l4 4m-4-4h12" />
            </svg>
          }
        />
        <KpiCard
          title="총 학생 수"
          value={stats.students}
          subtitle="등록된 학생"
          color="#9333EA"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <KpiCard
          title="미결제 청구서"
          value={stats.unpaidInvoices}
          subtitle="미결제 및 연체 포함"
          color="#F59E0B"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          title="만료 임박 문서"
          value={stats.expiringDocs}
          subtitle="갱신 필요 문서"
          color="#DC2626"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* User Role Distribution Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
        <h3 className="text-base font-semibold text-gray-800 mb-2">사용자 역할 분포</h3>
        <StatusPieChart data={roleDistribution} />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">빠른 작업</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all duration-200 text-center group"
            >
              <div className="w-10 h-10 rounded-lg bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center text-teal-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-600 group-hover:text-teal-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
