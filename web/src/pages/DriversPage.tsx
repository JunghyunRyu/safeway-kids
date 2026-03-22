import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import DataTable, { type Column } from '../components/DataTable';
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

  const columns: Column<DriverInfo>[] = [
    { key: 'name', label: '이름', sortable: true },
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">기사 관리</h2>

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
        <div className="ml-auto">
          <ExportButton data={drivers} columns={exportColumns} filename="기사목록" />
        </div>
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
        />
      )}
    </div>
  );
}
