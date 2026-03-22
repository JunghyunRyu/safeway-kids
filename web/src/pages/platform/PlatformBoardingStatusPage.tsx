import { useEffect, useState, useCallback } from 'react';
import api from '../../api/client';

interface BoardingItem {
  student_id: string;
  student_name: string;
  academy_name: string | null;
  status: string;
  pickup_time: string | null;
  boarded_at: string | null;
  alighted_at: string | null;
}

interface BoardingStatus {
  total: number;
  scheduled: number;
  boarded: number;
  completed: number;
  cancelled: number;
  no_show: number;
  items: BoardingItem[];
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: '예정',
  boarded: '탑승',
  completed: '완료',
  cancelled: '취소',
  no_show: '미탑승',
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  boarded: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  no_show: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function PlatformBoardingStatusPage() {
  const [data, setData] = useState<BoardingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/boarding-status', { params: { date } });
      setData(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const cards = data
    ? [
        { label: '전체', value: data.total, color: 'text-gray-700 dark:text-gray-200' },
        { label: '예정', value: data.scheduled, color: 'text-blue-600' },
        { label: '탑승 중', value: data.boarded, color: 'text-yellow-600' },
        { label: '완료', value: data.completed, color: 'text-green-600' },
        { label: '취소', value: data.cancelled, color: 'text-gray-500' },
        { label: '미탑승', value: data.no_show, color: 'text-red-600' },
      ]
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">탑승 현황</h1>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          />
          <span className="text-xs text-gray-400 dark:text-gray-500">30초 자동 갱신</span>
        </div>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
            {cards.map((c) => (
              <div key={c.label} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">{c.label}</div>
                <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">학생</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">학원</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">픽업 시각</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">상태</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">탑승</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">하차</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => (
                  <tr key={idx} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{item.student_name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.academy_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.pickup_time || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[item.status] || ''}`}>
                        {STATUS_LABELS[item.status] || item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {item.boarded_at ? new Date(item.boarded_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {item.alighted_at ? new Date(item.alighted_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {loading && !data && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">로딩 중...</div>
      )}
    </div>
  );
}
