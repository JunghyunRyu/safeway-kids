import { useEffect, useState, type FormEvent } from 'react';
import api from '../../api/client';
import { showToast } from '../../components/Toast';
import type { Vehicle, Academy } from '../../types';
import DataTable, { type Column } from '../../components/DataTable';
import FormModal from '../../components/FormModal';
import FormField from '../../components/FormField';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusBadge from '../../components/StatusBadge';
import ExportButton from '../../components/ExportButton';

interface VehicleRow extends Record<string, unknown> {
  id: string;
  license_plate: string;
  capacity: number;
  model_name: string;
  academy_id: string;
  academy_name: string;
  is_active: boolean;
}

const emptyForm = {
  license_plate: '',
  capacity: '15',
  model_name: '',
  academy_id: '',
};

export default function PlatformVehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form modal
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<VehicleRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<VehicleRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Search
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const [vRes, aRes] = await Promise.allSettled([
        api.get('/telemetry/vehicles'),
        api.get('/academies'),
      ]);
      const acads: Academy[] =
        aRes.status === 'fulfilled' && Array.isArray(aRes.value.data)
          ? aRes.value.data
          : [];
      setAcademies(acads);

      const raw: (Vehicle & { academy_id?: string })[] =
        vRes.status === 'fulfilled' && Array.isArray(vRes.value.data)
          ? vRes.value.data
          : [];
      setVehicles(
        raw.map((v) => {
          const acad = acads.find((a) => a.id === v.academy_id);
          return {
            id: v.id,
            license_plate: v.license_plate,
            capacity: v.capacity,
            model_name: v.model_name || '',
            academy_id: v.academy_id || '',
            academy_name: acad?.name || '-',
            is_active: v.is_active,
          };
        })
      );
    } catch {
      showToast('차량 데이터를 불러오는데 실패했습니다', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = vehicles.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.license_plate.toLowerCase().includes(q) ||
      v.model_name.toLowerCase().includes(q) ||
      v.academy_name.toLowerCase().includes(q)
    );
  });

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.license_plate.trim()) errs.license_plate = '번호판을 입력하세요';
    const cap = parseInt(form.capacity);
    if (isNaN(cap) || cap < 1) errs.capacity = '정원은 1 이상의 숫자여야 합니다';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (row: VehicleRow) => {
    setEditTarget(row);
    setForm({
      license_plate: row.license_plate,
      capacity: String(row.capacity),
      model_name: row.model_name,
      academy_id: row.academy_id,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      license_plate: form.license_plate,
      capacity: parseInt(form.capacity),
      model_name: form.model_name || undefined,
      academy_id: form.academy_id || undefined,
    };
    try {
      if (editTarget) {
        await api.patch(`/telemetry/vehicles/${editTarget.id}`, payload);
        showToast('차량 정보가 수정되었습니다', 'success');
      } else {
        await api.post('/telemetry/vehicles', payload);
        showToast('차량이 등록되었습니다', 'success');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditTarget(null);
      await fetchData();
    } catch {
      showToast(editTarget ? '차량 수정에 실패했습니다' : '차량 등록에 실패했습니다', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/telemetry/vehicles/${deleteTarget.id}`);
      showToast(`차량 ${deleteTarget.license_plate}이(가) 삭제되었습니다`, 'success');
      setDeleteTarget(null);
      await fetchData();
    } catch {
      showToast('차량 삭제에 실패했습니다', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const academyOptions = [
    { value: '', label: '선택 안 함' },
    ...academies.map((a) => ({ value: a.id, label: a.name })),
  ];

  const columns: Column<VehicleRow>[] = [
    { key: 'license_plate', label: '번호판', sortable: true },
    {
      key: 'capacity',
      label: '정원',
      sortable: true,
      render: (row) => `${row.capacity}명`,
    },
    { key: 'model_name', label: '모델', render: (row) => row.model_name || '-' },
    { key: 'academy_name', label: '학원', sortable: true },
    {
      key: 'is_active',
      label: '상태',
      render: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
    },
  ];

  const exportColumns = [
    { key: 'license_plate', label: '번호판' },
    { key: 'capacity', label: '정원' },
    { key: 'model_name', label: '모델' },
    { key: 'academy_name', label: '학원' },
    { key: 'is_active', label: '상태' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">차량 관리 (전체)</h2>
        <div className="flex items-center gap-3">
          <ExportButton data={filtered} columns={exportColumns} filename="차량목록" />
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            차량 등록
          </button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable<VehicleRow>
        columns={columns}
        data={filtered}
        loading={loading}
        searchable
        searchPlaceholder="번호판, 모델명, 학원명으로 검색..."
        onSearch={setSearch}
        emptyMessage="등록된 차량이 없습니다."
        actions={(row) => (
          <>
            <button
              onClick={() => openEdit(row)}
              className="text-xs px-3 py-1.5 text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 font-medium transition-colors"
            >
              수정
            </button>
            <button
              onClick={() => setDeleteTarget(row)}
              className="text-xs px-3 py-1.5 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 font-medium transition-colors"
            >
              삭제
            </button>
          </>
        )}
      />

      {/* Create / Edit Modal */}
      <FormModal
        open={showModal}
        title={editTarget ? '차량 수정' : '차량 등록'}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        loading={saving}
        submitText={editTarget ? '수정' : '등록'}
      >
        <FormField
          label="번호판"
          name="license_plate"
          value={form.license_plate}
          onChange={(v) => setForm({ ...form, license_plate: v })}
          placeholder="12가3456"
          required
          error={errors.license_plate}
        />
        <FormField
          label="정원"
          name="capacity"
          type="number"
          value={form.capacity}
          onChange={(v) => setForm({ ...form, capacity: v })}
          required
          error={errors.capacity}
        />
        <FormField
          label="모델명"
          name="model_name"
          value={form.model_name}
          onChange={(v) => setForm({ ...form, model_name: v })}
          placeholder="현대 카운티"
        />
        <FormField
          label="학원"
          name="academy_id"
          type="select"
          value={form.academy_id}
          onChange={(v) => setForm({ ...form, academy_id: v })}
          options={academyOptions}
        />
      </FormModal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="차량 삭제"
        message={`차량 "${deleteTarget?.license_plate}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
