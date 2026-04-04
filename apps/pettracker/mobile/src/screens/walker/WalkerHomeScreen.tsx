import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { listBookings, type Booking } from '../../api/bookings';
import { getWallet, type Wallet } from '../../api/wallet';

export default function WalkerHomeScreen() {
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [bookings, walletData] = await Promise.all([
        listBookings('confirmed'),
        getWallet(),
      ]);
      setTodayBookings(bookings.slice(0, 5));
      setWallet(walletData);
    } catch {}
  };

  useEffect(() => { loadData(); }, []);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>오늘의 산책 🐕</Text>
      </View>

      {/* Earnings Card */}
      <View style={styles.earningsCard}>
        <Text style={styles.earningsLabel}>현재 잔액</Text>
        <Text style={styles.earningsAmount}>
          {wallet ? `${wallet.balance.toLocaleString()}원` : '-'}
        </Text>
      </View>

      {/* Today's Bookings */}
      <Text style={styles.sectionTitle}>예정된 예약</Text>
      {todayBookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="sunny-outline" size={40} color={Colors.textDisabled} />
          <Text style={styles.emptyText}>예정된 산책이 없어요</Text>
        </View>
      ) : (
        todayBookings.map((b) => (
          <View key={b.id} style={styles.bookingCard}>
            <View style={styles.timeBox}>
              <Text style={styles.timeText}>
                {new Date(b.scheduled_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.bookingInfo}>
              <Text style={styles.bookingDuration}>{b.duration_minutes}분 산책</Text>
              <Text style={styles.bookingPrice}>{b.price.toLocaleString()}원</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: Colors.infoLight }]}>
              <Text style={[styles.statusText, { color: Colors.info }]}>확정</Text>
            </View>
          </View>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.xl, paddingTop: 60 },
  greeting: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  earningsCard: {
    marginHorizontal: Spacing.base, padding: Spacing.xl, backgroundColor: Colors.accent,
    borderRadius: Radius.lg, ...Shadows.md,
  },
  earningsLabel: { fontSize: Typography.sizes.sm, color: 'rgba(255,255,255,0.8)' },
  earningsAmount: { fontSize: Typography.sizes.display, fontWeight: Typography.weights.extrabold, color: '#fff', marginTop: 4 },
  sectionTitle: {
    fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary,
    paddingHorizontal: Spacing.base, marginTop: Spacing.xl, marginBottom: Spacing.md,
  },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: Typography.sizes.base, color: Colors.textDisabled, marginTop: Spacing.sm },
  bookingCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.base,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base,
    marginBottom: Spacing.sm, ...Shadows.sm,
  },
  timeBox: {
    width: 60, height: 48, backgroundColor: Colors.primaryLight, borderRadius: Radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  timeText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.primary },
  bookingInfo: { flex: 1, marginLeft: Spacing.md },
  bookingDuration: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
  bookingPrice: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm },
  statusText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
});
