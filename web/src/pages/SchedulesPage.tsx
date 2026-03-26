import { useState, useCallback, useEffect, type FormEvent } from 'react';
import api from '../api/client';
import { showToast } from '../components/Toast';
import DataTable, { type Column } from '../components/DataTable';
import FormModal from '../components/FormModal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import ExportButton from '../components/ExportButton';
import type { Academy, DailySchedule, Student } from '../types';

interface ScheduleTemplate {
  id: string;
  student_id: string;
  student_name?: string;
  academy_id: string;
  day_of_week: number;
  pickup_time: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  pickup_address: string | null;
  is_active: boolean;
  created_at: string;
}

const scheduleStatusColorMap: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700' },
  boarded: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  completed: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500' },
};

const scheduleStatusLabels: Record<string, string> = {
  scheduled: '예정',
  boarded: '탑승',
  completed: '완료',
  cancelled: '취소',
};

interface PipelineResult {
  schedules_created?: number;
  routes_generated?: number;
  students_assigned?: number;
  error?: string;
  [key: string]: unknown;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const DAY_OPTIONS = [
  { value: '1', label: '월' },
  { value: '2', label: '화' },
  { value: '3', label: '수' },
  { value: '4', label: '목' },
  { value: '5', label: '금' },
  { value: '6', label: '토' },
  { value: '0', label: '일' },
];

// -- Template form --
interface TemplateForm {
  student_id: string;
  day_of_week: string;
  pickup_time: string;
  pickup_address: string;
  pickup_latitude: string;
  pickup_longitude: string;
}

const INITIAL_TEMPLATE_FORM: TemplateForm = {
  student_id: '',
  day_of_week: '1',
  pickup_time: '08:00',
  pickup_address: '',
  pickup_latitude: '37.4979',
  pickup_longitude: '127.0276',
};

interface TemplateFieldErrors {
  student_id?: string;
  pickup_time?: string;
  pickup_latitude?: string;
  pickup_longitude?: string;
}

export default function SchedulesPage() {
  const [activeTab, setActiveTab] = useState<'daily' | 'templates'>('daily');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [schedules, setSchedules] = useState<DailySchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Academy & Students (for template form)
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  // Template form modal
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<TemplateForm>(INITIAL_TEMPLATE_FORM);
  const [templateFieldErrors, setTemplateFieldErrors] = useState<TemplateFieldErrors>({});
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Template delete
  const [deleteTemplateTarget, setDeleteTemplateTarget] = useState<ScheduleTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState(false);

  // Pipeline
  const [pipelineConfirmOpen, setPipelineConfirmOpen] = useState(false);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);

