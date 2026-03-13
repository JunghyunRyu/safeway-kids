import { useEffect, useState } from 'react';
import api from '../api/client';
import type { Vehicle } from '../types';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ license_plate: '', capacity: 15, model_name: '' });
  const [saving, setSaving] = useState(false);

  const fetchVehicles = async () => {
    try {
      const { data } = await api.get('/vehicles/vehicles');
      setVehicles(data);
    } catch {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/vehicles/vehicles', form);
      setShowForm(false);
      setForm({ license_plate: '', capacity: 15, model_name: '' });
      await fetchVehicles();
    } catch {
      alert('차량 등록 실패');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-500">로딩 중...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">차량 관리</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          {showForm ? '취소' : '+ 차량 등록'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">번호판</label>
              <input
                type="text"
                value={form.license_plate}
                onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="12가3456"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">정원</label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 15 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">모델명</label>
              <input
                type="text"
                value={form.model_name}
                onChange={(e) => setForm({ ...form, model_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="현대 카운티"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? '등록 중...' : '등록'}
          </button>
        </form>
      )}

      {vehicles.length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500">등록된 차량이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">번호판</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">정원</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">모델</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{v.license_plate}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{v.capacity}명</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{v.model_name || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      v.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {v.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
