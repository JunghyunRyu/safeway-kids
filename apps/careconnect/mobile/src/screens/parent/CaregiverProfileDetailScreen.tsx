import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { getCaregiverProfile, type CaregiverProfile } from '../../api/caregivers';

const TRUST_BADGES = [
  { key: 'has_background_check' as const, label: '신원조회 완료', icon: 'shield-checkmark' as const },
  { key: 'has_child_abuse_check' as const, label: '아동학대 이력 없음', icon: 'shield-checkmark' as const },
  { key: 'has_sex_offense_check' as const, label: '성범죄 이력 없음', icon: 'shield-checkmark' as const },
  { key: 'has_cpr_cert' as const, label: 'CPR 자격증 보유', icon: 'medkit' as const },
  { key: 'has_insurance' as const, label: '배상책임보험', icon: 'shield-checkmark' as const },
  { key: 'approval_status' as const, label: '본인인증 완료', icon: 'person-circle' as const },
];

export default function CaregiverProfileDetailScreen({ route, navigation }: any) {
  const { caregiverId } = route.params;
  const [profile, setProfile] = useState<CaregiverProfile | null>(null);

  useEffect(() => {
    getCaregiverProfile(caregiverId).then(setProfile).catch(() => {
      Alert.alert('오류', '데이터를 불러올 수 없습니다');
    });
  }, [caregiverId]);

  if (!profile) {
    return <View style={styles.container}><Text style={styles.loading}>로딩 중...</Text></View>;
  }

  const badgeEntries = TRUST_BADGES.map((b) => {
    let active: boolean;
    if (b.key === 'approval_status') {
      active = profile.approval_status === 'approved';
    } else {
      active = !!profile[b.key as keyof CaregiverProfile];
    }
    return { ...b, active };
  });

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

      {/* 5 Trust Badges */}
      <View style={styles.trustSection}>
        <Text style={styles.trustTitle}>안전 인증 현황</Text>
        {badgeEntries.map((b, i) => (
          <View key={i} style={[styles.trustItem, b.active ? styles.trustItemActive : styles.trustItemInactive]}>
            <View style={[styles.trustIconBg, b.active ? { backgroundColor: Colors.successLight } : { backgroundColor: Colors.neutralLight }]}>
              <Ionicons name={b.icon} size={18} color={b.active ? Colors.success : Colors.textDisabled} />
            </View>
            <Text style={[styles.trustLabel, !b.active && { color: Colors.textDisabled }]}>{b.label}</Text>
            <Ionicons
              name={b.active ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={b.active ? Colors.success : Colors.textDisabled}
            />
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
          <Text style={styles.statValue}>{profile.total_sessions}</Text>
          <Text style={styles.statLabel}>돌봄 횟수</Text>
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
      <Pressable style={styles.bookBtn} onPress={() => navigation.navigate('BookingCreate', { caregiverId })}>
        <Text style={styles.bookBtnText}>이 돌봄자에게 예약하기</Text>
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
  trustSection: { paddingHorizontal: Spacing.base, marginBottom: Spacing.xl },
  trustTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  trustItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    borderRadius: Radius.md, marginBottom: 8, gap: Spacing.md,
  },
  trustItemActive: { backgroundColor: Colors.successLight, borderWidth: 1, borderColor: Colors.success },
  trustItemInactive: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight },
  trustIconBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  trustLabel: { flex: 1, fontSize: Typography.sizes.base, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
  section: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: 8 },
  bioText: { fontSize: Typography.sizes.base, color: Colors.textSecondary, lineHeight: 22 },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: Spacing.base,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadows.sm,
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.primary },
  statLabel: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 4 },
  bookBtn: {
    marginHorizontal: Spacing.base, marginTop: Spacing.xxl, backgroundColor: Colors.primary,
    paddingVertical: Spacing.base, borderRadius: Radius.lg, alignItems: 'center',
  },
  bookBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
});
