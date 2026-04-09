import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { searchWalkers, type WalkerSearchResult } from '../../api/walkers';
import { DatePickerModal, formatKorean } from '@safeway/core-mobile';

// 서울 시청 기본 좌표 (위치 권한 거부 시 폴백)
const DEFAULT_LAT = 37.5665;
const DEFAULT_LNG = 126.978;

export default function SearchScreen({ navigation }: any) {
  const [results, setResults] = useState<WalkerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sizeFilter, setSizeFilter] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [userLat, setUserLat] = useState(DEFAULT_LAT);
  const [userLng, setUserLng] = useState(DEFAULT_LNG);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationDenied(true);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLat(loc.coords.latitude);
        setUserLng(loc.coords.longitude);
      } catch {
        setLocationDenied(true);
      }
    })();
  }, []);

  const doSearch = async () => {
    setLoading(true);
    try {
      const data = await searchWalkers(userLat, userLng, date);
      setResults(data);
      setHasSearched(true);
    } catch {
      Alert.alert('오류', '검색에 실패했습니다');
    }
    setLoading(false);
  };

  const renderWalker = ({ item }: { item: WalkerSearchResult }) => (
    <Pressable
      style={styles.walkerCard}
      onPress={() => navigation.navigate('WalkerProfile', { walkerId: item.id })}
    >
      <View style={styles.avatar}>
        <Ionicons name="person-circle" size={48} color={Colors.primary} />
      </View>
      <View style={styles.walkerInfo}>
        <Text style={styles.walkerName}>{item.name}</Text>
        <View style={styles.badges}>
          {item.avg_rating && (
            <View style={styles.badge}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.badgeText}>{item.avg_rating}</Text>
            </View>
          )}
          <View style={styles.badge}>
            <Ionicons name="walk" size={14} color={Colors.accent} />
            <Text style={styles.badgeText}>{item.total_walks}회</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="location" size={14} color={Colors.info} />
            <Text style={styles.badgeText}>{item.distance_km}km</Text>
          </View>
        </View>
        {item.bio && <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textDisabled} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>산책 도우미 찾기</Text>
      </View>
      {locationDenied && (
        <View style={styles.locationNotice}>
          <Ionicons name="location-outline" size={16} color={Colors.warning} />
          <Text style={styles.locationNoticeText}>위치 권한이 필요합니다. 기본 위치(서울)로 검색합니다.</Text>
        </View>
      )}
      <View style={styles.searchBar}>
        <Pressable style={styles.dateInput} onPress={() => setDatePickerVisible(true)}>
          <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.dateText}>{formatKorean(date)}</Text>
        </Pressable>
        <Pressable style={styles.searchBtn} onPress={doSearch}>
          <Ionicons name="search" size={20} color={Colors.textInverse} />
        </Pressable>
      </View>

      <DatePickerModal
        visible={datePickerVisible}
        value={date}
        onSelect={setDate}
        onClose={() => setDatePickerVisible(false)}
        primaryColor={Colors.primary}
      />

      {/* Size Filter Chips */}
      <View style={styles.filterRow}>
        {([['all', '전체'], ['small', '소형 (<10kg)'], ['medium', '중형 (10-25kg)'], ['large', '대형 (>25kg)']] as const).map(([key, label]) => (
          <Pressable key={key} style={[styles.filterChip, sizeFilter === key && styles.filterChipActive]} onPress={() => setSizeFilter(key)}>
            <Text style={[styles.filterChipText, sizeFilter === key && styles.filterChipTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderWalker}
          contentContainerStyle={{ padding: Spacing.base }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name={hasSearched ? 'alert-circle-outline' : 'search-outline'} size={48} color={Colors.textDisabled} />
              <Text style={styles.emptyText}>
                {hasSearched
                  ? '해당 조건에 맞는 도우미가 없습니다.\n날짜나 지역을 변경해보세요'
                  : '검색 버튼을 눌러 주변 도우미를 찾아보세요'}
              </Text>
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
  locationNotice: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.base, paddingVertical: 8, backgroundColor: Colors.warningLight, marginHorizontal: Spacing.base, borderRadius: Radius.sm, marginBottom: Spacing.sm },
  locationNoticeText: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, flex: 1 },
  searchBar: { flexDirection: 'row', paddingHorizontal: Spacing.base, marginBottom: Spacing.md },
  dateInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md, minHeight: 48,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  dateText: { flex: 1, fontSize: Typography.sizes.base, color: Colors.textPrimary },
  searchBtn: {
    width: 48, height: 48, backgroundColor: Colors.primary, borderRadius: Radius.md,
    justifyContent: 'center', alignItems: 'center', marginLeft: Spacing.sm,
  },
  walkerCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadows.sm,
  },
  avatar: { marginRight: Spacing.md },
  walkerInfo: { flex: 1 },
  walkerName: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  badges: { flexDirection: 'row', marginTop: 4, gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  badgeText: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
  bio: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 4 },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.base, marginBottom: Spacing.sm, gap: 6, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
  filterChipTextActive: { color: '#fff', fontWeight: Typography.weights.medium as any },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: Typography.sizes.base, color: Colors.textDisabled, marginTop: Spacing.md, textAlign: 'center' as const },
});
