import { useEffect, useState, type FormEvent } from 'react';
import api from '../../api/client';
import { showToast } from '../../components/Toast';
import type { Academy } from '../../types';
import DataTable, { type Column } from '../../components/DataTable';
import FormModal from '../../components/FormModal';
import FormField from '../../components/FormField';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusBadge from '../../components/StatusBadge';
import ExportButton from '../../components/ExportButton';

interface AcademyRow extends Record<string, unknown> {
  id: string;
  name: string;
  address: string;
  phone: string;
  admin_id: string;
  is_active?: boolean;
}

const emptyForm = { name: '', address: '', phone: '' };

export default function PlatformAcademiesPage() {
  const [academies, setAcademies] = useState<AcademyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AcademyRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Deactivate confirm
  const [deactivateTarget, setDeactivateTarget] = useState<AcademyRow | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  // Search
  const [search, setSearch] = useState('');

  const fetchAcademies = async () => {
    try {
      const { data } = await api.get('/academies');
      const list: Academy[] = Array.isArray(data) ? data : [];
      setAcademies(
        list.map((a) => ({
          id: a.id,
          name: a.name,
          address: a.address,
          phone: a.phone || '',
          admin_id: a.admin_id || '',
          is_active: true, // default if not returned
        }))
      );
    } catch {
      setAcademies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademies();
  }, []);

  const filtered = academies.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.address.toLowerCase().includes(q) ||
      a.phone.toLowerCase().includes(q)
    );
  });

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = '학원명을 입력하세요';
    if (!form.address.trim()) errs.address = '주소를 입력하세요';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (row: AcademyRow) => {
    setEditTarget(row);
    setForm({ name: row.name, address: row.address, phone: row.phone });
    setErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await api.patch(`/academies/${editTarget.id}`, form);
        showToast('학원 정보가 수정되었습니다', 'success');
      } else {
        await api.post('/academies', form);
        showToast('학원이 등록되었습니다', 'success');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditTarget(null);
      await fetchAcademies();
    } catch {
      showToast(editTarget ? '학원 수정에 실패했습니다' : '학원 등록에 실패했습니다', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await api.patch(`/academies/${deactivateTarget.id}`, { is_active: false });
      showToast(`${deactivateTarget.name} 학원이 비활성화되었습니다`, 'success');
      setDeactivateTarget(null);
      await fetchAcademies();
    } catch {
      showToast('학원 비활성화에 실패했습니다', 'error');
    } finally {
      setDeactivating(false);
    }
  };

  const columns: Column<AcademyRow>[] = [
    { key: 'name', label: '학원명', sortable: true },
    { key: 'address', label: '주소', sortable: true },
    { key: 'phone', label: '전화번호', render: (row) => row.phone || '-' },
    {
      key: 'admin_id',
      label: '관리자 ID',
      render: (row) =>
        row.admin_id ? (
          <span className="font-mono text-xs">{String(row.admin_id).slice(0, 8)}...</span>
        ) : (
          '-'
        ),
    },
    {
      key: 'is_active',
      label: '상태',
      render: (row) => <StatusBadge status={row.is_active !== false ? 'active' : 'inactive'} />,
    },
  ];

  const exportColumns = [
    { key: 'name', label: '학원명' },
    { key: 'address', label: '주소' },
    { key: 'phone', label: '전화번호' },
    { key: 'admin_id', label: '관리자 ID' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">학원 관리</h2>
        <div className="flex items-center gap-3">
          <ExportButton data={filtered} columns={exportColumns} filename="학원목록" />
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            학원 추가
          </button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable<AcademyRow>
        columns={columns}
        data={filtered}
        loading={loading}
        searchable
        searchPlaceholder="학원명, 주소로 검색..."
        onSearch={setSearch}
        emptyMessage="등록된 학원이 없습니다."
        actions={(row) => (
          <>
            <button
              onClick={() => openEdit(row)}
              className="text-xs px-3 py-1.5 text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 font-medium transition-colors"
            >
              수정
            </button>
            {row.is_active !== false && (
              <button
                onClick={() => setDeactivateTarget(row)}
                className="text-xs px-3 py-1.5 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 font-medium transition-colors"
              >
                비활성화
              </button>
            )}
          </>
        )}
      />

      {/* Create / Edit Modal */}
      <FormModal
        open={showModal}
        title={editTarget ? '학원 수정' : '학원 추가'}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        loading={saving}
        submitText={editTarget ? '수정' : '등록'}
      >
        <FormField
          label="학원명"
          name="name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          placeholder="예: 해피키즈 학원"
          required
          error={errors.name}
        />
        <FormField
          label="주소"
          name="address"
          value={form.address}
          onChange={(v) => setForm({ ...form, address: v })}
          placeholder="서울시 강남구 ..."
          required
          error={errors.address}
        />
        <FormField
          label="전화번호"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          placeholder="02-1234-5678"
        />
      </FormModal>

      {/* Deactivate Confirm */}
      <ConfirmDialog
        open={!!deactivateTarget}
        title="학원 비활성화"
        message={`"${deactivateTarget?.name}" 학원을 비활성화하시겠습니까? 비활성화 후에도 데이터는 보존됩니다.`}
        confirmText="비활성화"
        variant="warning"
        loading={deactivating}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}
