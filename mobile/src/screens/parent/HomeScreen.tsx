import React, { memo, useCallback, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
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

/** Strip seconds from "HH:MM:SS" → "HH:MM" */
function fmtTime(t: string): string {
  return t?.length >= 5 ? t.slice(0, 5) : t;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#2196F3",
  boarded: "#FF9800",
  completed: "#4CAF50",
  cancelled: "#999",
};

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

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
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.studentName}>{studentName}</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: STATUS_COLORS[status] ?? "#999" },
          ]}
        >
          <Text style={styles.badgeText}>
            {t(`schedule.${status}` as any, status)}
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
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.greeting}>
        {t("home.greeting")}, {user?.name}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t("home.childCount")}: {students.length}명
        </Text>
      </View>

      <Text style={styles.sectionTitle}>{t("home.todaySchedule")}</Text>

      {schedules.length === 0 ? (
        <Text style={styles.empty}>{t("home.noSchedule")}</Text>
      ) : (
        <FlatList
          data={schedules}
          keyExtractor={keyExtractor}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  greeting: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#333" },
  empty: { fontSize: 14, color: "#888", textAlign: "center", marginTop: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
      : { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }),
  } as any,
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  studentName: { fontSize: 16, fontWeight: "600" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  cardTime: { fontSize: 14, color: "#666", marginTop: 6 },
});
