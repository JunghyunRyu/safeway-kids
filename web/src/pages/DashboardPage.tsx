import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import KpiCard from '../components/KpiCard';
import { StatusPieChart } from '../components/Charts';
import { showToast } from '../components/Toast';
import type { Academy, DailySchedule, Vehicle, Invoice } from '../types';

interface DashboardStats {
  vehicles: number;
  todaySchedules: number;
  students: number;
  unpaidInvoices: number;
}

export default function DashboardPage() {
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    vehicles: 0,
    todaySchedules: 0,
    students: 0,
    unpaidInvoices: 0,
  });
  const [allSchedules, setAllSchedules] = useState<DailySchedule[]>([]);
  const [recentSchedules, setRecentSchedules] = useState<DailySchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);

        const [acadRes, vehiclesRes, schedulesRes, studentsRes, invoicesRes] =
          await Promise.allSettled([
            api.get<Academy | null>('/academies/mine'),
            api.get('/vehicles/vehicles'),
            api.get<DailySchedule[]>(`/schedules/daily?target_date=${today}`),
            api.get('/students'),
            api.get('/billing/invoices'),
          ]);

        const acad = acadRes.status === 'fulfilled' ? acadRes.value.data : null;
        setAcademy(acad);

        if (acad) {
          const vehicleList: Vehicle[] =
            vehiclesRes.status === 'fulfilled'
              ? Array.isArray(vehiclesRes.value.data)
                ? vehiclesRes.value.data
                : []
              : [];

          const scheduleList: DailySchedule[] =
            schedulesRes.status === 'fulfilled'
              ? Array.isArray(schedulesRes.value.data)
                ? schedulesRes.value.data
                : []
              : [];

          let studentCount = 0;
          if (studentsRes.status === 'fulfilled') {
            const sd = studentsRes.value.data;
            if (Array.isArray(sd)) {
              studentCount = sd.length;
            } else if (sd && typeof sd === 'object' && 'total' in (sd as Record<string, unknown>)) {
              studentCount = (sd as { total: number }).total;
            }
          }

          const invoiceList: Invoice[] =
            invoicesRes.status === 'fulfilled'
              ? Array.isArray(invoicesRes.value.data)
                ? invoicesRes.value.data
                : []
              : [];

          const unpaidCount = invoiceList.filter(
            (inv) => inv.status !== 'paid',
          ).length;

          setStats({
            vehicles: vehicleList.length,
            todaySchedules: scheduleList.length,
            students: studentCount,
            unpaidInvoices: unpaidCount,
          });

          setAllSchedules(scheduleList);
          // Show most recent 5 schedules
          setRecentSchedules(scheduleList.slice(0, 5));
        }
      } catch {
        showToast('대시보드 데이터를 불러오는데 실패했습니다', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const scheduleStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    allSchedules.forEach((s) => {
      counts[s.status] = (counts[s.status] || 0) + 1;
    });
    const colorMap: Record<string, string> = {
      scheduled: '#2563EB',
      boarded: '#F59E0B',
      completed: '#16A34A',
      cancelled: '#9CA3AF',
    };
    const labelMap: Record<string, string> = {
      scheduled: '예정',
      boarded: '탑승',
      completed: '완료',
      cancelled: '취소',
    };
    return Object.entries(counts).map(([status, value]) => ({
      name: labelMap[status] || status,
      value,
      color: colorMap[status] || '#6B7280',
    }));
  }, [allSchedules]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg
          className="w-8 h-8 animate-spin text-teal-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="ml-3 text-gray-500">로딩 중...</span>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">대시보드</h2>

      {academy ? (
        <div className="space-y-8">
          {/* Academy Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{academy.name}</h3>
                <p className="text-sm text-gray-500">{academy.address}</p>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="등록 학생"
              value={stats.students}
              subtitle="명"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
              color="#0F7A7A"
            />
            <KpiCard
              title="등록 차량"
              value={stats.vehicles}
              subtitle="대"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              }
              color="#2563EB"
            />
            <KpiCard
              title="오늘 스케줄"
              value={stats.todaySchedules}
              subtitle="건"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              color="#16A34A"
            />
            <KpiCard
              title="미결제 청구서"
              value={stats.unpaidInvoices}
              subtitle="건"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              color={stats.unpaidInvoices > 0 ? '#DC2626' : '#6B7280'}
            />
          </div>

          {/* Schedule Status Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-800 mb-2">오늘 스케줄 현황</h3>
            <StatusPieChart data={scheduleStatusData} />
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800">오늘의 스케줄</h3>
                <Link
                  to="/schedules"
                  className="text-sm text-teal-600 hover:text-teal-800 font-medium"
                >
                  전체 보기
                </Link>
              </div>
            </div>
            {recentSchedules.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-400 text-sm">오늘 예정된 스케줄이 없습니다.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentSchedules.map((s) => (
                  <div
                    key={s.id}
                    className="px-6 py-3 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700">
                          학생 <span className="font-mono text-gray-500">{s.student_id.slice(0, 8)}</span>
                        </p>
                        <p className="text-xs text-gray-400">픽업 {s.pickup_time}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        s.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : s.status === 'boarded'
                            ? 'bg-yellow-100 text-yellow-700'
                            : s.status === 'cancelled'
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {s.status === 'scheduled'
                        ? '예정'
                        : s.status === 'boarded'
                          ? '탑승'
                          : s.status === 'completed'
                            ? '완료'
                            : s.status === 'cancelled'
                              ? '취소'
                              : s.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-800 mb-4">빠른 작업</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <QuickLink
                to="/schedules"
                label="일일 파이프라인 실행"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
                color="text-yellow-600 bg-yellow-50"
              />
              <QuickLink
                to="/vehicles"
                label="차량 관리"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                }
                color="text-blue-600 bg-blue-50"
              />
              <QuickLink
                to="/billing"
                label="청구 관리"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                color="text-green-600 bg-green-50"
              />
              <QuickLink
                to="/students"
                label="학생 관리"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                }
                color="text-purple-600 bg-purple-50"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-yellow-800">
              등록된 학원이 없습니다. 먼저 학원을 등록해 주세요.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickLink({
  to,
  label,
  icon,
  color,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-center group"
    >
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-xs font-medium text-gray-600 group-hover:text-gray-800">
        {label}
      </span>
    </Link>
  );
}
