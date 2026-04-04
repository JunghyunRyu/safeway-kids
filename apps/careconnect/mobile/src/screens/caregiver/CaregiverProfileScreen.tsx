import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';

export default function CaregiverProfileScreen() {
  const menuItems = [
    { icon: 'shield-checkmark' as const, label: '자격증 관리 (5중 인증)', onPress: () => {} },
    { icon: 'star' as const, label: '내 리뷰 보기', onPress: () => {} },
    { icon: 'notifications' as const, label: '알림 설정', onPress: () => {} },
    { icon: 'lock-closed' as const, label: '개인정보처리방침', onPress: () => {} },
    { icon: 'help-circle' as const, label: '고객센터', onPress: () => {} },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person-circle" size={72} color={Colors.primary} />
        </View>
        <Text style={styles.name}>돌봄자</Text>
        <Text style={styles.role}>케어커넥트 돌봄자</Text>
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
  avatar: { marginBottom: Spacing.sm },
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
