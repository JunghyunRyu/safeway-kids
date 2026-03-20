import { useState } from 'react';
import api from '../../api/client';
import { showToast } from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';
import KpiCard from '../../components/KpiCard';

interface SeedResult {
  academies?: number;
  users?: number;
  students?: number;
  vehicles?: number;
  [key: string]: unknown;
}

export default function PlatformSeedPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSeed = async () => {
    setShowConfirm(false);
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post<SeedResult>('/admin/seed');
      setResult(data);
      showToast('시드 데이터가 생성되었습니다', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast(msg || '시드 데이터 생성에 실패했습니다', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">시드 데이터</h2>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        {/* Warning notice */}
        <div className="mb-6 flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800">개발 환경 전용</p>
            <p className="text-sm text-yellow-700 mt-0.5">
              개발 환경에서만 동작합니다. 프로덕션 환경에서는 이 기능이 비활성화됩니다.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          className="inline-flex items-center gap-3 px-8 py-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium transition-colors"
        >
          {loading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              생성 중...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              시드 데이터 생성
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">생성 결과</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              title="학원"
              value={`${result.academies ?? 0}개`}
              color="#0F7A7A"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />
            <KpiCard
              title="사용자"
              value={`${result.users ?? 0}명`}
              color="#2563EB"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
            />
            <KpiCard
              title="학생"
              value={`${result.students ?? 0}명`}
              color="#9333EA"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
            />
            <KpiCard
              title="차량"
              value={`${result.vehicles ?? 0}대`}
              color="#16A34A"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-4-10l-4 4m0 0l4 4m-4-4h12" />
                </svg>
              }
            />
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showConfirm}
        title="시드 데이터 생성"
        message="테스트용 시드 데이터를 생성하시겠습니까? 기존 데이터에 추가됩니다."
        confirmText="생성"
        variant="warning"
        loading={loading}
        onConfirm={handleSeed}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
