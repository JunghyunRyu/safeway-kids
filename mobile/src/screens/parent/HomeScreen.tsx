import React, { memo, useCallback, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { listStudents, Student } from "../../api/students";
import { listDailySchedules, DailySchedule } from "../../api/schedules";
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
  STATUS_COLORS,
  STATUS_BG_COLORS,
} from "../../constants/theme";

function fmtTime(t: string): string {
  return t?.length >= 5 ? t.slice(0, 5) : t;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: "예정",
  boarded: "탑승 중",
  completed: "완료",
  cancelled: "취소됨",
};

interface ScheduleCardProps {
  studentName: string;
  status: string;
  pickupTime: string;
}

const ScheduleCard = memo(function ScheduleCard({
  studentName,
  status,
  pickupTime,
}: ScheduleCardProps) {
  const { t } = useTranslation();
  const statusColor = STATUS_COLORS[status] ?? Colors.neutral;
  const statusBg = STATUS_BG_COLORS[status] ?? Colors.neutralLight;

  return (
    <View style={[styles.card, Shadows.sm]}>
      <View style={styles.cardHeader}>
        <Text style={styles.studentName}>{studentName}</Text>
        <View style={[styles.badge, { backgroundColor: statusBg }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {STATUS_LABELS[status] ?? t(`schedule.${status}` as any, status)}
          </Text>
        </View>
      </View>
      <Text style={styles.cardTime}>
        {t("schedule.pickupTime")}: {fmtTime(pickupTime)}
      </Text>
    </View>
  );
});

export default function ParentHomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [students, setStudents] = useState<Student[]>([]);
  const [schedules, setSchedules] = useState<DailySchedule[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, d] = await Promise.all([
        listStudents(),
        listDailySchedules(todayStr()),
      ]);
      setStudents(s);
      setSchedules(d);
    } catch {
      // silently fail on load
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const renderItem = useCallback(
    ({ item }: { item: DailySchedule }) => {
      const student = students.find((s) => s.id === item.student_id);
      return (
        <ScheduleCard
          studentName={student?.name ?? "학생"}
          status={item.status}
          pickupTime={item.pickup_time}
        />
      );
    },
    [students]
  );

  const keyExtractor = useCallback((item: DailySchedule) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 인사 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {t("home.greeting")}, {user?.name}
          </Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString("ko-KR", {
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
          </Text>
        </View>
        <View style={[styles.childBadge, { backgroundColor: Colors.primaryLight }]}>
          <Text style={[styles.childCount, { color: Colors.primary }]}>
            {students.length}명
          </Text>
          <Text style={[styles.childLabel, { color: Colors.primary }]}>자녀</Text>
        </View>
      </View>

      {/* 오늘 일정 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("home.todaySchedule")}</Text>
        <Text style={styles.sectionCount}>{schedules.length}건</Text>
      </View>

      {schedules.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t("home.noSchedule")}</Text>
        </View>
      ) : (
        <FlatList
          data={schedules}
          keyExtractor={keyExtractor}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  greeting: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  date: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  childBadge: {
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  childCount: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  childLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  sectionCount: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  list: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  studentName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  cardTime: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: Typography.sizes.base,
    color: Colors.textDisabled,
  },
});
