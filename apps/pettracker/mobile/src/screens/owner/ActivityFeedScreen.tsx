import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';

interface ActivityItem {
  id: string;
  type: 'photo' | 'message' | 'status';
  text: string;
  time: string;
  photoUrl?: string;
}

// Placeholder data — in production, fetched from WebSocket or API
const MOCK_FEED: ActivityItem[] = [
  { id: '1', type: 'status', text: '워커가 도착했습니다', time: '10:00' },
  { id: '2', type: 'status', text: '산책이 시작되었습니다 🐾', time: '10:02' },
  { id: '3', type: 'photo', text: '공원에�� 신나게 뛰고 있어요!', time: '10:15' },
  { id: '4', type: 'message', text: '배변 처리 완료, 물 마시는 중이에요', time: '10:30' },
  { id: '5', type: 'photo', text: '다른 강아지 친구를 만났어요 🐕', time: '10:40' },
];

export default function ActivityFeedScreen({ route, navigation }: any) {
  const renderItem = ({ item }: { item: ActivityItem }) => (
    <View style={styles.feedItem}>
      <View style={styles.timeline}>
        <View style={[styles.dot, item.type === 'photo' && styles.dotPhoto]} />
        <View style={styles.line} />
      </View>
      <View style={styles.feedContent}>
        <Text style={styles.feedTime}>{item.time}</Text>
        {item.type === 'photo' && (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="image" size={32} color={Colors.textDisabled} />
            <Text style={styles.photoText}>사진</Text>
          </View>
        )}
        <Text style={styles.feedText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>활동 피드</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>실시간</Text>
        </View>
      </View>

      <FlatList
        data={MOCK_FEED}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: Spacing.base }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="camera-outline" size={48} color={Colors.textDisabled} />
            <Text style={styles.emptyText}>아직 활동이 없어요</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md,
  },
  title: { flex: 1, fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success, marginRight: 4 },
  liveText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.success },
  feedItem: { flexDirection: 'row', marginBottom: Spacing.md },
  timeline: { width: 24, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, marginTop: 4 },
  dotPhoto: { backgroundColor: Colors.accent },
  line: { width: 2, flex: 1, backgroundColor: Colors.borderLight, marginTop: 4 },
  feedContent: { flex: 1, marginLeft: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, ...Shadows.sm },
  feedTime: { fontSize: Typography.sizes.xs, color: Colors.textDisabled, marginBottom: 4 },
  feedText: { fontSize: Typography.sizes.base, color: Colors.textPrimary, lineHeight: 20 },
  photoPlaceholder: {
    height: 120, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.sm,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  photoText: { fontSize: Typography.sizes.xs, color: Colors.textDisabled, marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: Typography.sizes.base, color: Colors.textDisabled, marginTop: Spacing.md },
});
