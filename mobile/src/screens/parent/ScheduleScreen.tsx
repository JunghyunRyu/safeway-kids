import React, { memo, useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
  ActivityIndicator,
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

// ── Constants ─────────────────────────────────────────────────

type ViewMode = "daily" | "weekly" | "monthly";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "예정",
  boarded: "탑승 중",
  completed: "완료",
  cancelled: "취소됨",
  no_show: "미탑승",
};

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
const DAY_NAMES_FULL = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

const timeFmt = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" });

// ── Date helpers ──────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function dateStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toDateStr(d);
}

function fmtTime(t: string): string {
  return t?.length >= 5 ? t.slice(0, 5) : t;
}

function fmtDisplayDate(dateIso: string): string {
  const d = new Date(dateIso + "T00:00:00");
  return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

/** Get Monday of the week containing the given date */
function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/** Get array of 7 dates for the week containing the reference date */
function getWeekDates(refDate: Date): Date[] {
  const monday = getMonday(refDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/** Get first day of month */
function getMonthStart(year: number, month: number): Date {
  return new Date(year, month, 1);
}

/** Get calendar grid (6 weeks x 7 days) for the month */
function getCalendarGrid(year: number, month: number): Date[][] {
  const firstDay = getMonthStart(year, month);
  const startDay = firstDay.getDay(); // 0=Sun
  const startOffset = startDay === 0 ? -6 : 1 - startDay; // align to Monday
  const gridStart = new Date(year, month, 1 + startOffset);

  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + w * 7 + d);
      week.push(date);
    }
    // Stop if entire week is in next month
    if (w >= 4 && week[0].getMonth() !== month) break;
    weeks.push(week);
  }
  return weeks;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ── Schedule Card ─────────────────────────────────────────────

interface ScheduleItemProps {
  id: string;
  studentName: string;
  pickupTime: string;
  status: string;
  boardedAt: string | null;
  alightedAt: string | null;
  academyName: string | null;
  vehiclePlate: string | null;
  driverName: string | null;
  onCancel: (id: string) => void;
  compact?: boolean;
}

const ScheduleItem = memo(function ScheduleItem({
  id, studentName, pickupTime, status, boardedAt, alightedAt,
  academyName, vehiclePlate, driverName, onCancel, compact,
}: ScheduleItemProps) {
  const { t } = useTranslation();
  const canCancel = status === "scheduled";
  const statusColor = STATUS_COLORS[status] ?? Colors.neutral;
  const statusBg = STATUS_BG_COLORS[status] ?? Colors.neutralLight;

  if (compact) {
    return (
      <View style={[styles.compactCard, Shadows.sm]}>
        <View style={styles.compactRow}>
          <Text style={styles.compactTime}>{fmtTime(pickupTime)}</Text>
          <Text style={styles.compactName} numberOfLines={1}>{studentName}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusPillText, { color: statusColor }]}>
              {STATUS_LABELS[status] ?? status}
            </Text>
          </View>
        </View>
        {(vehiclePlate || driverName) && (
          <Text style={styles.compactMeta} numberOfLines={1}>
            {[vehiclePlate, driverName].filter(Boolean).join(" · ")}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.card, Shadows.sm]}>
      <View style={styles.cardHeader}>
        <View style={[styles.timeBadge, { backgroundColor: Colors.primaryLight }]}>
          <Ionicons name="time-outline" size={14} color={Colors.primary} />
          <Text style={[styles.timeText, { color: Colors.primary }]}>{fmtTime(pickupTime)}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusPillText, { color: statusColor }]}>
            {STATUS_LABELS[status] ?? status}
          </Text>
        </View>
      </View>
      <Text style={styles.studentName}>{studentName}</Text>
      {academyName ? <Text style={styles.metaInfo}>{academyName}</Text> : null}
      {vehiclePlate || driverName ? (
        <Text style={styles.metaInfo}>
          {[vehiclePlate, driverName].filter(Boolean).join(" · ")}
        </Text>
      ) : null}
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
      {canCancel && (
        <Pressable style={styles.cancelBtn} onPress={() => onCancel(id)}>
          <Ionicons name="close-circle-outline" size={16} color={Colors.danger} />
          <Text style={styles.cancelText}>{t("schedule.cancelRide")}</Text>
        </Pressable>
      )}
    </View>
  );
});

// ── View Mode Tabs ────────────────────────────────────────────

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: "daily", label: "일간" },
  { key: "weekly", label: "주간" },
  { key: "monthly", label: "월간" },
];

// ── Date Navigation Header ────────────────────────────────────

