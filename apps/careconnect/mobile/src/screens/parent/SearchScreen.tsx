import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { searchCaregivers, type CaregiverProfile } from '../../api/caregivers';
import { DatePickerModal } from '@safeway/core-mobile';

const TRUST_BADGES = [
  { key: 'has_background_check' as const, label: '신원조회', icon: 'shield-checkmark' as const },
  { key: 'has_child_abuse_check' as const, label: '아동학대', icon: 'shield-checkmark' as const },
  { key: 'has_sex_offense_check' as const, label: '성범죄', icon: 'shield-checkmark' as const },
  { key: 'has_cpr_cert' as const, label: '심폐소생술', icon: 'medkit' as const },
  { key: 'has_insurance' as const, label: '배상보험', icon: 'shield-checkmark' as const },
];

const getDateString = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
};

const DATE_OPTIONS = [
  { label: '오늘', value: getDateString(0) },
  { label: '내일', value: getDateString(1) },
  { label: '모레', value: getDateString(2) },
];

export default function SearchScreen({ navigation }: any) {
  const [results, setResults] = useState<CaregiverProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(getDateString(0));
  const [userLat, setUserLat] = useState(37.5665);
  const [userLon, setUserLon] = useState(126.978);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserLat(loc.coords.latitude);
          setUserLon(loc.coords.longitude);
        }
      } catch { /* 위치 권한 거부 시 서울 기본 좌표 사용 */ }
      setLocationLoaded(true);
    })();
  }, []);

  const doSearch = async () => {
    setLoading(true);
    try {
      const data = await searchCaregivers(userLat, userLon, date);
      setResults(data);
    } catch {
      Alert.alert('오류', '데이터를 불러올 수 없습니다');
    }
    setLoading(false);
  };

  const countBadges = (cg: CaregiverProfile) =>
    [cg.has_background_check, cg.has_child_abuse_check, cg.has_sex_offense_check, cg.has_cpr_cert, cg.has_insurance].filter(Boolean).length;

  const renderCaregiver = ({ item }: { item: CaregiverProfile }) => (
    <Pressable
      style={styles.caregiverCard}
      onPress={() => navigation.navigate('CaregiverProfile', { caregiverId: item.id })}
    >
      <View style={styles.avatar}>
        <Ionicons name="person-circle" size={48} color={Colors.primary} />
      </View>
      <View style={styles.caregiverInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.caregiverName}>{item.name}</Text>
          {countBadges(item) >= 5 && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={12} color={Colors.textInverse} />
              <Text style={styles.verifiedText}>5중 인증</Text>
            </View>
          )}
        </View>
        {/* Trust Badges */}
        <View style={styles.trustRow}>
          {TRUST_BADGES.map((b) => (
            <View key={b.key} style={[styles.trustBadge, item[b.key] ? styles.trustBadgeActive : styles.trustBadgeInactive]}>
              <Ionicons name={b.icon} size={10} color={item[b.key] ? Colors.success : Colors.textDisabled} />
              <Text style={[styles.trustLabel, !item[b.key] && { color: Colors.textDisabled }]}>{b.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.badges}>
          {item.avg_rating && (
            <View style={styles.badge}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.badgeText}>{item.avg_rating}</Text>
            </View>
          )}
          <View style={styles.badge}>
            <Ionicons name="heart" size={14} color={Colors.accent} />
            <Text style={styles.badgeText}>{item.total_sessions}회</Text>
          </View>
          {item.distance_km !== undefined && (
            <View style={styles.badge}>
              <Ionicons name="location" size={14} color={Colors.info} />
              <Text style={styles.badgeText}>{item.distance_km}km</Text>
            </View>
          )}
        </View>
        {item.bio && <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textDisabled} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>돌봄 도우미 찾기</Text>
      </View>

      {!locationLoaded && (
        <Text style={styles.locationHint}>위치를 확인하는 중...</Text>
      )}

      {/* Date Quick Buttons */}
      <View style={styles.dateRow}>
        {DATE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.dateBtn, date === opt.value && styles.dateBtnActive]}
            onPress={() => setDate(opt.value)}
          >
            <Text style={[styles.dateBtnText, date === opt.value && styles.dateBtnTextActive]}>{opt.label}</Text>
            <Text style={[styles.dateBtnSub, date === opt.value && { color: Colors.primary }]}>{opt.value.slice(5)}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.dateBtn} onPress={() => setDatePickerVisible(true)}>
          <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.dateBtnSub}>직접 선택</Text>
        </Pressable>
      </View>

      <DatePickerModal
        visible={datePickerVisible}
        value={date}
        onSelect={setDate}
        onClose={() => setDatePickerVisible(false)}
        primaryColor={Colors.primary}
      />

      <Pressable style={styles.searchBtn} onPress={doSearch}>
        <Ionicons name="search" size={20} color={Colors.textInverse} />
        <Text style={styles.searchBtnText}>검색하기</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderCaregiver}
          contentContainerStyle={{ padding: Spacing.base }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={Colors.textDisabled} />
              <Text style={styles.emptyText}>검색 버튼을 눌러 주변 돌봄 도우미를 찾아보세요</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  locationHint: { fontSize: Typography.sizes.xs, color: Colors.textDisabled, paddingHorizontal: Spacing.base, marginBottom: 4 },
  dateRow: { flexDirection: 'row', paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.md },
  dateBtn: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.md, backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.borderLight,
  },
  dateBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  dateBtnText: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textSecondary },
  dateBtnTextActive: { color: Colors.primary },
  dateBtnSub: { fontSize: Typography.sizes.xs, color: Colors.textDisabled, marginTop: 2 },
  searchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: Spacing.base, backgroundColor: Colors.primary, paddingVertical: Spacing.md,
    borderRadius: Radius.md, marginBottom: Spacing.md,
  },
  searchBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
  caregiverCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadows.sm,
  },
  avatar: { marginRight: Spacing.md },
  caregiverInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  caregiverName: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.primary,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full,
  },
  verifiedText: { fontSize: 9, fontWeight: Typography.weights.bold, color: Colors.textInverse },
  trustRow: { flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  trustBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full, borderWidth: 1,
  },
  trustBadgeActive: { borderColor: Colors.success, backgroundColor: Colors.successLight },
  trustBadgeInactive: { borderColor: Colors.borderLight, backgroundColor: Colors.surface },
  trustLabel: { fontSize: 9, fontWeight: Typography.weights.medium, color: Colors.success },
  badges: { flexDirection: 'row', marginTop: 6, gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  badgeText: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
  bio: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: Typography.sizes.base, color: Colors.textDisabled, marginTop: Spacing.md },
});
