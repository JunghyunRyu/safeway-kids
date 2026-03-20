import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { getMyAssignment, VehicleAssignment } from "../../api/vehicles";
import { getDriverDailySchedules, DriverDailySchedule } from "../../api/schedules";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../constants/theme";
import { showError } from "../../utils/toast";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function DriverHomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
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
      showError('데이터를 불러오는데 실패했습니다');
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

  const boardedCount = schedules.filter(
    (s) => s.boarded_at !== null || s.status === "completed"
  ).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.roleDriver}
        />
      }
    >
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View>
          <Text style={styles.greeting}>
            {t("home.greeting")}, {user?.name}
          </Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
          </Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: Colors.roleDriver + "20" }]}>
          <Text style={[styles.roleBadgeText, { color: Colors.roleDriver }]}>기사</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t("driver.todaySummary")}</Text>

      {!assignment ? (
        <View style={styles.emptyCard}>
          <Ionicons name="bus-outline" size={40} color={Colors.textDisabled} />
          <Text style={styles.emptyText}>{t("driver.noAssignment")}</Text>
        </View>
      ) : (
        <>
          <View style={[styles.card, Shadows.md]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="car-outline" size={20} color={Colors.roleDriver} />
              <Text style={styles.cardTitle}>{t("driver.vehicleInfo")}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("driver.licensePlate")}</Text>
              <Text style={styles.infoValue}>{assignment.license_plate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("driver.capacity")}</Text>
              <Text style={styles.infoValue}>{assignment.capacity}명</Text>
            </View>
            {assignment.operator_name ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t("driver.operator")}</Text>
                <Text style={styles.infoValue}>{assignment.operator_name}</Text>
              </View>
            ) : null}
            {assignment.safety_escort_name ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t("driver.safetyEscort")}</Text>
                <Text style={styles.infoValue}>{assignment.safety_escort_name}</Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.statCard, Shadows.sm]}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{boardedCount}</Text>
              <Text style={styles.statLabel}>탑승</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{schedules.length}</Text>
              <Text style={styles.statLabel}>총 학생</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.success }]}>
                {schedules.filter((s) => s.status === "completed").length}
              </Text>
              <Text style={styles.statLabel}>완료</Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxl },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: Spacing.md,
    marginBottom: Spacing.md,
  },
  greeting: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  date: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  roleBadgeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  sectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  statCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.sm,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xxl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.sizes.base,
    color: Colors.textDisabled,
  },
});
