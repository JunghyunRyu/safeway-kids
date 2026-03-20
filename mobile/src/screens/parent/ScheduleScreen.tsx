import React, { memo, useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  cancelSchedule,
  DailySchedule,
  listDailySchedules,
} from "../../api/schedules";
import { listStudents, Student } from "../../api/students";
import { showError } from "../../utils/toast";
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
  STATUS_COLORS,
  STATUS_BG_COLORS,
} from "../../constants/theme";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "예정",
  boarded: "탑승 중",
  completed: "완료",
  cancelled: "취소됨",
};

const timeFmt = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" });

function dateStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

function fmtTime(t: string): string {
  return t?.length >= 5 ? t.slice(0, 5) : t;
}

function fmtDisplayDate(dateIso: string): string {
  const d = new Date(dateIso + "T00:00:00");
  return d.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

// ── Schedule Card ────────────────────────────────────────────
interface ScheduleItemProps {
  id: string;
  studentName: string;
  pickupTime: string;
  status: string;
  boardedAt: string | null;
  alightedAt: string | null;
  onCancel: (id: string) => void;
}

const ScheduleItem = memo(function ScheduleItem({
  id,
  studentName,
  pickupTime,
  status,
  boardedAt,
  alightedAt,
  onCancel,
}: ScheduleItemProps) {
  const { t } = useTranslation();
  const canCancel = status === "scheduled";
  const statusColor = STATUS_COLORS[status] ?? Colors.neutral;
  const statusBg = STATUS_BG_COLORS[status] ?? Colors.neutralLight;

  return (
    <View style={[styles.card, Shadows.sm]}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.timeBadge, { backgroundColor: Colors.primaryLight }]}>
          <Ionicons name="time-outline" size={14} color={Colors.primary} />
          <Text style={[styles.timeText, { color: Colors.primary }]}>
            {fmtTime(pickupTime)}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusPillText, { color: statusColor }]}>
            {STATUS_LABELS[status] ?? status}
          </Text>
        </View>
      </View>

      {/* Student Name */}
      <Text style={styles.studentName}>{studentName}</Text>

      {/* Timestamps */}
      {boardedAt ? (
        <View style={styles.metaRow}>
          <Ionicons name="enter-outline" size={14} color={Colors.statusBoarded} />
          <Text style={[styles.metaText, { color: Colors.statusBoarded }]}>
            탑승 {timeFmt.format(new Date(boardedAt))}
          </Text>
        </View>
      ) : null}
      {alightedAt ? (
        <View style={styles.metaRow}>
          <Ionicons name="exit-outline" size={14} color={Colors.statusCompleted} />
          <Text style={[styles.metaText, { color: Colors.statusCompleted }]}>
            하차 {timeFmt.format(new Date(alightedAt))}
          </Text>
        </View>
      ) : null}

      {/* Cancel Button */}
      {canCancel && (
        <Pressable
          style={styles.cancelBtn}
          onPress={() => onCancel(id)}
         
        >
          <Ionicons name="close-circle-outline" size={16} color={Colors.danger} />
          <Text style={styles.cancelText}>{t("schedule.cancelRide")}</Text>
        </Pressable>
      )}
    </View>
  );
});

// ── Date Navigation Header ───────────────────────────────────
const DateNavHeader = memo(function DateNavHeader({
  offset,
  onPrev,
  onNext,
}: {
  offset: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const label =
    offset === 0
      ? "오늘"
      : offset === -1
      ? "어제"
      : offset === 1
      ? "내일"
      : fmtDisplayDate(dateStr(offset));

  return (
    <View style={styles.dateNav}>
      <Pressable
        style={styles.dateNavBtn}
        onPress={onPrev}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
      </Pressable>

      <View style={styles.dateNavCenter}>
        <Text style={styles.dateNavLabel}>{label}</Text>
        <Text style={styles.dateNavSub}>{dateStr(offset)}</Text>
      </View>

      <Pressable
        style={styles.dateNavBtn}
        onPress={onNext}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
      </Pressable>
    </View>
  );
});

// ── Main Screen ──────────────────────────────────────────────
export default function ScheduleScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [dateOffset, setDateOffset] = useState(0);
  const [schedules, setSchedules] = useState<DailySchedule[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (offset: number) => {
      try {
        const [d, s] = await Promise.all([
          listDailySchedules(dateStr(offset)),
          listStudents(),
        ]);
        setSchedules(d);
        setStudents(s);
      } catch {
        showError('스케줄을 불러오는데 실패했습니다');
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      load(dateOffset);
    }, [load, dateOffset])
  );

  const handlePrev = () => {
    const next = dateOffset - 1;
    setDateOffset(next);
    load(next);
  };

  const handleNext = () => {
    const next = dateOffset + 1;
    setDateOffset(next);
    load(next);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(dateOffset);
    setRefreshing(false);
  }, [load, dateOffset]);

  const handleCancel = useCallback(
    (itemId: string) => {
      const item = schedules.find((s) => s.id === itemId);
      if (!item) return;

      const doCancel = async () => {
        try {
          await cancelSchedule(item.id);
          await load(dateOffset);
        } catch {
          if (Platform.OS === "web") {
            window.alert("취소 처리에 실패했습니다");
          } else {
            Alert.alert(t("common.error"));
          }
        }
      };

      if (Platform.OS === "web") {
        if (window.confirm(t("schedule.cancelConfirm"))) doCancel();
      } else {
        Alert.alert(t("schedule.cancelRide"), t("schedule.cancelConfirm"), [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("common.confirm"), style: "destructive", onPress: doCancel },
        ]);
      }
    },
    [schedules, load, t, dateOffset]
  );

  const renderItem = useCallback(
    ({ item }: { item: DailySchedule }) => {
      const student = students.find((s) => s.id === item.student_id);
      return (
        <ScheduleItem
          id={item.id}
          studentName={student?.name ?? "학생"}
          pickupTime={item.pickup_time}
          status={item.status}
          boardedAt={item.boarded_at}
          alightedAt={item.alighted_at}
          onCancel={handleCancel}
        />
      );
    },
    [students, handleCancel]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 페이지 헤더 */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>{t("schedule.daily")}</Text>
      </View>

      {/* 날짜 네비게이션 */}
      <DateNavHeader offset={dateOffset} onPrev={handlePrev} onNext={handleNext} />

      {/* 목록 */}
      {schedules.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={56} color={Colors.textDisabled} />
          <Text style={styles.emptyTitle}>이 날에 일정이 없습니다</Text>
          <Text style={styles.emptyDesc}>화살표로 날짜를 이동하거나 아래로 당겨 새로고침하세요.</Text>
        </View>
      ) : (
        <FlatList
          data={schedules}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  pageHeader: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pageTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },

  // Date Navigation
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dateNavBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceElevated,
  },
  dateNavCenter: {
    flex: 1,
    alignItems: "center",
  },
  dateNavLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  dateNavSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // List
  list: { padding: Spacing.base, gap: Spacing.sm },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  timeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  statusPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusPillText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  studentName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  metaText: {
    fontSize: Typography.sizes.sm,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
    minHeight: 48,
  },
  cancelText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.danger,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  emptyDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.textDisabled,
    textAlign: "center",
    lineHeight: 20,
  },
});
