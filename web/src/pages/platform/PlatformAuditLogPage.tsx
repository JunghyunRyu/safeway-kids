import { useEffect, useState, useCallback } from 'react';
import api from '../../api/client';
import DataTable, { type Column } from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ExportButton from '../../components/ExportButton';

interface AuditLogRow extends Record<string, unknown> {
  id: number;
  created_at: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  ip_address: string;
}

interface AuditLogResponse {
  items: AuditLogRow[];
  total: number;
  page: number;
  page_size: number;
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: '생성',
  UPDATE: '수정',
  DELETE: '삭제',
};

const ACTION_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  create: { bg: 'bg-green-100', text: 'text-green-700' },
  update: { bg: 'bg-blue-100', text: 'text-blue-700' },
  delete: { bg: 'bg-red-100', text: 'text-red-700' },
};

const ENTITY_LABELS: Record<string, string> = {
  user: '사용자',
  student: '학생',
  vehicle: '차량',
  invoice: '청구서',
  plan: '요금제',
};

const ENTITY_FILTER_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'user', label: '사용자' },
  { value: 'student', label: '학생' },
  { value: 'vehicle', label: '차량' },
  { value: 'invoice', label: '청구서' },
  { value: 'plan', label: '요금제' },
];

const ACTION_FILTER_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'CREATE', label: '생성' },
  { value: 'UPDATE', label: '수정' },
  { value: 'DELETE', label: '삭제' },
];

const PAGE_SIZE = 20;

function formatDateTime(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function truncate(str: string, maxLen: number): string {
  if (!str) return '-';
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

export default function PlatformAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (entityFilter) params.set('entity_type', entityFilter);
      if (actionFilter) params.set('action', actionFilter);
      params.set('page', String(page));
      params.set('page_size', String(PAGE_SIZE));
      const query = params.toString();
      const { data } = await api.get<AuditLogResponse>(`/admin/audit-logs?${query}`);
      setLogs(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [entityFilter, actionFilter, page]);

  useEffect(() => {
    setLoading(true);
    fetchLogs();
  }, [fetchLogs]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [entityFilter, actionFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const columns: Column<AuditLogRow>[] = [
    {
      key: 'created_at',
      label: '시간',
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap text-gray-600 dark:text-gray-400">
          {formatDateTime(row.created_at)}
        </span>
      ),
    },
    {
      key: 'user_name',
      label: '사용자',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-800 dark:text-gray-200">
          {row.user_name || '-'}
        </span>
      ),
    },
    {
      key: 'action',
      label: '작업',
      sortable: true,
      render: (row) => (
        <StatusBadge
          status={row.action.toLowerCase()}
          colorMap={{
            ...ACTION_BADGE_COLORS,
            [row.action.toLowerCase()]: ACTION_BADGE_COLORS[row.action.toLowerCase()] ?? { bg: 'bg-gray-100', text: 'text-gray-600' },
          }}
        />
      ),
    },
    {
      key: 'entity_type',
      label: '대상',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          {ENTITY_LABELS[row.entity_type] || row.entity_type}
        </span>
      ),
    },
    {
      key: 'entity_id',
      label: '대상 ID',
      render: (row) => (
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400" title={row.entity_id}>
          {truncate(row.entity_id, 8)}
        </span>
      ),
    },
    {
      key: 'details',
      label: '상세',
      render: (row) => {
        const isExpanded = expandedId === row.id;
        const detailStr = typeof row.details === 'string' ? row.details : JSON.stringify(row.details || '');
        if (!detailStr || detailStr === '""') return <span className="text-gray-400">-</span>;
        return (
          <button
            type="button"
            onClick={() => setExpandedId(isExpanded ? null : row.id)}
            className="text-left text-xs text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 max-w-xs"
            title={isExpanded ? '접기' : '펼쳐서 보기'}
          >
            {isExpanded ? (
              <span className="whitespace-pre-wrap break-all">{detailStr}</span>
            ) : (
              truncate(detailStr, 30)
            )}
          </button>
        );
      },
    },
    {
      key: 'ip_address',
      label: 'IP',
      render: (row) => (
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
          {row.ip_address || '-'}
        </span>
      ),
    },
  ];

  const exportColumns = [
    { key: 'created_at', label: '시간' },
    { key: 'user_name', label: '사용자' },
    { key: 'action', label: '작업' },
    { key: 'entity_type', label: '대상' },
    { key: 'entity_id', label: '대상 ID' },
    { key: 'details', label: '상세' },
    { key: 'ip_address', label: 'IP' },
  ];

  // For CSV export, map action/entity to Korean labels
  const exportData = logs.map((row) => ({
    ...row,
    action: ACTION_LABELS[row.action] || row.action,
    entity_type: ENTITY_LABELS[row.entity_type] || row.entity_type,
    created_at: formatDateTime(row.created_at),
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">감사 로그</h2>
        <ExportButton data={exportData} columns={exportColumns} filename="감사로그" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-teal-400 text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
          aria-label="대상 유형 필터"
        >
          {ENTITY_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-teal-400 text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
          aria-label="작업 유형 필터"
        >
          {ACTION_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <DataTable<AuditLogRow>
        columns={columns}
        data={logs}
        loading={loading}
        pageSize={PAGE_SIZE}
        emptyMessage="감사 로그가 없습니다."
      />

      {/* Server-side pagination */}
      {totalPages > 1 && (
        <div className="mt-4 px-6 py-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="이전 페이지"
          >
            이전
          </button>
          <div className="flex items-center gap-1" role="navigation" aria-label="페이지 네비게이션">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((i) => {
                if (i === 1 || i === totalPages) return true;
                if (Math.abs(i - page) <= 1) return true;
                return false;
              })
              .reduce<(number | 'ellipsis')[]>((acc, val) => {
                const prev = acc[acc.length - 1];
                if (typeof prev === 'number' && val - prev > 1) {
                  acc.push('ellipsis');
                }
                acc.push(val);
                return acc;
              }, [])
              .map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`e-${idx}`} className="px-2 text-gray-400 dark:text-gray-500 text-sm" aria-hidden="true">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    aria-label={`${item} 페이지`}
                    aria-current={page === item ? 'page' : undefined}
                    className={`w-8 h-8 text-sm rounded-lg ${
                      page === item
                        ? 'bg-teal-600 text-white font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            총 <strong className="text-gray-700 dark:text-gray-200">{total}</strong>건
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="다음 페이지"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
