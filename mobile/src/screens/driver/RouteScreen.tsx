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
  DriverDailySchedule,
  getDriverDailySchedules,
  markAlighted,
  markBoarded,
} from "../../api/schedules";
import { getMyRoute, RoutePlan } from "../../api/routes";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function DriverRouteScreen() {
  const { t } = useTranslation();
  const [schedules, setSchedules] = useState<DriverDailySchedule[]>([]);
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [scheduleData, routeData] = await Promise.all([
        getDriverDailySchedules(todayStr()),
        getMyRoute(todayStr()).catch(() => null),
      ]);

      // If route plan exists, reorder schedules by optimized stop order
      if (routeData && routeData.stops.length > 0) {
        setRoutePlan(routeData);
        const orderMap = new Map(
          routeData.stops.map((s) => [s.stop_id, s.order])
        );
        const sorted = [...scheduleData].sort((a, b) => {
          const orderA = orderMap.get(a.id) ?? 999;
          const orderB = orderMap.get(b.id) ?? 999;
          return orderA - orderB;
        });
        setSchedules(sorted);
      } else {
        setRoutePlan(null);
        setSchedules(scheduleData);
      }
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

  const handleBoard = async (item: DriverDailySchedule) => {
    try {
      await markBoarded(item.id);
      await load();
    } catch {
      Alert.alert(t("common.error"));
    }
  };

  const handleAlight = async (item: DriverDailySchedule) => {
    try {
      await markAlighted(item.id);
      await load();
    } catch {
      Alert.alert(t("common.error"));
    }
  };

  const completedCount = schedules.filter(
    (s) => s.status === "completed"
  ).length;
  const totalActive = schedules.filter(
    (s) => s.status !== "cancelled"
  ).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("driver.stopList")}</Text>

      {/* Route info banner */}
      {routePlan && (
        <View style={styles.routeBanner}>
          <Text style={styles.routeBannerText}>
            AI 최적화 노선 v{routePlan.version}
          </Text>
          <Text style={styles.routeBannerDetail}>
            {routePlan.total_distance_km?.toFixed(1)}km · 약{" "}
            {routePlan.total_duration_min?.toFixed(0)}분 · {completedCount}/
            {totalActive} 완료
          </Text>
        </View>
      )}

      {!routePlan && schedules.length > 0 && (
        <View style={[styles.routeBanner, styles.routeBannerFallback]}>
          <Text style={styles.routeBannerText}>
            픽업 시간순 (최적화 노선 없음)
          </Text>
          <Text style={styles.routeBannerDetail}>
            {completedCount}/{totalActive} 완료
          </Text>
        </View>
      )}

      {schedules.length === 0 ? (
        <Text style={styles.empty}>{t("driver.noAssignment")}</Text>
      ) : (
        <FlatList
          data={schedules}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item, index }) => {
            const isBoarded = !!item.boarded_at;
            const isCompleted = item.status === "completed";
            const isCancelled = item.status === "cancelled";

            return (
              <View style={[styles.card, isCancelled && styles.cardCancelled]}>
                <View
                  style={[
                    styles.indexCircle,
                    isCompleted && styles.indexCircleCompleted,
                  ]}
                >
                  <Text style={styles.indexText}>{index + 1}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.studentName}>{item.student_name}</Text>
                  <Text style={styles.detail}>{item.academy_name}</Text>
                  <Text style={styles.detail}>
                    {t("schedule.pickupTime")}: {item.pickup_time}
                  </Text>

                  {isCancelled ? (
                    <Text style={styles.cancelledText}>
                      {t("schedule.cancelled")}
                    </Text>
                  ) : isCompleted ? (
                    <Text style={styles.completedText}>
                      {t("schedule.completed")}
                    </Text>
                  ) : (
                    <View style={styles.actions}>
                      {!isBoarded ? (
                        <TouchableOpacity
                          style={styles.boardBtn}
                          onPress={() => handleBoard(item)}
                        >
                          <Text style={styles.btnText}>
                            {t("driver.markBoarded")}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.alightBtn}
                          onPress={() => handleAlight(item)}
                        >
                          <Text style={styles.btnText}>
                            {t("driver.markAlighted")}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f0f4e8" },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 40,
    marginBottom: 12,
  },
  routeBanner: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  routeBannerFallback: {
    backgroundColor: "#FFF3E0",
    borderLeftColor: "#FF9800",
  },
  routeBannerText: { fontSize: 13, fontWeight: "600", color: "#333" },
  routeBannerDetail: { fontSize: 12, color: "#666", marginTop: 2 },
  empty: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 40,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },
  cardCancelled: { opacity: 0.5 },
  indexCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 4,
  },
  indexCircleCompleted: { backgroundColor: "#999" },
  indexText: { color: "#fff", fontWeight: "bold" },
  cardBody: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  detail: { fontSize: 13, color: "#666", marginBottom: 2 },
  actions: { flexDirection: "row", marginTop: 8, gap: 8 },
  boardBtn: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  alightBtn: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  cancelledText: { color: "#999", fontStyle: "italic", marginTop: 4 },
  completedText: { color: "#4CAF50", fontWeight: "500", marginTop: 4 },
});
