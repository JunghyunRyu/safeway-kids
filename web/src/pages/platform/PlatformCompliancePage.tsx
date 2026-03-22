import { useEffect, useState, useCallback, type FormEvent } from 'react';
import api from '../../api/client';
import { showToast } from '../../components/Toast';
import type { Academy } from '../../types';
import DataTable, { type Column } from '../../components/DataTable';
import FormModal from '../../components/FormModal';
import FormField from '../../components/FormField';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusBadge from '../../components/StatusBadge';
import ExportButton from '../../components/ExportButton';

interface ComplianceDocument extends Record<string, unknown> {
  id: string;
  academy_id: string;
  academy_name: string;
  document_type: string;
  document_type_label: string;
  file_name: string;
  uploaded_at: string;
  expires_at: string | null;
  status: string;
}

const DOC_TYPES = [
  { value: 'business_license', label: '사업자등록증' },
  { value: 'insurance_cert', label: '보험증서' },
  { value: 'vehicle_inspection', label: '차량검사증' },
  { value: 'police_report', label: '범죄경력조회' },
  { value: 'safety_training', label: '안전교육이수증' },
  { value: 'school_bus_registration', label: '통학버스 신고필증' },
  { value: 'other', label: '기타' },
];

const DOC_TYPE_MAP = Object.fromEntries(DOC_TYPES.map((d) => [d.value, d.label]));

const COMPLIANCE_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  valid: { bg: 'bg-green-100', text: 'text-green-700' },
  expired: { bg: 'bg-red-100', text: 'text-red-700' },
  expiring_soon: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  pending: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

const COMPLIANCE_STATUS_LABELS: Record<string, string> = {
  valid: '유효',
  expired: '만료',
  expiring_soon: '만료임박',
  pending: '대기',
};

