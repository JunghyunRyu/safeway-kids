/**
 * P3-71: Monthly management report page with print-to-PDF support.
 */
import { useState, useCallback, useEffect } from 'react';
import api from '../api/client';

interface MonthlyReport {
  month: string;
  total_schedules: number;
  completed: number;
  cancelled: number;
  no_show: number;
  on_time_rate: number;
  avg_delay_minutes: number;
  daily_breakdown: Array<{
    date: string;
    total: number;
    completed: number;
    cancelled: number;
    no_show: number;
  }>;
}

export default function MonthlyReportPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [academyId, setAcademyId] = useState<string | null>(null);

  useEffect(() => {
    api.get('/academies').then((res) => {
      const academies = res.data;
      if (academies.length > 0) {
        setAcademyId(academies[0].id);
      }
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!academyId) return;
    setLoading(true);
    try {
      const res = await api.get(`/admin/academy/${academyId}/monthly-report?month=${month}`);
      setReport(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [academyId, month]);

  useEffect(() => {
    if (academyId) load();
  }, [academyId, load]);

  return (
    <div className="print:p-0">
      <div className="flex items-center justify-between mb-6 print:mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">월간 경영 보고서</h1>
        <div className="flex items-center gap-3 print:hidden">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          />
          <button
            onClick={load}
            className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            조회
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            PDF 출력
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">로딩 중...</div>
      ) : !report ? (
        <div className="text-center py-8 text-gray-400">보고서 데이터가 없습니다</div>
      ) : (
        <div>
          {/* Summary */}
          <div className="text-center mb-6 print:mb-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              {report.month} 월간 운행 보고서
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <StatCard label="총 운행" value={report.total_schedules} unit="건" />
            <StatCard label="완료" value={report.completed} unit="건" color="text-green-600" />
            <StatCard label="취소" value={report.cancelled} unit="건" color="text-yellow-600" />
            <StatCard label="미탑승" value={report.no_show} unit="건" color="text-red-600" />
            <StatCard label="정시 운행률" value={report.on_time_rate} unit="%" color="text-blue-600" />
            <StatCard label="평균 지연" value={report.avg_delay_minutes} unit="분" color="text-orange-600" />
          </div>

          {/* Daily breakdown table */}
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">일별 상세</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-600">
                  <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">날짜</th>
                  <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">총 건수</th>
                  <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">완료</th>
                  <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">취소</th>
                  <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">미탑승</th>
                  <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">완료율</th>
                </tr>
              </thead>
              <tbody>
                {report.daily_breakdown.map((day) => (
                  <tr key={day.date} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 px-3 text-gray-800 dark:text-gray-200">{day.date}</td>
                    <td className="py-2 px-3 text-right text-gray-800 dark:text-gray-200">{day.total}</td>
                    <td className="py-2 px-3 text-right text-green-600">{day.completed}</td>
                    <td className="py-2 px-3 text-right text-yellow-600">{day.cancelled}</td>
                    <td className="py-2 px-3 text-right text-red-600">{day.no_show}</td>
                    <td className="py-2 px-3 text-right text-blue-600">
                      {day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:mb-4 { margin-bottom: 1rem; }
          .print\\:p-0 { padding: 0; }
        }
      `}</style>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  color = 'text-gray-800',
}: {
  label: string;
  value: number;
  unit: string;
  color?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color} dark:${color.replace('600', '400')}`}>
        {value}
        <span className="text-sm font-normal ml-1">{unit}</span>
      </div>
    </div>
  );
}
