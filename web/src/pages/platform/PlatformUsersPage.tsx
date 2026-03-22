import { useEffect, useState, useCallback, type FormEvent } from 'react';
import api from '../../api/client';
import { showToast } from '../../components/Toast';
import type { UserResponse } from '../../types';
import DataTable, { type Column } from '../../components/DataTable';
import FormModal from '../../components/FormModal';
import FormField from '../../components/FormField';
import ConfirmDialog from '../../components/ConfirmDialog';
import DetailModal from '../../components/DetailModal';
import StatusBadge from '../../components/StatusBadge';
import ExportButton from '../../components/ExportButton';

interface UserRow extends Record<string, unknown> {
  id: number;
  name: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const ROLE_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'parent', label: '학부모' },
  { value: 'driver', label: '운전기사' },
  { value: 'safety_escort', label: '안전지도사' },
  { value: 'academy_admin', label: '학원 관리자' },
];

const ROLE_FORM_OPTIONS = [
  { value: 'parent', label: '학부모' },
  { value: 'driver', label: '운전기사' },
  { value: 'safety_escort', label: '안전지도사' },
  { value: 'academy_admin', label: '학원 관리자' },
];

const ROLE_LABELS: Record<string, string> = {
  parent: '학부모',
  driver: '운전기사',
  safety_escort: '안전지도사',
  academy_admin: '학원 관리자',
  platform_admin: '플랫폼 관리자',
};

