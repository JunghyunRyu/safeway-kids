import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { listBookings, type Booking } from '../../api/bookings';

const STATUS_LABELS: Record<string, string> = {
  pending: '대기 중', confirmed: '확정', in_progress: '산책 중', completed: '완료', cancelled: '취소',
};
const STATUS_ICONS: Record<string, string> = {
  pending: 'time', confirmed: 'checkmark-circle', in_progress: 'walk', completed: 'checkmark-done', cancelled: 'close-circle',
};
const STATUS_COLORS_MAP: Record<string, string> = {
  pending: Colors.warning, confirmed: Colors.info, in_progress: Colors.primary, completed: Colors.success, cancelled: Colors.neutral,
};

export default function BookingsScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try { setBookings(await listBookings()); } catch { Alert.alert('오류', '데이터를 불러올 수 없습니다'); }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const renderBooking = ({ item }: { item: Booking }) => (
    <Pressable style={styles.card} onPress={() => {}}>
      <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS_MAP[item.status] || Colors.neutral }]} />
      <View style={styles.cardContent}>
        <Text style={styles.cardDate}>{new Date(item.scheduled_at).toLocaleString('ko-KR')}</Text>
        <Text style={styles.cardDetail}>
          {item.duration_minutes}분 산책 · {item.price.toLocaleString()}원
        </Text>
        <View style={styles.statusRow}>
          <Ionicons name={(STATUS_ICONS[item.status] || 'ellipse') as any} size={14} color={STATUS_COLORS_MAP[item.status]} />
          <Text style={[styles.statusText, { color: STATUS_COLORS_MAP[item.status] }]}>
            {STATUS_LABELS[item.status] || item.status}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textDisabled} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>예약 목록</Text>
      </View>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
        contentContainerStyle={{ padding: Spacing.base }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={Colors.textDisabled} />
            <Text style={styles.emptyText}>아직 예약이 없어요</Text>
            <Pressable style={styles.emptyBtn} onPress={() => navigation.navigate('Search')}>
              <Text style={styles.emptyBtnText}>산책 예약하기</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadows.sm,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.md },
  cardContent: { flex: 1 },
  cardDate: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
  cardDetail: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  statusText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.medium },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: Typography.sizes.md, color: Colors.textDisabled, marginTop: Spacing.md },
  emptyBtn: { marginTop: Spacing.lg, backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.md },
  emptyBtnText: { color: Colors.textInverse, fontWeight: Typography.weights.bold, fontSize: Typography.sizes.base },
});
