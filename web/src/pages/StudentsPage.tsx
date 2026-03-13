import { useEffect, useState } from 'react';
import api from '../api/client';
import type { Academy, Enrollment, Student } from '../types';

export default function StudentsPage() {
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [enrollments, setEnrollments] = useState<(Enrollment & { student?: Student })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: acad } = await api.get<Academy | null>('/academies/mine');
        setAcademy(acad);
        if (acad) {
          // Fetch daily schedules to find student_ids associated with this academy
          const today = new Date().toISOString().slice(0, 10);
          try {
            const { data: schedules } = await api.get(`/schedules/daily?target_date=${today}`);
            const studentIds = [...new Set(schedules.map((s: { student_id: string }) => s.student_id))] as string[];
            setEnrollments(
              studentIds.map((sid) => ({
                id: sid,
                student_id: sid,
                academy_id: acad.id,
                status: 'active',
                enrolled_at: '',
              }))
            );
          } catch {
            setEnrollments([]);
          }
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">학생 관리</h2>
        {academy && (
          <span className="text-sm text-gray-500">{academy.name}</span>
        )}
      </div>

      {!academy ? (
        <p className="text-gray-500">등록된 학원이 없습니다.</p>
      ) : enrollments.length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500">등록된 학생이 없습니다.</p>
          <p className="text-sm text-gray-400 mt-2">
            학부모가 앱에서 학생을 등록하고 학원에 등록하면 여기에 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">학생 ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enrollments.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                    {e.student_id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                      {e.status}
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
