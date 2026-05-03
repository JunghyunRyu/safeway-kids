import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { listBookings, type Booking } from '../../api/bookings';

const STATUS_LABEL: Record<string, string> = {
  completed: '결제 완료',
  cancelled: '취소·환불',
  in_progress: '산책 중',
  confirmed: '결제 확정',
  pending: '결제 대기',
};

const STATUS_COLOR: Record<string, string> = {
  completed: Colors.success,
  cancelled: Colors.danger,
  in_progress: Colors.primary,
  confirmed: Colors.info,
  pending: Colors.warning,
};

export default function PaymentHistoryScreen({ navigation }: any) {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const all = await listBookings();
      const paid = all.filter((b) => ['completed', 'cancelled', 'in_progress', 'confirmed'].includes(b.status));
      paid.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
      setItems(paid);
    } catch {
      Alert.alert('오류', '결제 내역을 불러올 수 없습니다');
    }
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const totalPaid = items
    .filter((b) => b.status === 'completed' || b.status === 'in_progress' || b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.price ?? 0), 0);

  const renderItem = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.date}>{new Date(item.scheduled_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        <Text style={[styles.status, { color: STATUS_COLOR[item.status] ?? Colors.neutral }]}>
          {STATUS_LABEL[item.status] ?? item.status}
        </Text>
      </View>
      <Text style={styles.title}>{item.duration_minutes}분 산책</Text>
      <Text style={styles.amount}>
        {item.status === 'cancelled' ? '-' : ''}{(item.price ?? 0).toLocaleString()}원
      </Text>
    </View>
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
        keyExtractor={(item) => item.id}
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
});