const DateNavHeader = memo(function DateNavHeader({
  label,
  sub,
  onPrev,
  onNext,
  onToday,
}: {
  label: string;
  sub: string;
  onPrev: () => void;
  onNext: () => void;
  onToday?: () => void;
}) {
  return (
    <View style={styles.dateNav}>
      <Pressable style={styles.dateNavBtn} onPress={onPrev} hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
      </Pressable>
      <Pressable style={styles.dateNavCenter} onPress={onToday}>
        <Text style={styles.dateNavLabel}>{label}</Text>
        <Text style={styles.dateNavSub}>{sub}</Text>
      </Pressable>
      <Pressable style={styles.dateNavBtn} onPress={onNext} hitSlop={8}>
        <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
      </Pressable>
    </View>
  );
});

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

  // ── Daily ───────────────────────────────────────────────

  const filteredSchedules = useMemo(
    () => selectedStudentId ? schedules.filter((s) => s.student_id === selectedStudentId) : schedules,
    [schedules, selectedStudentId],
  );

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

  // ── Weekly ──────────────────────────────────────────────

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

  // ── Monthly ─────────────────────────────────────────────

  const loadMonth = useCallback(async (year: number, month: number) => {
    setMonthLoading(true);
    try {
      const [studs] = await Promise.all([listStudents()]);
      setStudents(studs);

      // Load all days of the month in batches
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const dates = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(year, month, i + 1);
        return toDateStr(d);
      });

      // Batch in groups of 7 to avoid too many parallel requests
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

  // ── Focus effect ────────────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      if (viewMode === "daily") loadDaily(dateOffset);
      else if (viewMode === "weekly") loadWeek(weekOffset);
      else loadMonth(monthDate.year, monthDate.month);
    }, [viewMode, dateOffset, weekOffset, monthDate, loadDaily, loadWeek, loadMonth]),
  );

  // ── Navigation handlers ─────────────────────────────────

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (viewMode === "daily") await loadDaily(dateOffset);
    else if (viewMode === "weekly") await loadWeek(weekOffset);
    else await loadMonth(monthDate.year, monthDate.month);
    setRefreshing(false);
  }, [viewMode, dateOffset, weekOffset, monthDate, loadDaily, loadWeek, loadMonth]);

  // ── Cancel handler ──────────────────────────────────────

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

  // ── Render helpers ──────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: DailySchedule }) => {
      const student = students.find((s) => s.id === item.student_id);
      return (
        <ScheduleItem
          id={item.id}
          studentName={student?.name ?? item.student_name ?? "학생"}
          pickupTime={item.pickup_time}
          status={item.status}
          boardedAt={item.boarded_at}
          alightedAt={item.alighted_at}
          academyName={item.academy_name}
          vehiclePlate={item.vehicle_license_plate}
          driverName={item.driver_name}
          onCancel={handleCancel}
        />
      );
    },
    [students, handleCancel],
  );

  // ── Daily nav label ─────────────────────────────────────

  const dailyLabel = dateOffset === 0 ? "오늘" : dateOffset === -1 ? "어제" : dateOffset === 1 ? "내일" : fmtDisplayDate(dateStr(dateOffset));

  // ── Weekly data ─────────────────────────────────────────

  const weekDates = useMemo(() => {
    const ref = new Date();
    ref.setDate(ref.getDate() + weekOffset * 7);
    return getWeekDates(ref);
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    if (weekDates.length === 0) return "";
    const s = weekDates[0];
    const e = weekDates[6];
    return `${s.getMonth() + 1}/${s.getDate()} ~ ${e.getMonth() + 1}/${e.getDate()}`;
  }, [weekDates]);

  // ── Monthly data ────────────────────────────────────────

  const calendarGrid = useMemo(
    () => getCalendarGrid(monthDate.year, monthDate.month),
    [monthDate],
  );
  const monthLabel = `${monthDate.year}년 ${monthDate.month + 1}월`;
  const today = new Date();

  // ── Render ──────────────────────────────────────────────

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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
          <Pressable style={[styles.filterTab, !selectedStudentId && styles.filterTabActive]} onPress={() => setSelectedStudentId(null)}>
            <Text style={[styles.filterTabText, !selectedStudentId && styles.filterTabTextActive]}>전체</Text>
          </Pressable>
          {students.map((s) => (
            <Pressable key={s.id} style={[styles.filterTab, selectedStudentId === s.id && styles.filterTabActive]} onPress={() => setSelectedStudentId(s.id)}>
              <Text style={[styles.filterTabText, selectedStudentId === s.id && styles.filterTabTextActive]}>{s.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* ═══════ DAILY VIEW ═══════ */}
      {viewMode === "daily" && (
        <>
          <DateNavHeader label={dailyLabel} sub={dateStr(dateOffset)} onPrev={handleDailyPrev} onNext={handleDailyNext} onToday={handleDailyToday} />
          {filteredSchedules.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={56} color={Colors.textDisabled} />
              <Text style={styles.emptyTitle}>이 날에 일정이 없습니다</Text>
              <Text style={styles.emptyDesc}>화살표로 날짜를 이동하거나 아래로 당겨 새로고침하세요.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredSchedules}
              keyExtractor={(item) => item.id}
              refreshing={refreshing}
              onRefresh={onRefresh}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
            />
          )}
        </>
      )}

      {/* ═══════ WEEKLY VIEW ═══════ */}
      {viewMode === "weekly" && (
        <>
          <DateNavHeader
            label={weekOffset === 0 ? "이번 주" : weekLabel}
            sub={weekLabel}
            onPrev={handleWeekPrev}
            onNext={handleWeekNext}
            onToday={handleWeekToday}
          />
          {weekLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.weekContainer} refreshControl={
              <FlatList
                data={[]}
                renderItem={() => null}
                refreshing={refreshing}
                onRefresh={onRefresh}
              /> as any
            }>
              {weekDates.map((date) => {
                const key = toDateStr(date);
                const daySchedules = weekSchedules.get(key) ?? [];
                const filtered = selectedStudentId
                  ? daySchedules.filter((s) => s.student_id === selectedStudentId)
                  : daySchedules;
                const isToday = isSameDay(date, today);
                const dayOfWeek = date.getDay();

                return (
                  <View key={key} style={styles.weekDaySection}>
                    <View style={[styles.weekDayHeader, isToday && styles.weekDayHeaderToday]}>
                      <Text style={[styles.weekDayName, isToday && styles.weekDayNameToday]}>
                        {DAY_NAMES[dayOfWeek]}
                      </Text>
                      <Text style={[styles.weekDayDate, isToday && styles.weekDayDateToday]}>
                        {date.getMonth() + 1}/{date.getDate()}
                      </Text>
                      <Text style={styles.weekDayCount}>
                        {filtered.length > 0 ? `${filtered.length}건` : ""}
                      </Text>
                    </View>
                    {filtered.length === 0 ? (
                      <Text style={styles.weekDayEmpty}>일정 없음</Text>
                    ) : (
                      filtered.map((item) => {
                        const student = students.find((s) => s.id === item.student_id);
                        return (
                          <ScheduleItem
                            key={item.id}
                            id={item.id}
                            studentName={student?.name ?? item.student_name ?? "학생"}
                            pickupTime={item.pickup_time}
                            status={item.status}
                            boardedAt={item.boarded_at}
                            alightedAt={item.alighted_at}
                            academyName={item.academy_name}
                            vehiclePlate={item.vehicle_license_plate}
                            driverName={item.driver_name}
                            onCancel={handleCancel}
                            compact
                          />
                        );
                      })
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </>
      )}

      {/* ═══════ MONTHLY VIEW ═══════ */}
      {viewMode === "monthly" && (
        <>
          <DateNavHeader label={monthLabel} sub="" onPrev={handleMonthPrev} onNext={handleMonthNext} onToday={handleMonthToday} />
          {monthLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.monthContainer}>
              {/* Day name header */}
              <View style={styles.calendarHeader}>
                {DAY_NAMES.map((d, i) => (
                  <Text key={i} style={[styles.calendarHeaderText, i === 0 && { color: Colors.danger }]}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* Calendar grid */}
              {calendarGrid.map((week, wi) => (
                <View key={wi} style={styles.calendarRow}>
                  {week.map((date, di) => {
                    const key = toDateStr(date);
                    const count = monthScheduleCounts.get(key) ?? 0;
                    const isCurrentMonth = date.getMonth() === monthDate.month;
                    const isToday2 = isSameDay(date, today);
                    const isSunday = di === 0;

                    return (
                      <Pressable
                        key={di}
                        style={[styles.calendarCell, isToday2 && styles.calendarCellToday]}
                        onPress={() => {
                          // Tap a day → switch to daily view for that date
                          const diff = Math.round((date.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
                          setDateOffset(diff);
                          setViewMode("daily");
                          loadDaily(diff);
                        }}
                      >
                        <Text
                          style={[
                            styles.calendarDay,
                            !isCurrentMonth && styles.calendarDayOther,
                            isToday2 && styles.calendarDayToday,
                            isSunday && isCurrentMonth && { color: Colors.danger },
                          ]}
                        >
                          {date.getDate()}
                        </Text>
                        {count > 0 && isCurrentMonth && (
                          <View style={styles.calendarDots}>
                            <View style={[styles.calendarDot, count >= 3 && styles.calendarDotMany]} />
                            {count >= 2 && <View style={[styles.calendarDot, count >= 3 && styles.calendarDotMany]} />}
                          </View>
                        )}
                        {count > 0 && isCurrentMonth && (
                          <Text style={styles.calendarCount}>{count}</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}

              {/* Monthly summary */}
              <View style={[styles.monthSummary, Shadows.sm]}>
                <Text style={styles.monthSummaryTitle}>이번 달 요약</Text>
                <View style={styles.monthSummaryRow}>
                  <View style={styles.monthSummaryStat}>
                    <Text style={styles.monthSummaryNum}>
                      {Array.from(monthScheduleCounts.values()).reduce((a, b) => a + b, 0)}
                    </Text>
                    <Text style={styles.monthSummaryLabel}>총 운행</Text>
                  </View>
                  <View style={styles.monthSummaryStat}>
                    <Text style={styles.monthSummaryNum}>
                      {monthScheduleCounts.size}
                    </Text>
                    <Text style={styles.monthSummaryLabel}>운행일</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </>
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
  dateNavCenter: { flex: 1, alignItems: "center" },
  dateNavLabel: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  dateNavSub: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 2 },

  // Filter
  filterRow: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  filterContent: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.sm },
  filterTab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated },
  filterTabActive: { backgroundColor: Colors.primary },
  filterTabText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.textSecondary },
  filterTabTextActive: { color: Colors.surface, fontWeight: Typography.weights.semibold },

  // List
  list: { padding: Spacing.base, gap: Spacing.sm },

  // Card (daily view)
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  timeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm },
  timeText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  statusPill: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.full },
  statusPillText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  studentName: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  metaInfo: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginBottom: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  metaText: { fontSize: Typography.sizes.sm },
  cancelBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.xs, marginTop: Spacing.md, paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.danger, backgroundColor: Colors.dangerLight, minHeight: 48 },
  cancelText: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.danger },

  // Compact card (weekly view)
  compactCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.xs },
  compactRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  compactTime: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.primary, width: 42 },
  compactName: { flex: 1, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
  compactMeta: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 2, marginLeft: 42 + Spacing.sm },

  // Weekly view
  weekContainer: { padding: Spacing.base, paddingBottom: Spacing.xxl },
  weekDaySection: { marginBottom: Spacing.md },
  weekDayHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.xs, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm, borderRadius: Radius.sm },
  weekDayHeaderToday: { backgroundColor: Colors.primaryLight },
  weekDayName: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.textSecondary, width: 24 },
  weekDayNameToday: { color: Colors.primary },
  weekDayDate: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  weekDayDateToday: { color: Colors.primary, fontWeight: Typography.weights.semibold },
  weekDayCount: { flex: 1, textAlign: "right", fontSize: Typography.sizes.xs, color: Colors.textDisabled },
  weekDayEmpty: { fontSize: Typography.sizes.xs, color: Colors.textDisabled, paddingLeft: Spacing.sm + 24 + Spacing.sm, paddingVertical: Spacing.xs },

  // Monthly view
  monthContainer: { padding: Spacing.base, paddingBottom: Spacing.xxl },
  calendarHeader: { flexDirection: "row", marginBottom: Spacing.xs },
  calendarHeaderText: { flex: 1, textAlign: "center", fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold, color: Colors.textSecondary },
  calendarRow: { flexDirection: "row" },
  calendarCell: { flex: 1, alignItems: "center", paddingVertical: Spacing.sm, minHeight: 56, borderRadius: Radius.sm },
  calendarCellToday: { backgroundColor: Colors.primaryLight },
  calendarDay: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
  calendarDayOther: { color: Colors.textDisabled },
  calendarDayToday: { color: Colors.primary, fontWeight: Typography.weights.bold },
  calendarDots: { flexDirection: "row", gap: 2, marginTop: 3 },
  calendarDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.primary },
  calendarDotMany: { backgroundColor: Colors.statusBoarded },
  calendarCount: { fontSize: 9, color: Colors.textSecondary, marginTop: 1 },

  // Monthly summary
  monthSummary: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base, marginTop: Spacing.lg },
  monthSummaryTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, marginBottom: Spacing.md },
  monthSummaryRow: { flexDirection: "row", justifyContent: "space-around" },
  monthSummaryStat: { alignItems: "center" },
  monthSummaryNum: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.primary },
  monthSummaryLabel: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 2 },

  // Empty State
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.xxl },
  emptyTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textSecondary },
  emptyDesc: { fontSize: Typography.sizes.sm, color: Colors.textDisabled, textAlign: "center", lineHeight: 20 },
});
