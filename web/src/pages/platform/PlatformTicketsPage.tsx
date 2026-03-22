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

interface SupportStats {
  total: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  avg_resolution_hours: number | null;
}

interface InternalNote {
  id: string;
  entity_type: string;
  entity_id: string;
  author_name: string | null;
  content: string;
  created_at: string;
}

export default function PlatformTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  // P3-75: CS stats
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [statsPeriod, setStatsPeriod] = useState('daily');
  // P3-76: Internal notes
  const [noteTicketId, setNoteTicketId] = useState<string | null>(null);
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [newNote, setNewNote] = useState('');

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

  // P3-75: Load CS stats
  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/support/stats', { params: { period: statsPeriod } });
      setStats(res.data);
    } catch { /* ignore */ }
  }, [statsPeriod]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // P3-76: Load notes for a ticket
  const loadNotes = useCallback(async (ticketId: string) => {
    try {
      const res = await api.get('/admin/notes', { params: { entity_type: 'ticket', entity_id: ticketId } });
      setNotes(res.data);
    } catch { /* ignore */ }
  }, []);

  const handleOpenNotes = useCallback((ticketId: string) => {
    setNoteTicketId(ticketId);
    setNewNote('');
    loadNotes(ticketId);
  }, [loadNotes]);

  const handleAddNote = useCallback(async () => {
    if (!noteTicketId || !newNote.trim()) return;
    try {
      await api.post('/admin/notes', {
        entity_type: 'ticket',
        entity_id: noteTicketId,
        content: newNote.trim(),
      });
      setNewNote('');
      loadNotes(noteTicketId);
    } catch { /* ignore */ }
  }, [noteTicketId, newNote, loadNotes]);

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

      {/* P3-75: CS Stats */}
      {stats && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">CS 통계</h2>
            <select
              value={statsPeriod}
              onChange={(e) => setStatsPeriod(e.target.value)}
              className="text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <option value="daily">일간</option>
              <option value="weekly">주간</option>
            </select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">총 문의</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.total}</div>
            </div>
            {Object.entries(stats.by_status).map(([status, count]) => (
              <div key={status} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">{STATUS_LABELS[status] || status}</div>
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{count}</div>
              </div>
            ))}
            {stats.avg_resolution_hours !== null && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">평균 해결 시간</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.avg_resolution_hours.toFixed(1)}<span className="text-sm font-normal ml-1">시간</span></div>
              </div>
            )}
          </div>
        </div>
      )}

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
                <div className="flex flex-col items-end gap-2">
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
                  <button
                    onClick={() => handleOpenNotes(t.id)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    내부 메모
                  </button>
                </div>
              </div>
              {/* P3-76: Notes panel */}
              {noteTicketId === t.id && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">내부 메모</h4>
                  {notes.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">메모가 없습니다</p>
                  ) : (
                    <div className="space-y-2 mb-2 max-h-40 overflow-y-auto">
                      {notes.map((n) => (
                        <div key={n.id} className="bg-gray-50 dark:bg-gray-700 rounded p-2 text-sm">
                          <p className="text-gray-800 dark:text-gray-200">{n.content}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {n.author_name || '관리자'} · {new Date(n.created_at).toLocaleString('ko-KR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="메모를 입력하세요..."
                      className="flex-1 text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(); }}
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      추가
                    </button>
                    <button
                      onClick={() => setNoteTicketId(null)}
                      className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
