import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

// NOTE: This screen is not registered in OwnerStackNavigator as of V1.0.
// The CTA navigate call is non-operational until V1.1 stack registration.
// Mock placeholder data removed 2026-05-05 (modoo-deadline package F-1=A).
// Track 2 T2.3 (사진 캡션 + Empathic 리포트) 완료 후 실 API 연결 예정 (V1.1 또는 V1.0 출시 6/9).
export default function ActivityFeedScreen({ navigation }: any) {
  return (
    <View style={styles.container} testID="activity-feed-placeholder">
      <View style={styles.iconWrap}>
        <Ionicons name="paw" size={64} color={Colors.primary} />
      </View>
      <Text style={styles.title}>활동 피드</Text>
      <Text style={styles.body}>
        {'실시간 산책 업데이트 기능이\n6월 정식 출시 예정입니다.'}
      </Text>
      <Text style={styles.subBody}>
        예약 후 산책이 시작되면 사진과 메시지를 받아볼 수 있어요.
      </Text>
      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={() => navigation?.navigate?.('Bookings')}
        accessibilityRole="button"
        accessibilityLabel="예약 확인하기"
        hitSlop={8}
      >
        <Text style={styles.ctaText}>예약 확인하기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconWrap: { marginBottom: Spacing.lg },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  body: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  subBody: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  cta: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    minWidth: 160,
    alignItems: 'center',
  },
  ctaPressed: {
    backgroundColor: Colors.primaryDark,
    opacity: 0.95,
  },
  ctaText: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
});
