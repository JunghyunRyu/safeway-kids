import { useEffect, useState } from 'react';
import api from '../api/client';

interface AcademyStats {
  total_schedules: number;
  completed: number;
  cancelled: number;
  no_show: number;
  on_time_rate: number;
  avg_delay_minutes: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<AcademyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const academyId = user.academy_id;
      if (!academyId) return;
      const res = await api.get(`/admin/academy/${academyId}/stats`, {
        params: { start_date: startDate, end_date: endDate },
      });
      setStats(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cards = stats
    ? [
        { label: '전체 운행', value: stats.total_schedules, color: 'text-gray-700 dark:text-gray-200' },
        { label: '완료', value: stats.completed, color: 'text-green-600' },
        { label: '취소', value: stats.cancelled, color: 'text-yellow-600' },
        { label: '미탑승', value: stats.no_show, color: 'text-red-600' },
        { label: '정시율', value: `${stats.on_time_rate}%`, color: 'text-blue-600' },
        { label: '평균 지연', value: `${stats.avg_delay_minutes}분`, color: 'text-orange-600' },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">운행 통계</h1>

      <div className="flex gap-4 mb-6 items-end">
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">시작일</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">종료일</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          />
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          {loading ? '조회 중...' : '조회'}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{c.label}</div>
              <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
