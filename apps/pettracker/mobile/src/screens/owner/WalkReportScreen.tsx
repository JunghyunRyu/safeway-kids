import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { getWalkReport, type WalkReport } from '../../api/walks';

export default function WalkReportScreen({ route, navigation }: any) {
  const { sessionId } = route?.params || {};
  const [report, setReport] = useState<WalkReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    if (!sessionId) {
      setLoading(false);
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    getWalkReport(sessionId)
      .then((r) => setReport(r))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, [sessionId]);

  // route_polyline([[lat,lng],...])을 LiveTrack과 동일한 Leaflet 지도로 렌더한다.
  const points = (report?.route_polyline || []).filter(
    (p) => Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number',
  ) as number[][];
  const hasRoute = points.length >= 2;
  const routeJson = JSON.stringify(points);

  const mapHtml = `
    <!DOCTYPE html>
    <html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>html,body,#map{height:100%;margin:0;padding:0}</style>
    </head><body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      var points = ${routeJson};
      var map = L.map('map').setView(points.length ? points[0] : [37.5665, 126.978], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
      if (points.length >= 2) {
        var line = L.polyline(points, { color: '#EF4444', weight: 4, opacity: 0.8 }).addTo(map);
        L.circleMarker(points[0], { radius: 8, color: '#10B981', fillColor: '#10B981', fillOpacity: 1 }).addTo(map).bindPopup('출발');
        L.marker(points[points.length - 1]).addTo(map).bindPopup('도착');
        map.fitBounds(line.getBounds(), { padding: [30, 30] });
      }
    </script>
    </body></html>
  `;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="뒤로 가기" hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>산책 리포트</Text>
      </View>

      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.emptyText}>리포트를 불러오는 중...</Text>
        </View>
      ) : error || !report ? (
        <View style={styles.empty}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textDisabled} />
          <Text style={styles.emptyText}>리포트를 불러올 수 없어요.</Text>
          <Pressable style={styles.retryBtn} onPress={load} accessibilityRole="button" accessibilityLabel="다시 시도">
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.summaryCard}>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Ionicons name="walk" size={24} color={Colors.primary} />
                <Text style={styles.statValue}>{report.distance_meters ? `${(report.distance_meters / 1000).toFixed(1)}km` : '-'}</Text>
                <Text style={styles.statLabel}>거리</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="time" size={24} color={Colors.accent} />
                <Text style={styles.statValue}>
                  {report.started_at && report.ended_at
                    ? `${Math.round((new Date(report.ended_at).getTime() - new Date(report.started_at).getTime()) / 60000)}분`
                    : '-'}
                </Text>
                <Text style={styles.statLabel}>시간</Text>
              </View>
            </View>
          </View>

          {/* 워커 메모 — 없을 때도 섹션을 유지해 "로딩 실패"와 "메모 없음"을 구분 (O-25) */}
          <View style={styles.memoCard}>
            <Text style={styles.memoTitle}>산책 도우미 메모</Text>
            <Text style={[styles.memoText, !report.walker_memo && styles.memoEmpty]}>
              {report.walker_memo || '이번 산책에는 메모가 없어요.'}
            </Text>
          </View>

          {/* 경로 지도 — 실제 렌더 (O-09) */}
          <View style={styles.mapCard}>
            <Text style={styles.mapTitle}>산책 경로</Text>
            {hasRoute ? (
              <WebView
                source={{ html: mapHtml }}
                style={styles.map}
                scrollEnabled={false}
                javaScriptEnabled
                domStorageEnabled
              />
            ) : (
              <View style={styles.mapEmpty}>
                <Ionicons name="map-outline" size={40} color={Colors.textDisabled} />
                <Text style={styles.mapEmptyText}>경로 데이터가 충분하지 않아요</Text>
              </View>
            )}
          </View>

          {/* 다음 행동 CTA — 막다른 화면 방지 (O-26) */}
          <View style={styles.ctaRow}>
            <Pressable
              style={[styles.cta, { backgroundColor: Colors.accent }]}
              onPress={() => navigation.navigate('Review', { bookingId: report.booking_id })}
              accessibilityRole="button"
              accessibilityLabel="리뷰 작성하기"
            >
              <Ionicons name="star" size={18} color={Colors.textInverse} />
              <Text style={styles.ctaText}>리뷰 작성하기</Text>
            </Pressable>
            <Pressable
              style={[styles.cta, styles.ctaSecondary]}
              onPress={() => navigation.navigate('Tabs', { screen: 'Search' })}
              accessibilityRole="button"
              accessibilityLabel="다시 예약하기"
            >
              <Ionicons name="refresh" size={18} color={Colors.primary} />
              <Text style={[styles.ctaText, { color: Colors.primary }]}>다시 예약하기</Text>
            </Pressable>
          </View>

          <View style={{ height: 40 }} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  summaryCard: { marginHorizontal: Spacing.base, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, ...Shadows.sm },
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginTop: 8 },
  statLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 4 },
  memoCard: { marginHorizontal: Spacing.base, marginTop: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base, ...Shadows.sm },
  memoTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: 8 },
  memoText: { fontSize: Typography.sizes.base, color: Colors.textSecondary, lineHeight: 22 },
  memoEmpty: { color: Colors.textDisabled, fontStyle: 'italic' },
  mapCard: { marginHorizontal: Spacing.base, marginTop: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base, ...Shadows.sm },
  mapTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: 8 },
  map: { height: 220, borderRadius: Radius.md, overflow: 'hidden' },
  mapEmpty: { height: 160, justifyContent: 'center', alignItems: 'center' },
  mapEmptyText: { fontSize: Typography.sizes.sm, color: Colors.textDisabled, marginTop: 8 },
  ctaRow: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.base, marginTop: Spacing.xl },
  cta: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: Spacing.md, borderRadius: Radius.lg,
  },
  ctaSecondary: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.primary },
  ctaText: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textInverse },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: Spacing.xl },
  emptyText: { color: Colors.textDisabled, marginTop: Spacing.md, textAlign: 'center' },
  retryBtn: { marginTop: Spacing.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.primary },
  retryText: { color: Colors.textInverse, fontWeight: Typography.weights.bold, fontSize: Typography.sizes.base },
});