const emptyForm = { name: '', phone: '', role: 'parent', is_active: 'true' };

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Form modal
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Detail modal
  const [detailTarget, setDetailTarget] = useState<UserRow | null>(null);

  // Qualification
  const [qualification, setQualification] = useState<Record<string, unknown> | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchQualification = useCallback(async (userId: number) => {
    try {
      const { data } = await api.get(`/auth/users/${userId}/qualification`);
      setQualification(data as Record<string, unknown>);
    } catch {
      setQualification(null);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      if (search) params.set('search', search);
      const query = params.toString();
      const { data } = await api.get(`/auth/users${query ? '?' + query : ''}`);
      const list: UserResponse[] = Array.isArray(data) ? data : [];
      setUsers(
        list.map((u) => ({
          id: u.id,
          name: u.name,
          phone: u.phone,
          role: u.role,
          is_active: u.is_active,
          created_at: u.created_at || '',
        }))
      );
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    setLoading(true);
    fetchUsers();
  }, [fetchUsers]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = '이름을 입력하세요';
    if (!form.phone.trim()) {
      errs.phone = '전화번호를 입력하세요';
    } else if (!/^\d{11}$/.test(form.phone.replace(/-/g, ''))) {
      errs.phone = '전화번호는 숫자 11자리로 입력하세요 (예: 01012345678)';
    }
    if (!form.role) errs.role = '역할을 선택하세요';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (row: UserRow) => {
    setEditTarget(row);
    setForm({
      name: row.name,
      phone: row.phone,
      role: row.role,
      is_active: String(row.is_active),
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await api.patch(`/auth/users/${editTarget.id}`, {
          name: form.name,
          role: form.role,
          is_active: form.is_active === 'true',
        });
        showToast('사용자 정보가 수정되었습니다', 'success');
      } else {
        await api.post('/auth/users', {
          name: form.name,
          phone: form.phone,
          role: form.role,
        });
        showToast('사용자가 등록되었습니다', 'success');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditTarget(null);
      await fetchUsers();
    } catch {
      showToast(editTarget ? '사용자 수정에 실패했습니다' : '사용자 등록에 실패했습니다', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/auth/users/${deleteTarget.id}`);
      showToast(`${deleteTarget.name} 사용자가 삭제되었습니다`, 'success');
      setDeleteTarget(null);
      await fetchUsers();
    } catch {
      showToast('사용자 삭제에 실패했습니다', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<UserRow>[] = [
    {
      key: 'name',
      label: '이름',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => { setDetailTarget(row); if (row.role === 'driver') fetchQualification(row.id); else setQualification(null); }}
          className="font-medium text-gray-800 cursor-pointer hover:underline"
        >
          {row.name}
        </button>
      ),
    },
    { key: 'phone', label: '전화번호' },
    {
      key: 'role',
      label: '역할',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
          {ROLE_LABELS[row.role] || row.role}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: '상태',
      render: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
    },
    {
      key: 'created_at',
      label: '가입일',
      sortable: true,
      render: (row) =>
        row.created_at ? new Date(row.created_at).toLocaleDateString('ko-KR') : '-',
    },
  ];

  const exportColumns = [
    { key: 'name', label: '이름' },
    { key: 'phone', label: '전화번호' },
    { key: 'role', label: '역할' },
    { key: 'is_active', label: '상태' },
    { key: 'created_at', label: '가입일' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">사용자 관리</h2>
        <div className="flex items-center gap-3">
          <ExportButton data={users} columns={exportColumns} filename="사용자목록" />
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            사용자 추가
          </button>
        </div>
      </div>

      {/* Role filter */}
      <div className="mb-4">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-400 text-sm bg-white"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <DataTable<UserRow>
        columns={columns}
        data={users}
        loading={loading}
        searchable
        searchPlaceholder="이름으로 검색..."
        onSearch={setSearch}
        emptyMessage="등록된 사용자가 없습니다."
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

      {/* Detail Modal */}
      <DetailModal
        open={!!detailTarget}
        title="사용자 상세"
        onClose={() => setDetailTarget(null)}
        fields={detailTarget ? [
          { label: '이름', value: detailTarget.name },
          { label: '전화번호', value: detailTarget.phone },
          { label: '역할', value: ROLE_LABELS[detailTarget.role] || detailTarget.role },
          { label: '활성 상태', value: <StatusBadge status={detailTarget.is_active ? 'active' : 'inactive'} /> },
          { label: '가입일', value: detailTarget.created_at ? new Date(detailTarget.created_at).toLocaleDateString('ko-KR') : '-' },
          ...(detailTarget.role === 'driver' && qualification ? [
            { label: '면허번호', value: String(qualification.license_number || '-') },
            { label: '면허유형', value: String(qualification.license_type || '-') },
            { label: '면허만료', value: String(qualification.license_expiry || '-') },
            { label: '범죄경력조회', value: qualification.criminal_check_clear ? '적격' : '미확인' },
            { label: '안전교육', value: String(qualification.safety_training_expiry || '-') },
            { label: '자격 충족', value: <StatusBadge status={qualification.is_qualified ? 'active' : 'inactive'} /> },
          ] : []),
        ] : []}
        actions={detailTarget ? (
          <>
            <button
              type="button"
              onClick={() => { const target = detailTarget; setDetailTarget(null); openEdit(target); }}
              className="px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100"
            >
              수정
            </button>
            <button
              type="button"
              onClick={() => { const target = detailTarget; setDetailTarget(null); setDeleteTarget(target); }}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
            >
              비활성화
            </button>
          </>
        ) : undefined}
      />

      {/* Create / Edit Modal */}
      <FormModal
        open={showModal}
        title={editTarget ? '사용자 수정' : '사용자 추가'}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        loading={saving}
        submitText={editTarget ? '수정' : '등록'}
      >
        <FormField
          label="이름"
          name="name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          placeholder="홍길동"
          required
          error={errors.name}
        />
        <FormField
          label="전화번호"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          placeholder="01012345678"
          required
          error={errors.phone}
        />
        <FormField
          label="역할"
          name="role"
          type="select"
          value={form.role}
          onChange={(v) => setForm({ ...form, role: v })}
          options={ROLE_FORM_OPTIONS}
          required
          error={errors.role}
        />
        {editTarget && (
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

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="사용자 삭제"
        message={`"${deleteTarget?.name}" 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
