import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { checkin, addActivity, checkout } from '../../api/sessions';

type SessionState = 'idle' | 'checked_in' | 'checked_out';

const ACTIVITIES = [
  { type: 'homework', label: '숙제', emoji: '\uD83D\uDCDA' },
  { type: 'play', label: '놀이', emoji: '\uD83C\uDFC3' },
  { type: 'meal', label: '식사', emoji: '\uD83C\uDF7D' },
  { type: 'snack', label: '간식', emoji: '\uD83C\uDF4E' },
  { type: 'nap', label: '낮잠', emoji: '\uD83D\uDE34' },
  { type: 'outdoor', label: '외출', emoji: '\uD83C\uDF33' },
];

export default function SessionScreen() {
  const [state, setState] = useState<SessionState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [activitiesCount, setActivitiesCount] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [memo, setMemo] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state === 'checked_in') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleCheckin = () => {
    Alert.alert('돌봄 시작', '돌봄을 시작하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '시작',
        onPress: async () => {
          try {
            const result = await checkin('demo-booking-id', { latitude: 0, longitude: 0, accuracy: 10 });
            setSessionId(result.session_id);
            setState('checked_in');
            setElapsed(0);
            setActivitiesCount(0);
          } catch {
            Alert.alert('오류', '체크인할 수 없습니다.');
          }
        },
      },
    ]);
  };

  const handleAddActivity = async (activityType: string) => {
    if (!sessionId) return;
    try {
      await addActivity(sessionId, { activity_type: activityType });
      setActivitiesCount((c) => c + 1);
    } catch {}
  };

  const handleCheckout = () => {
    Alert.alert('돌봄 종료', '돌봄을 종료하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '종료',
        onPress: async () => {
          if (timerRef.current) clearInterval(timerRef.current);
          try {
            if (sessionId) {
              const result = await checkout(sessionId);
              setTotalMinutes(result.total_minutes);
            }
          } catch {}
          setState('checked_out');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>돌봄</Text>
      </View>

      {state === 'idle' && (
        <View style={styles.center}>
          <Ionicons name="heart" size={80} color={Colors.textDisabled} />
          <Text style={styles.idleText}>확정된 예약에서 돌봄을 시작하세요</Text>
          <Pressable style={styles.startBtn} onPress={handleCheckin}>
            <Ionicons name="play" size={24} color={Colors.textInverse} />
            <Text style={styles.btnText}>돌봄 시작</Text>
          </Pressable>
        </View>
      )}

      {state === 'checked_in' && (
        <View style={styles.center}>
          {/* Allergy Warning Banner */}
          <View style={styles.allergyBanner}>
            <Ionicons name="warning" size={18} color={Colors.danger} />
            <Text style={styles.allergyText}>알레르기 정보를 확인하세요</Text>
          </View>

          {/* Timer */}
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
            <Text style={styles.timerLabel}>돌봄 중</Text>
          </View>

          {/* Activity Log Buttons */}
          <View style={styles.activityGrid}>
            {ACTIVITIES.map((a) => (
              <Pressable key={a.type} style={styles.activityBtn} onPress={() => handleAddActivity(a.type)}>
                <Text style={styles.activityEmoji}>{a.emoji}</Text>
                <Text style={styles.activityLabel}>{a.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Photo Button */}
          <Pressable style={styles.photoFab}>
            <Ionicons name="camera" size={32} color={Colors.textInverse} />
            <Text style={styles.photoLabel}>사진</Text>
          </Pressable>

          <Pressable style={styles.endBtn} onPress={handleCheckout}>
            <Ionicons name="stop" size={24} color={Colors.textInverse} />
            <Text style={styles.btnText}>돌봄 종료</Text>
          </Pressable>
        </View>
      )}

      {state === 'checked_out' && (
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          <Text style={styles.endedTitle}>돌봄 완료!</Text>
          <Text style={styles.endedStat}>총 시간: {totalMinutes || Math.floor(elapsed / 60)}분</Text>
          <Text style={styles.endedStat}>활동 기록: {activitiesCount}건</Text>

          <TextInput
            style={styles.memoInput}
            placeholder="돌봄자 메모 (아이 상태, 특이사항 등)"
            placeholderTextColor={Colors.textDisabled}
            value={memo}
            onChangeText={setMemo}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Pressable style={styles.resetBtn} onPress={() => { setState('idle'); setElapsed(0); setActivitiesCount(0); setMemo(''); }}>
            <Text style={styles.resetText}>확인</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  contentContainer: { flexGrow: 1 },
  header: { paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  idleText: { fontSize: Typography.sizes.md, color: Colors.textDisabled, marginTop: Spacing.lg, marginBottom: Spacing.xxl, textAlign: 'center' },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.base, borderRadius: Radius.lg, gap: 8,
  },
  btnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
  allergyBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dangerLight,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderRadius: Radius.md,
    width: '100%', gap: 8, marginBottom: Spacing.lg,
  },
  allergyText: { fontSize: Typography.sizes.sm, color: Colors.danger, fontWeight: Typography.weights.medium },
  timerCircle: {
    width: 180, height: 180, borderRadius: 90, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl,
  },
  timerText: { fontSize: 40, fontWeight: Typography.weights.extrabold, color: '#fff' },
  timerLabel: { fontSize: Typography.sizes.base, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  activityGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm,
    marginBottom: Spacing.xl, width: '100%',
  },
  activityBtn: {
    width: 90, height: 72, backgroundColor: Colors.surface, borderRadius: Radius.md,
    justifyContent: 'center', alignItems: 'center', ...Shadows.sm,
  },
  activityEmoji: { fontSize: 24, marginBottom: 4 },
  activityLabel: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, fontWeight: Typography.weights.medium },
  photoFab: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl,
  },
  photoLabel: { color: '#fff', fontSize: Typography.sizes.xs, marginTop: 2 },
  endBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.base, borderRadius: Radius.lg, gap: 8,
  },
  endedTitle: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.success, marginTop: Spacing.lg },
  endedStat: { fontSize: Typography.sizes.lg, color: Colors.textSecondary, marginTop: Spacing.sm },
  memoInput: {
    width: '100%', backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.base, marginTop: Spacing.xl, fontSize: Typography.sizes.base,
    color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.borderLight, minHeight: 100,
  },
  resetBtn: { marginTop: Spacing.xl, backgroundColor: Colors.primary, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, borderRadius: Radius.md },
  resetText: { color: Colors.textInverse, fontWeight: Typography.weights.bold, fontSize: Typography.sizes.md },
});
