import { useState, useCallback } from 'react';
import api from '../api/client';
import type { DailySchedule } from '../types';

const STATUS_COLOR: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  boarded: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function SchedulesPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [schedules, setSchedules] = useState<DailySchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<Record<string, unknown> | null>(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/schedules/daily?target_date=${date}`);
      setSchedules(data);
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  const runPipeline = useCallback(async () => {
    setLoading(true);
    setPipelineResult(null);
    try {
      const { data } = await api.post(`/schedules/daily/pipeline?target_date=${date}`);
      setPipelineResult(data);
      await fetchSchedules();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setPipelineResult({ error: msg || '파이프라인 실행 실패' });
    } finally {
      setLoading(false);
    }
  }, [date, fetchSchedules]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">스케줄 관리</h2>

      <div className="flex gap-3 mb-6">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
        />
        <button
          onClick={fetchSchedules}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          조회
        </button>
        <button
          onClick={runPipeline}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          일일 파이프라인 실행
        </button>
      </div>

      {pipelineResult ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <h4 className="text-sm font-semibold text-blue-700 mb-2">파이프라인 결과</h4>
          <pre className="text-xs text-blue-800 whitespace-pre-wrap">
            {JSON.stringify(pipelineResult, null, 2)}
          </pre>
        </div>
      ) : null}

      {schedules.length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500">해당 날짜에 스케줄이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">학생 ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">날짜</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">픽업 시간</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedules.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                    {s.student_id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{s.schedule_date}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{s.pickup_time}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLOR[s.status] || 'bg-gray-100 text-gray-700'}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
