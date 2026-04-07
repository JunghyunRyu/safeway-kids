import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { listBookings, acceptBooking, declineBooking, type CcBooking } from '../../api/bookings';

export default function BookingRequestScreen({ navigation }: any) {
  const [requests, setRequests] = useState<CcBooking[]>([]);
  const load = async () => {
    try {
      setRequests(await listBookings('pending'));
    } catch {
      Alert.alert('오류', '데이터를 불러올 수 없습니다');
    }
  };
  useEffect(() => { load(); }, []);

  const handleAccept = async (id: string) => {
    Alert.alert('예약 수락', '이 예약을 수락하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '수락',
        onPress: async () => {
          try {
            await acceptBooking(id);
            await load();
            Alert.alert('수락됨', '예약을 수락했습니다');
          } catch {
            Alert.alert('오류', '예약 수락에 실패했습니다');
          }
        },
      },
    ]);
  };

  const handleDecline = (id: string) => {
    Alert.alert('예약 거절', '이 예약을 거절하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '거절', style: 'destructive',
        onPress: async () => {
          try {
            await declineBooking(id);
            setRequests((prev) => prev.filter((r) => r.id !== id));
            Alert.alert('거절됨', '예약을 거절했습니다');
          } catch {
            Alert.alert('오류', '예약 거절에 실패했습니다');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>매칭 요청</Text></View>
      <FlatList
        data={requests} keyExtractor={i => i.id}
        contentContainerStyle={{ padding: Spacing.base }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardDate}>{new Date(item.scheduled_at).toLocaleString('ko-KR')}</Text>
              <Text style={styles.cardType}>{item.duration_hours}시간 방문돌봄</Text>
            </View>
            <Text style={styles.cardPrice}>{(item.hourly_rate * item.duration_hours).toLocaleString()}원</Text>
            {item.care_address && <Text style={styles.cardAddr}>{item.care_address}</Text>}
            <View style={styles.actions}>
              <Pressable style={styles.acceptBtn} onPress={() => handleAccept(item.id)}>
                <Text style={styles.acceptText}>수락</Text>
              </Pressable>
              <Pressable style={styles.declineBtn} onPress={() => handleDecline(item.id)}>
                <Text style={styles.declineText}>거절</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}><Ionicons name="mail-outline" size={48} color={Colors.textDisabled} /><Text style={styles.emptyText}>대기 중인 요청이 없어요</Text></View>
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.md, ...Shadows.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardDate: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
  cardType: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  cardPrice: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.primary, marginBottom: 4 },
  cardAddr: { fontSize: Typography.sizes.sm, color: Colors.textDisabled, marginBottom: Spacing.md },
  actions: { flexDirection: 'row', gap: Spacing.md },
  acceptBtn: { flex: 1, backgroundColor: Colors.primary, paddingVertical: Spacing.sm, borderRadius: Radius.md, alignItems: 'center' },
  acceptText: { color: '#fff', fontWeight: Typography.weights.bold, fontSize: Typography.sizes.base },
  declineBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, paddingVertical: Spacing.sm, borderRadius: Radius.md, alignItems: 'center' },
  declineText: { color: Colors.textSecondary, fontWeight: Typography.weights.medium, fontSize: Typography.sizes.base },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: Colors.textDisabled, marginTop: Spacing.md },
});
