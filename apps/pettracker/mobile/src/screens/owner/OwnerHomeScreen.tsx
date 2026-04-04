import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { listPets, type Pet } from '../../api/pets';
import { listBookings, type Booking } from '../../api/bookings';

export default function OwnerHomeScreen({ navigation }: any) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [petsData, bookingsData] = await Promise.all([
        listPets(),
        listBookings('confirmed'),
      ]);
      setPets(petsData);
      setNextBooking(bookingsData[0] || null);
    } catch {}
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>안녕하세요! 🐾</Text>
        <Text style={styles.subtitle}>오늘도 반려동물과 행복한 하루 보내세요</Text>
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
            {nextBooking.duration_minutes}분 산책 · {nextBooking.price.toLocaleString()}원
          </Text>
        </Pressable>
      )}

      {/* Pet Cards */}
      <Text style={styles.sectionTitle}>내 반려동물</Text>
      {pets.length === 0 ? (
        <Pressable style={styles.emptyCard} onPress={() => navigation.navigate('Search')}>
          <Ionicons name="add-circle-outline" size={40} color={Colors.textDisabled} />
          <Text style={styles.emptyText}>반려동물을 등록해 주세요</Text>
        </Pressable>
      ) : (
        pets.map((pet) => (
          <View key={pet.id} style={styles.petCard}>
            <View style={styles.petIcon}>
              <Text style={{ fontSize: 28 }}>{pet.species === 'dog' ? '🐕' : '🐈'}</Text>
            </View>
            <View style={styles.petInfo}>
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petBreed}>{pet.breed || pet.species}</Text>
              {pet.weight_kg && <Text style={styles.petDetail}>{pet.weight_kg}kg</Text>}
            </View>
          </View>
        ))
      )}

      {/* Quick Action */}
      <Pressable
        style={styles.quickAction}
        onPress={() => navigation.navigate('Search')}
      >
        <Ionicons name="walk" size={24} color={Colors.textInverse} />
        <Text style={styles.quickActionText}>산책 예약하기</Text>
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
  petCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.base,
    padding: Spacing.base, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    marginBottom: Spacing.sm, ...Shadows.sm,
  },
  petIcon: { width: 56, height: 56, borderRadius: Radius.lg, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  petInfo: { marginLeft: Spacing.md, flex: 1 },
  petName: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  petBreed: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 2 },
  petDetail: { fontSize: Typography.sizes.xs, color: Colors.textDisabled, marginTop: 2 },
  quickAction: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: Spacing.base, marginTop: Spacing.xl, padding: Spacing.base,
    backgroundColor: Colors.primary, borderRadius: Radius.lg, ...Shadows.md,
  },
  quickActionText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse, marginLeft: Spacing.sm },
});
