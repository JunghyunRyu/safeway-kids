import { useState, useCallback } from 'react';
import api from '../../api/client';

interface StudentResult {
  id: string;
  name: string;
  date_of_birth: string | null;
  grade: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  academy_name: string | null;
  is_active: boolean;
}

export default function PlatformStudentSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await api.get(`/admin/students/search?q=${encodeURIComponent(query.trim())}`);
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">학생 통합 조회</h2>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="학생 이름 또는 보호자 전화번호 검색..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none text-sm"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
        </div>
      </div>

      {searched && results.length === 0 && !loading && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500">검색 결과가 없습니다.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((s) => (
          <div key={s.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{s.name}</h3>
                  <p className="text-xs text-gray-500">{s.grade ? `${s.grade}학년` : ''} {s.date_of_birth || ''}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {s.is_active ? '활성' : '비활성'}
              </span>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex gap-2">
                <span className="text-gray-400 min-w-[60px]">보호자</span>
                <span>{s.guardian_name || '-'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 min-w-[60px]">연락처</span>
                <span>{s.guardian_phone || '-'}</span>
                {s.guardian_phone && <span className="text-xs text-gray-400">(마스킹)</span>}
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 min-w-[60px]">학원</span>
                <span>{s.academy_name || '-'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
