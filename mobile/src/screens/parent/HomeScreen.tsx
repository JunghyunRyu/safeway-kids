import React, { memo, useCallback, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { listStudents, Student, getAcademyBranding, AcademyBranding } from "../../api/students";
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
import { showError } from "../../utils/toast";

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
  academyName: string | null;
  vehiclePlate: string | null;
  driverName: string | null;
  onPress?: () => void;
}

const ScheduleCard = memo(function ScheduleCard({
  studentName,
  status,
  pickupTime,
  academyName,
  vehiclePlate,
  driverName,
  onPress,
}: ScheduleCardProps) {
  const { t } = useTranslation();
  const statusColor = STATUS_COLORS[status] ?? Colors.neutral;
  const statusBg = STATUS_BG_COLORS[status] ?? Colors.neutralLight;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, Shadows.sm, pressed && { opacity: 0.8 }]}
    >
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
      {academyName ? (
        <Text style={styles.cardMeta}>{academyName}</Text>
      ) : null}
      {vehiclePlate || driverName ? (
        <Text style={styles.cardMeta}>
          {[vehiclePlate, driverName].filter(Boolean).join(" · ")}
        </Text>
      ) : null}
    </Pressable>
  );
});

export default function ParentHomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [students, setStudents] = useState<Student[]>([]);
  const [schedules, setSchedules] = useState<DailySchedule[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  // P3-70: Academy branding
  const [branding, setBranding] = useState<AcademyBranding | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, d, b] = await Promise.all([
        listStudents(),
        listDailySchedules(todayStr()),
        getAcademyBranding(),
      ]);
      setStudents(s);
      setSchedules(d);
      setBranding(b);
    } catch {
      showError('데이터를 불러오는데 실패했습니다');
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

  const allFiltered = selectedStudentId
    ? schedules.filter((s) => s.student_id === selectedStudentId)
    : schedules;

  // P2-42: Separate active vs completed/cancelled
  const activeSchedules = allFiltered.filter(
    (s) => s.status === "scheduled" || s.status === "boarded"
  );
  const completedSchedules = allFiltered.filter(
    (s) => s.status === "completed" || s.status === "cancelled" || s.status === "no_show"
  );

  const renderItem = useCallback(
    ({ item }: { item: DailySchedule }) => {
      const student = students.find((s) => s.id === item.student_id);
      return (
        <ScheduleCard
          studentName={student?.name ?? item.student_name ?? "학생"}
          status={item.status}
          pickupTime={item.pickup_time}
          academyName={item.academy_name}
          vehiclePlate={item.vehicle_license_plate}
          driverName={item.driver_name}
          onPress={() => {
            // P2-44: Navigate to Map tab on card tap
            try {
              navigation.navigate("ParentMap");
            } catch {
              // tab may not exist
            }
          }}
        />
      );
    },
    [students, navigation]
  );

  const keyExtractor = useCallback((item: DailySchedule) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 인사 헤더 */}
      <View style={[styles.header, branding?.primary_color ? { borderBottomColor: branding.primary_color, borderBottomWidth: 2 } : undefined]}>
        <View>
          {branding?.name && (
            <Text style={[styles.academyLabel, branding.primary_color ? { color: branding.primary_color } : undefined]}>
              {branding.name}
            </Text>
          )}
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

      {/* 자녀별 필터 */}
      {students.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <Pressable
            style={[styles.filterTab, !selectedStudentId && styles.filterTabActive]}
            onPress={() => setSelectedStudentId(null)}
          >
            <Text style={[styles.filterTabText, !selectedStudentId && styles.filterTabTextActive]}>전체</Text>
          </Pressable>
          {students.map((s) => (
            <Pressable
              key={s.id}
              style={[styles.filterTab, selectedStudentId === s.id && styles.filterTabActive]}
              onPress={() => setSelectedStudentId(s.id)}
            >
              <Text style={[styles.filterTabText, selectedStudentId === s.id && styles.filterTabTextActive]}>{s.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* 오늘 일정 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("home.todaySchedule")}</Text>
        <Text style={styles.sectionCount}>{activeSchedules.length}건</Text>
      </View>

      {activeSchedules.length === 0 && completedSchedules.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t("home.noSchedule")}</Text>
        </View>
      ) : (
        <FlatList
          data={activeSchedules}
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
          ListFooterComponent={
            completedSchedules.length > 0 ? (
              <View>
                <Pressable
                  style={styles.completedToggle}
                  onPress={() => setShowCompleted((v) => !v)}
                >
                  <Text style={styles.completedToggleText}>
                    {showCompleted ? "완료된 일정 접기" : `완료된 일정 ${completedSchedules.length}건`}
                  </Text>
                </Pressable>
                {showCompleted &&
                  completedSchedules.map((item) => {
                    const student = students.find((s) => s.id === item.student_id);
                    return (
                      <View key={item.id} style={{ marginBottom: Spacing.sm }}>
                        <ScheduleCard
                          studentName={student?.name ?? item.student_name ?? "학생"}
                          status={item.status}
                          pickupTime={item.pickup_time}
                          academyName={item.academy_name}
                          vehiclePlate={item.vehicle_license_plate}
                          driverName={item.driver_name}
                        />
                      </View>
                    );
                  })}
              </View>
            ) : null
          }
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
  academyLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
    marginBottom: 2,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
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
  filterRow: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  filterTabTextActive: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.bold,
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
  cardMeta: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
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
  completedToggle: {
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  completedToggleText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
});
