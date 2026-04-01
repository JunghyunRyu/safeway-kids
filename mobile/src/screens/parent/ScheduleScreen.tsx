import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
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
} from "../../constants/theme";
import {
  ViewMode,
  VIEW_MODES,
  dateStr,
  toDateStr,
  getWeekDates,
} from "./utils/scheduleHelpers";
import DailyView from "./components/DailyView";
import WeeklyView from "./components/WeeklyView";
import MonthlyView from "./components/MonthlyView";

// ── Main Screen ───────────────────────────────────────────────

export default function ScheduleScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [dateOffset, setDateOffset] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const [schedules, setSchedules] = useState<DailySchedule[]>([]);
  const [weekSchedules, setWeekSchedules] = useState<Map<string, DailySchedule[]>>(new Map());
  const [monthScheduleCounts, setMonthScheduleCounts] = useState<Map<string, number>>(new Map());
  const [students, setStudents] = useState<Student[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [weekLoading, setWeekLoading] = useState(false);
  const [monthLoading, setMonthLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // ── Filtered schedules ─────────────────────────────────

  const filteredSchedules = useMemo(
    () => selectedStudentId ? schedules.filter((s) => s.student_id === selectedStudentId) : schedules,
    [schedules, selectedStudentId],
  );

  // ── Data loaders ───────────────────────────────────────

  const loadDaily = useCallback(async (offset: number) => {
    try {
      const [d, s] = await Promise.all([
        listDailySchedules(dateStr(offset)),
        listStudents(),
      ]);
      setSchedules(d);
      setStudents(s);
    } catch {
      showError("스케줄을 불러오는데 실패했습니다");
    }
  }, []);

  const loadWeek = useCallback(async (wOffset: number) => {
    setWeekLoading(true);
    try {
      const refDate = new Date();
      refDate.setDate(refDate.getDate() + wOffset * 7);
      const dates = getWeekDates(refDate);
      const [studs, ...results] = await Promise.all([
        listStudents(),
        ...dates.map((d) => listDailySchedules(toDateStr(d))),
      ]);
      setStudents(studs);
      const map = new Map<string, DailySchedule[]>();
      dates.forEach((d, i) => {
        const key = toDateStr(d);
        map.set(key, results[i]);
      });
      setWeekSchedules(map);
    } catch {
      showError("주간 스케줄을 불러오는데 실패했습니다");
    } finally {
      setWeekLoading(false);
    }
  }, []);

  const loadMonth = useCallback(async (year: number, month: number) => {
    setMonthLoading(true);
    try {
      const [studs] = await Promise.all([listStudents()]);
      setStudents(studs);

      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const dates = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(year, month, i + 1);
        return toDateStr(d);
      });

      const counts = new Map<string, number>();
      for (let i = 0; i < dates.length; i += 7) {
        const batch = dates.slice(i, i + 7);
        const results = await Promise.all(
          batch.map((dateKey) => listDailySchedules(dateKey).catch(() => [])),
        );
        batch.forEach((dateKey, idx) => {
          const active = results[idx].filter((s) => s.status !== "cancelled");
          if (active.length > 0) counts.set(dateKey, active.length);
        });
      }
      setMonthScheduleCounts(counts);
    } catch {
      showError("월간 스케줄을 불러오는데 실패했습니다");
    } finally {
      setMonthLoading(false);
    }
  }, []);

  // ── Focus effect ───────────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      if (viewMode === "daily") loadDaily(dateOffset);
      else if (viewMode === "weekly") loadWeek(weekOffset);
      else loadMonth(monthDate.year, monthDate.month);
    }, [viewMode, dateOffset, weekOffset, monthDate, loadDaily, loadWeek, loadMonth]),
  );

  // ── Navigation handlers ────────────────────────────────

  const handleDailyPrev = () => { const n = dateOffset - 1; setDateOffset(n); loadDaily(n); };
  const handleDailyNext = () => { const n = dateOffset + 1; setDateOffset(n); loadDaily(n); };
  const handleDailyToday = () => { setDateOffset(0); loadDaily(0); };

  const handleWeekPrev = () => { const n = weekOffset - 1; setWeekOffset(n); loadWeek(n); };
  const handleWeekNext = () => { const n = weekOffset + 1; setWeekOffset(n); loadWeek(n); };
  const handleWeekToday = () => { setWeekOffset(0); loadWeek(0); };

  const handleMonthPrev = () => {
    const m = monthDate.month === 0 ? 11 : monthDate.month - 1;
    const y = monthDate.month === 0 ? monthDate.year - 1 : monthDate.year;
    setMonthDate({ year: y, month: m });
    loadMonth(y, m);
  };
  const handleMonthNext = () => {
    const m = monthDate.month === 11 ? 0 : monthDate.month + 1;
    const y = monthDate.month === 11 ? monthDate.year + 1 : monthDate.year;
    setMonthDate({ year: y, month: m });
    loadMonth(y, m);
  };
  const handleMonthToday = () => {
    const now = new Date();
    setMonthDate({ year: now.getFullYear(), month: now.getMonth() });
    loadMonth(now.getFullYear(), now.getMonth());
  };
  const handleMonthDayPress = (diff: number) => {
    setDateOffset(diff);
    setViewMode("daily");
    loadDaily(diff);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (viewMode === "daily") await loadDaily(dateOffset);
    else if (viewMode === "weekly") await loadWeek(weekOffset);
    else await loadMonth(monthDate.year, monthDate.month);
    setRefreshing(false);
  }, [viewMode, dateOffset, weekOffset, monthDate, loadDaily, loadWeek, loadMonth]);

  // ── Cancel handler ─────────────────────────────────────

  const handleCancel = useCallback(
    (itemId: string) => {
      const doCancel = async () => {
        try {
          await cancelSchedule(itemId);
          if (viewMode === "daily") await loadDaily(dateOffset);
          else if (viewMode === "weekly") await loadWeek(weekOffset);
        } catch {
          showError("취소 처리에 실패했습니다");
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
    [viewMode, dateOffset, weekOffset, loadDaily, loadWeek, t],
  );

  // ── Render ─────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Page Header + View Mode Tabs */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>스케줄</Text>
        <View style={styles.viewModeTabs}>
          {VIEW_MODES.map((m) => (
            <Pressable
              key={m.key}
              style={[styles.viewModeTab, viewMode === m.key && styles.viewModeTabActive]}
              onPress={() => setViewMode(m.key)}
              accessibilityRole="button"
              accessibilityLabel={`${m.label} 보기 모드`}
            >
              <Text style={[styles.viewModeText, viewMode === m.key && styles.viewModeTextActive]}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Student Filter */}
      {students.length > 1 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}
          data={students}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <Pressable style={[styles.filterTab, !selectedStudentId && styles.filterTabActive]} onPress={() => setSelectedStudentId(null)} accessibilityRole="button" accessibilityLabel="전체 자녀 필터">
              <Text style={[styles.filterTabText, !selectedStudentId && styles.filterTabTextActive]}>전체</Text>
            </Pressable>
          }
          renderItem={({ item: s }) => (
            <Pressable style={[styles.filterTab, selectedStudentId === s.id && styles.filterTabActive]} onPress={() => setSelectedStudentId(s.id)} accessibilityRole="button" accessibilityLabel={`${s.name} 자녀 필터`}>
              <Text style={[styles.filterTabText, selectedStudentId === s.id && styles.filterTabTextActive]}>{s.name}</Text>
            </Pressable>
          )}
        />
      )}

      {/* View content */}
      {viewMode === "daily" && (
        <DailyView
          dateOffset={dateOffset}
          filteredSchedules={filteredSchedules}
          students={students}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onPrev={handleDailyPrev}
          onNext={handleDailyNext}
          onToday={handleDailyToday}
          onCancel={handleCancel}
        />
      )}

      {viewMode === "weekly" && (
        <WeeklyView
          weekOffset={weekOffset}
          weekSchedules={weekSchedules}
          students={students}
          weekLoading={weekLoading}
          refreshing={refreshing}
          selectedStudentId={selectedStudentId}
          onRefresh={onRefresh}
          onPrev={handleWeekPrev}
          onNext={handleWeekNext}
          onToday={handleWeekToday}
          onCancel={handleCancel}
        />
      )}

      {viewMode === "monthly" && (
        <MonthlyView
          monthDate={monthDate}
          monthScheduleCounts={monthScheduleCounts}
          monthLoading={monthLoading}
          onPrev={handleMonthPrev}
          onNext={handleMonthNext}
          onToday={handleMonthToday}
          onDayPress={handleMonthDayPress}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

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
    marginBottom: Spacing.sm,
  },

  // View mode tabs
  viewModeTabs: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: 2,
  },
  viewModeTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  viewModeTabActive: {
    backgroundColor: Colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewModeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
  },
  viewModeTextActive: {
    color: Colors.primary,
    fontWeight: Typography.weights.bold,
  },

  // Filter
  filterRow: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  filterContent: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.sm },
  filterTab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated },
  filterTabActive: { backgroundColor: Colors.primary },
  filterTabText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.textSecondary },
  filterTabTextActive: { color: Colors.surface, fontWeight: Typography.weights.semibold },
});
