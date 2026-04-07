import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { createChild } from '../../api/children';

const AGE_GROUPS = [
  { value: 'infant', label: '영아', desc: '0~1세' },
  { value: 'toddler', label: '유아', desc: '2~3세' },
  { value: 'preschool', label: '미취학', desc: '4~6세' },
  { value: 'school_age', label: '학령기', desc: '7세~' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 15 }, (_, i) => currentYear - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function ChildRegistrationScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [birthMonth, setBirthMonth] = useState<number | null>(null);
  const [birthDay, setBirthDay] = useState<number | null>(null);
  const [ageGroup, setAgeGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);

  const birthDate = birthYear && birthMonth && birthDay
    ? `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`
    : '';

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('오류', '이름을 입력해 주세요'); return; }
    if (!birthDate) { Alert.alert('오류', '생년월일을 선택해 주세요'); return; }
    if (!ageGroup) { Alert.alert('오류', '연령대를 선택해 주세요'); return; }
    setLoading(true);
    try {
      await createChild({
        name: name.trim(),
        birth_date: birthDate,
        age_group: ageGroup,
        allergies: allergies || undefined,
        medical_notes: medicalNotes || undefined,
        emergency_contact: emergencyContact || undefined,
        school_name: schoolName || undefined,
      });
      Alert.alert('등록 완료', `${name}이(가) 등록되었습니다!`);
      navigation.goBack();
    } catch {
      Alert.alert('오류', '등록에 실패했습니다');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>아이 등록</Text>
      </View>

      <Text style={styles.label}>이름 *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="아이 이름" placeholderTextColor={Colors.textDisabled} />

      <Text style={styles.label}>생년월일 *</Text>
      {/* Year selector */}
      <Text style={styles.subLabel}>연도</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll} contentContainerStyle={styles.pickerRow}>
        {YEARS.map((y) => (
          <Pressable key={y} style={[styles.pickerBtn, birthYear === y && styles.pickerBtnActive]} onPress={() => setBirthYear(y)}>
            <Text style={[styles.pickerBtnText, birthYear === y && styles.pickerBtnTextActive]}>{y}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {/* Month selector */}
      <Text style={styles.subLabel}>월</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll} contentContainerStyle={styles.pickerRow}>
        {MONTHS.map((m) => (
          <Pressable key={m} style={[styles.pickerBtn, birthMonth === m && styles.pickerBtnActive]} onPress={() => setBirthMonth(m)}>
            <Text style={[styles.pickerBtnText, birthMonth === m && styles.pickerBtnTextActive]}>{m}월</Text>
          </Pressable>
        ))}
      </ScrollView>
      {/* Day selector */}
      <Text style={styles.subLabel}>일</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll} contentContainerStyle={styles.pickerRow}>
        {DAYS.map((d) => (
          <Pressable key={d} style={[styles.pickerBtn, birthDay === d && styles.pickerBtnActive]} onPress={() => setBirthDay(d)}>
            <Text style={[styles.pickerBtnText, birthDay === d && styles.pickerBtnTextActive]}>{d}일</Text>
          </Pressable>
        ))}
      </ScrollView>
      {birthDate ? (
        <Text style={styles.birthDatePreview}>선택된 생년월일: {birthDate}</Text>
      ) : null}

      {/* Age Group Selector */}
      <Text style={styles.label}>연령대 *</Text>
      <View style={styles.ageGroupRow}>
        {AGE_GROUPS.map((ag) => (
          <Pressable
            key={ag.value}
            style={[styles.ageGroupBtn, ageGroup === ag.value && styles.ageGroupBtnActive]}
            onPress={() => setAgeGroup(ag.value)}
          >
            <Text style={[styles.ageGroupLabel, ageGroup === ag.value && styles.ageGroupLabelActive]}>{ag.label}</Text>
            <Text style={[styles.ageGroupDesc, ageGroup === ag.value && { color: Colors.primary }]}>{ag.desc}</Text>
          </Pressable>
        ))}
      </View>

      {/* Allergies - red warning border */}
      <Text style={styles.label}>
        <Ionicons name="alert-circle" size={14} color={Colors.danger} /> 알레르기 (필수 확인)
      </Text>
      <TextInput
        style={[styles.input, styles.allergyInput]}
        value={allergies}
        onChangeText={setAllergies}
        placeholder="식품 알레르기, 약물 알레르기 등"
        placeholderTextColor={Colors.textDisabled}
        multiline
      />
      <Text style={styles.allergyHint}>알레르기 정보는 돌봄자에게 필수로 전달됩니다</Text>

      <Text style={styles.label}>의료 정보</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={medicalNotes}
        onChangeText={setMedicalNotes}
        placeholder="지병, 복용 중인 약 등"
        multiline
        numberOfLines={3}
        placeholderTextColor={Colors.textDisabled}
      />

      <Text style={styles.label}>비상연락처</Text>
      <TextInput
        style={styles.input}
        value={emergencyContact}
        onChangeText={setEmergencyContact}
        placeholder="010-XXXX-XXXX"
        keyboardType="phone-pad"
        placeholderTextColor={Colors.textDisabled}
      />

      <Text style={styles.label}>어린이집/학교</Text>
      <TextInput
        style={styles.input}
        value={schoolName}
        onChangeText={setSchoolName}
        placeholder="재원 중인 어린이집 또는 학교"
        placeholderTextColor={Colors.textDisabled}
      />

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
  label: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, paddingHorizontal: Spacing.base, marginTop: Spacing.md, marginBottom: 6 },
  subLabel: { fontSize: Typography.sizes.xs, color: Colors.textDisabled, paddingHorizontal: Spacing.base, marginTop: 6, marginBottom: 4 },
  input: {
    marginHorizontal: Spacing.base, backgroundColor: Colors.surface, borderRadius: Radius.md,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, fontSize: Typography.sizes.base,
    color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.borderLight,
  },
  pickerScroll: { marginHorizontal: Spacing.base },
  pickerRow: { gap: 6, paddingVertical: 4 },
  pickerBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.borderLight,
  },
  pickerBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  pickerBtnText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.textSecondary },
  pickerBtnTextActive: { color: Colors.primary, fontWeight: Typography.weights.bold },
  birthDatePreview: { fontSize: Typography.sizes.sm, color: Colors.primary, fontWeight: Typography.weights.medium, paddingHorizontal: Spacing.base, marginTop: 8 },
  allergyInput: { borderColor: Colors.danger, borderWidth: 2, backgroundColor: Colors.dangerLight },
  allergyHint: { fontSize: Typography.sizes.xs, color: Colors.danger, paddingHorizontal: Spacing.base, marginTop: 4 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  ageGroupRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.base, flexWrap: 'wrap' },
  ageGroupBtn: {
    flex: 1, minWidth: 70, alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.borderLight,
  },
  ageGroupBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  ageGroupLabel: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textSecondary },
  ageGroupLabelActive: { color: Colors.primary },
  ageGroupDesc: { fontSize: Typography.sizes.xs, color: Colors.textDisabled, marginTop: 2 },
  submitBtn: { marginHorizontal: Spacing.base, marginTop: Spacing.xxl, backgroundColor: Colors.primary, paddingVertical: Spacing.base, borderRadius: Radius.lg, alignItems: 'center' },
  submitText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
});
