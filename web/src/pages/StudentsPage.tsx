import { useEffect, useState, useCallback, useRef, type FormEvent } from 'react';
import api from '../api/client';
import { showToast } from '../components/Toast';
import DataTable, { type Column } from '../components/DataTable';
import FormModal from '../components/FormModal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import DetailModal from '../components/DetailModal';
import StatusBadge from '../components/StatusBadge';
import ExportButton from '../components/ExportButton';
import type { Student } from '../types';

interface StudentForm {
  name: string;
  date_of_birth: string;
  grade: string;
  guardian_phone: string;
  special_notes: string;
  allergies: string;
}

const INITIAL_FORM: StudentForm = {
  name: '',
  date_of_birth: '',
  grade: '',
  guardian_phone: '',
  special_notes: '',
  allergies: '',
};

interface FieldErrors {
  name?: string;
  date_of_birth?: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  // Detail modal state
  const [detailTarget, setDetailTarget] = useState<Student | null>(null);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Excel upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      const { data } = await api.get<{ items: Student[]; total: number } | Student[]>('/students');
      if (Array.isArray(data)) {
        setStudents(data);
      } else {
        setStudents(data.items);
      }
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExcelUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/students/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('엑셀 업로드가 완료되었습니다.', 'success');
      await fetchStudents();
    } catch {
      showToast('엑셀 업로드에 실패했습니다.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [fetchStudents]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Filter client-side by search
  const filtered = search.trim()
    ? students.filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase()))
    : students;

  // Validation
  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!form.name.trim()) {
      errors.name = '이름을 입력해 주세요.';
    }
    if (!form.date_of_birth) {
      errors.date_of_birth = '생년월일을 입력해 주세요.';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date_of_birth)) {
      errors.date_of_birth = '올바른 날짜 형식이 아닙니다. (YYYY-MM-DD)';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open modal for create
  const openCreate = () => {
    setEditingStudent(null);
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setModalOpen(true);
  };

  // Open modal for edit
  const openEdit = (student: Student) => {
    setEditingStudent(student);
    setForm({
      name: student.name,
      date_of_birth: student.date_of_birth,
      grade: student.grade ?? '',
      guardian_phone: '',
      special_notes: (student as Record<string, unknown>).special_notes as string ?? '',
      allergies: (student as Record<string, unknown>).allergies as string ?? '',
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingStudent(null);
    setForm(INITIAL_FORM);
    setFieldErrors({});
  };

  // Submit (create or edit)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        date_of_birth: form.date_of_birth,
        grade: form.grade.trim() || null,
        guardian_phone: form.guardian_phone.trim() || null,
        special_notes: form.special_notes.trim() || null,
        allergies: form.allergies.trim() || null,
      };

      if (editingStudent) {
        await api.patch(`/students/${editingStudent.id}`, payload);
        showToast('학생 정보가 수정되었습니다.', 'success');
      } else {
        await api.post('/students', payload);
        showToast('학생이 등록되었습니다.', 'success');
      }
      closeModal();
      await fetchStudents();
    } catch {
      showToast(
        editingStudent ? '학생 수정에 실패했습니다.' : '학생 등록에 실패했습니다.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/students/${deleteTarget.id}`);
      showToast('학생이 삭제되었습니다.', 'success');
      setDeleteTarget(null);
      await fetchStudents();
    } catch {
      showToast('학생 삭제에 실패했습니다.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Columns
  const columns: Column<Student>[] = [
    {
      key: 'name',
      label: '이름',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-semibold flex-shrink-0">
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
    {
      key: 'grade',
      label: '학년',
      sortable: true,
      render: (row) => (row.grade ? `${row.grade}학년` : '-'),
    },
    {
      key: 'date_of_birth',
      label: '생년월일',
      sortable: true,
      render: (row) => row.date_of_birth || '-',
    },
    {
      key: 'created_at',
      label: '등록일',
      sortable: true,
      render: (row) => (row.created_at ? row.created_at.slice(0, 10) : '-'),
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
    { key: 'name', label: '이름' },
    { key: 'grade', label: '학년' },
    { key: 'date_of_birth', label: '생년월일' },
    { key: 'created_at', label: '등록일' },
    { key: 'is_active', label: '상태' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">학생 관리</h2>
        <div className="flex items-center gap-3">
          <ExportButton
            data={filtered as unknown as Record<string, unknown>[]}
            columns={exportColumns}
            filename="학생목록"
          />
          <button
            onClick={() => {
              const headers = ['이름', '생년월일(YYYY-MM-DD)', '성별(M/F)', '학교명', '보호자 이름', '보호자 연락처', '픽업 주소', '특이사항', '알레르기'];
              const csvContent = '\uFEFF' + headers.join(',') + '\n';
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = '학생등록_템플릿.csv';
              link.click();
              URL.revokeObjectURL(link.href);
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
          >
            템플릿 다운로드
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleExcelUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {uploading ? '업로드 중...' : '엑셀 업로드'}
          </button>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
          >
            + 학생 추가
          </button>
        </div>
      </div>

      {/* DataTable */}
      <DataTable<Student>
        columns={columns}
        data={filtered}
        loading={loading}
        searchable
        searchPlaceholder="학생 이름으로 검색..."
        onSearch={(q) => setSearch(q)}
        emptyMessage={
          search.trim()
            ? '검색 결과가 없습니다.'
            : '등록된 학생이 없습니다. "학생 추가" 버튼으로 등록할 수 있습니다.'
        }
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

      {/* Detail Modal */}
      <DetailModal
        open={!!detailTarget}
        title="학생 상세"
        onClose={() => setDetailTarget(null)}
        fields={detailTarget ? [
          { label: '이름', value: detailTarget.name },
          { label: '생년월일', value: detailTarget.date_of_birth || '-' },
          { label: '학년', value: detailTarget.grade ? `${detailTarget.grade}학년` : '-' },
          { label: '상태', value: <StatusBadge status={detailTarget.is_active ? 'active' : 'inactive'} /> },
          { label: '등록일', value: detailTarget.created_at ? detailTarget.created_at.slice(0, 10) : '-' },
          { label: '보호자 ID', value: detailTarget.guardian_id || '-' },
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
        title={editingStudent ? '학생 수정' : '학생 등록'}
        onClose={closeModal}
        onSubmit={handleSubmit}
        loading={saving}
        submitText={editingStudent ? '수정' : '등록'}
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
          label="생년월일"
          name="date_of_birth"
          type="date"
          value={form.date_of_birth}
          onChange={(v) => setForm({ ...form, date_of_birth: v })}
          error={fieldErrors.date_of_birth}
          required
        />
        <FormField
          label="학년"
          name="grade"
          value={form.grade}
          onChange={(v) => setForm({ ...form, grade: v })}
          placeholder="3"
        />
        <FormField
          label="보호자 연락처"
          name="guardian_phone"
          type="tel"
          value={form.guardian_phone}
          onChange={(v) => setForm({ ...form, guardian_phone: v })}
          placeholder="010-1234-5678"
        />
        <FormField
          label="특이사항"
          name="special_notes"
          value={form.special_notes}
          onChange={(v) => setForm({ ...form, special_notes: v })}
          placeholder="차멀미 심함, 앞자리 배정 등"
        />
        <FormField
          label="알레르기"
          name="allergies"
          value={form.allergies}
          onChange={(v) => setForm({ ...form, allergies: v })}
          placeholder="땅콩, 우유 등"
        />
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="학생 삭제"
        message={`"${deleteTarget?.name ?? ''}" 학생을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
