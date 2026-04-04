import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';

export default function NotificationSettingsScreen({ navigation }: any) {
  const [settings, setSettings] = useState([
    { key: 'booking_confirmed', label: '예약 확정', desc: '돌봄자가 예약을 수락했을 때', enabled: true },
    { key: 'checkin', label: '체크인 알림', desc: '돌봄자가 도착했을 때', enabled: true },
    { key: 'activity', label: '활동 보고', desc: '돌봄 중 활동 보고가 올 때', enabled: true },
    { key: 'checkout', label: '체크아웃', desc: '돌봄이 완료되었을 때', enabled: true },
    { key: 'handover', label: '인수 요청', desc: '아이 인수를 확인해야 할 때', enabled: true },
    { key: 'no_report', label: '30분 무보고', desc: '30분간 활동 보고가 없을 때', enabled: true },
    { key: 'sos', label: 'SOS 긴급', desc: '긴급 상황 발생 시', enabled: true },
    { key: 'review', label: '리뷰 요청', desc: '돌봄 완료 후 리뷰 작성 알림', enabled: false },
  ]);
  const toggle = (key: string) => setSettings(p => p.map(s => s.key === key ? { ...s, enabled: !s.enabled } : s));
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={Colors.textPrimary} /></Pressable>
        <Text style={styles.title}>알림 설정</Text>
      </View>
      <View style={styles.card}>
        {settings.map((s, i) => (
          <View key={s.key} style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.borderLight }]}>
            <View style={{ flex: 1, marginRight: Spacing.md }}>
              <Text style={styles.label}>{s.label}</Text>
              <Text style={styles.desc}>{s.desc}</Text>
            </View>
            <Switch value={s.enabled} onValueChange={() => toggle(s.key)} trackColor={{ false: Colors.borderLight, true: Colors.primaryLight }} thumbColor={s.enabled ? Colors.primary : Colors.neutral} />
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  card: { marginHorizontal: Spacing.base, backgroundColor: Colors.surface, borderRadius: Radius.lg, ...Shadows.sm },
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  label: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
  desc: { fontSize: Typography.sizes.xs, color: Colors.textDisabled, marginTop: 2 },
});