  // Fetch academy info
  const fetchAcademy = useCallback(async () => {
    try {
      const { data } = await api.get<Academy>('/academies/mine');
      setAcademy(data);
      return data;
    } catch {
      // Try from localStorage as fallback
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.academy_id) {
          setAcademy({ id: user.academy_id, name: '', address: '', latitude: 0, longitude: 0 });
          return { id: user.academy_id } as Academy;
        }
      } catch { /* ignore */ }
      return null;
    }
  }, []);

  // Fetch students for dropdown
  const fetchStudents = useCallback(async () => {
    try {
      const { data } = await api.get<{ items: Student[]; total: number } | Student[]>('/students');
      const list = Array.isArray(data) ? data : data.items;
      setStudents(list.filter((s) => s.is_active));
    } catch {
      setStudents([]);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      let acad = academy;
      if (!acad) {
        acad = await fetchAcademy();
      }
      const params = acad ? { academy_id: acad.id } : {};
      const { data } = await api.get('/schedules/templates/academy', { params });
      setTemplates(Array.isArray(data) ? data : []);
    } catch {
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  }, [academy, fetchAcademy]);

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
      fetchStudents();
      if (!academy) fetchAcademy();
    }
  }, [activeTab, fetchTemplates, fetchStudents, fetchAcademy, academy]);

  const toggleTemplate = useCallback(async (template: ScheduleTemplate) => {
    try {
      await api.patch(`/schedules/templates/${template.id}`, { is_active: !template.is_active });
      showToast(template.is_active ? '템플릿이 비활성화되었습니다.' : '템플릿이 활성화되었습니다.', 'success');
      await fetchTemplates();
    } catch {
      showToast('템플릿 상태 변경에 실패했습니다.', 'error');
    }
  }, [fetchTemplates]);

  // -- Template CRUD --

  const validateTemplateForm = (): boolean => {
    const errors: TemplateFieldErrors = {};
    if (!templateForm.student_id) {
      errors.student_id = '학생을 선택해 주세요.';
    }
    if (!templateForm.pickup_time) {
      errors.pickup_time = '픽업 시간을 입력해 주세요.';
    }
    const lat = parseFloat(templateForm.pickup_latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.pickup_latitude = '유효한 위도를 입력해 주세요. (-90 ~ 90)';
    }
    const lng = parseFloat(templateForm.pickup_longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.pickup_longitude = '유효한 경도를 입력해 주세요. (-180 ~ 180)';
    }
    setTemplateFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openTemplateCreate = () => {
    setEditingTemplate(null);
    setTemplateForm(INITIAL_TEMPLATE_FORM);
    setTemplateFieldErrors({});
    setTemplateModalOpen(true);
  };

  const openTemplateEdit = (template: ScheduleTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      student_id: template.student_id,
      day_of_week: String(template.day_of_week),
      pickup_time: template.pickup_time ? template.pickup_time.slice(0, 5) : '08:00',
      pickup_address: template.pickup_address || '',
      pickup_latitude: template.pickup_latitude != null ? String(template.pickup_latitude) : '37.4979',
      pickup_longitude: template.pickup_longitude != null ? String(template.pickup_longitude) : '127.0276',
    });
    setTemplateFieldErrors({});
    setTemplateModalOpen(true);
  };

  const closeTemplateModal = () => {
    setTemplateModalOpen(false);
    setEditingTemplate(null);
    setTemplateForm(INITIAL_TEMPLATE_FORM);
    setTemplateFieldErrors({});
  };

  const handleTemplateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateTemplateForm()) return;

    setSavingTemplate(true);
    try {
      if (editingTemplate) {
        // Update
        const payload = {
          day_of_week: parseInt(templateForm.day_of_week),
          pickup_time: templateForm.pickup_time,
          pickup_latitude: parseFloat(templateForm.pickup_latitude),
          pickup_longitude: parseFloat(templateForm.pickup_longitude),
          pickup_address: templateForm.pickup_address.trim() || null,
        };
        await api.patch(`/schedules/templates/${editingTemplate.id}`, payload);
        showToast('템플릿이 수정되었습니다.', 'success');
      } else {
        // Create
        const academyId = academy?.id;
        if (!academyId) {
          showToast('학원 정보를 불러올 수 없습니다.', 'error');
          setSavingTemplate(false);
          return;
        }
        const payload = {
          student_id: templateForm.student_id,
          academy_id: academyId,
          day_of_week: parseInt(templateForm.day_of_week),
          pickup_time: templateForm.pickup_time,
          pickup_latitude: parseFloat(templateForm.pickup_latitude),
          pickup_longitude: parseFloat(templateForm.pickup_longitude),
          pickup_address: templateForm.pickup_address.trim() || null,
        };
        await api.post('/schedules/templates', payload);
        showToast('템플릿이 등록되었습니다.', 'success');
      }
      closeTemplateModal();
      await fetchTemplates();
    } catch {
      showToast(
        editingTemplate ? '템플릿 수정에 실패했습니다.' : '템플릿 등록에 실패했습니다.',
        'error',
      );
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleTemplateDelete = async () => {
    if (!deleteTemplateTarget) return;
    setDeletingTemplate(true);
    try {
      await api.delete(`/schedules/templates/${deleteTemplateTarget.id}`);
      showToast('템플릿이 삭제되었습니다.', 'success');
      setDeleteTemplateTarget(null);
      await fetchTemplates();
    } catch {
      showToast('템플릿 삭제에 실패했습니다.', 'error');
    } finally {
      setDeletingTemplate(false);
    }
  };

  // Student options for select dropdown
  const studentOptions = students.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const templateColumns: Column<ScheduleTemplate>[] = [
    {
      key: 'student_id',
      label: '학생',
      render: (row) => <span>{(row as ScheduleTemplate & { student_name?: string }).student_name || row.student_id.slice(0, 8)}</span>,
    },
    {
      key: 'day_of_week',
      label: '요일',
      sortable: true,
      render: (row) => DAY_LABELS[row.day_of_week] || String(row.day_of_week),
    },
    {
      key: 'pickup_time',
      label: '픽업 시간',
      sortable: true,
    },
    {
      key: 'pickup_address',
      label: '주소',
      render: (row) => row.pickup_address || '-',
    },
    {
      key: 'is_active',
      label: '상태',
      render: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
    },
  ];

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/schedules/daily?target_date=${date}`);
      setSchedules(Array.isArray(data) ? data : []);
      setFetched(true);
    } catch {
      setSchedules([]);
      showToast('스케줄 조회에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, [date]);

  const runPipeline = useCallback(async () => {
    setPipelineRunning(true);
    setPipelineResult(null);
    try {
      const { data } = await api.post(`/schedules/daily/pipeline?target_date=${date}`);
      setPipelineResult(data as PipelineResult);
      showToast('자동 배차가 실행되었습니다.', 'success');
      setPipelineConfirmOpen(false);
      await fetchSchedules();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail;
      setPipelineResult({ error: msg || '자동 배차 실행 실패' });
      showToast('자동 배차 실행에 실패했습니다.', 'error');
      setPipelineConfirmOpen(false);
    } finally {
      setPipelineRunning(false);
    }
  }, [date, fetchSchedules]);

  // Columns
  const columns: Column<DailySchedule>[] = [
    {
      key: 'student_id',
      label: '학생',
      render: (row) => (
        <span>{row.student_name || row.student_id.slice(0, 8)}</span>
      ),
    },
    {
      key: 'schedule_date',
      label: '날짜',
      sortable: true,
    },
    {
      key: 'pickup_time',
      label: '픽업 시간',
      sortable: true,
    },
    {
      key: 'academy_id',
      label: '학원',
      render: (row) => <span>{row.academy_name || row.academy_id.slice(0, 8)}</span>,
    },
    {
      key: 'vehicle_license_plate',
      label: '차량',
      render: (row) => <span>{row.vehicle_license_plate || '-'}</span>,
    },
    {
      key: 'status',
      label: '상태',
      sortable: true,
      render: (row) => (
        <StatusBadge
          status={row.status}
          colorMap={{
            ...scheduleStatusColorMap,
          }}
        />
      ),
    },
  ];

  const exportColumns = [
    { key: 'student_id', label: '학생 ID' },
    { key: 'schedule_date', label: '날짜' },
    { key: 'pickup_time', label: '픽업 시간' },
    { key: 'academy_name', label: '학원' },
    { key: 'vehicle_license_plate', label: '차량' },
    { key: 'status', label: '상태' },
  ];

  // Pipeline result display
  const renderPipelineResult = () => {
    if (!pipelineResult) return null;

    if (pipelineResult.error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-red-800">실행 오류</span>
          </div>
          <p className="text-sm text-red-700">{pipelineResult.error}</p>
        </div>
      );
    }

    return (
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium text-teal-800">자동 배차 완료</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {pipelineResult.schedules_created != null && (
            <div className="bg-white rounded-lg p-3 border border-teal-100">
              <p className="text-xs text-gray-500">생성된 스케줄</p>
              <p className="text-lg font-bold text-gray-800">
                {pipelineResult.schedules_created}건
              </p>
            </div>
          )}
          {pipelineResult.routes_generated != null && (
            <div className="bg-white rounded-lg p-3 border border-teal-100">
              <p className="text-xs text-gray-500">생성된 경로</p>
              <p className="text-lg font-bold text-gray-800">
                {pipelineResult.routes_generated}건
              </p>
            </div>
          )}
          {pipelineResult.students_assigned != null && (
            <div className="bg-white rounded-lg p-3 border border-teal-100">
              <p className="text-xs text-gray-500">배정된 학생</p>
              <p className="text-lg font-bold text-gray-800">
                {pipelineResult.students_assigned}명
              </p>
            </div>
          )}
        </div>
        {/* Show any extra fields from the result */}
        {Object.entries(pipelineResult).filter(
          ([k]) => !['schedules_created', 'routes_generated', 'students_assigned', 'error'].includes(k),
        ).length > 0 && (
          <details className="mt-3">
            <summary className="text-xs text-teal-600 cursor-pointer hover:underline">
              상세 결과 보기
            </summary>
            <div className="mt-2 bg-white rounded-lg p-3 border border-teal-100 text-xs text-gray-600 overflow-x-auto">
              {Object.entries(pipelineResult)
                .filter(
                  ([k]) =>
                    !['schedules_created', 'routes_generated', 'students_assigned', 'error'].includes(k),
                )
                .map(([key, val]) => (
                  <div key={key} className="flex gap-2 py-1">
                    <span className="font-medium text-gray-700 min-w-[120px]">{key}:</span>
                    <span>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                  </div>
                ))}
            </div>
          </details>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">스케줄 관리</h2>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === 'daily' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          일일 스케줄
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === 'templates' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          스케줄 템플릿
        </button>
      </div>

      {activeTab === 'templates' ? (
        <>
          {/* Template header with add button */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              주간 반복 스케줄 템플릿을 관리합니다.
            </p>
            <button
              onClick={openTemplateCreate}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
            >
              + 템플릿 추가
            </button>
          </div>

          <DataTable<ScheduleTemplate>
            columns={templateColumns}
            data={templates}
            loading={templatesLoading}
            emptyMessage="등록된 스케줄 템플릿이 없습니다."
            actions={(row) => (
              <>
                <button
                  onClick={() => openTemplateEdit(row)}
                  className="text-sm px-3 py-1.5 text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 font-medium"
                >
                  수정
                </button>
                <button
                  onClick={() => toggleTemplate(row)}
                  className={`text-sm px-3 py-1.5 rounded-lg font-medium ${row.is_active ? 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100' : 'text-green-700 bg-green-50 hover:bg-green-100'}`}
                >
                  {row.is_active ? '비활성화' : '활성화'}
                </button>
                <button
                  onClick={() => setDeleteTemplateTarget(row)}
                  className="text-sm px-3 py-1.5 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 font-medium"
                >
                  삭제
                </button>
              </>
            )}
          />

          {/* Template Create/Edit Modal */}
          <FormModal
            open={templateModalOpen}
            title={editingTemplate ? '템플릿 수정' : '템플릿 등록'}
            onClose={closeTemplateModal}
            onSubmit={handleTemplateSubmit}
            loading={savingTemplate}
            submitText={editingTemplate ? '수정' : '등록'}
          >
            {!editingTemplate && (
              <FormField
                label="학생"
                name="student_id"
                type="select"
                value={templateForm.student_id}
                onChange={(v) => setTemplateForm({ ...templateForm, student_id: v })}
                error={templateFieldErrors.student_id}
                required
                placeholder="학생을 선택해 주세요"
                options={studentOptions}
              />
            )}
            {editingTemplate && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">학생</label>
                <p className="text-sm text-gray-600 dark:text-gray-400 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  {editingTemplate.student_name || editingTemplate.student_id.slice(0, 8)}
                </p>
              </div>
            )}
            <FormField
              label="요일"
              name="day_of_week"
              type="select"
              value={templateForm.day_of_week}
              onChange={(v) => setTemplateForm({ ...templateForm, day_of_week: v })}
              required
              options={DAY_OPTIONS}
            />
            <FormField
              label="픽업 시간"
              name="pickup_time"
              type="time"
              value={templateForm.pickup_time}
              onChange={(v) => setTemplateForm({ ...templateForm, pickup_time: v })}
              error={templateFieldErrors.pickup_time}
              required
            />
            <FormField
              label="픽업 주소"
              name="pickup_address"
              value={templateForm.pickup_address}
              onChange={(v) => setTemplateForm({ ...templateForm, pickup_address: v })}
              placeholder="서울시 강남구 역삼동 123-45"
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="위도"
                name="pickup_latitude"
                type="number"
                value={templateForm.pickup_latitude}
                onChange={(v) => setTemplateForm({ ...templateForm, pickup_latitude: v })}
                error={templateFieldErrors.pickup_latitude}
                required
                placeholder="37.4979"
              />
              <FormField
                label="경도"
                name="pickup_longitude"
                type="number"
                value={templateForm.pickup_longitude}
                onChange={(v) => setTemplateForm({ ...templateForm, pickup_longitude: v })}
                error={templateFieldErrors.pickup_longitude}
                required
                placeholder="127.0276"
              />
            </div>
          </FormModal>

          {/* Template Delete Confirmation */}
          <ConfirmDialog
            open={!!deleteTemplateTarget}
            title="템플릿 삭제"
            message={`"${deleteTemplateTarget?.student_name || deleteTemplateTarget?.student_id?.slice(0, 8) || ''}" 학생의 ${DAY_LABELS[deleteTemplateTarget?.day_of_week ?? 0]}요일 템플릿을 삭제하시겠습니까?`}
            confirmText="삭제"
            variant="danger"
            loading={deletingTemplate}
            onConfirm={handleTemplateDelete}
            onCancel={() => setDeleteTemplateTarget(null)}
          />
        </>
      ) : (
      <>

      {/* Controls */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              대상 날짜
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setFetched(false);
                setPipelineResult(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none text-sm"
            />
          </div>
          <button
            onClick={fetchSchedules}
            disabled={loading}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? '조회 중...' : '조회'}
          </button>
          <button
            onClick={() => setPipelineConfirmOpen(true)}
            disabled={loading || pipelineRunning}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
          >
            자동 배차 실행
          </button>
          {fetched && schedules.length > 0 && (
            <ExportButton
              data={schedules as unknown as Record<string, unknown>[]}
              columns={exportColumns}
              filename={`스케줄_${date}`}
            />
          )}
        </div>
      </div>

      {/* Pipeline Result */}
      {renderPipelineResult()}

      {/* Schedule Table */}
      {fetched ? (
        <DataTable<DailySchedule>
          columns={columns}
          data={schedules}
          loading={loading}
          emptyMessage="해당 날짜에 스케줄이 없습니다."
        />
      ) : (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <svg
            className="w-12 h-12 mx-auto text-gray-300 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-500">날짜를 선택하고 "조회" 버튼을 클릭해 주세요.</p>
        </div>
      )}

      {/* Pipeline Confirmation */}
      <ConfirmDialog
        open={pipelineConfirmOpen}
        title="자동 배차 실행"
        message={`${date} 날짜의 일일 자동 배차를 실행하시겠습니까? 스케줄 생성 및 경로 최적화가 수행됩니다.`}
        confirmText="실행"
        variant="warning"
        loading={pipelineRunning}
        onConfirm={runPipeline}
        onCancel={() => setPipelineConfirmOpen(false)}
      />
      </>
      )}
    </div>
  );
}
