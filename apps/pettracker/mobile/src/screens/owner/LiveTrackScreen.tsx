import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useWebSocket } from '@safeway/core-mobile/hooks/useWebSocket';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { getWalkReport } from '../../api/walks';
import { apiClient } from '../../api/client';

type GpsMsg = {
  type?: string;
  lat?: number;
  lng?: number;
  recorded_at?: string;
};

export default function LiveTrackScreen({ route, navigation }: any) {
  const { sessionId } = route?.params || {};
  const [walkerPosition, setWalkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [routePoints, setRoutePoints] = useState<Array<[number, number]>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [walkerPhone, setWalkerPhone] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const webviewRef = useRef<WebView>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── HTTP fetch (initial load + polling fallback) ────────────────
  const fetchLocation = useCallback(async () => {
    if (!sessionId) return;
    try {
      const report = await getWalkReport(sessionId);
      if (report.route_polyline && report.route_polyline.length > 0) {
        const validPoints = (report.route_polyline as any[])
          .filter((p) => Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number')
          .map((p) => [p[0], p[1]] as [number, number]);
        setRoutePoints(validPoints);
        if (validPoints.length > 0) {
          const last = validPoints[validPoints.length - 1];
          setWalkerPosition({ lat: last[0], lng: last[1] });
        }
      }
      if (report.started_at && !startedAt) {
        setStartedAt(new Date(report.started_at));
      }
      const phone = (report as any).walker_phone;
      if (typeof phone === 'string' && phone.length >= 9) {
        setWalkerPhone(phone);
      }
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  }, [sessionId, startedAt]);

  // ── WebSocket: real-time GPS stream ─────────────────────────────
  // Backend C-12 publishes to `pt:walk:{session_id}:updates`
  // Hook auto-reconnects; on permanent fail we resume HTTP polling.
  const { status: wsStatus } = useWebSocket({
    path: sessionId ? `/pt/ws/walks/${sessionId}` : '/pt/ws/walks/none',
    enabled: Boolean(sessionId),
    onMessage: (msg: unknown) => {
      const data = msg as GpsMsg;
      if (data?.type !== 'gps' || typeof data.lat !== 'number' || typeof data.lng !== 'number') {
        return;
      }
      const point: [number, number] = [data.lat, data.lng];
      setRoutePoints((prev) => [...prev, point]);
      setWalkerPosition({ lat: data.lat, lng: data.lng });
      setIsLoading(false);
    },
  });

  // ── Initial load + polling fallback when WS fails ───────────────
  useEffect(() => {
    fetchLocation();
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle HTTP polling based on WS health.
  useEffect(() => {
    if (wsStatus === 'failed') {
      if (!pollRef.current) {
        pollRef.current = setInterval(fetchLocation, 5000);
      }
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }, [wsStatus, fetchLocation]);

  // startedAt이 도착하면 경과 시간을 실제 시작 시각 기준으로 보정한다.
  // (산책 도중에 화면을 열어도 00:00이 아니라 실제 경과가 보이도록)
  useEffect(() => {
    if (!startedAt) return;
    const base = Math.floor((Date.now() - startedAt.getTime()) / 1000);
    setElapsedSeconds(base > 0 ? base : 0);
  }, [startedAt]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleContact = () => {
    // 실제 산책 도우미 전화번호가 있을 때만 전화 연결. (가짜 번호 다이얼 금지)
    if (walkerPhone) {
      Alert.alert('산책 도우미 연락', '산책 도우미에게 전화하시겠습니까?', [
        { text: '취소', style: 'cancel' },
        {
          text: '전화',
          onPress: () =>
            Linking.openURL(`tel:${walkerPhone}`).catch(() => Alert.alert('오류', '전화 앱을 열 수 없습니다')),
        },
      ]);
      return;
    }
    // 번호 미수신 시: 가짜 번호로 걸지 않고 안내만 한다.
    Alert.alert(
      '산책 도우미 연락',
      '연락처를 불러오는 중입니다. 긴급한 상황이라면 아래 SOS 긴급 신고를 이용해 주세요.',
    );
  };

  const handleSOS = () => {
    if (sending) return;
    Alert.alert(
      '긴급 신고',
      '긴급 상황을 신고하시겠습니까?\n관제 센터에 즉시 알림이 전달됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '신고',
          style: 'destructive',
          onPress: async () => {
            setSending(true);
            let latitude: number | null = null;
            let longitude: number | null = null;
            let location_unknown = false;
            try {
              const { status } = await Location.getForegroundPermissionsAsync();
              if (status === 'granted') {
                const pos = await Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.High,
                });
                latitude = pos.coords.latitude;
                longitude = pos.coords.longitude;
              } else {
                location_unknown = true;
              }
            } catch {
              location_unknown = true;
            }
            try {
              await apiClient.post('/pt/sos', {
                session_id: sessionId ?? null,
                latitude,
                longitude,
                location_unknown,
              });
              Alert.alert('신고 완료', '관제 센터에 신고가 접수되었습니다.');
            } catch {
              Alert.alert(
                '신고 실패',
                '신고 전송에 실패했습니다. 119에 직접 신고해 주세요.',
                [
                  {
                    text: '119 신고',
                    onPress: () => Linking.openURL('tel:119').catch(() => null),
                  },
                  { text: '닫기', style: 'cancel' },
                ],
              );
            } finally {
              setSending(false);
            }
          },
        },
      ],
    );
  };

  // TODO: In production, replace polling with WebSocket subscription to walk_session:{sessionId}:live

  const centerLat = walkerPosition?.lat ?? 37.5665;
  const centerLng = walkerPosition?.lng ?? 126.978;
  const routeJson = JSON.stringify(routePoints);
  const hasRoute = routePoints.length >= 2;

  const mapHtml = hasRoute ? `
    <!DOCTYPE html>
    <html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>html,body,#map{height:100%;margin:0;padding:0}</style>
    </head><body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      var points = ${routeJson};
      var map = L.map('map').setView([${centerLat}, ${centerLng}], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);
      if (points.length >= 2) {
        var line = L.polyline(points, { color: '#EF4444', weight: 4, opacity: 0.8 }).addTo(map);
        var start = points[0];
        var end = points[points.length - 1];
        L.circleMarker(start, { radius: 8, color: '#10B981', fillColor: '#10B981', fillOpacity: 1 }).addTo(map).bindPopup('출발');
        L.marker(end).addTo(map).bindPopup('현재 위치');
        map.fitBounds(line.getBounds(), { padding: [30, 30] });
      }
    </script>
    </body></html>
  ` : `
    <!DOCTYPE html>
    <html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>body{margin:0}#map{width:100%;height:100vh;background:#e8f4f4;display:flex;justify-content:center;align-items:center;font-family:sans-serif}</style>
    </head><body>
    <div id="map">
      <div style="text-align:center">
        <div style="font-size:48px">📍</div>
        <div style="font-size:16px;color:#5a7272;margin-top:8px">실시간 위치를 받아오고 있어요...</div>
        <div style="font-size:12px;color:#9eb3b3;margin-top:4px">산책이 시작되면 경로가 지도에 표시됩니다</div>
      </div>
    </div>
    </body></html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="뒤로 가기" hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>실시간 추적</Text>
        {wsStatus === 'open' ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        ) : wsStatus === 'failed' ? (
          <View style={[styles.liveBadge, { backgroundColor: Colors.borderLight }]}>
            <Text style={[styles.liveText, { color: Colors.textSecondary }]}>업데이트 중</Text>
          </View>
        ) : (
          <View style={[styles.liveBadge, { backgroundColor: Colors.borderLight }]}>
            <Text style={[styles.liveText, { color: Colors.textSecondary }]}>연결중</Text>
          </View>
        )}
      </View>

      {isLoading && !walkerPosition ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>산책사 위치 불러오는 중...</Text>
        </View>
      ) : (
        <WebView
          ref={webviewRef}
          source={{ html: mapHtml }}
          style={styles.map}
          scrollEnabled={false}
          javaScriptEnabled
          domStorageEnabled
        />
      )}

      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <Ionicons name="walk" size={18} color={Colors.primary} />
          <Text style={styles.infoText}>산책 진행 중</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="time" size={18} color={Colors.accent} />
          <Text style={styles.infoText}>{formatElapsed(elapsedSeconds)}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <Pressable style={styles.contactBtn} onPress={handleContact} accessibilityRole="button" accessibilityLabel="산책 도우미에게 연락">
          <Ionicons name="call" size={20} color={Colors.textInverse} />
          <Text style={styles.contactBtnText}>산책 도우미 연락</Text>
        </Pressable>
        <Pressable style={[styles.sosBtn, sending && { opacity: 0.6 }]} onPress={handleSOS} disabled={sending} accessibilityRole="button" accessibilityLabel="SOS 긴급 신고">
          {sending ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <Ionicons name="warning" size={20} color={Colors.textInverse} />
          )}
          <Text style={styles.sosBtnText}>{sending ? '신고 중...' : 'SOS 긴급 신고'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base,
    paddingTop: 60, paddingBottom: Spacing.md, backgroundColor: Colors.surface, zIndex: 10,
  },
  backBtn: { marginRight: Spacing.md },
  title: { flex: 1, fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dangerLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger, marginRight: 4 },
  liveText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.danger },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: Typography.sizes.base, color: Colors.textSecondary, marginTop: Spacing.md },
  map: { flex: 1 },
  infoBar: {
    flexDirection: 'row', justifyContent: 'space-around', backgroundColor: Colors.surface,
    paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  actionBar: {
    flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md, backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  contactBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: Radius.md,
  },
  contactBtnText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.textInverse },
  sosBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.danger, paddingVertical: Spacing.md, borderRadius: Radius.md,
  },
  sosBtnText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.textInverse },
});
