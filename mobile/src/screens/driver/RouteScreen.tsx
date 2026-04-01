import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { DriverDailySchedule, getDriverDailySchedules } from "../../api/schedules";
import { getMyRoute, RoutePlan } from "../../api/routes";
import { getMyAssignment } from "../../api/vehicles";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../constants/theme";
import { showError } from "../../utils/toast";
import { StopCard } from "./components/StopCard";
import { VehicleClearance } from "./components/VehicleClearance";
import { MemoModal } from "./components/MemoModal";
import { useRouteActions } from "./hooks/useRouteActions";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function DriverRouteScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [schedules, setSchedules] = useState<DriverDailySchedule[]>([]);
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [scheduleData, routeData, assignmentData] = await Promise.all([
        getDriverDailySchedules(todayStr()),
        getMyRoute(todayStr()).catch(() => null),
        getMyAssignment(todayStr()).catch(() => null),
      ]);
      setVehicleId(assignmentData?.vehicle_id ?? null);
      if (routeData && routeData.stops.length > 0) {
        setRoutePlan(routeData);
        const orderMap = new Map(routeData.stops.map((s) => [s.stop_id, s.order]));
        const sorted = [...scheduleData].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
        setSchedules(sorted);
      } else {
        setRoutePlan(null);
        setSchedules(scheduleData);
      }
    } catch { showError("경로 데이터를 불러오는데 실패했습니다"); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await load(); setRefreshing(false);
  }, [load]);

  const actions = useRouteActions(schedules, setSchedules, vehicleId, load);

  // Polling for real-time updates
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    pollingRef.current = setInterval(() => { load(); }, 30000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [load]);

  // TTS next stop announcement
  const firstScheduledIdx = schedules.findIndex(s => s.status === "scheduled");
  useEffect(() => {
    if (schedules.length > 0 && firstScheduledIdx >= 0) {
      const nextStop = schedules[firstScheduledIdx];
      actions.tts.announceNextStop(nextStop.student_name, nextStop.pickup_address);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstScheduledIdx]);

  // Clearance items
  const clearanceItems = useMemo(() => {
    const studentItems = schedules
      .filter((s) => s.status !== "cancelled")
      .map((s) => ({ key: `seat_${s.id}`, label: `좌석: ${s.student_name} 하차 확인` }));
    return [...studentItems, { key: "trunk", label: "트렁크 잔류물/학생 없음 확인" }, { key: "locked", label: "차량 잠금 확인" }];
  }, [schedules]);

  // Computed values
  const completedCount = schedules.filter((s) => s.status === "completed").length;
  const totalActive = schedules.filter((s) => s.status !== "cancelled").length;
  const noShowCount = schedules.filter((s) => s.status === "no_show").length;
  const cancelledCount = schedules.filter((s) => s.status === "cancelled").length;
  const allDone = totalActive > 0 && completedCount + noShowCount >= totalActive;

  const batchGroups = useMemo(() => {
    const groups = new Map<string, number>();
    for (const s of schedules) {
      if (s.status === "scheduled" && s.pickup_address) groups.set(s.pickup_address, (groups.get(s.pickup_address) ?? 0) + 1);
    }
    return Array.from(groups.entries()).filter(([, count]) => count >= 2);
  }, [schedules]);

  const renderItem = useCallback(({ item, index }: { item: DriverDailySchedule; index: number }) => (
    <StopCard
      id={item.id} index={index} studentName={item.student_name} studentPhotoUrl={item.student_photo_url}
      academyName={item.academy_name} pickupTime={item.pickup_time} pickupAddress={item.pickup_address}
      pickupLatitude={item.pickup_latitude} pickupLongitude={item.pickup_longitude}
      specialNotes={item.special_notes} allergies={item.allergies} guardianPhoneMasked={item.guardian_phone_masked}
      status={item.status} isBoarded={!!item.boarded_at} isCompleted={item.status === "completed"}
      isCancelled={item.status === "cancelled"} isNoShow={item.status === "no_show"} isNextStop={index === firstScheduledIdx}
      boardedAt={item.boarded_at} alightedAt={item.alighted_at} arrivalConfirmedAt={item.arrival_confirmed_at}
      notificationSent={item.notification_sent}
      onBoard={actions.handleBoard} onAlight={actions.handleAlight} onNoShow={actions.handleNoShow}
      onUndoBoard={actions.handleUndoBoard} onUndoAlight={actions.handleUndoAlight}
      onArrivalConfirm={actions.handleArrivalConfirm} onMemo={actions.handleMemo}
      onMoveUp={() => actions.handleMoveUp(index)} onMoveDown={() => actions.handleMoveDown(index)}
      canMoveUp={index > 0} canMoveDown={index < schedules.length - 1}
    />
  ), [actions, firstScheduledIdx, schedules.length]);

  const keyExtractor = useCallback((item: DriverDailySchedule) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>{t("driver.stopList")}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={[styles.progressBadge, { backgroundColor: Colors.successLight }]}>
            <Text style={[styles.progressText, { color: Colors.success }]}>{completedCount}/{totalActive} 완료</Text>
          </View>
          <Pressable style={[styles.toggleBtn, { backgroundColor: actions.tts.enabled ? Colors.info : Colors.neutral }]} onPress={actions.tts.toggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={actions.tts.enabled ? "음성 안내 끄기" : "음성 안내 켜기"}>
            <Ionicons name={actions.tts.enabled ? "volume-high" : "volume-mute"} size={16} color={Colors.textInverse} />
          </Pressable>
          {schedules.length > 0 && (
            <Pressable style={[styles.toggleBtn, { backgroundColor: actions.routeActive ? Colors.danger : Colors.success }]} onPress={actions.handleRouteToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={actions.routeActive ? "운행 종료" : "운행 시작"}>
              <Ionicons name={actions.routeActive ? "stop-circle" : "play-circle"} size={16} color={Colors.textInverse} />
              <Text style={styles.toggleText}>{actions.routeActive ? "운행 종료" : "운행 시작"}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Route Banner */}
      {routePlan ? (
        <View style={[styles.banner, { borderLeftColor: Colors.success, backgroundColor: Colors.successLight }]}>
          <Ionicons name="navigate" size={14} color={Colors.success} />
          <Text style={[styles.bannerText, { color: Colors.success }]}>AI 최적화 노선 v{routePlan.version} · {routePlan.total_distance_km?.toFixed(1)}km</Text>
        </View>
      ) : schedules.length > 0 ? (
        <View style={[styles.banner, { borderLeftColor: Colors.warning, backgroundColor: Colors.warningLight }]}>
          <Ionicons name="time-outline" size={14} color={Colors.warning} />
          <Text style={[styles.bannerText, { color: Colors.warningDark }]}>픽업 시간순 (최적화 노선 없음)</Text>
        </View>
      ) : null}

      {/* Batch Board */}
      {batchGroups.length > 0 && (
        <View style={styles.batchContainer}>
          {batchGroups.map(([address, count]) => (
            <Pressable key={address} style={styles.batchBtn} onPress={() => actions.handleBatchBoard(address)} accessibilityRole="button" accessibilityLabel={`${address} ${count}명 일괄 탑승`}>
              <Ionicons name="people" size={16} color={Colors.textInverse} />
              <Text style={styles.batchBtnText}>일괄 탑승 ({count}명) - {address.length > 15 ? address.slice(0, 15) + "..." : address}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Main List */}
      {schedules.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="map-outline" size={56} color={Colors.textDisabled} />
          <Text style={styles.emptyText}>{t("driver.noAssignment")}</Text>
        </View>
      ) : (
        <>
          <FlatList data={schedules} keyExtractor={keyExtractor} renderItem={renderItem} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.roleDriver} />} />
          {allDone && (
            <VehicleClearance
              visible={actions.showClearance} vehicleId={vehicleId} clearanceItems={clearanceItems}
              clearanceChecks={actions.clearanceChecks} setClearanceChecks={actions.setClearanceChecks}
              onShow={() => { actions.setClearanceChecks({}); actions.setShowClearance(true); }}
              onHide={() => actions.setShowClearance(false)} onSubmit={actions.handleVehicleClearance}
            />
          )}
        </>
      )}

      {/* Daily Summary */}
      {schedules.length > 0 && allDone && (
        <View style={[styles.summaryContainer, Shadows.sm]}>
          <Text style={styles.summaryTitle}>오늘 운행 요약</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}><Text style={styles.summaryValue}>{totalActive}</Text><Text style={styles.summaryLabel}>총 학생</Text></View>
            <View style={styles.summaryItem}><Text style={[styles.summaryValue, { color: Colors.success }]}>{completedCount}</Text><Text style={styles.summaryLabel}>완료</Text></View>
            <View style={styles.summaryItem}><Text style={[styles.summaryValue, { color: Colors.warning }]}>{noShowCount}</Text><Text style={styles.summaryLabel}>미탑승</Text></View>
            <View style={styles.summaryItem}><Text style={[styles.summaryValue, { color: Colors.neutral }]}>{cancelledCount}</Text><Text style={styles.summaryLabel}>취소</Text></View>
          </View>
        </View>
      )}

      {/* Memo Modal */}
      <MemoModal
        visible={actions.memoModalId !== null} text={actions.memoText} saving={actions.memoSaving}
        onChangeText={actions.setMemoText} onSave={actions.handleMemoSave} onClose={() => actions.setMemoModalId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  pageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.base, paddingTop: Spacing.lg, paddingBottom: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  pageTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  progressBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
  progressText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  toggleBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
  toggleText: { color: Colors.textInverse, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  banner: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderLeftWidth: 3 },
  bannerText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },
  list: { padding: Spacing.base, gap: Spacing.sm },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.sm },
  emptyText: { fontSize: Typography.sizes.base, color: Colors.textDisabled },
  batchContainer: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.xs, backgroundColor: Colors.infoLight, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  batchBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Colors.info, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base, borderRadius: Radius.md },
  batchBtnText: { color: Colors.textInverse, fontWeight: Typography.weights.semibold, fontSize: Typography.sizes.sm },
  summaryContainer: { backgroundColor: Colors.surface, margin: Spacing.base, borderRadius: Radius.lg, padding: Spacing.base },
  summaryTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: Spacing.md, textAlign: "center" },
  summaryGrid: { flexDirection: "row", justifyContent: "space-around" },
  summaryItem: { alignItems: "center" },
  summaryValue: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  summaryLabel: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 2 },
});
