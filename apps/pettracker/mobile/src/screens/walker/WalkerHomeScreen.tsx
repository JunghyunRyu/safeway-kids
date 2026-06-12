import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { listBookings, acceptBooking, declineBooking, type Booking } from '../../api/bookings';
import { getWallet, type Wallet } from '../../api/wallet';
import { getWalkerProfile } from '../../api/walkers';
import { getMe } from '@safeway/core-mobile/api/auth';

export default function WalkerHomeScreen() {
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [needsQualification, setNeedsQualification] = useState(false);

  const checkQualification = async () => {
    // 신규 가입 온보딩 배너 (FR-M6) — 실패 시 미신청으로 간주, 홈 로딩은 차단 안 함
    try {
      const me = await getMe();
      const profile = await getWalkerProfile(me.id);
      setNeedsQualification(profile.approval_status !== 'approved');
    } catch {
      setNeedsQualification(true);
    }
  };

  const loadData = async () => {
    try {
      const [confirmed, pending, walletData] = await Promise.all([
        listBookings('confirmed'),
        listBookings('pending'),
        getWallet(),
      ]);
      setTodayBookings(confirmed.slice(0, 5));
      setPendingBookings(pending);
      setWallet(walletData);
    } catch {
      Alert.alert('오류', '데이터를 불러올 수 없습니다');
    }
    void checkQualification();
  };

  useEffect(() => { loadData(); }, []);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleAccept = async (bookingId: string) => {
    try {
      await acceptBooking(bookingId);
      Alert.alert('수락 완료', '예약을 수락했습니다.');
      await loadData();
    } catch {
      Alert.alert('오류', '예약 수락에 실패했습니다');
    }
  };

  const handleDecline = async (bookingId: string) => {
    Alert.alert('예약 거절', '이 예약을 거절하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '거절',
        style: 'destructive',
        onPress: async () => {
          try {
            await declineBooking(bookingId);
            Alert.alert('거절 완료', '예약을 거절했습니다.');
            await loadData();
          } catch {
            Alert.alert('오류', '예약 거절에 실패했습니다');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>오늘의 산책 🐕</Text>
      </View>

      {needsQualification && (
        <View style={styles.qualBanner}>
          <Ionicons name="ribbon-outline" size={22} color={Colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.qualBannerTitle}>산책 도우미 자격을 신청해 주세요</Text>
            <Text style={styles.qualBannerDesc}>프로필 탭에서 경력·자격 서류를 제출하면 활동을 시작할 수 있어요</Text>
          </View>
        </View>
      )}

      {/* Earnings Card */}
      <View style={styles.earningsCard}>
        <Text style={styles.earningsLabel}>현재 잔액</Text>
        <Text style={styles.earningsAmount}>
          {wallet ? `${wallet.balance.toLocaleString()}원` : '-'}
        </Text>
      </View>

      {/* Pending Bookings */}
      {pendingBookings.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>대기 중인 요청</Text>
          {pendingBookings.map((b) => (
            <View key={b.id} style={styles.pendingCard}>
              <View style={styles.pendingInfo}>
                <Text style={styles.pendingPet}>
                  {b.pet_species === 'cat' ? '🐈' : '🐕'} {b.pet_name || '반려동물'}
                </Text>
                <Text style={styles.pendingTime}>
                  {new Date(b.scheduled_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {' · '}{b.duration_minutes}분
                </Text>
                <Text style={styles.pendingPrice}>{b.price.toLocaleString()}원</Text>
              </View>
              <View style={styles.pendingActions}>
                <Pressable style={styles.acceptBtn} onPress={() => handleAccept(b.id)}>
                  <Text style={styles.acceptBtnText}>수락</Text>
                </Pressable>
                <Pressable style={styles.declineBtn} onPress={() => handleDecline(b.id)}>
                  <Text style={styles.declineBtnText}>거절</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      )}

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
  qualBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.base, marginBottom: Spacing.md,
    backgroundColor: Colors.warningLight, borderRadius: Radius.lg,
    padding: Spacing.base, borderWidth: 1, borderColor: Colors.warning,
  },
  qualBannerTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  qualBannerDesc: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 2 },
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
  // Pending booking cards
  pendingCard: {
    marginHorizontal: Spacing.base, backgroundColor: Colors.warningLight, borderRadius: Radius.lg,
    padding: Spacing.base, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.warning,
  },
  pendingInfo: { marginBottom: Spacing.sm },
  pendingPet: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  pendingTime: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 2 },
  pendingPrice: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.accent, marginTop: 2 },
  pendingActions: { flexDirection: 'row', gap: Spacing.sm },
  acceptBtn: {
    flex: 1, backgroundColor: Colors.accent, paddingVertical: Spacing.sm,
    borderRadius: Radius.md, alignItems: 'center',
  },
  acceptBtnText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.textInverse },
  declineBtn: {
    flex: 1, backgroundColor: Colors.surface, paddingVertical: Spacing.sm,
    borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.danger,
  },
  declineBtnText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.danger },
  // Confirmed bookings
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
