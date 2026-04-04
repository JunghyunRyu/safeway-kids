import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { searchWalkers, type WalkerSearchResult } from '../../api/walkers';

export default function SearchScreen({ navigation }: any) {
  const [results, setResults] = useState<WalkerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const doSearch = async () => {
    setLoading(true);
    try {
      // Default to Seoul coordinates for demo
      const data = await searchWalkers(37.5665, 126.978, date);
      setResults(data);
    } catch {}
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
      <View style={styles.searchBar}>
        <TextInput
          style={styles.dateInput}
          value={date}
          onChangeText={setDate}
          placeholder="날짜 (YYYY-MM-DD)"
          placeholderTextColor={Colors.textDisabled}
        />
        <Pressable style={styles.searchBtn} onPress={doSearch}>
          <Ionicons name="search" size={20} color={Colors.textInverse} />
        </Pressable>
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
              <Ionicons name="search-outline" size={48} color={Colors.textDisabled} />
              <Text style={styles.emptyText}>검색 버튼을 눌러 주변 도우미를 찾아보세요</Text>
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
  searchBar: { flexDirection: 'row', paddingHorizontal: Spacing.base, marginBottom: Spacing.md },
  dateInput: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md, fontSize: Typography.sizes.base, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
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
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: Typography.sizes.base, color: Colors.textDisabled, marginTop: Spacing.md },
});
