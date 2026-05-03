import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { cancelBooking, type Booking } from '../../api/bookings';

const STATUS_LABELS: Record<string, string> = {
  pending: '대기 중', confirmed: '확정', in_progress: '산책 중', completed: '완료', cancelled: '취소',
};

export default function BookingDetailScreen({ route, navigation }: any) {
  const booking: Booking | undefined = route?.params?.booking;

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
          } catch { Alert.alert('오류', '예약 취소에 실패했습니다'); }
        },
      },
    ]);
  };

  const canCancel = !['completed', 'cancelled'].includes(booking.status);
  const canTrack = booking.status === 'in_progress';
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
          <Text style={styles.infoText}>{booking.duration_minutes}분 산책</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="card" size={18} color={Colors.textSecondary} />
          <Text style={styles.infoText}>{booking.price.toLocaleString()}원</Text>
        </View>
        {booking.pickup_address && (
          <View style={styles.infoRow}>
            <Ionicons name="location" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{booking.pickup_address}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {canTrack && (
          <Pressable
            style={styles.actionBtn}
            onPress={() => {
              const sid = (booking as any).session_id;
              if (!sid) {
                Alert.alert('알림', '활성 산책 세션을 찾을 수 없습니다');
                return;
              }
              navigation.navigate('LiveTrack', { sessionId: sid });
            }}
          >
            <Ionicons name="map" size={20} color={Colors.textInverse} />
            <Text style={styles.actionText}>실시간 추적</Text>
          </Pressable>
        )}
        {canReview && (
          <Pressable style={[styles.actionBtn, { backgroundColor: Colors.accent }]} onPress={() => navigation.navigate('Review', { bookingId: booking.id })}>
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
