import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { startWalk, recordGps, endWalk } from '../../api/walks';

type WalkState = 'idle' | 'walking' | 'ended';

export default function WalkScreen() {
  const [state, setState] = useState<WalkState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gpsRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (state === 'walking') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleStart = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('위치 권한 필요', '산책 GPS 추적을 위해 위치 권한이 필요합니다.');
      return;
    }

    // For demo, using a hardcoded booking ID — in real app, selected from list
    Alert.alert('산책 시작', '산책을 시작하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '시작',
        onPress: async () => {
          try {
            // In real flow, bookingId comes from confirmed booking
            const result = await startWalk('demo-booking-id');
            setSessionId(result.session_id);
            setState('walking');
            setElapsed(0);

            // Start GPS streaming every 5 seconds
            gpsRef.current = setInterval(async () => {
              try {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                if (result.session_id) {
                  await recordGps(result.session_id, {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    heading: loc.coords.heading ?? undefined,
                    speed: loc.coords.speed ?? undefined,
                    accuracy: loc.coords.accuracy ?? undefined,
                    recorded_at: new Date().toISOString(),
                  });
                }
              } catch {}
            }, 5000);
          } catch (e) {
            Alert.alert('오류', '산책을 시작할 수 없습니다.');
          }
        },
      },
    ]);
  };

  const handleEnd = () => {
    Alert.alert('산책 종료', '산책을 종료하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '종료',
        onPress: async () => {
          if (gpsRef.current) clearInterval(gpsRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          try {
            if (sessionId) {
              const result = await endWalk(sessionId);
              setDistance(result.distance_meters || 0);
            }
          } catch {}
          setState('ended');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>산책</Text>
      </View>

      <View style={styles.center}>
        {state === 'idle' && (
          <>
            <Ionicons name="walk" size={80} color={Colors.textDisabled} />
            <Text style={styles.idleText}>확정된 예약에서 산책을 시작하세요</Text>
            <Pressable style={styles.startBtn} onPress={handleStart}>
              <Ionicons name="play" size={24} color={Colors.textInverse} />
              <Text style={styles.btnText}>산책 시작</Text>
            </Pressable>
          </>
        )}

        {state === 'walking' && (
          <>
            <View style={styles.timerCircle}>
              <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
              <Text style={styles.timerLabel}>산책 중</Text>
            </View>

            {/* Photo FAB — large button for one-handed use */}
            <Pressable style={styles.photoFab}>
              <Ionicons name="camera" size={32} color={Colors.textInverse} />
              <Text style={styles.photoLabel}>사진</Text>
            </Pressable>

            <Pressable style={styles.endBtn} onPress={handleEnd}>
              <Ionicons name="stop" size={24} color={Colors.textInverse} />
              <Text style={styles.btnText}>산책 종료</Text>
            </Pressable>
          </>
        )}

        {state === 'ended' && (
          <>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
            <Text style={styles.endedTitle}>산책 완료!</Text>
            <Text style={styles.endedStat}>시간: {formatTime(elapsed)}</Text>
            <Text style={styles.endedStat}>거리: {(distance / 1000).toFixed(1)}km</Text>
            <Pressable style={styles.resetBtn} onPress={() => { setState('idle'); setElapsed(0); setDistance(0); }}>
              <Text style={styles.resetText}>확인</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  idleText: { fontSize: Typography.sizes.md, color: Colors.textDisabled, marginTop: Spacing.lg, marginBottom: Spacing.xxl, textAlign: 'center' },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.base, borderRadius: Radius.lg, gap: 8,
  },
  btnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
  timerCircle: {
    width: 200, height: 200, borderRadius: 100, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xxl,
  },
  timerText: { fontSize: 48, fontWeight: Typography.weights.extrabold, color: '#fff' },
  timerLabel: { fontSize: Typography.sizes.base, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  photoFab: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xxl,
  },
  photoLabel: { color: '#fff', fontSize: Typography.sizes.xs, marginTop: 2 },
  endBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.base, borderRadius: Radius.lg, gap: 8,
  },
  endedTitle: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.success, marginTop: Spacing.lg },
  endedStat: { fontSize: Typography.sizes.lg, color: Colors.textSecondary, marginTop: Spacing.sm },
  resetBtn: { marginTop: Spacing.xxl, backgroundColor: Colors.primary, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, borderRadius: Radius.md },
  resetText: { color: Colors.textInverse, fontWeight: Typography.weights.bold, fontSize: Typography.sizes.md },
});
