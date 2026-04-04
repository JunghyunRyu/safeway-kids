import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { listChildren, type Child } from '../../api/children';
import { listBookings, type CcBooking } from '../../api/bookings';

export default function ParentHomeScreen({ navigation }: any) {
  const [children, setChildren] = useState<Child[]>([]);
  const [nextBooking, setNextBooking] = useState<CcBooking | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [childrenData, bookingsData] = await Promise.all([
        listChildren(),
        listBookings('confirmed'),
      ]);
      setChildren(childrenData);
      setNextBooking(bookingsData[0] || null);
    } catch {}
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const AGE_GROUP_LABELS: Record<string, string> = {
    infant: '영아', toddler: '유아', preschool: '미취학', school_age: '학령기',
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>안녕하세요! 👶</Text>
        <Text style={styles.subtitle}>오늘도 안전한 돌봄을 시작하세요</Text>
      </View>

      {/* Next Booking Card */}
      {nextBooking && (
        <Pressable style={styles.bookingCard} onPress={() => navigation.navigate('Bookings')}>
          <View style={styles.bookingHeader}>
            <Ionicons name="calendar" size={20} color={Colors.primary} />
            <Text style={styles.bookingTitle}>다음 예약</Text>
          </View>
          <Text style={styles.bookingTime}>
            {new Date(nextBooking.scheduled_at).toLocaleString('ko-KR')}
          </Text>
          <Text style={styles.bookingDetail}>
            {nextBooking.duration_hours}시간 돌봄 · {(nextBooking.hourly_rate * nextBooking.duration_hours).toLocaleString()}원
          </Text>
        </Pressable>
      )}

      {/* Children Cards */}
      <Text style={styles.sectionTitle}>내 아이</Text>
      {children.length === 0 ? (
        <Pressable style={styles.emptyCard} onPress={() => navigation.navigate('ChildRegistration')}>
          <Ionicons name="add-circle-outline" size={40} color={Colors.textDisabled} />
          <Text style={styles.emptyText}>아이를 등록해 주세요</Text>
        </Pressable>
      ) : (
        children.map((child) => (
          <View key={child.id} style={styles.childCard}>
            <View style={styles.childIcon}>
              <Text style={{ fontSize: 28 }}>👶</Text>
            </View>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childAge}>{AGE_GROUP_LABELS[child.age_group] || child.age_group}</Text>
              {child.allergies && (
                <View style={styles.allergyRow}>
                  <Ionicons name="alert-circle" size={12} color={Colors.danger} />
                  <Text style={styles.allergyText}>알레르기: {child.allergies}</Text>
                </View>
              )}
            </View>
          </View>
        ))
      )}

      {/* Quick Action */}
      <Pressable
        style={styles.quickAction}
        onPress={() => navigation.navigate('Search')}
      >
        <Ionicons name="heart" size={24} color={Colors.textInverse} />
        <Text style={styles.quickActionText}>돌봄 예약하기</Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.xl, paddingTop: 60 },
  greeting: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sizes.base, color: Colors.textSecondary, marginTop: 4 },
  bookingCard: {
    marginHorizontal: Spacing.base, padding: Spacing.base, backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg, marginBottom: Spacing.base,
  },
  bookingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  bookingTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.primary, marginLeft: 8 },
  bookingTime: { fontSize: Typography.sizes.base, color: Colors.textPrimary, fontWeight: Typography.weights.medium },
  bookingDetail: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 4 },
  sectionTitle: {
    fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary,
    paddingHorizontal: Spacing.base, marginTop: Spacing.lg, marginBottom: Spacing.md,
  },
  emptyCard: {
    marginHorizontal: Spacing.base, padding: Spacing.xxl, backgroundColor: Colors.surface,
    borderRadius: Radius.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight, borderStyle: 'dashed',
  },
  emptyText: { fontSize: Typography.sizes.base, color: Colors.textDisabled, marginTop: Spacing.sm },
  childCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.base,
    padding: Spacing.base, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    marginBottom: Spacing.sm, ...Shadows.sm,
  },
  childIcon: { width: 56, height: 56, borderRadius: Radius.lg, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  childInfo: { marginLeft: Spacing.md, flex: 1 },
  childName: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  childAge: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 2 },
  allergyRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  allergyText: { fontSize: Typography.sizes.xs, color: Colors.danger },
  quickAction: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: Spacing.base, marginTop: Spacing.xl, padding: Spacing.base,
    backgroundColor: Colors.primary, borderRadius: Radius.lg, ...Shadows.md,
  },
  quickActionText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse, marginLeft: Spacing.sm },
});
