import React, { useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
} from "../../../constants/theme";
import { DAY_NAMES, getCalendarGrid, isSameDay, toDateStr } from "../utils/scheduleHelpers";
import DateNavHeader from "./DateNavHeader";

interface MonthlyViewProps {
  monthDate: { year: number; month: number };
  monthScheduleCounts: Map<string, number>;
  monthLoading: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onDayPress: (dateOffset: number) => void;
}

export default function MonthlyView({
  monthDate,
  monthScheduleCounts,
  monthLoading,
  onPrev,
  onNext,
  onToday,
  onDayPress,
}: MonthlyViewProps) {
  const today = new Date();
  const monthLabel = `${monthDate.year}년 ${monthDate.month + 1}월`;

  const calendarGrid = useMemo(
    () => getCalendarGrid(monthDate.year, monthDate.month),
    [monthDate],
  );

  return (
    <>
      <DateNavHeader label={monthLabel} sub="" onPrev={onPrev} onNext={onNext} onToday={onToday} />
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
                    accessibilityRole="button"
                    accessibilityLabel={`${date.getMonth() + 1}월 ${date.getDate()}일${count > 0 ? ` ${count}건 일정` : ""}`}
                    onPress={() => {
                      // Tap a day -> switch to daily view for that date
                      const diff = Math.round((date.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
                      onDayPress(diff);
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
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.xxl },
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
  monthSummary: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base, marginTop: Spacing.lg },
  monthSummaryTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, marginBottom: Spacing.md },
  monthSummaryRow: { flexDirection: "row", justifyContent: "space-around" },
  monthSummaryStat: { alignItems: "center" },
  monthSummaryNum: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.primary },
  monthSummaryLabel: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 2 },
});
