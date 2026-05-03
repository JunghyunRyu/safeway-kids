import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Alert,
  ActivityIndicator, Linking, DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { getMe, logout, type UserResponse } from '@safeway/core-mobile/api/auth';

const ROLE_LABEL: Record<string, string> = {
  pet_owner: '반려동물 보호자',
  walker: '산책 도우미',
  platform_admin: '플랫폼 관리자',
  parent: '학부모',
  driver: '기사',
};

const SUPPORT_EMAIL = 'support@lunenlabs.com';

export default function ProfileScreen({ navigation }: any) {
  const [me, setMe] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(setMe)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logout();
          DeviceEventEmitter.emit('auth:logout');
        },
      },
    ]);
  };

  const handleSupport = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=PetTracker%20문의`;
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
    } else {
      Alert.alert('고객센터', `이메일 클라이언트를 열 수 없습니다.\n${SUPPORT_EMAIL} 으로 문의해 주세요.`);
    }
  };

  const menuItems: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }[] = [
    { icon: 'paw', label: '내 반려동물 관리', onPress: () => navigation.navigate('MyPets') },
    { icon: 'card', label: '결제 내역', onPress: () => navigation.navigate('PaymentHistory') },
    { icon: 'notifications', label: '알림 설정', onPress: () => navigation.navigate('NotificationSettings') },
    { icon: 'shield-checkmark', label: '개인정보 처리방침', onPress: () => navigation.navigate('Policy', { kind: 'privacy' }) },
    { icon: 'document-text', label: '이용약관', onPress: () => navigation.navigate('Policy', { kind: 'terms' }) },
    { icon: 'help-circle', label: '고객센터', onPress: handleSupport },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person-circle" size={72} color={Colors.primary} />
        </View>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 8 }} />
        ) : (
          <>
            <Text style={styles.name}>{me?.name ?? '사용자'}</Text>
            <Text style={styles.role}>{ROLE_LABEL[me?.role ?? ''] ?? '회원'}</Text>
            {me?.phone ? <Text style={styles.phone}>{me.phone}</Text> : null}
          </>
        )}
      </View>

      <View style={styles.menu}>
        {menuItems.map((item, idx) => (
          <Pressable
            key={item.label}
            style={[styles.menuItem, idx === menuItems.length - 1 && { borderBottomWidth: 0 }]}
            onPress={item.onPress}
            android_ripple={{ color: Colors.borderLight }}
          >
            <Ionicons name={item.icon} size={22} color={Colors.textSecondary} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textDisabled} />
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </Pressable>

      <Text style={styles.version}>PetTracker v1.0.0</Text>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: Spacing.xl },
  avatar: { marginBottom: Spacing.sm },
  name: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  role: { fontSize: Typography.sizes.base, color: Colors.textSecondary, marginTop: 4 },
  phone: { fontSize: Typography.sizes.sm, color: Colors.textDisabled, marginTop: 2 },
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
  version: { textAlign: 'center', marginTop: Spacing.lg, fontSize: Typography.sizes.xs, color: Colors.textDisabled },
});
