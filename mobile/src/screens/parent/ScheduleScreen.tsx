import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import {
  cancelSchedule,
  DailySchedule,
  listDailySchedules,
} from "../../api/schedules";
import { listStudents, Student } from "../../api/students";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function ScheduleScreen() {
  const { t } = useTranslation();
  const [schedules, setSchedules] = useState<DailySchedule[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, s] = await Promise.all([
        listDailySchedules(todayStr()),
        listStudents(),
      ]);
      setSchedules(d);
      setStudents(s);
    } catch {
      // silent
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleCancel = (item: DailySchedule) => {
    Alert.alert(t("schedule.cancelRide"), t("schedule.cancelConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.confirm"),
        style: "destructive",
        onPress: async () => {
          try {
            await cancelSchedule(item.id);
            await load();
          } catch {
            Alert.alert(t("common.error"));
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("schedule.daily")}</Text>

      {schedules.length === 0 ? (
        <Text style={styles.empty}>{t("home.noSchedule")}</Text>
      ) : (
        <FlatList
          data={schedules}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => {
            const student = students.find((s) => s.id === item.student_id);
            const canCancel = item.status === "scheduled";
            return (
              <View style={styles.card}>
                <Text style={styles.studentName}>{student?.name ?? "학생"}</Text>
                <Text style={styles.time}>
                  {t("schedule.pickupTime")}: {item.pickup_time}
                </Text>
                <Text style={styles.status}>
                  {t(`schedule.${item.status}` as any, item.status)}
                </Text>
                {item.boarded_at && (
                  <Text style={styles.time}>탑승: {item.boarded_at}</Text>
                )}
                {item.alighted_at && (
                  <Text style={styles.time}>하차: {item.alighted_at}</Text>
                )}
                {canCancel && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancel(item)}
                  >
                    <Text style={styles.cancelText}>{t("schedule.cancelRide")}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16, marginTop: 40 },
  empty: { fontSize: 14, color: "#888", textAlign: "center", marginTop: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
  },
  studentName: { fontSize: 16, fontWeight: "600" },
  time: { fontSize: 14, color: "#666", marginTop: 4 },
  status: { fontSize: 14, fontWeight: "500", marginTop: 4, color: "#2196F3" },
  cancelBtn: {
    marginTop: 10,
    backgroundColor: "#f44",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelText: { color: "#fff", fontWeight: "bold" },
});
