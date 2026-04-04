import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { createPet } from '../../api/pets';

export default function PetRegistrationScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<'dog' | 'cat'>('dog');
  const [breed, setBreed] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [temperament, setTemperament] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('오류', '이름을 입력해 주세요'); return; }
    setLoading(true);
    try {
      await createPet({
        name: name.trim(),
        species,
        breed: breed || undefined,
        weight_kg: weightKg ? parseFloat(weightKg) : undefined,
        medical_notes: medicalNotes || undefined,
        temperament: temperament || undefined,
        special_needs: specialNeeds || undefined,
      });
      Alert.alert('등록 완료', `${name}이(가) 등록되었습니다!`);
      navigation.goBack();
    } catch { Alert.alert('오류', '등록에 실패했습니다'); }
    setLoading(false);
  };

  const TEMPERAMENTS = ['차분', '활발', '겁많음', '주의필요'];

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>반려동물 등록</Text>
      </View>

      {/* Species selector */}
      <View style={styles.speciesRow}>
        <Pressable style={[styles.speciesBtn, species === 'dog' && styles.speciesBtnActive]} onPress={() => setSpecies('dog')}>
          <Text style={styles.speciesEmoji}>🐕</Text>
          <Text style={[styles.speciesLabel, species === 'dog' && styles.speciesLabelActive]}>강아지</Text>
        </Pressable>
        <Pressable style={[styles.speciesBtn, species === 'cat' && styles.speciesBtnActive]} onPress={() => setSpecies('cat')}>
          <Text style={styles.speciesEmoji}>🐈</Text>
          <Text style={[styles.speciesLabel, species === 'cat' && styles.speciesLabelActive]}>고양이</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>이름 *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="반려동물 이름" placeholderTextColor={Colors.textDisabled} />

      <Text style={styles.label}>품종</Text>
      <TextInput style={styles.input} value={breed} onChangeText={setBreed} placeholder="예: 골든리트리버" placeholderTextColor={Colors.textDisabled} />

      <Text style={styles.label}>체중 (kg)</Text>
      <TextInput style={styles.input} value={weightKg} onChangeText={setWeightKg} placeholder="예: 12.5" keyboardType="decimal-pad" placeholderTextColor={Colors.textDisabled} />

      <Text style={styles.label}>성격</Text>
      <View style={styles.tagRow}>
        {TEMPERAMENTS.map((t) => (
          <Pressable key={t} style={[styles.tag, temperament === t && styles.tagActive]} onPress={() => setTemperament(t)}>
            <Text style={[styles.tagText, temperament === t && styles.tagTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>의료 정보 / 알레르기</Text>
      <TextInput style={[styles.input, styles.multiline]} value={medicalNotes} onChangeText={setMedicalNotes} placeholder="알레르기, 복용 중인 약 등" multiline numberOfLines={3} placeholderTextColor={Colors.textDisabled} />

      <Text style={styles.label}>특이사항</Text>
      <TextInput style={[styles.input, styles.multiline]} value={specialNeeds} onChangeText={setSpecialNeeds} placeholder="워커가 알아야 할 점" multiline numberOfLines={3} placeholderTextColor={Colors.textDisabled} />

      <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.submitText}>{loading ? '등록 중...' : '등록하기'}</Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  speciesRow: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  speciesBtn: { flex: 1, alignItems: 'center', padding: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 2, borderColor: Colors.borderLight },
  speciesBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  speciesEmoji: { fontSize: 32, marginBottom: 4 },
  speciesLabel: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.medium, color: Colors.textSecondary },
  speciesLabelActive: { color: Colors.primary },
  label: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, paddingHorizontal: Spacing.base, marginTop: Spacing.md, marginBottom: 6 },
  input: {
    marginHorizontal: Spacing.base, backgroundColor: Colors.surface, borderRadius: Radius.md,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, fontSize: Typography.sizes.base,
    color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.borderLight,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  tagRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.base, flexWrap: 'wrap' },
  tag: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight },
  tagActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tagText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  tagTextActive: { color: Colors.textInverse },
  submitBtn: { marginHorizontal: Spacing.base, marginTop: Spacing.xxl, backgroundColor: Colors.primary, paddingVertical: Spacing.base, borderRadius: Radius.lg, alignItems: 'center' },
  submitText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
});
