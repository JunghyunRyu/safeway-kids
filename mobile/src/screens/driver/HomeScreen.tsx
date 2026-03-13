import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { getMyAssignment, VehicleAssignment } from "../../api/vehicles";
import { getDriverDailySchedules, DriverDailySchedule } from "../../api/schedules";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function DriverHomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<VehicleAssignment | null>(null);
  const [schedules, setSchedules] = useState<DriverDailySchedule[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const today = todayStr();
      const [a, s] = await Promise.all([
        getMyAssignment(today),
        getDriverDailySchedules(today),
      ]);
      setAssignment(a);
      setSchedules(s);
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

  const boardedCount = schedules.filter(
    (s) => s.boarded_at !== null || s.status === "completed"
  ).length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.greeting}>
        {t("home.greeting")}, {user?.name}
      </Text>

      <Text style={styles.sectionTitle}>{t("driver.todaySummary")}</Text>

      {!assignment ? (
        <Text style={styles.empty}>{t("driver.noAssignment")}</Text>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("driver.vehicleInfo")}</Text>
            <Text style={styles.cardRow}>
              {t("driver.licensePlate")}: {assignment.license_plate}
            </Text>
            <Text style={styles.cardRow}>
              {t("driver.capacity")}: {assignment.capacity}명
            </Text>
            {assignment.operator_name && (
              <Text style={styles.cardRow}>
                {t("driver.operator")}: {assignment.operator_name}
              </Text>
            )}
            {assignment.safety_escort_name && (
              <Text style={styles.cardRow}>
                {t("driver.safetyEscort")}: {assignment.safety_escort_name}
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t("driver.studentCount")}: {boardedCount}/{schedules.length}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f0f4e8" },
  greeting: { fontSize: 22, fontWeight: "bold", marginTop: 40, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12, color: "#333" },
  empty: { fontSize: 14, color: "#888", textAlign: "center", marginTop: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  cardRow: { fontSize: 14, color: "#555", marginBottom: 4 },
});
