import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { getSessionActivities, type SessionActivity } from '../../api/sessions';

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

export default function SessionMonitorScreen({ route, navigation }: any) {
  const sessionId = route?.params?.sessionId;
  const [feed, setFeed] = useState<ActivityItem[]>([]);
  const [noReportAlert, setNoReportAlert] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll session activities every 10 seconds
  useEffect(() => {
    const fetchFeed = async () => {
      if (!sessionId) return;
      try {
        const activities = await getSessionActivities(sessionId);
        setFeed(activities);
      } catch {
        Alert.alert('오류', '데이터를 불러올 수 없습니다');
      }
    };
    fetchFeed();
    pollRef.current = setInterval(fetchFeed, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sessionId]);

  // Real 30-min no-report detection
  useEffect(() => {
    if (feed.length === 0) return;
    const lastTime = new Date(feed[0].time).getTime();
    const elapsed = Date.now() - lastTime;
    if (isNaN(lastTime)) {
      // time is HH:MM format from API — build today's date
      const [h, m] = feed[0].time.split(':').map(Number);
      const now = new Date();
      const lastDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
      const elapsedMs = now.getTime() - lastDate.getTime();
      if (elapsedMs > 30 * 60 * 1000) setNoReportAlert(true);
      else setNoReportAlert(false);
    } else {
      if (elapsed > 30 * 60 * 1000) setNoReportAlert(true);
      else setNoReportAlert(false);
    }
  }, [feed]);

  const handleSOS = () => {
    Alert.alert(
      'SOS 긴급 연락',
      '긴급 상황입니까? 돌봄자와 관리자에게 즉시 알림을 보냅니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: 'SOS 보내기', style: 'destructive', onPress: () => navigation?.navigate('SOS') },
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
            <Text style={styles.emptyText}>아직 활동 기록이 없습니다</Text>
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
