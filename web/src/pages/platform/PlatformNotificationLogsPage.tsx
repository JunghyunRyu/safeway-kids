import { useState, useCallback, useEffect } from 'react';
import api from '../../api/client';
import { showToast } from '../../components/Toast';
import DataTable, { type Column } from '../../components/DataTable';
import FormModal from '../../components/FormModal';
import FormField from '../../components/FormField';
import StatusBadge from '../../components/StatusBadge';

interface NotificationLog extends Record<string, unknown> {
  id: string;
  recipient_user_id: string | null;
  recipient_phone: string | null;
  channel: string;
  notification_type: string;
  title: string | null;
  body: string | null;
  status: string;
  error_message: string | null;
  sent_at: string;
}

const CHANNEL_LABELS: Record<string, string> = { fcm: 'FCM', sms: 'SMS' };
const TYPE_LABELS: Record<string, string> = {
  boarding: '탑승', alighting: '하차', delay: '지연', sos: 'SOS',
  schedule_cancelled: '취소', manual: '수동', no_show: '미탑승',
  arrival: '도착확인',
};

export default function PlatformNotificationLogsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [channelFilter, setChannelFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Manual send modal
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ recipient_ids: '', channel: 'both', message: '', purpose: '기타 운영 안내' });
  const [sending, setSending] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: '50' });
      if (channelFilter) params.set('channel', channelFilter);
      if (typeFilter) params.set('notification_type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/admin/notifications/logs?${params}`);
      setLogs(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, channelFilter, typeFilter, statusFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleManualSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.recipient_ids.trim() || !manualForm.message.trim()) return;
    setSending(true);
    try {
      const ids = manualForm.recipient_ids.split(',').map((s) => s.trim()).filter(Boolean);
      const { data } = await api.post('/notifications/manual-send', {
        recipient_ids: ids,
        channel: manualForm.channel,
        message: manualForm.message,
        purpose: manualForm.purpose,
      });
      showToast(`발송 완료: ${data.sent}건 성공, ${data.failed}건 실패`, 'success');
      setShowManual(false);
      setManualForm({ recipient_ids: '', channel: 'both', message: '', purpose: '기타 운영 안내' });
      await fetchLogs();
    } catch {
      showToast('발송에 실패했습니다', 'error');
    } finally {
      setSending(false);
    }
  };

  const columns: Column<NotificationLog>[] = [
    {
      key: 'sent_at',
      label: '발송 시각',
      sortable: true,
      render: (row) => new Date(row.sent_at).toLocaleString('ko-KR'),
    },
    {
      key: 'channel',
      label: '채널',
      render: (row) => CHANNEL_LABELS[row.channel] || row.channel,
    },
    {
      key: 'notification_type',
      label: '유형',
      render: (row) => TYPE_LABELS[row.notification_type] || row.notification_type,
    },
    { key: 'recipient_phone', label: '수신자', render: (row) => {
      const p = row.recipient_phone;
      if (!p) return '-';
      const digits = p.replace(/-/g, '').replace(/ /g, '');
      return digits.length >= 7 ? digits.slice(0, 3) + '****' + digits.slice(-4) : '***';
    }},
    { key: 'body', label: '내용', render: (row) => (
      <span className="truncate block max-w-[200px]" title={row.body || ''}>
        {row.body || '-'}
      </span>
    )},
    {
      key: 'status',
      label: '상태',
      render: (row) => (
        <StatusBadge
          status={row.status}
          colorMap={{
            sent: { bg: 'bg-green-100', text: 'text-green-700' },
            failed: { bg: 'bg-red-100', text: 'text-red-700' },
          }}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">알림 발송 이력</h2>
        <button
          onClick={() => setShowManual(true)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
        >
          수동 발송
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={channelFilter} onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">전체 채널</option>
          <option value="fcm">FCM</option>
          <option value="sms">SMS</option>
        </select>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">전체 유형</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">전체 상태</option>
          <option value="sent">성공</option>
          <option value="failed">실패</option>
        </select>
        <span className="text-sm text-gray-500 self-center ml-auto">총 {total}건</span>
      </div>

      <DataTable<NotificationLog>
        columns={columns}
        data={logs}
        loading={loading}
        emptyMessage="알림 발송 이력이 없습니다."
      />

      {total > 50 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50">이전</button>
          <span className="px-3 py-1 text-sm">{page} / {Math.ceil(total / 50)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 50)}
            className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50">다음</button>
        </div>
      )}

      {/* Manual Send Modal */}
      <FormModal
        open={showManual}
        title="수동 알림 발송"
        onClose={() => setShowManual(false)}
        onSubmit={handleManualSend}
        loading={sending}
        submitText="발송"
      >
        <FormField
          label="수신자 ID"
          name="recipient_ids"
          value={manualForm.recipient_ids}
          onChange={(v) => setManualForm({ ...manualForm, recipient_ids: v })}
          placeholder="UUID (콤마로 구분)"
          required
        />
        <FormField
          label="채널"
          name="channel"
          type="select"
          value={manualForm.channel}
          onChange={(v) => setManualForm({ ...manualForm, channel: v })}
          options={[
            { value: 'both', label: 'FCM + SMS' },
            { value: 'fcm', label: 'FCM만' },
            { value: 'sms', label: 'SMS만' },
          ]}
        />
        <FormField
          label="발송 목적"
          name="purpose"
          type="select"
          value={manualForm.purpose}
          onChange={(v) => setManualForm({ ...manualForm, purpose: v })}
          options={[
            { value: '긴급 안전 안내', label: '긴급 안전 안내' },
            { value: '시스템 장애 공지', label: '시스템 장애 공지' },
            { value: '운행 변경 안내', label: '운행 변경 안내' },
            { value: '기타 운영 안내', label: '기타 운영 안내' },
          ]}
        />
        <FormField
          label="메시지"
          name="message"
          value={manualForm.message}
          onChange={(v) => setManualForm({ ...manualForm, message: v })}
          placeholder="발송할 메시지 내용 (최대 200자)"
          required
        />
      </FormModal>
    </div>
  );
}
