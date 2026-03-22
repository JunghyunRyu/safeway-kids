import { useEffect, useState, useCallback, type FormEvent } from 'react';
import api from '../api/client';
import { showToast } from '../components/Toast';
import DataTable, { type Column } from '../components/DataTable';
import FormModal from '../components/FormModal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import ExportButton from '../components/ExportButton';
import type { Vehicle } from '../types';

interface VehicleForm {
  license_plate: string;
  capacity: string;
  model_name: string;
  is_active: string;
  school_bus_registration_no: string;
  manufacture_year: string;
  is_yellow_painted: string;
  has_cctv: string;
  has_stop_sign: string;
}

const INITIAL_FORM: VehicleForm = {
  license_plate: '',
  capacity: '15',
  model_name: '',
  is_active: 'true',
  school_bus_registration_no: '',
  manufacture_year: '',
  is_yellow_painted: 'false',
  has_cctv: 'false',
  has_stop_sign: 'false',
};

interface FieldErrors {
  license_plate?: string;
  capacity?: string;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleForm>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchVehicles = useCallback(async () => {
    try {
      const { data } = await api.get('/telemetry/vehicles');
      setVehicles(Array.isArray(data) ? data : []);
    } catch {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Validation
  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!form.license_plate.trim()) {
      errors.license_plate = '번호판을 입력해 주세요.';
    }
    const cap = parseInt(form.capacity);
    if (isNaN(cap) || cap <= 0) {
      errors.capacity = '정원은 1 이상이어야 합니다.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreate = () => {
    setEditingVehicle(null);
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    const v = vehicle as Vehicle & {
      school_bus_registration_no?: string;
      manufacture_year?: number;
      is_yellow_painted?: boolean;
      has_cctv?: boolean;
      has_stop_sign?: boolean;
    };
    setForm({
      license_plate: vehicle.license_plate,
      capacity: String(vehicle.capacity),
      model_name: vehicle.model_name ?? '',
      is_active: vehicle.is_active ? 'true' : 'false',
      school_bus_registration_no: v.school_bus_registration_no ?? '',
      manufacture_year: v.manufacture_year ? String(v.manufacture_year) : '',
      is_yellow_painted: v.is_yellow_painted ? 'true' : 'false',
      has_cctv: v.has_cctv ? 'true' : 'false',
      has_stop_sign: v.has_stop_sign ? 'true' : 'false',
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingVehicle(null);
    setForm(INITIAL_FORM);
    setFieldErrors({});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        license_plate: form.license_plate.trim(),
        capacity: parseInt(form.capacity),
        model_name: form.model_name.trim() || null,
        is_active: form.is_active === 'true',
        school_bus_registration_no: form.school_bus_registration_no.trim() || null,
        manufacture_year: form.manufacture_year ? parseInt(form.manufacture_year) : null,
        is_yellow_painted: form.is_yellow_painted === 'true',
        has_cctv: form.has_cctv === 'true',
        has_stop_sign: form.has_stop_sign === 'true',
      };

      if (editingVehicle) {
        await api.patch(`/telemetry/vehicles/${editingVehicle.id}`, payload);
        showToast('차량 정보가 수정되었습니다.', 'success');
      } else {
        await api.post('/telemetry/vehicles', payload);
        showToast('차량이 등록되었습니다.', 'success');
      }
      closeModal();
      await fetchVehicles();
    } catch {
      showToast(
        editingVehicle ? '차량 수정에 실패했습니다.' : '차량 등록에 실패했습니다.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/telemetry/vehicles/${deleteTarget.id}`);
      showToast('차량이 삭제되었습니다.', 'success');
      setDeleteTarget(null);
      await fetchVehicles();
    } catch {
      showToast('차량 삭제에 실패했습니다.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Columns
  const columns: Column<Vehicle>[] = [
    {
      key: 'license_plate',
      label: '번호판',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-800">{row.license_plate}</span>
      ),
    },
    {
      key: 'capacity',
      label: '정원',
      sortable: true,
      render: (row) => `${row.capacity}명`,
    },
    {
      key: 'model_name',
      label: '모델',
      sortable: true,
      render: (row) => row.model_name || '-',
    },
    {
      key: 'is_active',
      label: '상태',
      render: (row) => (
        <StatusBadge status={row.is_active ? 'active' : 'inactive'} />
      ),
    },
  ];

  const exportColumns = [
    { key: 'license_plate', label: '번호판' },
    { key: 'capacity', label: '정원' },
    { key: 'model_name', label: '모델' },
    { key: 'is_active', label: '상태' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">차량 관리</h2>
        <div className="flex items-center gap-3">
          <ExportButton
            data={vehicles as unknown as Record<string, unknown>[]}
            columns={exportColumns}
            filename="차량목록"
          />
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
          >
            + 차량 등록
          </button>
        </div>
      </div>

      {/* DataTable */}
      <DataTable<Vehicle>
        columns={columns}
        data={vehicles}
        loading={loading}
        searchable
        searchPlaceholder="번호판 또는 모델명으로 검색..."
        onSearch={() => {
          /* client-side filtering handled by DataTable */
        }}
        emptyMessage="등록된 차량이 없습니다."
        actions={(row) => (
          <>
            <button
              onClick={() => openEdit(row)}
              className="text-sm px-3 py-1.5 text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 font-medium"
            >
              수정
            </button>
            <button
              onClick={() => setDeleteTarget(row)}
              className="text-sm px-3 py-1.5 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 font-medium"
            >
              삭제
            </button>
          </>
        )}
      />

      {/* Create/Edit Modal */}
      <FormModal
        open={modalOpen}
        title={editingVehicle ? '차량 수정' : '차량 등록'}
        onClose={closeModal}
        onSubmit={handleSubmit}
        loading={saving}
        submitText={editingVehicle ? '수정' : '등록'}
      >
        <FormField
          label="번호판"
          name="license_plate"
          value={form.license_plate}
          onChange={(v) => setForm({ ...form, license_plate: v })}
          error={fieldErrors.license_plate}
          required
          placeholder="12가3456"
        />
        <FormField
          label="정원"
          name="capacity"
          type="number"
          value={form.capacity}
          onChange={(v) => setForm({ ...form, capacity: v })}
          error={fieldErrors.capacity}
          required
          placeholder="15"
        />
        <FormField
          label="모델명"
          name="model_name"
          value={form.model_name}
          onChange={(v) => setForm({ ...form, model_name: v })}
          placeholder="현대 카운티"
        />
        <FormField
          label="통학버스 신고번호"
          name="school_bus_registration_no"
          value={form.school_bus_registration_no}
          onChange={(v) => setForm({ ...form, school_bus_registration_no: v })}
          placeholder="신고번호"
        />
        <FormField
          label="제조연도"
          name="manufacture_year"
          type="number"
          value={form.manufacture_year}
          onChange={(v) => setForm({ ...form, manufacture_year: v })}
          placeholder="2024"
        />
        <FormField
          label="황색 도색"
          name="is_yellow_painted"
          type="select"
          value={form.is_yellow_painted}
          onChange={(v) => setForm({ ...form, is_yellow_painted: v })}
          options={[
            { value: 'true', label: '예' },
            { value: 'false', label: '아니오' },
          ]}
        />
        <FormField
          label="CCTV 장착"
          name="has_cctv"
          type="select"
          value={form.has_cctv}
          onChange={(v) => setForm({ ...form, has_cctv: v })}
          options={[
            { value: 'true', label: '예' },
            { value: 'false', label: '아니오' },
          ]}
        />
        <FormField
          label="정지 표지판"
          name="has_stop_sign"
          type="select"
          value={form.has_stop_sign}
          onChange={(v) => setForm({ ...form, has_stop_sign: v })}
          options={[
            { value: 'true', label: '예' },
            { value: 'false', label: '아니오' },
          ]}
        />
        {editingVehicle && (
          <FormField
            label="상태"
            name="is_active"
            type="select"
            value={form.is_active}
            onChange={(v) => setForm({ ...form, is_active: v })}
            options={[
              { value: 'true', label: '활성' },
              { value: 'false', label: '비활성' },
            ]}
          />
        )}
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="차량 삭제"
        message={`"${deleteTarget?.license_plate ?? ''}" 차량을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
