import React, { memo, useCallback, useState } from "react";
import {
  Alert,
  FlatList,
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
  DriverDailySchedule,
  getDriverDailySchedules,
  markAlighted,
  markBoarded,
} from "../../api/schedules";
import { getMyRoute, RoutePlan } from "../../api/routes";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function fmtTime(t: string): string {
  return t?.length >= 5 ? t.slice(0, 5) : t;
}

interface StopCardProps {
  id: string;
  index: number;
  studentName: string;
  academyName: string;
  pickupTime: string;
  status: string;
  isBoarded: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  onBoard: (id: string) => void;
  onAlight: (id: string) => void;
}

const StopCard = memo(function StopCard({
  id,
  index,
  studentName,
  academyName,
  pickupTime,
  status,
  isBoarded,
  isCompleted,
  isCancelled,
  onBoard,
  onAlight,
}: StopCardProps) {
  const { t } = useTranslation();

  const handleBoard = useCallback(() => onBoard(id), [id, onBoard]);
  const handleAlight = useCallback(() => onAlight(id), [id, onAlight]);

  return (
    <View style={[styles.card, isCancelled ? styles.cardCancelled : undefined]}>
      <View
        style={[
          styles.indexCircle,
          isCompleted ? styles.indexCircleCompleted : undefined,
        ]}
      >
        <Text style={styles.indexText}>{index + 1}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.studentName}>{studentName}</Text>
        <Text style={styles.detail}>{academyName}</Text>
        <Text style={styles.detail}>
          {t("schedule.pickupTime")}: {fmtTime(pickupTime)}
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
              <Pressable style={styles.boardBtn} onPress={handleBoard}>
                <Text style={styles.btnText}>
                  {t("driver.markBoarded")}
                </Text>
              </Pressable>
            ) : (
              <Pressable style={styles.alightBtn} onPress={handleAlight}>
                <Text style={styles.btnText}>
                  {t("driver.markAlighted")}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
});

export default function DriverRouteScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleBoard = useCallback(
    async (itemId: string) => {
      try {
        await markBoarded(itemId);
        await load();
      } catch {
        Alert.alert(t("common.error"));
      }
    },
    [load, t]
  );

  const handleAlight = useCallback(
    async (itemId: string) => {
      try {
        await markAlighted(itemId);
        await load();
      } catch {
        Alert.alert(t("common.error"));
      }
    },
    [load, t]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: DriverDailySchedule; index: number }) => (
      <StopCard
        id={item.id}
        index={index}
        studentName={item.student_name}
        academyName={item.academy_name}
        pickupTime={item.pickup_time}
        status={item.status}
        isBoarded={!!item.boarded_at}
        isCompleted={item.status === "completed"}
        isCancelled={item.status === "cancelled"}
        onBoard={handleBoard}
        onAlight={handleAlight}
      />
    ),
    [handleBoard, handleAlight]
  );

  const keyExtractor = useCallback(
    (item: DriverDailySchedule) => item.id,
    []
  );

  const completedCount = schedules.filter(
    (s) => s.status === "completed"
  ).length;
  const totalActive = schedules.filter(
    (s) => s.status !== "cancelled"
  ).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>{t("driver.stopList")}</Text>

      {/* Route info banner */}
      {routePlan ? (
        <View style={styles.routeBanner}>
          <Text style={styles.routeBannerText}>
            AI 최적화 노선 v{routePlan.version}
          </Text>
          <Text style={styles.routeBannerDetail}>
            {routePlan.total_distance_km?.toFixed(1)}km · 약{" "}
            {Math.round((routePlan.total_distance_km ?? 0) * 2)}분 (운행) · {completedCount}/
            {totalActive} 완료
          </Text>
        </View>
      ) : null}

      {!routePlan && schedules.length > 0 ? (
        <View style={[styles.routeBanner, styles.routeBannerFallback]}>
          <Text style={styles.routeBannerText}>
            픽업 시간순 (최적화 노선 없음)
          </Text>
          <Text style={styles.routeBannerDetail}>
            {completedCount}/{totalActive} 완료
          </Text>
        </View>
      ) : null}

      {schedules.length === 0 ? (
        <Text style={styles.empty}>{t("driver.noAssignment")}</Text>
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
  container: { flex: 1, padding: 20, backgroundColor: "#f0f4e8" },
  title: {
    fontSize: 20,
    fontWeight: "bold",
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
