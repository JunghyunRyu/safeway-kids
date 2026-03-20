import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import api from '../../api/client';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface VehicleInfo {
  id: string;
  license_plate: string;
  capacity: number;
  operator_name: string | null;
  is_active: boolean;
  created_at: string;
}

interface GpsLocation {
  vehicle_id: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  recorded_at: string;
}

interface VehicleState extends VehicleInfo {
  location: GpsLocation | null;
  lastFetchedAt: number | null; // epoch ms
}

/* ------------------------------------------------------------------ */
/*  Kakao Map iframe HTML                                              */
/* ------------------------------------------------------------------ */

function buildMapHtml(apiKey: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body,#map{width:100%;height:100%;}
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map=null, markers={}, infoWindows={}, kakaoLoaded=false;

    function loadKakao(){
      var s=document.createElement('script');
      s.src='https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false';
      s.onload=function(){
        kakao.maps.load(function(){
          kakaoLoaded=true;
          var container=document.getElementById('map');
          map=new kakao.maps.Map(container,{
            center:new kakao.maps.LatLng(37.5665,126.978),
            level:8
          });
          window.parent.postMessage(JSON.stringify({type:'mapReady'}),'*');
        });
      };
      s.onerror=function(){
        document.getElementById('map').innerHTML=
          '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:14px;">'+
          'Kakao Maps SDK load failed</div>';
      };
      document.head.appendChild(s);
    }
    loadKakao();

    window.addEventListener('message',function(e){
      try{
        var data=typeof e.data==='string'?JSON.parse(e.data):e.data;
        if(!data||!data.type) return;

        if(data.type==='updateVehicle'){
          if(!map) return;
          var pos=new kakao.maps.LatLng(data.lat,data.lng);
          if(markers[data.id]){
            markers[data.id].setPosition(pos);
          } else {
            var img=new kakao.maps.MarkerImage(
              'data:image/svg+xml,'+encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">'+
                '<circle cx="16" cy="16" r="14" fill="#2196F3" stroke="white" stroke-width="3"/>'+
                '<text x="16" y="21" text-anchor="middle" fill="white" font-size="12" font-weight="bold">B</text>'+
                '</svg>'
              ),
              new kakao.maps.Size(32,32),
              {offset:new kakao.maps.Point(16,16)}
            );
            markers[data.id]=new kakao.maps.Marker({position:pos,map:map,image:img});
            infoWindows[data.id]=new kakao.maps.InfoWindow({
              content:'<div style="padding:5px 10px;font-size:12px;white-space:nowrap;">'+data.label+'</div>'
            });
            infoWindows[data.id].open(map,markers[data.id]);
          }
        }

        if(data.type==='centerOn'){
          if(!map) return;
          map.setCenter(new kakao.maps.LatLng(data.lat,data.lng));
          map.setLevel(4);
        }

        if(data.type==='removeVehicle'){
          if(markers[data.id]){
            markers[data.id].setMap(null);
            delete markers[data.id];
          }
          if(infoWindows[data.id]){
            infoWindows[data.id].close();
            delete infoWindows[data.id];
          }
        }

        if(data.type==='fitBounds'){
          if(!map||!data.points||data.points.length===0) return;
          var bounds=new kakao.maps.LatLngBounds();
          data.points.forEach(function(p){bounds.extend(new kakao.maps.LatLng(p.lat,p.lng));});
          map.setBounds(bounds);
        }
      }catch(ex){}
    });
  </script>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function secondsAgo(isoStr: string | null): string {
  if (!isoStr) return '-';
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 0) return '방금';
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  return `${Math.floor(diff / 3600)}시간 전`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PlatformMapPage() {
  const [vehicles, setVehicles] = useState<VehicleState[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [, setTick] = useState(0); // for re-rendering time-ago labels

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const vehiclesRef = useRef<VehicleState[]>(vehicles);
  vehiclesRef.current = vehicles;

  const kakaoApiKey = (import.meta as any).env?.VITE_KAKAO_MAPS_API_KEY || '';
  const hasMapKey = !!kakaoApiKey;

  // ---- Fetch vehicle list ----
  const fetchVehicles = useCallback(async () => {
    try {
      const { data } = await api.get('/telemetry/vehicles');
      if (Array.isArray(data)) {
        setVehicles((prev) => {
          const map = new Map(prev.map((v) => [v.id, v]));
          return data.map((v: VehicleInfo) => ({
            ...v,
            location: map.get(v.id)?.location ?? null,
            lastFetchedAt: map.get(v.id)?.lastFetchedAt ?? null,
          }));
        });
      }
    } catch {
      /* handled by api interceptor */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
    // Re-fetch vehicle list every 30 seconds
    const id = setInterval(fetchVehicles, 30_000);
    return () => clearInterval(id);
  }, [fetchVehicles]);

  // ---- Listen for mapReady ----
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data?.type === 'mapReady') setMapReady(true);
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // ---- Poll GPS for active vehicles ----
  useEffect(() => {
    if (!mapReady && hasMapKey) return;

    const poll = async () => {
      const current = vehiclesRef.current;
      const active = current.filter((v) => v.is_active);
      const results = await Promise.allSettled(
        active.map((v) => api.get(`/telemetry/vehicles/${v.id}/location`))
      );

      setVehicles((prev) => {
        const next = [...prev];
        active.forEach((v, i) => {
          const res = results[i];
          const idx = next.findIndex((x) => x.id === v.id);
          if (idx === -1) return;
          if (res.status === 'fulfilled' && res.value.data) {
            const loc: GpsLocation = res.value.data;
            next[idx] = { ...next[idx], location: loc, lastFetchedAt: Date.now() };
            // Send to iframe
            if (hasMapKey) {
              iframeRef.current?.contentWindow?.postMessage(
                JSON.stringify({
                  type: 'updateVehicle',
                  id: v.id,
                  lat: loc.latitude,
                  lng: loc.longitude,
                  label: v.license_plate,
                }),
                '*'
              );
            }
          }
        });
        return next;
      });
    };

    poll(); // immediate first poll
    const id = setInterval(poll, 5_000);
    return () => clearInterval(id);
  }, [mapReady, hasMapKey]);

  // ---- Tick for time-ago labels ----
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5_000);
    return () => clearInterval(id);
  }, []);

  // ---- Derived data ----
  const activeCount = vehicles.filter((v) => v.is_active).length;
  const withLocationCount = vehicles.filter((v) => v.is_active && v.location).length;
  const totalCount = vehicles.length;

  const filtered = useMemo(() => {
    if (!search) return vehicles;
    const q = search.toLowerCase();
    return vehicles.filter((v) => v.license_plate.toLowerCase().includes(q));
  }, [vehicles, search]);

  // ---- Center map on vehicle ----
  const centerOnVehicle = useCallback(
    (v: VehicleState) => {
      setSelectedId(v.id);
      if (v.location && hasMapKey) {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({
            type: 'centerOn',
            lat: v.location.latitude,
            lng: v.location.longitude,
          }),
          '*'
        );
      }
    },
    [hasMapKey]
  );

  // ---- Map HTML blob URL ----
  const mapBlobUrl = useMemo(() => {
    if (!hasMapKey) return '';
    const html = buildMapHtml(kakaoApiKey);
    const blob = new Blob([html], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [hasMapKey, kakaoApiKey]);

  useEffect(() => {
    return () => {
      if (mapBlobUrl) URL.revokeObjectURL(mapBlobUrl);
    };
  }, [mapBlobUrl]);

  // ---- Render ----
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Top stats bar */}
      <div className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mr-4">
          관제 센터
        </h2>
        <div className="flex items-center gap-6 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
            <span className="text-gray-600 dark:text-gray-300">
              운행 중 <strong className="text-gray-900 dark:text-gray-100">{withLocationCount}</strong>대
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" />
            <span className="text-gray-600 dark:text-gray-300">
              대기 <strong className="text-gray-900 dark:text-gray-100">{activeCount - withLocationCount}</strong>대
            </span>
          </span>
          <span className="text-gray-400 dark:text-gray-500">|</span>
          <span className="text-gray-600 dark:text-gray-300">
            총 <strong className="text-gray-900 dark:text-gray-100">{totalCount}</strong>대
          </span>
        </div>
        {/* Sidebar toggle */}
        <button
          type="button"
          onClick={() => setSidebarOpen((o) => !o)}
          className="ml-auto p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={sidebarOpen ? '차량 목록 숨기기' : '차량 목록 보기'}
          title={sidebarOpen ? '차량 목록 숨기기' : '차량 목록 보기'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            )}
          </svg>
        </button>
      </div>

      {/* Main area: sidebar + map */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - vehicle list */}
        {sidebarOpen && (
          <div className="w-[300px] shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="번호판 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Vehicle list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-sm text-gray-400 dark:text-gray-500">
                  로딩 중...
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-sm text-gray-400 dark:text-gray-500">
                  {search ? '검색 결과가 없습니다' : '등록된 차량이 없습니다'}
                </div>
              ) : (
                filtered.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => centerOnVehicle(v)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      selectedId === v.id
                        ? 'bg-teal-50 dark:bg-teal-900/20 border-l-4 border-l-teal-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {v.license_plate}
                      </span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          v.is_active && v.location
                            ? 'bg-green-500'
                            : v.is_active
                            ? 'bg-yellow-400'
                            : 'bg-gray-400'
                        }`}
                        title={
                          v.is_active && v.location
                            ? '운행 중'
                            : v.is_active
                            ? '대기'
                            : '비활성'
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {v.operator_name || v.capacity + '인승'}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {v.location
                          ? `마지막 업데이트: ${secondsAgo(v.location.recorded_at)}`
                          : '위치 없음'}
                      </span>
                    </div>
                    {/* Show details when selected */}
                    {selectedId === v.id && v.location && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <div>
                          위도: {v.location.latitude.toFixed(6)}, 경도:{' '}
                          {v.location.longitude.toFixed(6)}
                        </div>
                        {v.location.speed != null && (
                          <div>속도: {v.location.speed.toFixed(1)} km/h</div>
                        )}
                        {v.location.heading != null && (
                          <div>방향: {v.location.heading.toFixed(0)}&deg;</div>
                        )}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Map area */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 relative">
          {hasMapKey ? (
            <iframe
              ref={iframeRef}
              src={mapBlobUrl}
              title="관제 지도"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            /* Fallback: table-based view */
            <div className="flex flex-col h-full">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 text-sm text-yellow-800 dark:text-yellow-200">
                <span className="font-medium">
                  카카오맵 API 키 설정 후 지도가 표시됩니다
                </span>
                <span className="block text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  VITE_KAKAO_MAPS_API_KEY 환경 변수를 설정하세요.
                </span>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                      <th className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium">
                        번호판
                      </th>
                      <th className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium">
                        상태
                      </th>
                      <th className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium">
                        위도
                      </th>
                      <th className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium">
                        경도
                      </th>
                      <th className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium">
                        속도 (km/h)
                      </th>
                      <th className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium">
                        마지막 업데이트
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-gray-400 dark:text-gray-500"
                        >
                          {loading ? '로딩 중...' : '등록된 차량이 없습니다'}
                        </td>
                      </tr>
                    ) : (
                      vehicles.map((v) => (
                        <tr
                          key={v.id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="px-4 py-2 text-gray-900 dark:text-gray-100 font-medium">
                            {v.license_plate}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                                v.is_active && v.location
                                  ? 'text-green-700 dark:text-green-400'
                                  : v.is_active
                                  ? 'text-yellow-700 dark:text-yellow-400'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  v.is_active && v.location
                                    ? 'bg-green-500'
                                    : v.is_active
                                    ? 'bg-yellow-400'
                                    : 'bg-gray-400'
                                }`}
                              />
                              {v.is_active && v.location
                                ? '운행 중'
                                : v.is_active
                                ? '대기'
                                : '비활성'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300 font-mono text-xs">
                            {v.location?.latitude.toFixed(6) ?? '-'}
                          </td>
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300 font-mono text-xs">
                            {v.location?.longitude.toFixed(6) ?? '-'}
                          </td>
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300 font-mono text-xs">
                            {v.location?.speed?.toFixed(1) ?? '-'}
                          </td>
                          <td className="px-4 py-2 text-gray-500 dark:text-gray-400 text-xs">
                            {v.location
                              ? secondsAgo(v.location.recorded_at)
                              : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
