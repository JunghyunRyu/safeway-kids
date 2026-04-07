import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { listPets, type Pet } from '../../api/pets';
import { createBooking } from '../../api/bookings';

const DURATIONS = [
  { minutes: 30, label: '30분', price: 15000 },
  { minutes: 60, label: '60분', price: 25000 },
];

const TIME_SLOTS = [
  { label: '오전 10시', hour: 10, minute: 0 },
  { label: '오후 2시', hour: 14, minute: 0 },
  { label: '오후 4시', hour: 16, minute: 0 },
  { label: '오후 6시', hour: 18, minute: 0 },
];

// 서울 시청 기본 좌표
const DEFAULT_LAT = 37.5665;
const DEFAULT_LNG = 126.978;

export default function BookingCreateScreen({ route, navigation }: any) {
  const walkerId = route?.params?.walkerId;
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [duration, setDuration] = useState(DURATIONS[0]);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  // 날짜 선택: 'today' | 'tomorrow'
  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today');
  // 시간대 선택
  const [selectedTime, setSelectedTime] = useState(TIME_SLOTS[0]);
  // GPS 좌표
  const [pickupLat, setPickupLat] = useState(DEFAULT_LAT);
  const [pickupLng, setPickupLng] = useState(DEFAULT_LNG);

  useEffect(() => {
    listPets().then(setPets).catch(() => { Alert.alert('오류', '반려동물 목록을 불러올 수 없습니다'); });
    // 실제 위치 가져오기
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setPickupLat(loc.coords.latitude);
        setPickupLng(loc.coords.longitude);
      } catch { /* 위치 가져오기 실패 시 기본 좌표 사용 */ }
    })();
  }, []);

  const getScheduledAt = (): string => {
    const now = new Date();
    const target = new Date(now);
    if (selectedDay === 'tomorrow') {
      target.setDate(target.getDate() + 1);
    }
    target.setHours(selectedTime.hour, selectedTime.minute, 0, 0);
    return target.toISOString();
  };

  const handleBook = async () => {
    if (!selectedPet) { Alert.alert('오류', '반려동물을 선택해 주세요'); return; }
    setLoading(true);
    try {
      await createBooking({
        pet_id: selectedPet,
        duration_minutes: duration.minutes,
        scheduled_at: getScheduledAt(),
        pickup_latitude: pickupLat,
        pickup_longitude: pickupLng,
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

      {/* Date Selection */}
      <Text style={styles.label}>날짜 선택</Text>
      <View style={styles.durationRow}>
        <Pressable
          style={[styles.durationBtn, selectedDay === 'today' && styles.durationBtnActive]}
          onPress={() => setSelectedDay('today')}
        >
          <Text style={[styles.durationText, selectedDay === 'today' && styles.durationTextActive]}>오늘</Text>
        </Pressable>
        <Pressable
          style={[styles.durationBtn, selectedDay === 'tomorrow' && styles.durationBtnActive]}
          onPress={() => setSelectedDay('tomorrow')}
        >
          <Text style={[styles.durationText, selectedDay === 'tomorrow' && styles.durationTextActive]}>내일</Text>
        </Pressable>
      </View>

      {/* Time Selection */}
      <Text style={styles.label}>시간대 선택</Text>
      <View style={styles.timeRow}>
        {TIME_SLOTS.map((slot) => (
          <Pressable
            key={slot.label}
            style={[styles.timeBtn, selectedTime.hour === slot.hour && styles.timeBtnActive]}
            onPress={() => setSelectedTime(slot)}
          >
            <Text style={[styles.timeText, selectedTime.hour === slot.hour && styles.timeTextActive]}>{slot.label}</Text>
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
          <Text style={styles.summaryLabel}>예약 일시</Text>
          <Text style={styles.summaryValue}>{selectedDay === 'today' ? '오늘' : '내일'} {selectedTime.label}</Text>
        </View>
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
  timeRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base, flexWrap: 'wrap' },
  timeBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.borderLight },
  timeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  timeText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.textSecondary },
  timeTextActive: { color: Colors.primary },
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
