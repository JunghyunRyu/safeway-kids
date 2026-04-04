import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { addActivity } from '../../api/sessions';

const ACTIVITY_TYPES = [
  { type: 'homework', emoji: '📚', label: '숙제' },
  { type: 'play', emoji: '🏃', label: '놀이' },
  { type: 'meal', emoji: '🍽', label: '식사' },
  { type: 'snack', emoji: '🍎', label: '간식' },
  { type: 'nap', emoji: '😴', label: '낮잠' },
  { type: 'outdoor', emoji: '🌳', label: '외출' },
  { type: 'other', emoji: '📝', label: '기타' },
];

export default function ActivityLogScreen({ route, navigation }: any) {
  const { sessionId } = route?.params || {};
  const [selected, setSelected] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selected) { Alert.alert('오류', '활동 유형을 선택해 주세요'); return; }
    if (!sessionId) { Alert.alert('오류', '세션 정보가 없습니다'); return; }
    setLoading(true);
    try {
      await addActivity(sessionId, { activity_type: selected, description: description || undefined });
      Alert.alert('기록됨', '활동이 기록되었습니다', [{ text: '확인', onPress: () => navigation.goBack() }]);
    } catch { Alert.alert('오류', '활동 기록에 실패했습니다'); }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={Colors.textPrimary} /></Pressable>
        <Text style={styles.title}>활동 기록</Text>
      </View>
      <Text style={styles.label}>활동 유형</Text>
      <View style={styles.typeGrid}>
        {ACTIVITY_TYPES.map(t => (
          <Pressable key={t.type} style={[styles.typeBtn, selected === t.type && styles.typeBtnActive]} onPress={() => setSelected(t.type)}>
            <Text style={styles.typeEmoji}>{t.emoji}</Text>
            <Text style={[styles.typeLabel, selected === t.type && styles.typeLabelActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>설명 (선택)</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="활동 내용을 기록하세요" placeholderTextColor={Colors.textDisabled} multiline numberOfLines={3} />
      <Pressable style={[styles.submitBtn, !selected && { opacity: 0.5 }]} onPress={handleSubmit} disabled={loading || !selected}>
        <Text style={styles.submitText}>{loading ? '기록 중...' : '활동 기록하기'}</Text>
      </Pressable>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  label: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, paddingHorizontal: Spacing.base, marginTop: Spacing.lg, marginBottom: 8 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingHorizontal: Spacing.base },
  typeBtn: { width: '30%', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.borderLight },
  typeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  typeEmoji: { fontSize: 28, marginBottom: 4 },
  typeLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  typeLabelActive: { color: Colors.primary, fontWeight: Typography.weights.bold },
  input: { marginHorizontal: Spacing.base, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.base, fontSize: Typography.sizes.base, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.borderLight, minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { marginHorizontal: Spacing.base, marginTop: Spacing.xxl, backgroundColor: Colors.primary, paddingVertical: Spacing.base, borderRadius: Radius.lg, alignItems: 'center' },
  submitText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: '#fff' },
});
