import React, { useMemo } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import { DailySchedule } from "../../../api/schedules";
import { Student } from "../../../api/students";
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
} from "../../../constants/theme";
import { DAY_NAMES, getWeekDates, isSameDay, toDateStr } from "../utils/scheduleHelpers";
import DateNavHeader from "./DateNavHeader";
import ScheduleItem from "./ScheduleItem";

interface WeeklyViewProps {
  weekOffset: number;
  weekSchedules: Map<string, DailySchedule[]>;
  students: Student[];
  weekLoading: boolean;
  refreshing: boolean;
  selectedStudentId: string | null;
  onRefresh: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCancel: (id: string) => void;
}

export default function WeeklyView({
  weekOffset,
  weekSchedules,
  students,
  weekLoading,
  refreshing,
  selectedStudentId,
  onRefresh,
  onPrev,
  onNext,
  onToday,
  onCancel,
}: WeeklyViewProps) {
  const today = new Date();

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

  return (
    <>
      <DateNavHeader
        label={weekOffset === 0 ? "이번 주" : weekLabel}
        sub={weekLabel}
        onPrev={onPrev}
        onNext={onNext}
        onToday={onToday}
      />
      {weekLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.weekContainer} refreshControl={
          <FlatList
            data={[]}
            keyExtractor={(_item, index) => index.toString()}
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
                        onCancel={onCancel}
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
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.xxl },
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
});
