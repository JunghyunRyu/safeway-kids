import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DailySchedule } from "../../../api/schedules";
import { Student } from "../../../api/students";
import { Colors, Typography, Spacing } from "../../../constants/theme";
import { dateStr, fmtDisplayDate } from "../utils/scheduleHelpers";
import DateNavHeader from "./DateNavHeader";
import ScheduleItem from "./ScheduleItem";

interface DailyViewProps {
  dateOffset: number;
  filteredSchedules: DailySchedule[];
  students: Student[];
  refreshing: boolean;
  onRefresh: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCancel: (id: string) => void;
}

export default function DailyView({
  dateOffset,
  filteredSchedules,
  students,
  refreshing,
  onRefresh,
  onPrev,
  onNext,
  onToday,
  onCancel,
}: DailyViewProps) {
  const dailyLabel = dateOffset === 0 ? "오늘" : dateOffset === -1 ? "어제" : dateOffset === 1 ? "내일" : fmtDisplayDate(dateStr(dateOffset));

  const renderItem = ({ item }: { item: DailySchedule }) => {
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
        onCancel={onCancel}
      />
    );
  };

  return (
    <>
      <DateNavHeader label={dailyLabel} sub={dateStr(dateOffset)} onPrev={onPrev} onNext={onNext} onToday={onToday} />
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
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  list: { padding: Spacing.base, gap: Spacing.sm },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.xxl },
  emptyTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textSecondary },
  emptyDesc: { fontSize: Typography.sizes.sm, color: Colors.textDisabled, textAlign: "center", lineHeight: 20 },
});
