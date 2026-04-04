import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { confirmHandover } from '../../api/sessions';

export default function HandoverScreen({ route, navigation }: any) {
  const { sessionId, totalMinutes, activitiesCount } = route?.params || {};
  const [loading, setLoading] = useState(false);

  const hours = Math.floor((totalMinutes || 0) / 60);
  const mins = (totalMinutes || 0) % 60;

  const handleConfirm = async () => {
    if (!sessionId) { Alert.alert('오류', '세션 정보가 없습니다'); return; }
    setLoading(true);
    try {
      await confirmHandover(sessionId);
      Alert.alert('인수 완료', '아이 인수가 확인되었습니다. 감사합니다!', [
        { text: '리뷰 작성', onPress: () => navigation.navigate('Review', { bookingId: route?.params?.bookingId }) },
        { text: '확인', onPress: () => navigation.navigate('Home') },
      ]);
    } catch { Alert.alert('오류', '인수 확인에 실패했습니다'); }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>아이 인수</Text>
      </View>

      {/* Timer Warning */}
      <View style={styles.timerBanner}>
        <Ionicons name="time" size={20} color={Colors.warning} />
        <Text style={styles.timerText}>5분 내 확인해 주세요</Text>
      </View>

      {/* Session Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>돌봄 요약</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Ionicons name="time-outline" size={28} color={Colors.primary} />
            <Text style={styles.summaryValue}>
              {hours > 0 ? `${hours}시간 ` : ''}{mins > 0 ? `${mins}분` : ''}
            </Text>
            <Text style={styles.summaryLabel}>총 돌봄 시간</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Ionicons name="list-outline" size={28} color={Colors.accent} />
            <Text style={styles.summaryValue}>{activitiesCount || 0}건</Text>
            <Text style={styles.summaryLabel}>활동 기록</Text>
          </View>
        </View>
      </View>

      {/* Confirm Button */}
      <View style={styles.confirmSection}>
        <Text style={styles.confirmGuide}>아이를 직접 확인한 후 인수 확인을 눌러주세요</Text>
        <Pressable style={styles.confirmBtn} onPress={handleConfirm} disabled={loading}>
          <Ionicons name="checkmark-circle" size={32} color={Colors.textInverse} />
          <Text style={styles.confirmText}>{loading ? '처리 중...' : '인수 확인'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  timerBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: Spacing.base,
    padding: Spacing.md, backgroundColor: Colors.warningLight, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.warning, marginBottom: Spacing.xl,
  },
  timerText: { fontSize: Typography.sizes.md, color: Colors.warning, fontWeight: Typography.weights.bold },
  summaryCard: {
    marginHorizontal: Spacing.base, backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.xl, ...Shadows.sm,
  },
  summaryTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.xl },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginTop: Spacing.sm },
  summaryLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 4 },
  divider: { width: 1, height: 60, backgroundColor: Colors.borderLight },
  confirmSection: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.base },
  confirmGuide: { fontSize: Typography.sizes.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  confirmBtn: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    ...Shadows.md,
  },
  confirmText: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textInverse, marginTop: Spacing.sm },
});
