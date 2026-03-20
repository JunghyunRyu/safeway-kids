import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../../api/client';
import { showToast } from '../../components/Toast';
import type { Academy, Invoice } from '../../types';
import DataTable, { type Column } from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusBadge from '../../components/StatusBadge';
import ExportButton from '../../components/ExportButton';
import KpiCard from '../../components/KpiCard';
import { StatusPieChart } from '../../components/Charts';
import { openInvoiceReceipt } from '../../utils/invoiceReceipt';

interface InvoiceRow extends Record<string, unknown> {
  id: string;
  billing_month: string;
  academy_id: string;
  academy_name: string;
  student_id: string;
  total_rides: number;
  amount: number;
  status: string;
  due_date: string;
}

export default function PlatformBillingPage() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [academyFilter, setAcademyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Mark paid confirm
  const [markPaidTarget, setMarkPaidTarget] = useState<InvoiceRow | null>(null);
  const [marking, setMarking] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [acadRes, invRes] = await Promise.allSettled([
        api.get('/academies'),
        api.get('/billing/invoices'),
      ]);

      const acads: Academy[] =
        acadRes.status === 'fulfilled' && Array.isArray(acadRes.value.data)
          ? acadRes.value.data
          : [];
      setAcademies(acads);

      const rawInvoices: Invoice[] =
        invRes.status === 'fulfilled' && Array.isArray(invRes.value.data)
          ? invRes.value.data
          : [];
      setInvoices(
        rawInvoices.map((inv) => {
          const acad = acads.find((a) => a.id === inv.academy_id);
          return {
            id: inv.id,
            billing_month: inv.billing_month,
            academy_id: inv.academy_id,
            academy_name: acad?.name || inv.academy_id.slice(0, 8),
            student_id: inv.student_id,
            total_rides: inv.total_rides,
            amount: inv.amount,
            status: inv.status,
            due_date: inv.due_date,
          };
        })
      );
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = invoices.filter((inv) => {
    if (academyFilter && inv.academy_id !== academyFilter) return false;
    if (statusFilter && inv.status !== statusFilter) return false;
    return true;
  });

  const pendingTotal = filtered
    .filter((i) => i.status === 'pending')
    .reduce((sum, i) => sum + i.amount, 0);
  const paidTotal = filtered
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);
  const overdueTotal = filtered
    .filter((i) => i.status === 'overdue')
    .reduce((sum, i) => sum + i.amount, 0);

  const invoiceStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((inv) => {
      counts[inv.status] = (counts[inv.status] || 0) + 1;
    });
    const colorMap: Record<string, string> = {
      pending: '#F59E0B',
      paid: '#16A34A',
      overdue: '#DC2626',
    };
    const labelMap: Record<string, string> = {
      pending: '미결제',
      paid: '결제완료',
      overdue: '연체',
    };
    return Object.entries(counts).map(([status, value]) => ({
      name: labelMap[status] || status,
      value,
      color: colorMap[status] || '#6B7280',
    }));
  }, [filtered]);

  const handleMarkPaid = async () => {
    if (!markPaidTarget) return;
    setMarking(true);
    try {
      await api.post(`/billing/invoices/${markPaidTarget.id}/mark-paid`);
      showToast('결제 처리가 완료되었습니다', 'success');
      setMarkPaidTarget(null);
      await fetchData();
    } catch {
      showToast('결제 처리에 실패했습니다', 'error');
    } finally {
      setMarking(false);
    }
  };

  const columns: Column<InvoiceRow>[] = [
    { key: 'billing_month', label: '청구월', sortable: true },
    { key: 'academy_name', label: '학원', sortable: true },
    {
      key: 'student_id',
      label: '학생 ID',
      render: (row) => (
        <span className="font-mono text-xs">{String(row.student_id).slice(0, 8)}...</span>
      ),
    },
    {
      key: 'total_rides',
      label: '탑승 횟수',
      sortable: true,
      render: (row) => `${row.total_rides}회`,
    },
    {
      key: 'amount',
      label: '금액',
      sortable: true,
      render: (row) => (
        <span className="font-medium">{Number(row.amount).toLocaleString()}원</span>
      ),
    },
    {
      key: 'status',
      label: '상태',
      render: (row) => <StatusBadge status={row.status as string} />,
    },
    { key: 'due_date', label: '납부기한', sortable: true },
  ];

  const exportColumns = [
    { key: 'billing_month', label: '청구월' },
    { key: 'academy_name', label: '학원' },
    { key: 'student_id', label: '학생 ID' },
    { key: 'total_rides', label: '탑승 횟수' },
    { key: 'amount', label: '금액' },
    { key: 'status', label: '상태' },
    { key: 'due_date', label: '납부기한' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">청구 관리 (전체)</h2>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="총 미결제 금액"
          value={`${pendingTotal.toLocaleString()}원`}
          color="#F59E0B"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          title="총 결제 완료"
          value={`${paidTotal.toLocaleString()}원`}
          color="#16A34A"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          title="총 연체 금액"
          value={`${overdueTotal.toLocaleString()}원`}
          color="#DC2626"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <KpiCard
          title="총 청구서 수"
          value={`${filtered.length}건`}
          color="#0F7A7A"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>

      {/* Invoice Status Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-2">청구서 상태 분포</h3>
        <StatusPieChart data={invoiceStatusData} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={academyFilter}
          onChange={(e) => setAcademyFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-400 text-sm bg-white"
        >
          <option value="">전체 학원</option>
          {academies.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-400 text-sm bg-white"
        >
          <option value="">전체 상태</option>
          <option value="pending">미결제</option>
          <option value="paid">결제완료</option>
          <option value="overdue">연체</option>
        </select>
        <div className="ml-auto">
          <ExportButton data={filtered} columns={exportColumns} filename="청구서목록" />
        </div>
      </div>

      {/* Invoice Table */}
      <DataTable<InvoiceRow>
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage="청구서가 없습니다."
        actions={(row) => (
          <>
            <button
              onClick={() => openInvoiceReceipt(row)}
              className="text-xs px-3 py-1.5 text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 font-medium transition-colors"
            >
              영수증
            </button>
            {row.status !== 'paid' && (
              <button
                onClick={() => setMarkPaidTarget(row)}
                className="text-xs px-3 py-1.5 text-white bg-teal-600 rounded-lg hover:bg-teal-700 font-medium transition-colors"
              >
                결제 처리
              </button>
            )}
          </>
        )}
      />

      {/* Mark Paid Confirm */}
      <ConfirmDialog
        open={!!markPaidTarget}
        title="결제 처리"
        message={`청구월 ${markPaidTarget?.billing_month}, 금액 ${markPaidTarget ? Number(markPaidTarget.amount).toLocaleString() : 0}원을 결제 완료로 처리하시겠습니까?`}
        confirmText="결제 처리"
        variant="info"
        loading={marking}
        onConfirm={handleMarkPaid}
        onCancel={() => setMarkPaidTarget(null)}
      />
    </div>
  );
}
