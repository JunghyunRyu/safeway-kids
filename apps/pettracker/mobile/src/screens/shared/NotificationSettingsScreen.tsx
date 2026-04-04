import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';

interface NotifSetting {
  key: string;
  label: string;
  desc: string;
  enabled: boolean;
}

export default function NotificationSettingsScreen({ navigation }: any) {
  const [settings, setSettings] = useState<NotifSetting[]>([
    { key: 'booking_confirmed', label: '예약 확정', desc: '워커가 예약을 수락했을 때', enabled: true },
    { key: 'walk_start', label: '산책 시작', desc: '워커가 산책을 시작했을 때', enabled: true },
    { key: 'walk_photo', label: '산책 사진', desc: '워커가 사진을 보냈을 때', enabled: true },
    { key: 'walk_end', label: '산책 완료', desc: '산책이 완료되었을 때', enabled: true },
    { key: 'walker_arrival', label: '워커 도착', desc: '워커가 픽업 장소에 도착했을 때', enabled: true },
    { key: 'review_reminder', label: '리뷰 요청', desc: '산책 완료 후 리뷰 작성 알림', enabled: false },
    { key: 'promotion', label: '프로모션', desc: '할인 및 이벤트 안내', enabled: false },
  ]);

  const toggle = (key: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, enabled: !s.enabled } : s))
    );
    // TODO: API call to update notification preferences
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>알림 설정</Text>
      </View>

      <View style={styles.card}>
        {settings.map((s, idx) => (
          <View key={s.key} style={[styles.row, idx > 0 && styles.rowBorder]}>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>{s.label}</Text>
              <Text style={styles.rowDesc}>{s.desc}</Text>
            </View>
            <Switch
              value={s.enabled}
              onValueChange={() => toggle(s.key)}
              trackColor={{ false: Colors.borderLight, true: Colors.primaryLight }}
              thumbColor={s.enabled ? Colors.primary : Colors.neutral}
            />
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
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.borderLight },
  rowContent: { flex: 1, marginRight: Spacing.md },
  rowLabel: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
  rowDesc: { fontSize: Typography.sizes.xs, color: Colors.textDisabled, marginTop: 2 },
});
