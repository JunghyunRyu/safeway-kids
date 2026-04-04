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

export default function ChildRegistrationScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('오류', '이름을 입력해 주세요'); return; }
    if (!birthDate.trim()) { Alert.alert('오류', '생년월일을 입력해 주세요'); return; }
    if (!ageGroup) { Alert.alert('오류', '연령대를 선택해 주세요'); return; }
    setLoading(true);
    try {
      await createChild({
        name: name.trim(),
        birth_date: birthDate.trim(),
        age_group: ageGroup,
        allergies: allergies || undefined,
        medical_notes: medicalNotes || undefined,
        emergency_contact: emergencyContact || undefined,
        school_name: schoolName || undefined,
      });
      Alert.alert('등록 완료', `${name}이(가) 등록되었습니다!`);
      navigation.goBack();
    } catch { Alert.alert('오류', '등록에 실패했습니다'); }
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
      <TextInput style={styles.input} value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textDisabled} />

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
  input: {
    marginHorizontal: Spacing.base, backgroundColor: Colors.surface, borderRadius: Radius.md,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, fontSize: Typography.sizes.base,
    color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.borderLight,
  },
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
