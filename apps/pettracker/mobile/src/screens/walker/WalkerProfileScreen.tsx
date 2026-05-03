import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { getMe } from '@safeway/core-mobile/api/auth';
import { useImageUpload } from '@safeway/core-mobile/hooks/useImageUpload';

export default function WalkerProfileScreen() {
  const [name, setName] = useState('산책 도우미');
  const [userId, setUserId] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const { upload: uploadImage, uploading: photoUploading } = useImageUpload();

  useEffect(() => {
    getMe()
      .then((me) => {
        setName(me.name || '산책 도우미');
        setUserId(me.id);
      })
      .catch(() => {});
  }, []);

  const uploadPicked = useCallback(
    async (localUri: string, mimeType: string | undefined) => {
      if (!userId) {
        Alert.alert('오류', '사용자 정보를 불러오지 못했습니다');
        return;
      }
      try {
        const res = await uploadImage({
          fileUri: localUri,
          contentType: mimeType ?? 'image/jpeg',
          entityType: 'walker_profile',
          userId,
        });
        setPhotoUri(res.downloadUrl);
      } catch {
        Alert.alert('업로드 실패', '프로필 사진 업로드에 실패했습니다. 다시 시도해 주세요.');
      }
    },
    [userId, uploadImage],
  );

  const handlePhotoChange = () => {
    if (photoUploading) return;
    Alert.alert('프로필 사진', '사진 선택 방법', [
      { text: '카메라', onPress: async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('권한 필요', '카메라 권한이 필요합니다'); return; }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
        if (!result.canceled && result.assets[0]) {
          setPhotoUri(result.assets[0].uri);
          uploadPicked(result.assets[0].uri, result.assets[0].mimeType);
        }
      }},
      { text: '갤러리', onPress: async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
        if (!result.canceled && result.assets[0]) {
          setPhotoUri(result.assets[0].uri);
          uploadPicked(result.assets[0].uri, result.assets[0].mimeType);
        }
      }},
      { text: '취소', style: 'cancel' },
    ]);
  };

  const menuItems = [
    { icon: 'document-text' as const, label: '자격증/서류 관리', onPress: () => {} },
    { icon: 'star' as const, label: '내 리뷰 보기', onPress: () => {} },
    { icon: 'notifications' as const, label: '알림 설정', onPress: () => {} },
    { icon: 'shield-checkmark' as const, label: '개인정보 처리방침', onPress: () => {} },
    { icon: 'help-circle' as const, label: '고객센터', onPress: () => {} },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handlePhotoChange} style={styles.avatar}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="person-circle" size={80} color={Colors.accent} />
          )}
          {photoUploading && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </Pressable>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.role}>펫트래커 산책사</Text>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item, idx) => (
          <Pressable key={idx} style={styles.menuItem} onPress={item.onPress}>
            <Ionicons name={item.icon} size={22} color={Colors.textSecondary} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textDisabled} />
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.logoutBtn} onPress={() => Alert.alert('로그아웃', '로그아웃 하시겠습니까?')}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </Pressable>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: Spacing.xl },
  avatar: { marginBottom: Spacing.sm, position: 'relative' as const },
  avatarImg: { width: 80, height: 80, borderRadius: 40 },
  avatarOverlay: {
    position: 'absolute' as const, top: 0, left: 0, width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center' as const, alignItems: 'center' as const,
  },
  cameraBadge: {
    position: 'absolute' as const, right: 0, bottom: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.primary, justifyContent: 'center' as const, alignItems: 'center' as const,
    borderWidth: 2, borderColor: '#fff',
  },
  name: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  role: { fontSize: Typography.sizes.base, color: Colors.textSecondary, marginTop: 4 },
  menu: { backgroundColor: Colors.surface, marginHorizontal: Spacing.base, borderRadius: Radius.lg, ...Shadows.sm },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.base,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  menuLabel: { flex: 1, marginLeft: Spacing.md, fontSize: Typography.sizes.base, color: Colors.textPrimary },
  logoutBtn: {
    marginHorizontal: Spacing.base, marginTop: Spacing.xl, padding: Spacing.base,
    alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.danger,
  },
  logoutText: { fontSize: Typography.sizes.base, color: Colors.danger, fontWeight: Typography.weights.medium },
});
