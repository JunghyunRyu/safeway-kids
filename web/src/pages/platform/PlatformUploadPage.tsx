import { useEffect, useState, useRef, useCallback, type DragEvent } from 'react';
import api from '../../api/client';
import { showToast } from '../../components/Toast';
import type { Academy } from '../../types';
import DataTable, { type Column } from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import KpiCard from '../../components/KpiCard';

interface UploadResult {
  total: number;
  success_count: number;
  error_count: number;
  results?: RowResult[];
}

interface RowResult extends Record<string, unknown> {
  row: number;
  status: string;
  error?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function PlatformUploadPage() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const validateFile = useCallback((f: File): boolean => {
    const validExts = ['.xlsx', '.xls'];
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
    if (!validExts.includes(ext)) {
      showToast('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다', 'error');
      return false;
    }
    if (f.size > MAX_FILE_SIZE) {
      showToast('파일 크기는 5MB 이하여야 합니다', 'error');
      return false;
    }
    return true;
  }, []);

  const handleFileSelect = (f: File | null) => {
    if (f && !validateFile(f)) {
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setFile(f);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleUploadClick = () => {
    if (!file || !selectedAcademy) return;
    setShowConfirm(true);
  };

  const handleUpload = async () => {
    if (!file || !selectedAcademy) return;
    setShowConfirm(false);
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('academy_id', selectedAcademy);
      const { data } = await api.post<UploadResult>('/students/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      if (data.error_count === 0) {
        showToast(`${data.success_count}건 업로드 성공`, 'success');
      } else {
        showToast(`${data.success_count}건 성공, ${data.error_count}건 실패`, 'info');
      }
    } catch {
      showToast('업로드에 실패했습니다', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const resultColumns: Column<RowResult>[] = [
    { key: 'row', label: '행', sortable: true },
    {
      key: 'status',
      label: '상태',
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${
            row.status === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {row.status === 'success' ? '성공' : '실패'}
        </span>
      ),
    },
    {
      key: 'error',
      label: '오류',
      render: (row) => (
        <span className={row.error ? 'text-red-600' : 'text-gray-400'}>
          {(row.error as string) || '-'}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
          <div className="h-40 bg-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  const academyName = academies.find((a) => a.id === selectedAcademy)?.name;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">엑셀 업로드</h2>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        {/* Academy selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">학원 선택</label>
          <select
            value={selectedAcademy}
            onChange={(e) => setSelectedAcademy(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-400 text-sm bg-white"
          >
            <option value="">학원을 선택하세요</option>
            {academies.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Drag-and-drop file upload area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragging
              ? 'border-teal-400 bg-teal-50'
              : file
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-teal-300 hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            className="hidden"
          />
          {file ? (
            <div>
              <svg className="w-12 h-12 mx-auto text-green-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-gray-800">{file.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {(file.size / 1024).toFixed(1)} KB
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="mt-3 text-xs text-red-600 hover:text-red-700 font-medium"
              >
                파일 제거
              </button>
            </div>
          ) : (
            <div>
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-medium text-gray-600">
                파일을 드래그하여 놓거나 <span className="text-teal-600">클릭하여 선택</span>하세요
              </p>
              <p className="text-xs text-gray-400 mt-1">
                .xlsx, .xls 파일 (최대 5MB)
              </p>
            </div>
          )}
        </div>

        {/* Upload button */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleUploadClick}
            disabled={uploading || !file || !selectedAcademy}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
          >
            {uploading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                업로드 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                업로드
              </>
            )}
          </button>
          {!selectedAcademy && file && (
            <span className="text-xs text-yellow-600">학원을 선택하세요</span>
          )}
        </div>
      </div>

      {/* Upload Result */}
      {result && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              title="전체"
              value={result.total}
              color="#6B7280"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <KpiCard
              title="성공"
              value={result.success_count}
              color="#16A34A"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <KpiCard
              title="실패"
              value={result.error_count}
              color="#DC2626"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          {/* Row-by-row results table */}
          {result.results && result.results.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">상세 결과</h3>
              <DataTable<RowResult>
                columns={resultColumns}
                data={result.results}
                pageSize={10}
                emptyMessage="결과가 없습니다."
              />
            </div>
          )}
        </div>
      )}

      {/* Upload Confirm Dialog */}
      <ConfirmDialog
        open={showConfirm}
        title="업로드 확인"
        message={`"${academyName}" 학원에 "${file?.name}" 파일을 업로드하시겠습니까?`}
        confirmText="업로드"
        variant="info"
        loading={uploading}
        onConfirm={handleUpload}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
