import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { getWalkerProfile, type WalkerProfile } from '../../api/walkers';
import { listWalkerReviews, type WalkerReview } from '../../api/reviews';

// 백엔드 자격 코드 → 사용자 친화 한글 라벨 (내부 enum 노출 방지, O-16)
const CERT_LABELS: Record<string, string> = {
  pet_care_level_1: '반려동물관리사 1급',
  pet_care_level_2: '반려동물관리사 2급',
  pet_first_aid: '반려동물 응급처치',
  dog_trainer: '반려견 행동전문가',
  vet_assistant: '동물보건사',
};
// 알려진 코드는 매핑, 미지의 머신 코드(snake_case)는 일반화해 노출 차단,
// 이미 사람이 읽는 텍스트는 그대로 통과.
const certLabel = (raw: string) =>
  CERT_LABELS[raw] || (/^[a-z0-9_]+$/.test(raw) ? '자격 보유' : raw);

export default function WalkerProfileDetailScreen({ route, navigation }: any) {
  const { walkerId } = route.params;
  const [profile, setProfile] = useState<WalkerProfile | null>(null);
  const [reviews, setReviews] = useState<WalkerReview[]>([]);

  useEffect(() => {
    getWalkerProfile(walkerId).then(setProfile).catch(() => { Alert.alert('오류', '프로필을 불러올 수 없습니다'); });
    listWalkerReviews(walkerId).then(setReviews).catch(() => setReviews([]));
  }, [walkerId]);

  if (!profile) {
    return <View style={[styles.container, styles.loadingWrap]}><ActivityIndicator size="large" color={Colors.primary} /></View>;
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
    profile.certification_type && { icon: 'ribbon' as const, label: certLabel(profile.certification_type), color: Colors.info },
    profile.total_walks >= 10 && { icon: 'walk' as const, label: `${profile.total_walks}회 완료`, color: Colors.accent },
    insuranceBadge,
  ].filter(Boolean) as Array<{ icon: keyof typeof Ionicons.glyphMap; label: string; color: string }>;

  return (
    <View style={styles.container}>
      <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="뒤로 가기" hitSlop={10}>
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
      </Pressable>

      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xl }}>
      <View style={styles.profileHeader}>
        {profile.profile_photo_url ? (
          <Image source={{ uri: profile.profile_photo_url }} style={styles.profilePhoto} />
        ) : (
          <Ionicons name="person-circle" size={80} color={Colors.primary} />
        )}
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

      {/* Reviews (O-15) — 신뢰 형성의 핵심: 숫자가 아닌 실제 후기 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>이용 후기</Text>
        {reviews.length === 0 ? (
          <Text style={styles.noReview}>아직 등록된 후기가 없어요.</Text>
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewHead}>
                <Text style={styles.reviewName}>{r.reviewer_name || '보호자'}</Text>
                <View style={styles.reviewStars}>
                  <Ionicons name="star" size={13} color="#F59E0B" />
                  <Text style={styles.reviewRating}>{r.rating}</Text>
                </View>
              </View>
              {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
            </View>
          ))
        )}
      </View>
      </ScrollView>

      {/* Book Button — 하단 고정 (O-31) */}
      <View style={styles.footer}>
        <Pressable style={styles.bookBtn} onPress={() => navigation.navigate('BookingCreate', { walkerId })} accessibilityRole="button" accessibilityLabel="이 도우미에게 예약하기">
          <Text style={styles.bookBtnText}>이 도우미에게 예약하기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { justifyContent: 'center', alignItems: 'center' },
  backBtn: { position: 'absolute', top: 60, left: Spacing.base, zIndex: 10, padding: 6 },
  profilePhoto: { width: 80, height: 80, borderRadius: 40 },
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
  footer: { padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.borderLight, backgroundColor: Colors.surface },
  bookBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.base, borderRadius: Radius.lg, alignItems: 'center',
  },
  bookBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
  noReview: { fontSize: Typography.sizes.base, color: Colors.textDisabled, fontStyle: 'italic' },
  reviewCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.sm },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewName: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  reviewStars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  reviewRating: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
  reviewComment: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, lineHeight: 20 },
});
