import React, { memo, useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  DriverDailySchedule,
  getDriverDailySchedules,
  markAlighted,
  markBoarded,
} from "../../api/schedules";
import { getMyRoute, RoutePlan } from "../../api/routes";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../constants/theme";

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

  const indexBgColor = isCompleted
    ? Colors.statusCompleted
    : isCancelled
    ? Colors.neutral
    : Colors.roleDriver;

  return (
    <View
      style={[
        styles.card,
        Shadows.sm,
        isCancelled && styles.cardCancelled,
      ]}
    >
      <View style={[styles.indexCircle, { backgroundColor: indexBgColor }]}>
        {isCompleted ? (
          <Ionicons name="checkmark" size={16} color={Colors.textInverse} />
        ) : (
          <Text style={styles.indexText}>{index + 1}</Text>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.studentName}>{studentName}</Text>
        <Text style={styles.detail}>{academyName}</Text>
        <Text style={styles.detail}>
          {t("schedule.pickupTime")}: {fmtTime(pickupTime)}
        </Text>

        {isCancelled ? (
          <Text style={[styles.statusText, { color: Colors.neutral }]}>
            {t("schedule.cancelled")}
          </Text>
        ) : isCompleted ? (
          <Text style={[styles.statusText, { color: Colors.success }]}>
            {t("schedule.completed")}
          </Text>
        ) : (
          <View style={styles.actions}>
            {!isBoarded ? (
              <Pressable
                style={[styles.actionBtn, { backgroundColor: Colors.info }]}
                onPress={handleBoard}
               
              >
                <Ionicons name="enter-outline" size={14} color={Colors.textInverse} />
                <Text style={styles.btnText}>{t("driver.markBoarded")}</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.actionBtn, { backgroundColor: Colors.warning }]}
                onPress={handleAlight}
               
              >
                <Ionicons name="exit-outline" size={14} color={Colors.textInverse} />
                <Text style={styles.btnText}>{t("driver.markAlighted")}</Text>
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

  const completedCount = schedules.filter((s) => s.status === "completed").length;
  const totalActive = schedules.filter((s) => s.status !== "cancelled").length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>{t("driver.stopList")}</Text>
        <View style={[styles.progressBadge, { backgroundColor: Colors.successLight }]}>
          <Text style={[styles.progressText, { color: Colors.success }]}>
            {completedCount}/{totalActive} 완료
          </Text>
        </View>
      </View>

      {/* Route Banner */}
      {routePlan ? (
        <View style={[styles.routeBanner, { borderLeftColor: Colors.success, backgroundColor: Colors.successLight }]}>
          <Ionicons name="navigate" size={14} color={Colors.success} />
          <Text style={[styles.routeBannerText, { color: Colors.success }]}>
            AI 최적화 노선 v{routePlan.version} · {routePlan.total_distance_km?.toFixed(1)}km
          </Text>
        </View>
      ) : schedules.length > 0 ? (
        <View style={[styles.routeBanner, { borderLeftColor: Colors.warning, backgroundColor: Colors.warningLight }]}>
          <Ionicons name="time-outline" size={14} color={Colors.warning} />
          <Text style={[styles.routeBannerText, { color: Colors.warningDark }]}>
            픽업 시간순 (최적화 노선 없음)
          </Text>
        </View>
      ) : null}

      {schedules.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="map-outline" size={56} color={Colors.textDisabled} />
          <Text style={styles.emptyText}>{t("driver.noAssignment")}</Text>
        </View>
      ) : (
        <FlatList
          data={schedules}
          keyExtractor={keyExtractor}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.roleDriver}
            />
          }
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pageTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  progressBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  progressText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  routeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderLeftWidth: 3,
  },
  routeBannerText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  list: { padding: Spacing.base, gap: Spacing.sm },
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  cardCancelled: { opacity: 0.5 },
  indexCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    marginTop: 2,
  },
  indexText: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.bold,
    fontSize: Typography.sizes.base,
  },
  cardBody: { flex: 1 },
  studentName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  detail: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  statusText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginTop: Spacing.xs,
  },
  actions: {
    flexDirection: "row",
    marginTop: Spacing.sm,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    minHeight: 40,
  },
  btnText: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.semibold,
    fontSize: Typography.sizes.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.sizes.base,
    color: Colors.textDisabled,
  },
});
