import { useEffect, useState, useCallback } from 'react';
import api from '../../api/client';

interface Ticket {
  id: string;
  user_id: string;
  user_name: string | null;
  category: string;
  subject: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  open: '접수',
  in_progress: '처리 중',
  resolved: '해결',
  closed: '종료',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export default function PlatformTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/admin/support/tickets', { params });
      setTickets(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (ticketId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/support/tickets/${ticketId}`, { status: newStatus });
      load();
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">CS 문의 관리</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">전체 {total}건</span>
      </div>

      <div className="mb-4 flex gap-2">
        {['', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded text-sm ${
              statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {s === '' ? '전체' : STATUS_LABELS[s] || s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">로딩 중...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">문의가 없습니다</div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[t.status] || ''}`}>
                      {STATUS_LABELS[t.status] || t.status}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{t.category}</span>
                  </div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">{t.subject}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.description}</p>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {t.user_name || '알 수 없음'} | {new Date(t.created_at).toLocaleString('ko-KR')}
                  </div>
                </div>
                {t.status !== 'closed' && (
                  <select
                    value={t.status}
                    onChange={(e) => updateStatus(t.id, e.target.value)}
                    className="text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  >
                    <option value="open">접수</option>
                    <option value="in_progress">처리 중</option>
                    <option value="resolved">해결</option>
                    <option value="closed">종료</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
