import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { getWalkReport } from '../../api/walks';

export default function LiveTrackScreen({ route, navigation }: any) {
  const { sessionId } = route?.params || {};
  const [walkerPosition, setWalkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const webviewRef = useRef<WebView>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling: fetch walker location every 5 seconds
  const fetchLocation = useCallback(async () => {
    if (!sessionId) return;
    try {
      const report = await getWalkReport(sessionId);
      // Use the latest GPS point from the route polyline if available
      if (report.route_polyline && report.route_polyline.length > 0) {
        const last = report.route_polyline[report.route_polyline.length - 1];
        if (Array.isArray(last) && last.length >= 2) {
          setWalkerPosition({ lat: last[0], lng: last[1] });
        }
      }
      if (report.started_at && !startedAt) {
        setStartedAt(new Date(report.started_at));
      }
      setIsLoading(false);
    } catch {
      // Silently fail on poll — position will update on next attempt
      setIsLoading(false);
    }
  }, [sessionId, startedAt]);

  // Start polling and timer on mount
  useEffect(() => {
    fetchLocation();
    pollRef.current = setInterval(fetchLocation, 5000);

    // Elapsed time counter (1 second interval)
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchLocation]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleContact = () => {
    // TODO: Replace with actual walker phone or navigate to chat screen
    Alert.alert('산책사 연락', '산책사에게 연락하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '전화', onPress: () => Linking.openURL('tel:010-0000-0000').catch(() => Alert.alert('오류', '전화 앱을 열 수 없습니다')) },
    ]);
  };

  const handleSOS = () => {
    Alert.alert(
      '긴급 신고',
      '긴급 상황을 신고하시겠습니까?\n관제 센터에 즉시 알림이 전달됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '신고',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement SOS API call
            Alert.alert('신고 완료', '관제 센터에 신고가 접수되었습니다. 곧 연락드리겠습니다.');
          },
        },
      ],
    );
  };

  // TODO: In production, replace polling with WebSocket subscription to walk_session:{sessionId}:live

  const positionText = walkerPosition
    ? `${walkerPosition.lat.toFixed(4)}, ${walkerPosition.lng.toFixed(4)}`
    : '위치 수신 대기';

  const mapHtml = `
    <!DOCTYPE html>
    <html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>body{margin:0}#map{width:100%;height:100vh;background:#e8f4f4;display:flex;justify-content:center;align-items:center;font-family:sans-serif}</style>
    </head><body>
    <div id="map">
      <div style="text-align:center">
        <div style="font-size:48px">📍</div>
        <div style="font-size:16px;color:#5a7272;margin-top:8px">실시간 위치 추적 중...</div>
        <div style="font-size:12px;color:#9eb3b3;margin-top:4px">${positionText}</div>
      </div>
    </div>
    </body></html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>실시간 추적</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
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
        <Pressable style={styles.contactBtn} onPress={handleContact}>
          <Ionicons name="call" size={20} color={Colors.textInverse} />
          <Text style={styles.contactBtnText}>산책사 연락</Text>
        </Pressable>
        <Pressable style={styles.sosBtn} onPress={handleSOS}>
          <Ionicons name="warning" size={20} color={Colors.textInverse} />
          <Text style={styles.sosBtnText}>SOS 긴급 신고</Text>
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
