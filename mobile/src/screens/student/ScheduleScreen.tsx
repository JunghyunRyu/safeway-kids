import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius, Shadows, STATUS_COLORS, STATUS_BG_COLORS } from "../../constants/theme";
import { listDailySchedules, DailySchedule } from "../../api/schedules";
import { showError } from "../../utils/toast";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "예정",
  boarded: "탑승 중",
  completed: "완료",
  cancelled: "취소됨",
};

function maskName(name: string): string {
  if (name.length <= 1) return name;
  return name[0] + "O" + name.slice(2, 3);
}

function ScheduleCard({
  item,
  friends,
  totalStops,
  completedStops,
}: {
  item: DailySchedule;
  friends: DailySchedule[];
  totalStops: number;
  completedStops: number;
}) {
  const statusColor = STATUS_COLORS[item.status] ?? Colors.neutral;
  const statusBg = STATUS_BG_COLORS[item.status] ?? Colors.neutralLight;
  const time = item.pickup_time?.slice(0, 5) ?? "--:--";
  const isBoarded = item.status === "boarded" || !!item.boarded_at;
  const remainingStops = Math.max(0, totalStops - completedStops);
  const etaMinutes = remainingStops * 3;
  const progress = totalStops > 0 ? completedStops / totalStops : 0;

  return (
    <View style={[styles.card, Shadows.sm]}>
      <View style={[styles.timeBadge, { backgroundColor: Colors.roleStudent + "20" }]}>
        <Text style={[styles.timeText, { color: Colors.roleStudent }]}>{time}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.studentName}>
          {item.academy_name ? `${item.academy_name} 등원` : "오늘의 등원"}
        </Text>
        {(item.vehicle_license_plate || item.driver_name) ? (
          <Text style={styles.metaInfo}>
            {[item.vehicle_license_plate, item.driver_name].filter(Boolean).join(" · ")}
          </Text>
        ) : null}
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABELS[item.status] ?? item.status}
          </Text>
        </View>

        {/* P3-64: Progress bar when boarded */}
        {isBoarded && totalStops > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.etaText}>
              목적지까지 약 {etaMinutes}분
            </Text>
          </View>
        )}

        {/* P3-62: Friends riding together */}
        {friends.length > 0 && (
          <View style={styles.friendsSection}>
            <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.friendsText}>
              함께 타는 친구: {friends.map((f) => maskName(f.student_name ?? "")).join(", ")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function StudentScheduleScreen() {
  const insets = useSafeAreaInsets();
  const [schedules, setSchedules] = useState<DailySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = () => new Date().toISOString().split("T")[0];

  const load = useCallback(async () => {
    try {
      const data = await listDailySchedules(todayStr());
      setSchedules(data);
    } catch (err) {
      if (__DEV__) console.error("Student schedule load error:", err);
      showError('스케줄을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>오늘 일정</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color={Colors.roleStudent} />
      ) : schedules.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={56} color={Colors.textDisabled} />
          <Text style={styles.emptyTitle}>오늘 일정이 없습니다</Text>
        </View>
      ) : (
        <FlatList
          data={schedules}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            // P3-62: Find friends in same vehicle (exclude self)
            const friends = schedules.filter(
              (s) =>
                s.vehicle_id &&
                s.vehicle_id === item.vehicle_id &&
                s.id !== item.id
            );
            // P3-64: Count stops for progress bar
            const sameVehicle = schedules.filter(
              (s) => s.vehicle_id && s.vehicle_id === item.vehicle_id
            );
            const totalStops = sameVehicle.length;
            const completedStops = sameVehicle.filter(
              (s) => s.status === "completed"
            ).length;
            return (
              <ScheduleCard
                item={item}
                friends={friends}
                totalStops={totalStops}
                completedStops={completedStops}
              />
            );
          }}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={Colors.roleStudent}
            />
          }
        />
      )}
    </View>
  );
}

// P2-45: Student-friendly UI — larger fonts, brighter colors
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7FF" },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.roleStudent,
    borderBottomWidth: 0,
  },
  title: {
    fontSize: 26,
    fontWeight: Typography.weights.bold,
    color: Colors.textInverse,
  },
  date: {
    fontSize: Typography.sizes.base,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  list: { padding: Spacing.base, gap: Spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  timeBadge: {
    width: 72,
    height: 72,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  timeText: {
    fontSize: 20,
    fontWeight: Typography.weights.bold,
  },
  cardContent: { flex: 1, gap: Spacing.xs },
  metaInfo: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },
  studentName: {
    fontSize: 20,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.sm },
  emptyTitle: {
    fontSize: 20,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  // P3-64: Progress bar
  progressSection: {
    marginTop: Spacing.sm,
    gap: 4,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.roleStudent,
    borderRadius: 4,
  },
  etaText: {
    fontSize: Typography.sizes.sm,
    color: Colors.roleStudent,
    fontWeight: Typography.weights.semibold,
  },
  // P3-62: Friends section
  friendsSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.sm,
  },
  friendsText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
});
