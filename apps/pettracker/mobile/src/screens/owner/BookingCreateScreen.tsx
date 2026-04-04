import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { listPets, type Pet } from '../../api/pets';
import { createBooking } from '../../api/bookings';

const DURATIONS = [
  { minutes: 30, label: '30분', price: 15000 },
  { minutes: 60, label: '60분', price: 25000 },
];

export default function BookingCreateScreen({ route, navigation }: any) {
  const walkerId = route?.params?.walkerId;
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [duration, setDuration] = useState(DURATIONS[0]);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { listPets().then(setPets).catch(() => {}); }, []);

  const handleBook = async () => {
    if (!selectedPet) { Alert.alert('오류', '반려동물을 선택해 주세요'); return; }
    setLoading(true);
    try {
      await createBooking({
        pet_id: selectedPet,
        duration_minutes: duration.minutes,
        scheduled_at: new Date(Date.now() + 3600000).toISOString(), // 1시간 후 기본
        pickup_latitude: 37.5665,
        pickup_longitude: 126.978,
        pickup_address: address || '서울',
        price: duration.price,
      });
      Alert.alert('예약 완료', '산책 예약이 생성되었습니다!', [
        { text: '확인', onPress: () => navigation.navigate('Bookings') },
      ]);
    } catch { Alert.alert('오류', '예약에 실패했습니다'); }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>산책 예약</Text>
      </View>

      {/* Pet Selection */}
      <Text style={styles.label}>반려동물 선택</Text>
      {pets.map((pet) => (
        <Pressable
          key={pet.id}
          style={[styles.optionCard, selectedPet === pet.id && styles.optionSelected]}
          onPress={() => setSelectedPet(pet.id)}
        >
          <Text style={styles.optionEmoji}>{pet.species === 'dog' ? '🐕' : '🐈'}</Text>
          <Text style={styles.optionLabel}>{pet.name}</Text>
          {selectedPet === pet.id && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
        </Pressable>
      ))}

      {/* Duration Selection */}
      <Text style={styles.label}>산책 시간</Text>
      <View style={styles.durationRow}>
        {DURATIONS.map((d) => (
          <Pressable
            key={d.minutes}
            style={[styles.durationBtn, duration.minutes === d.minutes && styles.durationBtnActive]}
            onPress={() => setDuration(d)}
          >
            <Text style={[styles.durationText, duration.minutes === d.minutes && styles.durationTextActive]}>{d.label}</Text>
            <Text style={[styles.priceText, duration.minutes === d.minutes && styles.durationTextActive]}>{d.price.toLocaleString()}원</Text>
          </Pressable>
        ))}
      </View>

      {/* Address */}
      <Text style={styles.label}>픽업 주소</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="주소를 입력하세요"
        placeholderTextColor={Colors.textDisabled}
      />

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>산책 시간</Text>
          <Text style={styles.summaryValue}>{duration.label}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>결제 금액</Text>
          <Text style={styles.summaryPrice}>{duration.price.toLocaleString()}원</Text>
        </View>
        <Text style={styles.escrowNote}>서비스 완료 후 결제가 확정됩니다 (에스크로)</Text>
      </View>

      <Pressable style={styles.bookBtn} onPress={handleBook} disabled={loading}>
        <Text style={styles.bookBtnText}>{loading ? '예약 중...' : '예약하기'}</Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  label: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, paddingHorizontal: Spacing.base, marginTop: Spacing.lg, marginBottom: 8 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.base, padding: Spacing.base,
    backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.borderLight, marginBottom: 8, gap: Spacing.md,
  },
  optionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  optionEmoji: { fontSize: 24 },
  optionLabel: { flex: 1, fontSize: Typography.sizes.md, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
  durationRow: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.base },
  durationBtn: { flex: 1, padding: Spacing.base, backgroundColor: Colors.surface, borderRadius: Radius.md, alignItems: 'center', borderWidth: 2, borderColor: Colors.borderLight },
  durationBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  durationText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textSecondary },
  durationTextActive: { color: Colors.primary },
  priceText: { fontSize: Typography.sizes.sm, color: Colors.textDisabled, marginTop: 4 },
  input: {
    marginHorizontal: Spacing.base, backgroundColor: Colors.surface, borderRadius: Radius.md,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, fontSize: Typography.sizes.base,
    color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.borderLight,
  },
  summary: { marginHorizontal: Spacing.base, marginTop: Spacing.xxl, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: Typography.sizes.base, color: Colors.textSecondary },
  summaryValue: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
  summaryPrice: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.primary },
  escrowNote: { fontSize: Typography.sizes.xs, color: Colors.textDisabled, marginTop: 8, textAlign: 'center' },
  bookBtn: { marginHorizontal: Spacing.base, marginTop: Spacing.xl, backgroundColor: Colors.primary, paddingVertical: Spacing.base, borderRadius: Radius.lg, alignItems: 'center' },
  bookBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
});
