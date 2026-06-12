import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { preparePayment, confirmPayment } from '../../api/payments';

type Phase = 'ready' | 'processing' | 'success' | 'failed';

/**
 * 결제 화면 (FR-MP2) — 예약 생성 직후 modal 진입.
 * prepare → (PG 결제창 자리) → confirm. 사업자 계정 전이라 실 PG 결제창 대신
 * 백엔드 dev-mock 채널로 confirm한다. 실 채널 전환 시 confirm 직전에
 * PortOne SDK 호출만 끼워 넣으면 된다 (imp_uid를 SDK 결과로 교체).
 */
export default function PaymentScreen({ route, navigation }: any) {
  const { bookingId, amount, durationMinutes, petName } = route?.params ?? {};
  const [phase, setPhase] = useState<Phase>('ready');
  const [errorMsg, setErrorMsg] = useState('');

  const handlePay = async () => {
    setPhase('processing');
    try {
      const prep = await preparePayment(bookingId);
      // 실 PG 채널 전: dev-mock imp_uid (PortOne SDK 연동 시 SDK 결과로 교체)
      const impUid = `imp_dev_${prep.merchant_uid}`;
      const result = await confirmPayment(impUid, prep.merchant_uid);
      if (result.status === 'paid') {
        setPhase('success');
      } else {
        setErrorMsg(`결제 상태: ${result.status}`);
        setPhase('failed');
      }
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.detail ?? '결제 처리 중 오류가 발생했습니다');
      setPhase('failed');
    }
  };

  const goBookings = () => navigation.navigate('Bookings');

  if (phase === 'success') {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="checkmark-circle" size={72} color={Colors.success} />
        <Text style={styles.resultTitle}>결제가 완료되었습니다</Text>
        <Text style={styles.resultDesc}>
          {(amount ?? 0).toLocaleString()}원 · 산책사가 수락하면 알림을 보내드려요
        </Text>
        <Pressable style={styles.primaryBtn} onPress={goBookings}>
          <Text style={styles.primaryBtnText}>예약 목록으로</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'failed') {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="close-circle" size={72} color={Colors.danger} />
        <Text style={styles.resultTitle}>결제에 실패했습니다</Text>
        <Text style={styles.resultDesc}>{String(errorMsg)}</Text>
        <Pressable style={styles.primaryBtn} onPress={() => setPhase('ready')}>
          <Text style={styles.primaryBtnText}>다시 시도</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={goBookings}>
          <Text style={styles.secondaryBtnText}>나중에 결제하기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} accessibilityLabel="닫기">
          <Ionicons name="close" size={26} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>결제하기</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>
          {petName ? `${petName} · ` : ''}{durationMinutes ?? 30}분 산책
        </Text>
        <Text style={styles.summaryAmount}>{(amount ?? 0).toLocaleString()}원</Text>
      </View>

      <Text style={styles.sectionTitle}>결제 수단</Text>
      <View style={styles.methodCard}>
        <Ionicons name="card-outline" size={22} color={Colors.primary} />
        <Text style={styles.methodLabel}>신용/체크카드</Text>
        <View style={styles.testBadge}>
          <Text style={styles.testBadgeText}>테스트 결제</Text>
        </View>
      </View>

      <Text style={styles.escrowNote}>
        결제 금액은 안심 보관되며, 산책 완료 후 정산됩니다.{'\n'}취소 시 전액 환불됩니다.
      </Text>

      <View style={{ flex: 1 }} />

      <Pressable
        style={[styles.primaryBtn, phase === 'processing' && styles.primaryBtnDisabled]}
        onPress={handlePay}
        disabled={phase === 'processing'}
      >
        {phase === 'processing' ? (
          <ActivityIndicator color={Colors.textInverse} />
        ) : (
          <Text style={styles.primaryBtnText}>{(amount ?? 0).toLocaleString()}원 결제하기</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.base, paddingTop: 24 },
  center: { justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  headerTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  summaryCard: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadows.md,
  },
  summaryLabel: { fontSize: Typography.sizes.sm, color: Colors.textInverse, opacity: 0.9 },
  summaryAmount: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.textInverse, marginTop: 4 },
  sectionTitle: {
    fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary,
    marginTop: Spacing.xl, marginBottom: Spacing.sm,
  },
  methodCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base,
    borderWidth: 2, borderColor: Colors.primary, ...Shadows.sm,
  },
  methodLabel: { flex: 1, fontSize: Typography.sizes.base, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
  testBadge: { backgroundColor: Colors.warningLight, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  testBadgeText: { fontSize: Typography.sizes.xs, color: Colors.warning, fontWeight: Typography.weights.semibold },
  escrowNote: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: Spacing.md, lineHeight: 18 },
  primaryBtn: {
    backgroundColor: Colors.primary, paddingVertical: Spacing.base, borderRadius: Radius.lg,
    alignItems: 'center', marginTop: Spacing.md, alignSelf: 'stretch',
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
  secondaryBtn: { alignItems: 'center', paddingVertical: Spacing.md },
  secondaryBtnText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  resultTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginTop: Spacing.md },
  resultDesc: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
});
