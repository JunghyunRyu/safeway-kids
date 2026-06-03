import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, FlatList, Pressable, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { listPets, type Pet } from '../../api/pets';

export default function MyPetsScreen({ navigation }: any) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setPets(await listPets());
    } catch {
      Alert.alert('오류', '반려동물 목록을 불러올 수 없습니다');
    }
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderPet = ({ item }: { item: Pet }) => {
    const photoUrl = (item as any).photo_url as string | undefined;
    return (
    <View style={styles.card}>
      <View style={styles.avatarBox}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.avatarEmoji}>{item.species === 'cat' ? '🐈' : '🐕'}</Text>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.detail}>
          {item.breed ?? (item.species === 'cat' ? '고양이' : '강아지')}
          {item.weight_kg ? ` · ${item.weight_kg}kg` : ''}
        </Text>
        {item.temperament ? <Text style={styles.tag}>{item.temperament}</Text> : null}
      </View>
    </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="뒤로 가기" hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>내 반려동물</Text>
      </View>

      <FlatList
        data={pets}
        keyExtractor={(item) => item.id}
        renderItem={renderPet}
        contentContainerStyle={{ padding: Spacing.base, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Ionicons name="paw-outline" size={48} color={Colors.textDisabled} />
              <Text style={styles.emptyText}>아직 등록된 반려동물이 없어요</Text>
            </View>
          )
        }
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('PetRegistration')} accessibilityRole="button" accessibilityLabel="반려동물 추가">
        <Ionicons name="add" size={24} color={Colors.textInverse} />
        <Text style={styles.fabText}>반려동물 추가</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md,
  },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadows.sm,
  },
  avatarBox: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarEmoji: { fontSize: 28 },
  avatarImg: { width: 56, height: 56, borderRadius: 28 },
  cardContent: { flex: 1 },
  name: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  detail: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 2 },
  tag: {
    alignSelf: 'flex-start', marginTop: 6,
    paddingHorizontal: 8, paddingVertical: 2,
    backgroundColor: Colors.accentLight, color: Colors.accentDark,
    borderRadius: Radius.full, fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: Typography.sizes.md, color: Colors.textDisabled, marginTop: Spacing.md },
  fab: {
    position: 'absolute', bottom: 32, right: 24,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: Radius.full, ...Shadows.md,
  },
  fabText: { color: Colors.textInverse, fontWeight: Typography.weights.bold, fontSize: Typography.sizes.base },
});
