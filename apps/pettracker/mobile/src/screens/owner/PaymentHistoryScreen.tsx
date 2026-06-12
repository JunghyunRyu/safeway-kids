import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { listPayments, type PaymentItem } from '../../api/payments';

/**
 * 결제 내역 (FR-MP3) — pt_payments 실 데이터 기반.
 * (기존 구현은 bookings를 필터링한 유사 내역이었음 — 결제 의미론으로 교체)
 */

const STATUS_LABEL: Record<string, string> = {
  paid: '결제 완료',
  pending: '결제 대기',
  cancelled: '취소',
  refunded: '환불',
};

const STATUS_COLOR: Record<string, string> = {
  paid: Colors.success,
  pending: Colors.warning,
  cancelled: Colors.danger,
  refunded: Colors.info,
};

export default function PaymentHistoryScreen({ navigation }: any) {
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<PaymentItem | null>(null);

  const load = async () => {
    try {
      const data = await listPayments({ limit: 100 });
      setItems(data.items);
    } catch {
      Alert.alert('오류', '결제 내역을 불러올 수 없습니다');
    }
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const totalPaid = items
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const renderItem = ({ item }: { item: PaymentItem }) => (
    <Pressable style={styles.card} onPress={() => setSelected(item)}>
      <View style={styles.row}>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
        <Text style={[styles.status, { color: STATUS_COLOR[item.status] ?? Colors.neutral }]}>
          {STATUS_LABEL[item.status] ?? item.status}
        </Text>
      </View>
      <Text style={styles.title}>
        {item.pet_name ? `${item.pet_name} · ` : ''}{item.duration_minutes ?? 30}분 산책
      </Text>
      <Text style={styles.amount}>
        {item.status === 'cancelled' || item.status === 'refunded' ? '-' : ''}
        {item.amount.toLocaleString()}원
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>결제 내역</Text>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>총 결제 금액</Text>
        <Text style={styles.summaryAmount}>{totalPaid.toLocaleString()}원</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.payment_id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: Spacing.base }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Ionicons name="card-outline" size={48} color={Colors.textDisabled} />
              <Text style={styles.emptyText}>아직 결제 내역이 없어요</Text>
            </View>
          )
        }
      />

      {/* 영수증 상세 (FR-MP3) */}
      <Modal
        visible={selected !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.receipt}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptTitle}>영수증</Text>
              <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>
            {selected && (
              <>
                <ReceiptRow label="상태" value={STATUS_LABEL[selected.status] ?? selected.status} />
                <ReceiptRow label="금액" value={`${selected.amount.toLocaleString()}원`} />
                <ReceiptRow
                  label="산책"
                  value={`${selected.pet_name ? `${selected.pet_name} · ` : ''}${selected.duration_minutes ?? 30}분`}
                />
                {selected.scheduled_at && (
                  <ReceiptRow
                    label="예정 일시"
                    value={new Date(selected.scheduled_at).toLocaleString('ko-KR')}
                  />
                )}
                {selected.paid_at && (
                  <ReceiptRow label="결제 일시" value={new Date(selected.paid_at).toLocaleString('ko-KR')} />
                )}
                {selected.cancelled_at && (
                  <ReceiptRow label="취소 일시" value={new Date(selected.cancelled_at).toLocaleString('ko-KR')} />
                )}
                {selected.cancel_amount != null && (
                  <ReceiptRow label="환불 금액" value={`${selected.cancel_amount.toLocaleString()}원`} />
                )}
                {selected.cancel_reason && (
                  <ReceiptRow label="취소 사유" value={selected.cancel_reason} />
                )}
                <ReceiptRow label="주문번호" value={selected.merchant_uid} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.receiptRow}>
      <Text style={styles.receiptLabel}>{label}</Text>
      <Text style={styles.receiptValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  summary: {
    marginHorizontal: Spacing.base, marginBottom: Spacing.md,
    backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: Radius.lg, ...Shadows.md,
  },
  summaryLabel: { fontSize: Typography.sizes.sm, color: Colors.textInverse, opacity: 0.9 },
  summaryAmount: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.textInverse, marginTop: 4 },
  card: {
    backgroundColor: Colors.surface, padding: Spacing.base,
    borderRadius: Radius.lg, marginBottom: Spacing.sm, ...Shadows.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  status: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold },
  title: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.medium, color: Colors.textPrimary, marginTop: 4 },
  amount: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: Typography.sizes.md, color: Colors.textDisabled, marginTop: Spacing.md },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  receipt: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.xl, paddingBottom: 48,
  },
  receiptHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  receiptTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  receiptRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md,
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  receiptLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  receiptValue: { fontSize: Typography.sizes.sm, color: Colors.textPrimary, fontWeight: Typography.weights.medium, flexShrink: 1, textAlign: 'right' },
});
