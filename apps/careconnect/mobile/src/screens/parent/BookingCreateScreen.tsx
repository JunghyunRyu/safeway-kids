import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { listChildren, type Child } from '../../api/children';
import { createBooking } from '../../api/bookings';

const DURATIONS = [
  { hours: 2, label: '2시간', price: 30000 },
  { hours: 4, label: '4시간', price: 60000 },
  { hours: 8, label: '8시간', price: 120000 },
];

const HOURLY_RATE = 15000;

export default function BookingCreateScreen({ route, navigation }: any) {
  const caregiverId = route?.params?.caregiverId;
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [duration, setDuration] = useState(DURATIONS[0]);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasConsent, setHasConsent] = useState(true); // In production, check from API

  useEffect(() => { listChildren().then(setChildren).catch(() => {}); }, []);

  const handleBook = async () => {
    if (!selectedChild) { Alert.alert('오류', '아이를 선택해 주세요'); return; }
    if (!hasConsent) {
      Alert.alert('동의 필요', '14세 미만 법정대리인 동의가 필요합니다', [
        { text: '동의하러 가기', onPress: () => navigation.navigate('Consent', { childId: selectedChild }) },
        { text: '취소', style: 'cancel' },
      ]);
      return;
    }
    setLoading(true);
    try {
      await createBooking({
        child_id: selectedChild,
        duration_hours: duration.hours,
        scheduled_at: new Date(Date.now() + 3600000).toISOString(),
        hourly_rate: HOURLY_RATE,
        care_latitude: 37.5665,
        care_longitude: 126.978,
        care_address: address || '서울',
      });
      Alert.alert('예약 완료', '돌봄 예약이 생성되었습니다!', [
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
        <Text style={styles.title}>돌봄 예약</Text>
      </View>

      {/* Consent Warning */}
      {!hasConsent && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={20} color={Colors.danger} />
          <Text style={styles.warningText}>14세 미만 동의 필요 - 예약 전 법정대리인 동의를 완료해 주세요</Text>
        </View>
      )}

      {/* Child Selection */}
      <Text style={styles.label}>아이 선택</Text>
      {children.map((child) => (
        <Pressable
          key={child.id}
          style={[styles.optionCard, selectedChild === child.id && styles.optionSelected]}
          onPress={() => setSelectedChild(child.id)}
        >
          <Text style={styles.optionEmoji}>👶</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionLabel}>{child.name}</Text>
            {child.allergies && (
              <Text style={styles.allergyNote}>알레르기: {child.allergies}</Text>
            )}
          </View>
          {selectedChild === child.id && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
        </Pressable>
      ))}

      {/* Duration Selection */}
      <Text style={styles.label}>돌봄 시간</Text>
      <View style={styles.durationRow}>
        {DURATIONS.map((d) => (
          <Pressable
            key={d.hours}
            style={[styles.durationBtn, duration.hours === d.hours && styles.durationBtnActive]}
            onPress={() => setDuration(d)}
          >
            <Text style={[styles.durationText, duration.hours === d.hours && styles.durationTextActive]}>{d.label}</Text>
            <Text style={[styles.priceText, duration.hours === d.hours && styles.durationTextActive]}>{d.price.toLocaleString()}원</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.rateNote}>시간당 {HOURLY_RATE.toLocaleString()}원</Text>

      {/* Address */}
      <Text style={styles.label}>돌봄 장소</Text>
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
          <Text style={styles.summaryLabel}>돌봄 시간</Text>
          <Text style={styles.summaryValue}>{duration.label}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>결제 금액</Text>
          <Text style={styles.summaryPrice}>{duration.price.toLocaleString()}원</Text>
        </View>
        <View style={styles.escrowBadge}>
          <Ionicons name="lock-closed" size={14} color={Colors.info} />
          <Text style={styles.escrowNote}>에스크로 결제 - 돌봄 완료 후 결제가 확정됩니다</Text>
        </View>
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
  warningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: Spacing.base,
    padding: Spacing.md, backgroundColor: Colors.dangerLight, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.danger, marginBottom: Spacing.md,
  },
  warningText: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.danger, fontWeight: Typography.weights.medium },
  label: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, paddingHorizontal: Spacing.base, marginTop: Spacing.lg, marginBottom: 8 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.base, padding: Spacing.base,
    backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.borderLight, marginBottom: 8, gap: Spacing.md,
  },
  optionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  optionEmoji: { fontSize: 24 },
  optionLabel: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
  allergyNote: { fontSize: Typography.sizes.xs, color: Colors.danger, marginTop: 2 },
  durationRow: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.base },
  durationBtn: { flex: 1, padding: Spacing.base, backgroundColor: Colors.surface, borderRadius: Radius.md, alignItems: 'center', borderWidth: 2, borderColor: Colors.borderLight },
  durationBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  durationText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textSecondary },
  durationTextActive: { color: Colors.primary },
  priceText: { fontSize: Typography.sizes.sm, color: Colors.textDisabled, marginTop: 4 },
  rateNote: { fontSize: Typography.sizes.xs, color: Colors.textDisabled, paddingHorizontal: Spacing.base, marginTop: 4 },
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
  escrowBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  escrowNote: { fontSize: Typography.sizes.xs, color: Colors.info, flex: 1 },
  bookBtn: { marginHorizontal: Spacing.base, marginTop: Spacing.xl, backgroundColor: Colors.primary, paddingVertical: Spacing.base, borderRadius: Radius.lg, alignItems: 'center' },
  bookBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
});
