import { useEffect, useState } from 'react';
import api from '../api/client';
import type { Academy, BillingPlan, Invoice } from '../types';

export default function BillingPage() {
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Plan form
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', price_per_ride: 5000, monthly_cap: '' });

  // Invoice generation
  const [billingMonth, setBillingMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [genResult, setGenResult] = useState<Record<string, unknown> | null>(null);

  const load = async () => {
    try {
      const { data: acad } = await api.get<Academy | null>('/academies/mine');
      setAcademy(acad);
      if (acad) {
        const [plansRes, invoicesRes] = await Promise.allSettled([
          api.get(`/billing/plans?academy_id=${acad.id}`),
          api.get(`/billing/invoices?academy_id=${acad.id}`),
        ]);
        if (plansRes.status === 'fulfilled') setPlans(plansRes.value.data);
        if (invoicesRes.status === 'fulfilled') setInvoices(invoicesRes.value.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academy) return;
    try {
      await api.post('/billing/plans', {
        academy_id: academy.id,
        name: planForm.name,
        price_per_ride: planForm.price_per_ride,
        monthly_cap: planForm.monthly_cap ? parseInt(planForm.monthly_cap) : null,
      });
      setShowPlanForm(false);
      setPlanForm({ name: '', price_per_ride: 5000, monthly_cap: '' });
      await load();
    } catch {
      alert('요금제 생성 실패');
    }
  };

  const generateInvoices = async () => {
    if (!academy) return;
    setGenResult(null);
    try {
      const { data } = await api.post('/billing/generate-invoices', {
        academy_id: academy.id,
        billing_month: billingMonth,
      });
      setGenResult(data);
      await load();
    } catch {
      alert('청구서 생성 실패');
    }
  };

  const markPaid = async (invoiceId: string) => {
    try {
      await api.post(`/billing/invoices/${invoiceId}/mark-paid`);
      await load();
    } catch {
      alert('결제 처리 실패');
    }
  };

  if (loading) return <div className="text-gray-500">로딩 중...</div>;
  if (!academy) return <p className="text-gray-500">등록된 학원이 없습니다.</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">청구 관리</h2>

      {/* Billing Plans */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">요금제</h3>
          <button
            onClick={() => setShowPlanForm(!showPlanForm)}
            className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showPlanForm ? '취소' : '+ 요금제 추가'}
          </button>
        </div>

        {showPlanForm && (
          <form onSubmit={createPlan} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                placeholder="요금제 이름"
                className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <input
                type="number"
                value={planForm.price_per_ride}
                onChange={(e) => setPlanForm({ ...planForm, price_per_ride: parseInt(e.target.value) || 0 })}
                placeholder="건당 요금 (원)"
                className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <input
                type="number"
                value={planForm.monthly_cap}
                onChange={(e) => setPlanForm({ ...planForm, monthly_cap: e.target.value })}
                placeholder="월 상한 (원, 선택)"
                className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button type="submit" className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
              생성
            </button>
          </form>
        )}

        {plans.length === 0 ? (
          <p className="text-sm text-gray-400">등록된 요금제가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plans.map((p) => (
              <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="font-medium text-gray-800">{p.name}</div>
                <div className="text-sm text-gray-500 mt-1">
                  건당 {p.price_per_ride.toLocaleString()}원
                  {p.monthly_cap && ` / 월 상한 ${p.monthly_cap.toLocaleString()}원`}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Invoice Generation */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">청구서 생성</h3>
        <div className="flex gap-3 items-center">
          <input
            type="month"
            value={billingMonth}
            onChange={(e) => setBillingMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={generateInvoices}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            청구서 일괄 생성
          </button>
        </div>
        {genResult && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
            생성 {(genResult as { invoices_created?: number }).invoices_created}건 / 총액 {((genResult as { total_amount?: number }).total_amount || 0).toLocaleString()}원
          </div>
        )}
      </section>

      {/* Invoice List */}
      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">청구서 목록</h3>
        {invoices.length === 0 ? (
          <p className="text-sm text-gray-400">청구서가 없습니다.</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">청구월</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">학생 ID</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">탑승 횟수</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">금액</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">납부기한</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{inv.billing_month}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-mono">{inv.student_id.slice(0, 8)}...</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{inv.total_rides}회</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{inv.amount.toLocaleString()}원</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        inv.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : inv.status === 'overdue'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {inv.status === 'paid' ? '결제완료' : inv.status === 'overdue' ? '연체' : '미결제'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{inv.due_date}</td>
                    <td className="px-6 py-4">
                      {inv.status !== 'paid' && (
                        <button
                          onClick={() => markPaid(inv.id)}
                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          결제 처리
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
