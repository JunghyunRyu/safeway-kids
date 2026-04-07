import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { getWalkReport, type WalkReport } from '../../api/walks';

export default function WalkReportScreen({ route, navigation }: any) {
  const { sessionId } = route?.params || {};
  const [report, setReport] = useState<WalkReport | null>(null);

  useEffect(() => {
    if (sessionId) getWalkReport(sessionId).then(setReport).catch(() => { Alert.alert('오류', '리포트를 불러올 수 없습니다'); });
  }, [sessionId]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>산책 리포트</Text>
      </View>

      {report ? (
        <>
          <View style={styles.summaryCard}>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Ionicons name="walk" size={24} color={Colors.primary} />
                <Text style={styles.statValue}>{report.distance_meters ? `${(report.distance_meters / 1000).toFixed(1)}km` : '-'}</Text>
                <Text style={styles.statLabel}>거리</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="time" size={24} color={Colors.accent} />
                <Text style={styles.statValue}>
                  {report.started_at && report.ended_at
                    ? `${Math.round((new Date(report.ended_at).getTime() - new Date(report.started_at).getTime()) / 60000)}분`
                    : '-'}
                </Text>
                <Text style={styles.statLabel}>시간</Text>
              </View>
            </View>
          </View>

          {report.walker_memo && (
            <View style={styles.memoCard}>
              <Text style={styles.memoTitle}>워커 메모</Text>
              <Text style={styles.memoText}>{report.walker_memo}</Text>
            </View>
          )}

          <View style={styles.mapPlaceholder}>
            <Ionicons name="map" size={48} color={Colors.textDisabled} />
            <Text style={styles.mapText}>경로 지도</Text>
            <Text style={styles.mapSubtext}>
              {report.route_polyline ? `${report.route_polyline.length}개 포인트` : '경로 데이터 없음'}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>리포트를 불러오는 중...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  summaryCard: { marginHorizontal: Spacing.base, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, ...Shadows.sm },
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginTop: 8 },
  statLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 4 },
  memoCard: { marginHorizontal: Spacing.base, marginTop: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base, ...Shadows.sm },
  memoTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: 8 },
  memoText: { fontSize: Typography.sizes.base, color: Colors.textSecondary, lineHeight: 22 },
  mapPlaceholder: {
    marginHorizontal: Spacing.base, marginTop: Spacing.lg, height: 200, backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center',
  },
  mapText: { fontSize: Typography.sizes.md, color: Colors.textDisabled, marginTop: 8 },
  mapSubtext: { fontSize: Typography.sizes.sm, color: Colors.textDisabled, marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: Colors.textDisabled },
});
