import { useEffect, useState } from 'react';
import api from '../api/client';
import type { Academy } from '../types';

export default function DashboardPage() {
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [stats, setStats] = useState({ students: 0, vehicles: 0, todaySchedules: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: acad } = await api.get<Academy | null>('/academies/mine');
        setAcademy(acad);

        if (acad) {
          const today = new Date().toISOString().slice(0, 10);
          const [vehiclesRes, schedulesRes] = await Promise.allSettled([
            api.get('/vehicles/vehicles'),
            api.get(`/schedules/daily?target_date=${today}`),
          ]);

          setStats({
            students: 0,
            vehicles: vehiclesRes.status === 'fulfilled' ? vehiclesRes.value.data.length : 0,
            todaySchedules: schedulesRes.status === 'fulfilled' ? schedulesRes.value.data.length : 0,
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="text-gray-500">로딩 중...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">대시보드</h2>

      {academy ? (
        <>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="text-lg font-semibold text-gray-700">{academy.name}</h3>
            <p className="text-sm text-gray-500">{academy.address}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="등록 차량" value={stats.vehicles} color="blue" />
            <StatCard label="오늘 스케줄" value={stats.todaySchedules} color="green" />
            <StatCard label="학원 ID" value={academy.id.slice(0, 8)} color="purple" />
          </div>

          <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">빠른 작업</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <QuickAction href="/schedules" label="일일 파이프라인 실행" icon="🚀" />
              <QuickAction href="/vehicles" label="차량 등록" icon="🚐" />
              <QuickAction href="/billing" label="청구서 생성" icon="💰" />
              <QuickAction href="/students" label="학생 조회" icon="👨‍🎓" />
            </div>
          </div>
        </>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <p className="text-yellow-800">
            등록된 학원이 없습니다. 먼저 학원을 등록해 주세요.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className={`rounded-xl p-5 ${colors[color] || colors.blue}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

function QuickAction({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-center"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs text-gray-600">{label}</span>
    </a>
  );
}
