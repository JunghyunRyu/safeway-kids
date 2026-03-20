import { useEffect, useState, useCallback, type FormEvent } from 'react';
import api from '../api/client';
import { showToast } from '../components/Toast';
import DataTable, { type Column } from '../components/DataTable';
import FormModal from '../components/FormModal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import DetailModal from '../components/DetailModal';
import StatusBadge from '../components/StatusBadge';
import ExportButton from '../components/ExportButton';
import type { Academy, BillingPlan, Invoice } from '../types';
import { openInvoiceReceipt } from '../utils/invoiceReceipt';

// ── Plan form ───────────────────────────────────────────────────────
interface PlanForm {
  name: string;
  price_per_ride: string;
  monthly_cap: string;
  is_active: string;
}

const INITIAL_PLAN_FORM: PlanForm = {
  name: '',
  price_per_ride: '5000',
  monthly_cap: '',
  is_active: 'true',
};

interface PlanFieldErrors {
  name?: string;
  price_per_ride?: string;
}

// ── Invoice generation result ────────────────────────────────────────
interface GenResult {
  invoices_created?: number;
  total_amount?: number;
}

export default function BillingPage() {
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Plan modal
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BillingPlan | null>(null);
  const [planForm, setPlanForm] = useState<PlanForm>(INITIAL_PLAN_FORM);
  const [planFieldErrors, setPlanFieldErrors] = useState<PlanFieldErrors>({});
  const [savingPlan, setSavingPlan] = useState(false);

  // Plan delete
  const [deletePlanTarget, setDeletePlanTarget] = useState<BillingPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState(false);

  // Invoice generation
  const [billingMonth, setBillingMonth] = useState(
    () => new Date().toISOString().slice(0, 7),
  );
  const [genConfirmOpen, setGenConfirmOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<GenResult | null>(null);

  // Invoice detail
  const [invoiceDetail, setInvoiceDetail] = useState<Invoice | null>(null);

  // Invoice mark-paid
  const [markPaidTarget, setMarkPaidTarget] = useState<Invoice | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const [acadRes, plansRes, invoicesRes] = await Promise.allSettled([
        api.get<Academy | null>('/academies/mine'),
        api.get('/billing/plans'),
        api.get('/billing/invoices'),
      ]);

      const acad = acadRes.status === 'fulfilled' ? acadRes.value.data : null;
      setAcademy(acad);

      if (acad) {
        if (plansRes.status === 'fulfilled') {
          setPlans(Array.isArray(plansRes.value.data) ? plansRes.value.data : []);
        }
        if (invoicesRes.status === 'fulfilled') {
          setInvoices(Array.isArray(invoicesRes.value.data) ? invoicesRes.value.data : []);
        }
      }
    } catch {
      showToast('청구 데이터를 불러오는데 실패했습니다', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Plan CRUD ──────────────────────────────────────────────────────
  const validatePlan = (): boolean => {
    const errors: PlanFieldErrors = {};
    if (!planForm.name.trim()) {
      errors.name = '요금제 이름을 입력해 주세요.';
    }
    const price = parseInt(planForm.price_per_ride);
    if (isNaN(price) || price <= 0) {
      errors.price_per_ride = '건당 요금은 0보다 커야 합니다.';
    }
    setPlanFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreatePlan = () => {
    setEditingPlan(null);
    setPlanForm(INITIAL_PLAN_FORM);
    setPlanFieldErrors({});
    setPlanModalOpen(true);
  };

  const openEditPlan = (plan: BillingPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      price_per_ride: String(plan.price_per_ride),
      monthly_cap: plan.monthly_cap != null ? String(plan.monthly_cap) : '',
      is_active: plan.is_active ? 'true' : 'false',
    });
    setPlanFieldErrors({});
    setPlanModalOpen(true);
  };

  const closePlanModal = () => {
    setPlanModalOpen(false);
    setEditingPlan(null);
    setPlanForm(INITIAL_PLAN_FORM);
    setPlanFieldErrors({});
  };

  const handlePlanSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!academy || !validatePlan()) return;

    setSavingPlan(true);
    try {
      const payload = {
        academy_id: academy.id,
        name: planForm.name.trim(),
        price_per_ride: parseInt(planForm.price_per_ride),
        monthly_cap: planForm.monthly_cap ? parseInt(planForm.monthly_cap) : null,
        is_active: planForm.is_active === 'true',
      };

      if (editingPlan) {
        await api.patch(`/billing/plans/${editingPlan.id}`, payload);
        showToast('요금제가 수정되었습니다.', 'success');
      } else {
        await api.post('/billing/plans', payload);
        showToast('요금제가 생성되었습니다.', 'success');
      }
      closePlanModal();
      await load();
    } catch {
      showToast(
        editingPlan ? '요금제 수정에 실패했습니다.' : '요금제 생성에 실패했습니다.',
        'error',
      );
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!deletePlanTarget) return;
    setDeletingPlan(true);
    try {
      await api.delete(`/billing/plans/${deletePlanTarget.id}`);
      showToast('요금제가 삭제되었습니다.', 'success');
      setDeletePlanTarget(null);
      await load();
    } catch {
      showToast('요금제 삭제에 실패했습니다.', 'error');
    } finally {
      setDeletingPlan(false);
    }
  };

  // ── Invoice generation ─────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!academy) return;
    setGenerating(true);
    setGenResult(null);
    try {
      const { data } = await api.post('/billing/generate-invoices', {
        academy_id: academy.id,
        billing_month: billingMonth,
      });
      setGenResult(data as GenResult);
      showToast('청구서가 생성되었습니다.', 'success');
      setGenConfirmOpen(false);
      await load();
    } catch {
      showToast('청구서 생성에 실패했습니다.', 'error');
      setGenConfirmOpen(false);
    } finally {
      setGenerating(false);
    }
  };

  // ── Invoice mark paid ──────────────────────────────────────────────
  const handleMarkPaid = async () => {
    if (!markPaidTarget) return;
    setMarkingPaid(true);
    try {
      await api.post(`/billing/invoices/${markPaidTarget.id}/mark-paid`);
      showToast('결제 처리되었습니다.', 'success');
      setMarkPaidTarget(null);
      await load();
    } catch {
      showToast('결제 처리에 실패했습니다.', 'error');
    } finally {
      setMarkingPaid(false);
    }
  };

  // ── Columns: Plans ─────────────────────────────────────────────────
  const planColumns: Column<BillingPlan>[] = [
    {
      key: 'name',
      label: '요금제명',
      sortable: true,
      render: (row) => <span className="font-medium text-gray-800">{row.name}</span>,
    },
    {
      key: 'price_per_ride',
      label: '건당 요금',
      sortable: true,
      render: (row) => `${row.price_per_ride.toLocaleString()}원`,
    },
    {
      key: 'monthly_cap',
      label: '월 상한',
      sortable: true,
      render: (row) =>
        row.monthly_cap != null && row.monthly_cap > 0
          ? `${row.monthly_cap.toLocaleString()}원`
          : '없음',
    },
    {
      key: 'is_active',
      label: '상태',
      render: (row) => (
        <StatusBadge status={row.is_active ? 'active' : 'inactive'} />
      ),
    },
  ];

  // ── Columns: Invoices ──────────────────────────────────────────────
  const invoiceColumns: Column<Invoice>[] = [
    {
      key: 'billing_month',
      label: '청구월',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => setInvoiceDetail(row)}
          className="font-medium text-gray-800 cursor-pointer hover:underline"
        >
          {row.billing_month}
        </button>
      ),
    },
    {
      key: 'student_id',
      label: '학생 ID',
      render: (row) => (
        <span className="font-mono text-gray-600">{row.student_id.slice(0, 8)}...</span>
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
        <span className="font-medium text-gray-800">{row.amount.toLocaleString()}원</span>
      ),
    },
    {
      key: 'status',
      label: '상태',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'due_date',
      label: '납부기한',
      sortable: true,
      render: (row) => row.due_date,
    },
  ];

  const invoiceExportColumns = [
    { key: 'billing_month', label: '청구월' },
    { key: 'student_id', label: '학생 ID' },
    { key: 'total_rides', label: '탑승 횟수' },
    { key: 'amount', label: '금액' },
    { key: 'status', label: '상태' },
    { key: 'due_date', label: '납부기한' },
  ];

  // ── Render ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg
          className="w-8 h-8 animate-spin text-teal-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="ml-3 text-gray-500">로딩 중...</span>
      </div>
    );
  }

  if (!academy) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <p className="text-yellow-800">
          등록된 학원이 없습니다. 먼저 학원을 등록해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">청구 관리</h2>

      {/* ── Section 1: Billing Plans ──────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">요금제</h3>
          <button
            onClick={openCreatePlan}
            className="text-sm px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
          >
            + 요금제 추가
          </button>
        </div>

        <DataTable<BillingPlan>
          columns={planColumns}
          data={plans}
          emptyMessage="등록된 요금제가 없습니다."
          actions={(row) => (
            <>
              <button
                onClick={() => openEditPlan(row)}
                className="text-sm px-3 py-1.5 text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 font-medium"
              >
                수정
              </button>
              <button
                onClick={() => setDeletePlanTarget(row)}
                className="text-sm px-3 py-1.5 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 font-medium"
              >
                삭제
              </button>
            </>
          )}
        />
      </section>

      {/* ── Section 2: Invoice Generation ─────────────────────────── */}
      <section className="mb-10">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">청구서 생성</h3>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                청구 월
              </label>
              <input
                type="month"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-400 text-sm"
              />
            </div>
            <button
              onClick={() => setGenConfirmOpen(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
            >
              청구서 일괄 생성
            </button>
          </div>
          {genResult && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">생성 완료</span>
              </div>
              <p>
                생성된 청구서: <strong>{genResult.invoices_created ?? 0}</strong>건 /
                총 금액: <strong>{(genResult.total_amount ?? 0).toLocaleString()}원</strong>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 3: Invoices ────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">청구서 목록</h3>
          <ExportButton
            data={invoices as unknown as Record<string, unknown>[]}
            columns={invoiceExportColumns}
            filename="청구서목록"
          />
        </div>

        <DataTable<Invoice>
          columns={invoiceColumns}
          data={invoices}
          emptyMessage="청구서가 없습니다."
          actions={(row) => (
            <>
              <button
                onClick={() => openInvoiceReceipt(row)}
                className="text-sm px-3 py-1.5 text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 font-medium"
              >
                영수증
              </button>
              {row.status !== 'paid' && (
                <button
                  onClick={() => setMarkPaidTarget(row)}
                  className="text-sm px-3 py-1.5 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 font-medium"
                >
                  결제 처리
                </button>
              )}
            </>
          )}
        />
      </section>

      {/* ── Modals & Dialogs ──────────────────────────────────────── */}

      {/* Invoice Detail */}
      <DetailModal
        open={!!invoiceDetail}
        title="청구서 상세"
        onClose={() => setInvoiceDetail(null)}
        fields={invoiceDetail ? [
          { label: '청구 월', value: invoiceDetail.billing_month },
          { label: '학생 ID', value: invoiceDetail.student_id },
          { label: '학원 ID', value: invoiceDetail.academy_id },
          { label: '탑승 횟수', value: `${invoiceDetail.total_rides}회` },
          { label: '금액', value: `${invoiceDetail.amount.toLocaleString()}원` },
          { label: '상태', value: <StatusBadge status={invoiceDetail.status} /> },
          { label: '마감일', value: invoiceDetail.due_date || '-' },
          { label: '결제일', value: invoiceDetail.paid_at || '-' },
        ] : []}
        actions={invoiceDetail && invoiceDetail.status !== 'paid' ? (
          <button
            type="button"
            onClick={() => { const target = invoiceDetail; setInvoiceDetail(null); setMarkPaidTarget(target); }}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            결제 완료 처리
          </button>
        ) : undefined}
      />

      {/* Plan Create/Edit */}
      <FormModal
        open={planModalOpen}
        title={editingPlan ? '요금제 수정' : '요금제 추가'}
        onClose={closePlanModal}
        onSubmit={handlePlanSubmit}
        loading={savingPlan}
        submitText={editingPlan ? '수정' : '생성'}
      >
        <FormField
          label="요금제 이름"
          name="plan_name"
          value={planForm.name}
          onChange={(v) => setPlanForm({ ...planForm, name: v })}
          error={planFieldErrors.name}
          required
          placeholder="기본 요금제"
        />
        <FormField
          label="건당 요금 (원)"
          name="price_per_ride"
          type="number"
          value={planForm.price_per_ride}
          onChange={(v) => setPlanForm({ ...planForm, price_per_ride: v })}
          error={planFieldErrors.price_per_ride}
          required
          placeholder="5000"
        />
        <FormField
          label="월 상한 (원, 선택)"
          name="monthly_cap"
          type="number"
          value={planForm.monthly_cap}
          onChange={(v) => setPlanForm({ ...planForm, monthly_cap: v })}
          placeholder="비워두면 상한 없음"
        />
        {editingPlan && (
          <FormField
            label="상태"
            name="plan_is_active"
            type="select"
            value={planForm.is_active}
            onChange={(v) => setPlanForm({ ...planForm, is_active: v })}
            options={[
              { value: 'true', label: '활성' },
              { value: 'false', label: '비활성' },
            ]}
          />
        )}
      </FormModal>

      {/* Plan Delete Confirmation */}
      <ConfirmDialog
        open={!!deletePlanTarget}
        title="요금제 삭제"
        message={`"${deletePlanTarget?.name ?? ''}" 요금제를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        variant="danger"
        loading={deletingPlan}
        onConfirm={handleDeletePlan}
        onCancel={() => setDeletePlanTarget(null)}
      />

      {/* Invoice Generation Confirmation */}
      <ConfirmDialog
        open={genConfirmOpen}
        title="청구서 일괄 생성"
        message={`${billingMonth} 청구서를 일괄 생성하시겠습니까? 이미 생성된 청구서가 있으면 중복 생성될 수 있습니다.`}
        confirmText="생성"
        variant="warning"
        loading={generating}
        onConfirm={handleGenerate}
        onCancel={() => setGenConfirmOpen(false)}
      />

      {/* Mark Paid Confirmation */}
      <ConfirmDialog
        open={!!markPaidTarget}
        title="결제 처리"
        message={`${markPaidTarget?.billing_month ?? ''} / ${markPaidTarget?.amount?.toLocaleString() ?? '0'}원 청구서를 결제 완료로 처리하시겠습니까?`}
        confirmText="결제 처리"
        variant="info"
        loading={markingPaid}
        onConfirm={handleMarkPaid}
        onCancel={() => setMarkPaidTarget(null)}
      />
    </div>
  );
}
