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

interface DriverInfo extends Record<string, unknown> {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
  license_number: string | null;
  license_type: string | null;
  license_expiry: string | null;
  criminal_check_date: string | null;
  criminal_check_clear: boolean;
  safety_training_date: string | null;
  safety_training_expiry: string | null;
  is_qualified: boolean;
}

interface DriverForm {
  name: string;
  phone: string;
}

const INITIAL_FORM: DriverForm = {
  name: '',
  phone: '',
};

interface FieldErrors {
  name?: string;
  phone?: string;
}

function isExpiringSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff > 0 && diff <= 30;
}

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) <= new Date();
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [academyId, setAcademyId] = useState('');
  const [academies, setAcademies] = useState<{ id: string; name: string }[]>([]);

  // Form modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverInfo | null>(null);
  const [form, setForm] = useState<DriverForm>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  // Detail modal state
  const [detailTarget, setDetailTarget] = useState<DriverInfo | null>(null);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<DriverInfo | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get('/academies').then(({ data }) => {
      setAcademies(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const fetchDrivers = useCallback(async () => {
    if (!academyId) { setDrivers([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/academy/${academyId}/drivers`);
      setDrivers(Array.isArray(data) ? data : []);
    } catch {
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, [academyId]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  // Validation
  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!form.name.trim()) {
      errors.name = '이름을 입력해 주세요.';
    }
    if (!editingDriver && !form.phone.trim()) {
      errors.phone = '전화번호를 입력해 주세요.';
    } else if (!editingDriver && !/^01[0-9]{8,9}$/.test(form.phone.trim())) {
      errors.phone = '올바른 전화번호 형식이 아닙니다. (01012345678)';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open modal for create
  const openCreate = () => {
    setEditingDriver(null);
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setModalOpen(true);
  };

  // Open modal for edit
  const openEdit = (driver: DriverInfo) => {
    setEditingDriver(driver);
    setForm({
      name: driver.name,
      phone: driver.phone,
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDriver(null);
    setForm(INITIAL_FORM);
    setFieldErrors({});
  };

  // Submit (create or edit)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      if (editingDriver) {
        await api.patch(`/auth/users/${editingDriver.id}`, {
          name: form.name.trim(),
        });
        showToast('기사 정보가 수정되었습니다.', 'success');
      } else {
        await api.post('/auth/users', {
          phone: form.phone.trim(),
          name: form.name.trim(),
          role: 'driver',
        });
        showToast('기사가 등록되었습니다.', 'success');
      }
      closeModal();
      await fetchDrivers();
    } catch {
      showToast(
        editingDriver ? '기사 수정에 실패했습니다.' : '기사 등록에 실패했습니다.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete (deactivate)
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/auth/users/${deleteTarget.id}`);
      showToast('기사가 비활성화되었습니다.', 'success');
      setDeleteTarget(null);
      await fetchDrivers();
    } catch {
      showToast('기사 비활성화에 실패했습니다.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<DriverInfo>[] = [
    {
      key: 'name',
      label: '이름',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold flex-shrink-0">
            {row.name.charAt(0)}
          </div>
          <button
            type="button"
            onClick={() => setDetailTarget(row)}
            className="font-medium text-gray-800 cursor-pointer hover:underline"
          >
            {row.name}
          </button>
        </div>
      ),
    },
    { key: 'phone', label: '연락처' },
    {
      key: 'license_expiry',
      label: '면허 만료',
      sortable: true,
      render: (row) => {
        if (!row.license_expiry) return <span className="text-gray-400">-</span>;
        if (isExpired(row.license_expiry)) return <span className="text-red-600 font-medium">만료 ({row.license_expiry})</span>;
        if (isExpiringSoon(row.license_expiry)) return <span className="text-yellow-600 font-medium">임박 ({row.license_expiry})</span>;
        return <span>{row.license_expiry}</span>;
      },
    },
    {
      key: 'safety_training_expiry',
      label: '안전교육 만료',
      sortable: true,
      render: (row) => {
        if (!row.safety_training_expiry) return <span className="text-gray-400">-</span>;
        if (isExpired(row.safety_training_expiry)) return <span className="text-red-600 font-medium">만료</span>;
        if (isExpiringSoon(row.safety_training_expiry)) return <span className="text-yellow-600 font-medium">임박</span>;
        return <span>{row.safety_training_expiry}</span>;
      },
    },
    {
      key: 'criminal_check_clear',
      label: '범죄경력',
      render: (row) => row.criminal_check_clear
        ? <StatusBadge status="active" />
        : <span className="text-red-500 text-xs font-medium">미확인</span>,
    },
    {
      key: 'is_qualified',
      label: '자격 상태',
      render: (row) => (
        <StatusBadge status={row.is_qualified ? 'active' : 'inactive'} />
      ),
    },
  ];

  const exportColumns = [
    { key: 'name', label: '이름' },
    { key: 'phone', label: '연락처' },
    { key: 'license_expiry', label: '면허 만료' },
    { key: 'safety_training_expiry', label: '안전교육 만료' },
    { key: 'is_qualified', label: '자격 상태' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">기사 관리</h2>
        <div className="flex items-center gap-3">
          <ExportButton data={drivers} columns={exportColumns} filename="기사목록" />
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
          >
            + 기사 등록
          </button>
        </div>
      </div>

      {/* Academy filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={academyId}
          onChange={(e) => setAcademyId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-400 text-sm bg-white"
        >
          <option value="">학원을 선택하세요</option>
          {academies.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {!academyId ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500">학원을 선택하면 소속 기사 목록이 표시됩니다.</p>
        </div>
      ) : (
        <DataTable<DriverInfo>
          columns={columns}
          data={drivers}
          loading={loading}
          emptyMessage="배정된 기사가 없습니다."
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
                비활성화
              </button>
            </>
          )}
        />
      )}

      {/* Detail Modal */}
      <DetailModal
        open={!!detailTarget}
        title="기사 상세"
        onClose={() => setDetailTarget(null)}
        fields={detailTarget ? [
          { label: '이름', value: detailTarget.name },
          { label: '연락처', value: detailTarget.phone },
          { label: '상태', value: <StatusBadge status={detailTarget.is_active ? 'active' : 'inactive'} /> },
          { label: '자격 상태', value: <StatusBadge status={detailTarget.is_qualified ? 'active' : 'inactive'} /> },
          { label: '면허 종류', value: detailTarget.license_type || '-' },
          { label: '면허 번호', value: detailTarget.license_number || '-' },
          { label: '면허 만료일', value: detailTarget.license_expiry || '-' },
          { label: '범죄경력 조회일', value: detailTarget.criminal_check_date || '-' },
          { label: '범죄경력 결과', value: detailTarget.criminal_check_clear ? '적격' : '미확인' },
          { label: '안전교육 이수일', value: detailTarget.safety_training_date || '-' },
          { label: '안전교육 만료일', value: detailTarget.safety_training_expiry || '-' },
        ] : []}
        actions={detailTarget ? (
          <>
            <button
              type="button"
              onClick={() => { setDetailTarget(null); openEdit(detailTarget); }}
              className="px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100"
            >
              수정
            </button>
            <button
              type="button"
              onClick={() => { setDetailTarget(null); setDeleteTarget(detailTarget); }}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
            >
              비활성화
            </button>
          </>
        ) : undefined}
      />

      {/* Create/Edit Modal */}
      <FormModal
        open={modalOpen}
        title={editingDriver ? '기사 수정' : '기사 등록'}
        onClose={closeModal}
        onSubmit={handleSubmit}
        loading={saving}
        submitText={editingDriver ? '수정' : '등록'}
      >
        <FormField
          label="이름"
          name="name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          error={fieldErrors.name}
          required
          placeholder="홍길동"
        />
        <FormField
          label="전화번호"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          error={fieldErrors.phone}
          required={!editingDriver}
          placeholder="01012345678"
        />
        {editingDriver && (
          <p className="text-xs text-gray-400 -mt-2 mb-4">전화번호는 등록 시에만 설정 가능합니다.</p>
        )}
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="기사 비활성화"
        message={`"${deleteTarget?.name ?? ''}" 기사를 비활성화하시겠습니까? 비활성화 후에도 데이터는 보존됩니다.`}
        confirmText="비활성화"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
