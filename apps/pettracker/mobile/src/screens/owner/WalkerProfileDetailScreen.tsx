import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { getWalkerProfile, type WalkerProfile } from '../../api/walkers';

export default function WalkerProfileDetailScreen({ route, navigation }: any) {
  const { walkerId } = route.params;
  const [profile, setProfile] = useState<WalkerProfile | null>(null);

  useEffect(() => {
    getWalkerProfile(walkerId).then(setProfile).catch(() => { Alert.alert('오류', '프로필을 불러올 수 없습니다'); });
  }, [walkerId]);

  if (!profile) {
    return <View style={styles.container}><Text style={styles.loading}>로딩 중...</Text></View>;
  }

  const insuranceBadge = (() => {
    if (!profile.has_insurance) return null;
    if (!profile.insurance_expiry) {
      return { icon: 'umbrella' as const, label: '보험 가입', color: Colors.success };
    }
    const expiry = new Date(profile.insurance_expiry);
    const now = new Date();
    const daysLeft = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) {
      return { icon: 'alert-circle' as const, label: '보험 만료', color: Colors.danger ?? '#DC2626' };
    }
    if (daysLeft <= 30) {
      return { icon: 'umbrella' as const, label: `보험 ${daysLeft}일 남음`, color: Colors.warning ?? '#F59E0B' };
    }
    return { icon: 'umbrella' as const, label: '보험 가입', color: Colors.success };
  })();

  const badges = [
    profile.approval_status === 'approved' && { icon: 'shield-checkmark' as const, label: '본인인증', color: Colors.success },
    profile.certification_type && { icon: 'ribbon' as const, label: profile.certification_type, color: Colors.info },
    profile.total_walks >= 10 && { icon: 'walk' as const, label: `${profile.total_walks}회 완료`, color: Colors.accent },
    insuranceBadge,
  ].filter(Boolean) as Array<{ icon: keyof typeof Ionicons.glyphMap; label: string; color: string }>;

  return (
    <ScrollView style={styles.container}>
      <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
      </Pressable>

      <View style={styles.profileHeader}>
        <Ionicons name="person-circle" size={80} color={Colors.primary} />
        <Text style={styles.name}>{profile.name}</Text>
        {profile.avg_rating && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={18} color="#F59E0B" />
            <Text style={styles.rating}>{profile.avg_rating}</Text>
            <Text style={styles.reviewCount}>({profile.total_reviews}개 리뷰)</Text>
          </View>
        )}
      </View>

      {/* Trust Badges */}
      <View style={styles.badgesRow}>
        {badges.map((b, i) => (
          <View key={i} style={styles.badge}>
            <Ionicons name={b.icon} size={16} color={b.color} />
            <Text style={[styles.badgeText, { color: b.color }]}>{b.label}</Text>
          </View>
        ))}
      </View>

      {/* Bio */}
      {profile.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>소개</Text>
          <Text style={styles.bioText}>{profile.bio}</Text>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{profile.total_walks}</Text>
          <Text style={styles.statLabel}>산책 횟수</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{profile.experience_years}년</Text>
          <Text style={styles.statLabel}>경력</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{profile.avg_rating || '-'}</Text>
          <Text style={styles.statLabel}>평점</Text>
        </View>
      </View>

      {/* Book Button */}
      <Pressable style={styles.bookBtn} onPress={() => navigation.navigate('BookingCreate', { walkerId })}>
        <Text style={styles.bookBtnText}>이 도우미에게 예약하기</Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { textAlign: 'center', marginTop: 100, color: Colors.textDisabled },
  backBtn: { position: 'absolute', top: 60, left: Spacing.base, zIndex: 10 },
  profileHeader: { alignItems: 'center', paddingTop: 80, paddingBottom: Spacing.xl },
  name: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginTop: Spacing.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  rating: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  reviewCount: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  badgesRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: Spacing.xl, flexWrap: 'wrap', paddingHorizontal: Spacing.base },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, ...Shadows.sm,
  },
  badgeText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  section: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: 8 },
  bioText: { fontSize: Typography.sizes.base, color: Colors.textSecondary, lineHeight: 22 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: Spacing.base, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadows.sm },
  stat: { alignItems: 'center' },
  statValue: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.primary },
  statLabel: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 4 },
  bookBtn: {
    marginHorizontal: Spacing.base, marginTop: Spacing.xxl, backgroundColor: Colors.primary,
    paddingVertical: Spacing.base, borderRadius: Radius.lg, alignItems: 'center',
  },
  bookBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
});
