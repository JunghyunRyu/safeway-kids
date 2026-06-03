import React, { useCallback, useState } from 'react';
import { View, Text, Image, StyleSheet, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { createPet, updatePet, type Pet } from '../../api/pets';
import { getMe } from '@safeway/core-mobile/api/auth';
import { useImageUpload } from '@safeway/core-mobile/hooks/useImageUpload';

export default function PetRegistrationScreen({ navigation, route }: any) {
  const editingPet: Pet | undefined = route?.params?.pet;
  const isEdit = !!editingPet;

  const [name, setName] = useState(editingPet?.name ?? '');
  const [species, setSpecies] = useState<'dog' | 'cat' | null>(
    editingPet ? (editingPet.species === 'cat' ? 'cat' : 'dog') : null,
  );
  const [breed, setBreed] = useState(editingPet?.breed ?? '');
  const [weightKg, setWeightKg] = useState(editingPet?.weight_kg ? String(editingPet.weight_kg) : '');
  const [medicalNotes, setMedicalNotes] = useState(editingPet?.medical_notes ?? '');
  const [temperaments, setTemperaments] = useState<string[]>(
    editingPet?.temperament ? editingPet.temperament.split(',').map((t) => t.trim()).filter(Boolean) : [],
  );
  const [specialNeeds, setSpecialNeeds] = useState(editingPet?.special_needs ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>((editingPet as any)?.photo_url ?? null);
  const [photoUrl, setPhotoUrl] = useState<string | null>((editingPet as any)?.photo_url ?? null);
  const [loading, setLoading] = useState(false);
  const { upload: uploadImage, uploading: photoUploading } = useImageUpload();

  const toggleTemperament = (t: string) =>
    setTemperaments((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const handlePhoto = useCallback(async () => {
    if (photoUploading) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPhotoUri(asset.uri);
    setPhotoUrl(null);
    try {
      const me = await getMe();
      const res = await uploadImage({
        fileUri: asset.uri,
        contentType: asset.mimeType ?? 'image/jpeg',
        entityType: 'pet_photo',
        userId: me.id,
      });
      setPhotoUrl(res.downloadUrl);
    } catch {
      Alert.alert('업로드 실패', '사진 업로드에 실패했습니다. 다시 시도해 주세요.');
    }
  }, [photoUploading, uploadImage]);

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('오류', '이름을 입력해 주세요'); return; }
    if (!species) { Alert.alert('오류', '강아지 또는 고양이를 선택해 주세요'); return; }
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        species,
        breed: breed || undefined,
        weight_kg: weightKg ? parseFloat(weightKg) : undefined,
        medical_notes: medicalNotes || undefined,
        temperament: temperaments.length ? temperaments.join(', ') : undefined,
        special_needs: specialNeeds || undefined,
        photo_url: photoUrl || undefined,
      };
      if (isEdit && editingPet) {
        await updatePet(editingPet.id, payload);
        Alert.alert('수정 완료', `${name} 정보가 수정되었습니다.`);
      } else {
        await createPet(payload);
        Alert.alert('등록 완료', `${name}이(가) 등록되었습니다!`);
      }
      navigation.goBack();
    } catch { Alert.alert('오류', isEdit ? '수정에 실패했습니다' : '등록에 실패했습니다'); }
    setLoading(false);
  };

  const TEMPERAMENTS = ['차분', '활발', '겁많음', '주의필요'];

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="뒤로 가기" hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{isEdit ? '반려동물 수정' : '반려동물 등록'}</Text>
      </View>

      {/* 프로필 사진 (O-36) */}
      <Pressable style={styles.photoPicker} onPress={handlePhoto} accessibilityRole="button" accessibilityLabel="반려동물 사진 선택">
        {photoUri ? (
          <Image source={{ uri: photoUrl ?? photoUri }} style={styles.photoImg} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera" size={28} color={Colors.textDisabled} />
            <Text style={styles.photoHint}>사진 추가</Text>
          </View>
        )}
        {photoUploading && (
          <View style={styles.photoOverlay}><ActivityIndicator color="#fff" /></View>
        )}
      </Pressable>

      {/* Species selector — 초기엔 둘 다 정상 표시, 선택 후 비선택 항목만 흐리게 (O-20) */}
      <View style={styles.speciesRow}>
        <Pressable
          style={[styles.speciesBtn, species === 'dog' && styles.speciesBtnActive, species === 'cat' && styles.speciesBtnInactive]}
          onPress={() => setSpecies('dog')}
          accessibilityRole="button"
          accessibilityState={{ selected: species === 'dog' }}
          accessibilityLabel="강아지"
        >
          <Text style={styles.speciesEmoji}>🐕</Text>
          <Text style={[styles.speciesLabel, species === 'dog' && styles.speciesLabelActive]}>강아지</Text>
        </Pressable>
        <Pressable
          style={[styles.speciesBtn, species === 'cat' && styles.speciesBtnActive, species === 'dog' && styles.speciesBtnInactive]}
          onPress={() => setSpecies('cat')}
          accessibilityRole="button"
          accessibilityState={{ selected: species === 'cat' }}
          accessibilityLabel="고양이"
        >
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

      <Text style={styles.label}>성격 (여러 개 선택 가능)</Text>
      <View style={styles.tagRow}>
        {TEMPERAMENTS.map((t) => {
          const on = temperaments.includes(t);
          return (
            <Pressable
              key={t}
              style={[styles.tag, on && styles.tagActive]}
              onPress={() => toggleTemperament(t)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`성격 ${t}`}
            >
              <Text style={[styles.tagText, on && styles.tagTextActive]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>의료 정보 / 알레르기</Text>
      <TextInput style={[styles.input, styles.multiline]} value={medicalNotes} onChangeText={setMedicalNotes} placeholder="알레르기, 복용 중인 약 등" multiline numberOfLines={3} placeholderTextColor={Colors.textDisabled} />

      <Text style={styles.label}>특이사항</Text>
      <TextInput style={[styles.input, styles.multiline]} value={specialNeeds} onChangeText={setSpecialNeeds} placeholder="워커가 알아야 할 점" multiline numberOfLines={3} placeholderTextColor={Colors.textDisabled} />

      <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={loading} accessibilityRole="button" accessibilityLabel={isEdit ? '수정하기' : '등록하기'}>
        <Text style={styles.submitText}>{loading ? '저장 중...' : isEdit ? '수정하기' : '등록하기'}</Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  photoPicker: { alignSelf: 'center', marginBottom: Spacing.lg, width: 96, height: 96, borderRadius: 48, overflow: 'hidden' },
  photoImg: { width: 96, height: 96, borderRadius: 48 },
  photoPlaceholder: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.borderLight, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
  },
  photoHint: { fontSize: Typography.sizes.xs, color: Colors.textDisabled, marginTop: 2 },
  photoOverlay: {
    position: 'absolute', top: 0, left: 0, width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center',
  },
  speciesRow: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  speciesBtn: { flex: 1, alignItems: 'center', padding: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 2, borderColor: Colors.borderLight },
  speciesBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  speciesBtnInactive: { opacity: 0.6 },
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
