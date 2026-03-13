import React, { memo, useCallback, useState } from "react";
import {
  Alert,
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
import {
  cancelSchedule,
  DailySchedule,
  listDailySchedules,
} from "../../api/schedules";
import { listStudents, Student } from "../../api/students";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function fmtTime(t: string): string {
  return t?.length >= 5 ? t.slice(0, 5) : t;
}

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

  const handlePress = useCallback(() => {
    onCancel(id);
  }, [id, onCancel]);

  return (
    <View style={styles.card}>
      <Text style={styles.studentName}>{studentName}</Text>
      <Text style={styles.time}>
        {t("schedule.pickupTime")}: {fmtTime(pickupTime)}
      </Text>
      <Text style={styles.status}>
        {t(`schedule.${status}` as any, status)}
      </Text>
      {boardedAt ? <Text style={styles.time}>탑승: {boardedAt}</Text> : null}
      {alightedAt ? <Text style={styles.time}>하차: {alightedAt}</Text> : null}
      {canCancel ? (
        <Pressable style={styles.cancelBtn} onPress={handlePress}>
          <Text style={styles.cancelText}>{t("schedule.cancelRide")}</Text>
        </Pressable>
      ) : null}
    </View>
  );
});

export default function ScheduleScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleCancel = useCallback(
    (itemId: string) => {
      const item = schedules.find((s) => s.id === itemId);
      if (!item) return;

      const doCancel = async () => {
        try {
          await cancelSchedule(item.id);
          await load();
        } catch {
          if (Platform.OS === "web") {
            window.alert("취소 처리에 실패했습니다");
          } else {
            Alert.alert(t("common.error"));
          }
        }
      };

      if (Platform.OS === "web") {
        if (window.confirm(t("schedule.cancelConfirm"))) {
          doCancel();
        }
      } else {
        Alert.alert(t("schedule.cancelRide"), t("schedule.cancelConfirm"), [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("common.confirm"), style: "destructive", onPress: doCancel },
        ]);
      }
    },
    [schedules, load, t]
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

  const keyExtractor = useCallback((item: DailySchedule) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>{t("schedule.daily")}</Text>

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
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
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
