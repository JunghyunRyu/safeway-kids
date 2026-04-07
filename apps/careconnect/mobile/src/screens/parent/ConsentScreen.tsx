import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { createConsent } from '../../api/children';

const CONSENT_ITEMS = [
  { key: 'gps_tracking', label: 'GPS 위치 확인', desc: '돌봄 시간 동안 아이가 어디에 있는지 부모님이 실시간으로 볼 수 있어요' },
  { key: 'photo_activity', label: '활동 사진 공유', desc: '돌봄자가 아이의 활동 사진을 찍어서 부모님께 보내드려요' },
  { key: 'personal_info', label: '아이 정보 제공', desc: '이름, 알레르기 등 돌봄에 꼭 필요한 정보를 돌봄자에게 전달해요' },
];

export default function ConsentScreen({ route, navigation }: any) {
  const { childId } = route?.params || {};
  const [consents, setConsents] = useState<Record<string, boolean>>({
    gps_tracking: false,
    photo_activity: false,
    personal_info: false,
  });
  const [loading, setLoading] = useState(false);

  const toggleConsent = (key: string) => {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(consents).every(Boolean);

  const toggleAll = () => {
    const newVal = !allChecked;
    setConsents({ gps_tracking: newVal, photo_activity: newVal, personal_info: newVal });
  };

  const handleSubmit = async () => {
    if (!allChecked) { Alert.alert('동의 필요', '모든 항목에 동의해 주세요'); return; }
    if (!childId) { Alert.alert('오류', '아이 정보가 없습니다'); return; }
    setLoading(true);
    try {
      await createConsent(childId, consents);
      Alert.alert('동의 완료', '법정대리인 동의가 완료되었습니다', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('오류', '동의 처리에 실패했습니다');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>보호자 동의</Text>
      </View>

      {/* Legal notice */}
      <View style={styles.noticeCard}>
        <Ionicons name="information-circle" size={24} color={Colors.info} />
        <View style={styles.noticeContent}>
          <Text style={styles.noticeTitle}>부모님/보호자 동의</Text>
          <Text style={styles.noticeText}>
            아이의 정보를 안전하게 보호하기 위해 부모님(또는 법적 보호자)의 동의가 필요합니다.
          </Text>
        </View>
      </View>

      {/* All consent toggle */}
      <Pressable style={styles.allToggle} onPress={toggleAll}>
        <Ionicons
          name={allChecked ? 'checkbox' : 'square-outline'}
          size={24}
          color={allChecked ? Colors.primary : Colors.textDisabled}
        />
        <Text style={styles.allToggleText}>모두 동의합니다</Text>
        <View style={styles.requiredBadge}>
          <Text style={styles.requiredText}>모두 필수</Text>
        </View>
      </Pressable>

      {/* Individual consent items */}
      {CONSENT_ITEMS.map((item) => (
        <Pressable key={item.key} style={styles.consentItem} onPress={() => toggleConsent(item.key)}>
          <Ionicons
            name={consents[item.key] ? 'checkbox' : 'square-outline'}
            size={22}
            color={consents[item.key] ? Colors.primary : Colors.textDisabled}
          />
          <View style={styles.consentContent}>
            <Text style={styles.consentLabel}>{item.label}</Text>
            <Text style={styles.consentDesc}>{item.desc}</Text>
          </View>
        </Pressable>
      ))}

      <Pressable
        style={[styles.submitBtn, !allChecked && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading || !allChecked}
      >
        <Text style={styles.submitText}>{loading ? '처리 중...' : '동의하고 계속하기'}</Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  noticeCard: {
    flexDirection: 'row', marginHorizontal: Spacing.base, padding: Spacing.base,
    backgroundColor: Colors.infoLight, borderRadius: Radius.lg, marginBottom: Spacing.xl, gap: Spacing.md,
  },
  noticeContent: { flex: 1 },
  noticeTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: 4 },
  noticeText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, lineHeight: 20 },
  allToggle: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.base,
    padding: Spacing.base, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    marginBottom: Spacing.md, gap: Spacing.md, ...Shadows.sm,
  },
  allToggleText: { flex: 1, fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  requiredBadge: { backgroundColor: Colors.danger, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  requiredText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.textInverse },
  consentItem: {
    flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: Spacing.base,
    padding: Spacing.base, backgroundColor: Colors.surface, borderRadius: Radius.md,
    marginBottom: 8, gap: Spacing.md,
  },
  consentContent: { flex: 1 },
  consentLabel: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  consentDesc: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 2 },
  submitBtn: { marginHorizontal: Spacing.base, marginTop: Spacing.xxl, backgroundColor: Colors.primary, paddingVertical: Spacing.base, borderRadius: Radius.lg, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: Colors.neutral, opacity: 0.5 },
  submitText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
});