export default function PlatformCompliancePage() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState('');
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [expiringDocs, setExpiringDocs] = useState<ComplianceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'expiring'>('all');

  // Upload form
  const [showModal, setShowModal] = useState(false);
  const [docForm, setDocForm] = useState({ document_type: 'business_license', expires_at: '' });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<ComplianceDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchAcademies = async () => {
      try {
        const { data } = await api.get('/academies');
        setAcademies(Array.isArray(data) ? data : []);
      } catch {
        setAcademies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAcademies();
  }, []);

  const fetchDocuments = useCallback(async () => {
    if (!selectedAcademy) {
      setDocuments([]);
      return;
    }
    try {
      const { data } = await api.get(`/compliance/documents?academy_id=${selectedAcademy}`);
      const raw = Array.isArray(data) ? data : [];
      const acad = academies.find((a) => a.id === selectedAcademy);
      setDocuments(
        raw.map((doc: Record<string, unknown>) => ({
          ...doc,
          academy_name: acad?.name || '',
          document_type_label: DOC_TYPE_MAP[doc.document_type as string] || String(doc.document_type),
        })) as ComplianceDocument[]
      );
    } catch {
      setDocuments([]);
    }
  }, [selectedAcademy, academies]);

  const fetchExpiring = useCallback(async () => {
    try {
      const { data } = await api.get('/compliance/documents/expiring');
      const raw = Array.isArray(data) ? data : [];
      setExpiringDocs(
        raw.map((doc: Record<string, unknown>) => {
          const acad = academies.find((a) => a.id === doc.academy_id);
          return {
            ...doc,
            academy_name: acad?.name || String(doc.academy_id || '').slice(0, 8),
            document_type_label: DOC_TYPE_MAP[doc.document_type as string] || String(doc.document_type),
          } as ComplianceDocument;
        })
      );
    } catch {
      setExpiringDocs([]);
    }
  }, [academies]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    if (tab === 'expiring') {
      fetchExpiring();
    }
  }, [tab, fetchExpiring]);

  const handleUploadDoc = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !selectedAcademy) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('academy_id', selectedAcademy);
      formData.append('document_type', docForm.document_type);
      if (docForm.expires_at) formData.append('expires_at', docForm.expires_at);
      await api.post('/compliance/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('문서가 업로드되었습니다', 'success');
      setShowModal(false);
      setDocForm({ document_type: 'business_license', expires_at: '' });
      setFile(null);
      await fetchDocuments();
    } catch {
      showToast('문서 업로드에 실패했습니다', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/compliance/documents/${deleteTarget.id}`);
      showToast('문서가 삭제되었습니다', 'success');
      setDeleteTarget(null);
      if (tab === 'all') {
        await fetchDocuments();
      } else {
        await fetchExpiring();
      }
    } catch {
      showToast('문서 삭제에 실패했습니다', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const allDocsColumns: Column<ComplianceDocument>[] = [
    { key: 'document_type_label', label: '유형', sortable: true },
    { key: 'file_name', label: '파일명' },
    {
      key: 'uploaded_at',
      label: '업로드일',
      sortable: true,
      render: (row) =>
        row.uploaded_at
          ? new Date(row.uploaded_at as string).toLocaleDateString('ko-KR')
          : '-',
    },
    {
      key: 'expires_at',
      label: '만료일',
      sortable: true,
      render: (row) =>
        row.expires_at
          ? new Date(row.expires_at as string).toLocaleDateString('ko-KR')
          : '-',
    },
    {
      key: 'status',
      label: '상태',
      render: (row) => (
        <StatusBadge
          status={row.status as string}
          colorMap={{
            ...COMPLIANCE_STATUS_COLORS,
            // Override labels via colorMap is not possible, so we handle label separately
          }}
        />
      ),
    },
  ];

  const expiringColumns: Column<ComplianceDocument>[] = [
    { key: 'document_type_label', label: '유형', sortable: true },
    { key: 'academy_name', label: '학원', sortable: true },
    { key: 'file_name', label: '파일명' },
    {
      key: 'expires_at',
      label: '만료일',
      sortable: true,
      render: (row) =>
        row.expires_at
          ? new Date(row.expires_at as string).toLocaleDateString('ko-KR')
          : '-',
    },
    {
      key: 'status',
      label: '상태',
      render: (row) => {
        const status = row.status as string;
        const label = COMPLIANCE_STATUS_LABELS[status] || status;
        const colors = COMPLIANCE_STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-600' };
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}>
            {label}
          </span>
        );
      },
    },
  ];

  const exportColumns = [
    { key: 'document_type_label', label: '유형' },
    { key: 'academy_name', label: '학원' },
    { key: 'file_name', label: '파일명' },
    { key: 'uploaded_at', label: '업로드일' },
    { key: 'expires_at', label: '만료일' },
    { key: 'status', label: '상태' },
  ];

  const currentDocs = tab === 'all' ? documents : expiringDocs;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">컴플라이언스</h2>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'all'
              ? 'bg-teal-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          문서 목록
        </button>
        <button
          onClick={() => setTab('expiring')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'expiring'
              ? 'bg-teal-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          만료 임박
        </button>
      </div>

      {tab === 'all' ? (
        <>
          {/* Academy filter + actions */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <select
              value={selectedAcademy}
              onChange={(e) => setSelectedAcademy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-400 text-sm bg-white"
            >
              <option value="">학원을 선택하세요</option>
              {academies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            {selectedAcademy && (
              <button
                onClick={() => {
                  setDocForm({ document_type: 'business_license', expires_at: '' });
                  setFile(null);
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                문서 업로드
              </button>
            )}
            <div className="ml-auto">
              <ExportButton data={documents} columns={exportColumns} filename="컴플라이언스문서" />
            </div>
          </div>

          {!selectedAcademy ? (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
              <p className="text-gray-500">학원을 선택하면 문서 목록이 표시됩니다.</p>
            </div>
          ) : (
            <DataTable<ComplianceDocument>
              columns={allDocsColumns}
              data={documents}
              loading={loading}
              emptyMessage="등록된 문서가 없습니다."
              actions={(row) => (
                <button
                  onClick={() => setDeleteTarget(row)}
                  className="text-xs px-3 py-1.5 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 font-medium transition-colors"
                >
                  삭제
                </button>
              )}
            />
          )}
        </>
      ) : (
        /* Expiring tab */
        <>
          <div className="flex justify-end mb-4">
            <ExportButton data={expiringDocs} columns={exportColumns} filename="만료임박문서" />
          </div>
          <DataTable<ComplianceDocument>
            columns={expiringColumns}
            data={expiringDocs}
            loading={loading}
            emptyMessage="만료 임박 문서가 없습니다."
            actions={(row) => (
              <button
                onClick={() => setDeleteTarget(row)}
                className="text-xs px-3 py-1.5 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 font-medium transition-colors"
              >
                삭제
              </button>
            )}
          />
        </>
      )}

      {/* Upload Modal */}
      <FormModal
        open={showModal}
        title="문서 업로드"
        onClose={() => setShowModal(false)}
        onSubmit={handleUploadDoc}
        loading={saving}
        submitText="업로드"
      >
        <FormField
          label="문서 유형"
          name="document_type"
          type="select"
          value={docForm.document_type}
          onChange={(v) => setDocForm({ ...docForm, document_type: v })}
          options={DOC_TYPES}
          required
        />
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            파일 <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-400 text-sm"
            required
          />
        </div>
        <FormField
          label="만료일"
          name="expires_at"
          type="date"
          value={docForm.expires_at}
          onChange={(v) => setDocForm({ ...docForm, expires_at: v })}
        />
      </FormModal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="문서 삭제"
        message={`"${deleteTarget?.file_name}" 문서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
