import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';

interface ActivityItem {
  id: string;
  activity_type: string;
  description: string;
  time: string;
  photo_url?: string;
}

const ACTIVITY_ICONS: Record<string, { icon: string; color: string }> = {
  homework: { icon: 'book', color: Colors.info },
  play: { icon: 'game-controller', color: Colors.accent },
  meal: { icon: 'restaurant', color: Colors.warning },
  snack: { icon: 'cafe', color: '#D97706' },
  nap: { icon: 'moon', color: Colors.primary },
  outdoor: { icon: 'sunny', color: Colors.success },
};

// Placeholder data — in production, fetched from WebSocket or API
const MOCK_FEED: ActivityItem[] = [
  { id: '1', activity_type: 'meal', description: '점심 식사를 했어요 (잔반 없음)', time: '12:00' },
  { id: '2', activity_type: 'nap', description: '낮잠 시작 (1시간 예정)', time: '13:00' },
  { id: '3', activity_type: 'play', description: '블록 놀이를 하고 있어요', time: '14:30' },
  { id: '4', activity_type: 'outdoor', description: '놀이터에서 뛰어놀고 있어요', time: '15:30' },
  { id: '5', activity_type: 'snack', description: '간식 시간 (과일, 우유)', time: '16:00' },
];

export default function SessionMonitorScreen({ route, navigation }: any) {
  const [feed] = useState<ActivityItem[]>(MOCK_FEED);
  const [noReportAlert, setNoReportAlert] = useState(false);

  // Simulate 30-min no-report detection
  useEffect(() => {
    const timer = setTimeout(() => setNoReportAlert(true), 5000); // Demo: show after 5s
    return () => clearTimeout(timer);
  }, []);

  const handleSOS = () => {
    Alert.alert(
      'SOS 긴급 연락',
      '긴급 상황입니까? 돌봄자와 관리자에게 즉시 알림을 보냅니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: 'SOS 보내기', style: 'destructive', onPress: () => Alert.alert('전송 완료', 'SOS 알림이 전송되었습니다') },
      ],
    );
  };

  const renderItem = ({ item }: { item: ActivityItem }) => {
    const activityConfig = ACTIVITY_ICONS[item.activity_type] || { icon: 'ellipse', color: Colors.neutral };
    return (
      <View style={styles.feedItem}>
        <View style={styles.timeline}>
          <View style={[styles.dot, { backgroundColor: activityConfig.color }]} />
          <View style={styles.line} />
        </View>
        <View style={styles.feedContent}>
          <View style={styles.feedHeader}>
            <Ionicons name={activityConfig.icon as any} size={16} color={activityConfig.color} />
            <Text style={styles.feedTime}>{item.time}</Text>
          </View>
          {item.photo_url && (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="image" size={32} color={Colors.textDisabled} />
              <Text style={styles.photoText}>사진</Text>
            </View>
          )}
          <Text style={styles.feedText}>{item.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>돌봄 모니터링</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>실시간</Text>
        </View>
      </View>

      {/* 30-min no-report alert */}
      {noReportAlert && (
        <View style={styles.alertBanner}>
          <Ionicons name="alert-circle" size={20} color={Colors.danger} />
          <Text style={styles.alertText}>30분 무보고 - 돌봄자에게 확인 중입니다</Text>
        </View>
      )}

      <FlatList
        data={feed}
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

      {/* SOS Button */}
      <Pressable style={styles.sosBtn} onPress={handleSOS}>
        <Ionicons name="warning" size={24} color={Colors.textInverse} />
        <Text style={styles.sosText}>SOS</Text>
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
  title: { flex: 1, fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success, marginRight: 4 },
  liveText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.success },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: Spacing.base,
    padding: Spacing.md, backgroundColor: Colors.dangerLight, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.danger, marginBottom: Spacing.md,
  },
  alertText: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.danger, fontWeight: Typography.weights.bold },
  feedItem: { flexDirection: 'row', marginBottom: Spacing.md },
  timeline: { width: 24, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  line: { width: 2, flex: 1, backgroundColor: Colors.borderLight, marginTop: 4 },
  feedContent: { flex: 1, marginLeft: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, ...Shadows.sm },
  feedHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  feedTime: { fontSize: Typography.sizes.xs, color: Colors.textDisabled },
  feedText: { fontSize: Typography.sizes.base, color: Colors.textPrimary, lineHeight: 20 },
  photoPlaceholder: {
    height: 120, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.sm,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  photoText: { fontSize: Typography.sizes.xs, color: Colors.textDisabled, marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: Typography.sizes.base, color: Colors.textDisabled, marginTop: Spacing.md },
  sosBtn: {
    position: 'absolute', bottom: 40, right: Spacing.base,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.danger, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: Radius.full, ...Shadows.md,
  },
  sosText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
});
