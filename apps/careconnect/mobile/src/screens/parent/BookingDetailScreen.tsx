import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { cancelBooking, type CcBooking } from '../../api/bookings';

const STATUS_LABELS: Record<string, string> = {
  pending: '대기 중', confirmed: '확정', checked_in: '체크인 완료', in_progress: '돌봄 중',
  handover_pending: '인수 대기', completed: '완료', cancelled: '취소',
};

export default function BookingDetailScreen({ route, navigation }: any) {
  const booking: CcBooking | undefined = route?.params?.booking;

  if (!booking) {
    return <View style={styles.container}><Text style={styles.empty}>예약 정보를 찾을 수 없습니다</Text></View>;
  }

  const handleCancel = () => {
    Alert.alert('예약 취소', '정말 취소하시겠습니까?', [
      { text: '아니오', style: 'cancel' },
      {
        text: '예, 취소합니다',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelBooking(booking.id);
            Alert.alert('취소 완료', '예약이 취소되었습니다');
            navigation.goBack();
          } catch {}
        },
      },
    ]);
  };

  const canCancel = !['completed', 'cancelled'].includes(booking.status);
  const canTrack = ['in_progress', 'checked_in'].includes(booking.status);
  const canHandover = booking.status === 'handover_pending';
  const canReview = booking.status === 'completed';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>예약 상세</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>{STATUS_LABELS[booking.status] || booking.status}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={18} color={Colors.textSecondary} />
          <Text style={styles.infoText}>{new Date(booking.scheduled_at).toLocaleString('ko-KR')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time" size={18} color={Colors.textSecondary} />
          <Text style={styles.infoText}>{booking.duration_hours}시간 돌봄</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="card" size={18} color={Colors.textSecondary} />
          <Text style={styles.infoText}>{(booking.hourly_rate * booking.duration_hours).toLocaleString()}원</Text>
        </View>
        {booking.care_address && (
          <View style={styles.infoRow}>
            <Ionicons name="location" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{booking.care_address}</Text>
          </View>
        )}
      </View>

      {/* Caregiver Info */}
      {booking.caregiver_id && (
        <Pressable
          style={styles.caregiverCard}
          onPress={() => navigation.navigate('CaregiverProfile', { caregiverId: booking.caregiver_id })}
        >
          <Ionicons name="person-circle" size={40} color={Colors.primary} />
          <View style={styles.caregiverInfo}>
            <Text style={styles.caregiverLabel}>담당 돌봄자</Text>
            <Text style={styles.caregiverAction}>프로필 보기</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textDisabled} />
        </Pressable>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {canTrack && (
          <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('SessionMonitor', { sessionId: booking.id })}>
            <Ionicons name="eye" size={20} color={Colors.textInverse} />
            <Text style={styles.actionText}>돌봄 모니터링</Text>
          </Pressable>
        )}
        {canHandover && (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: Colors.success }]}
            onPress={() => navigation.navigate('Handover', { sessionId: booking.id, bookingId: booking.id })}
          >
            <Ionicons name="hand-left" size={20} color={Colors.textInverse} />
            <Text style={styles.actionText}>인수 확인</Text>
          </Pressable>
        )}
        {canReview && (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: Colors.accent }]}
            onPress={() => navigation.navigate('Review', { bookingId: booking.id })}
          >
            <Ionicons name="star" size={20} color={Colors.textInverse} />
            <Text style={styles.actionText}>리뷰 작성</Text>
          </Pressable>
        )}
        {canCancel && (
          <Pressable style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelText}>예약 취소</Text>
          </Pressable>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  empty: { textAlign: 'center', marginTop: 100, color: Colors.textDisabled },
  card: { marginHorizontal: Spacing.base, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadows.sm },
  statusRow: { marginBottom: Spacing.md },
  statusLabel: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.primary },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  infoText: { fontSize: Typography.sizes.base, color: Colors.textPrimary },
  caregiverCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.base, marginTop: Spacing.md,
    padding: Spacing.base, backgroundColor: Colors.surface, borderRadius: Radius.lg, ...Shadows.sm, gap: Spacing.md,
  },
  caregiverInfo: { flex: 1 },
  caregiverLabel: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  caregiverAction: { fontSize: Typography.sizes.sm, color: Colors.primary, marginTop: 2 },
  actions: { paddingHorizontal: Spacing.base, marginTop: Spacing.xl, gap: Spacing.md },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingVertical: Spacing.base, borderRadius: Radius.lg,
  },
  actionText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
  cancelBtn: {
    alignItems: 'center', paddingVertical: Spacing.base, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.danger,
  },
  cancelText: { fontSize: Typography.sizes.base, color: Colors.danger, fontWeight: Typography.weights.medium },
});
