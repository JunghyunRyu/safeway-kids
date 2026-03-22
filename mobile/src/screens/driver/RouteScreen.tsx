import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Linking,
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
  markNoShow,
  undoBoard,
  undoAlight,
  submitVehicleClearance,
  confirmArrival,
  startRoute,
  endRoute,
} from "../../api/schedules";
import { getMyRoute, RoutePlan } from "../../api/routes";
import { getMyAssignment } from "../../api/vehicles";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../constants/theme";
import { showError } from "../../utils/toast";
import { openNavigation } from "../../utils/navigation";

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
  studentPhotoUrl: string | null;
  academyName: string;
  pickupTime: string;
  pickupAddress: string | null;
  pickupLatitude: number;
  pickupLongitude: number;
  specialNotes: string | null;
  allergies: string | null;
  guardianPhoneMasked: string | null;
  status: string;
  isBoarded: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  isNoShow: boolean;
  isNextStop: boolean;
  boardedAt: string | null;
  alightedAt: string | null;
  arrivalConfirmedAt: string | null;
  notificationSent: boolean | null;
  onBoard: (id: string) => void;
  onAlight: (id: string) => void;
  onNoShow: (id: string) => void;
  onUndoBoard: (id: string) => void;
  onUndoAlight: (id: string) => void;
  onArrivalConfirm: (id: string) => void;
}

const UNDO_TIMEOUT_MS = 5 * 60 * 1000;

function canUndo(timestampStr: string | null): boolean {
  if (!timestampStr) return false;
  const diff = Date.now() - new Date(timestampStr).getTime();
  return diff < UNDO_TIMEOUT_MS;
}

const StopCard = memo(function StopCard({
  id,
  index,
  studentName,
  studentPhotoUrl,
  academyName,
  pickupTime,
  pickupAddress,
  pickupLatitude,
  pickupLongitude,
  specialNotes,
  allergies,
  guardianPhoneMasked,
  status,
  isBoarded,
  isCompleted,
  isCancelled,
  isNoShow,
  isNextStop,
  boardedAt,
  alightedAt,
  arrivalConfirmedAt,
  notificationSent,
  onBoard,
  onAlight,
  onNoShow,
  onUndoBoard,
  onUndoAlight,
  onArrivalConfirm,
}: StopCardProps) {
  const { t } = useTranslation();

  const handleBoard = useCallback(() => {
    Alert.alert("탑승 확인", `${studentName} 학생 탑승 처리하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      { text: "확인", onPress: () => onBoard(id) },
    ]);
  }, [id, studentName, onBoard]);

  const handleAlight = useCallback(() => {
    Alert.alert("하차 확인", `${studentName} 학생 하차 처리하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      { text: "확인", onPress: () => onAlight(id) },
    ]);
  }, [id, studentName, onAlight]);

  const handleNoShow = useCallback(() => {
    Alert.alert("미탑승 처리", `${studentName} 학생 미탑승 처리하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      { text: "학생 미출현", onPress: () => onNoShow(id) },
    ]);
  }, [id, studentName, onNoShow]);

  const handleUndoBoard = useCallback(() => onUndoBoard(id), [id, onUndoBoard]);
  const handleUndoAlight = useCallback(() => onUndoAlight(id), [id, onUndoAlight]);

  const handleArrivalConfirm = useCallback(() => {
    Alert.alert("도착 확인", `${studentName} 학생이 학원에 안전하게 도착했습니까?`, [
      { text: "취소", style: "cancel" },
      { text: "확인", onPress: () => onArrivalConfirm(id) },
    ]);
  }, [id, studentName, onArrivalConfirm]);

  const handleNavigate = useCallback(() => {
    openNavigation(pickupLatitude, pickupLongitude, pickupAddress || studentName);
  }, [pickupLatitude, pickupLongitude, pickupAddress, studentName]);

  const handleCallGuardian = useCallback(() => {
    if (guardianPhoneMasked) {
      Alert.alert("전화 연결 불가", "보호자 전화번호가 마스킹 처리되어 있습니다. 관리자에게 문의해 주세요.");
    }
  }, [guardianPhoneMasked]);

  const indexBgColor = isCompleted
    ? Colors.statusCompleted
    : isCancelled || isNoShow
    ? Colors.neutral
    : Colors.roleDriver;

  const isDone = isCompleted || isCancelled || isNoShow;

  return (
    <View
      style={[
        styles.card,
        Shadows.sm,
        isDone && styles.cardDone,
        isNextStop && styles.cardNextStop,
      ]}
    >
      {/* Student Photo or Index */}
      {studentPhotoUrl ? (
        <Image source={{ uri: studentPhotoUrl }} style={styles.studentPhoto} />
      ) : (
        <View style={[styles.indexCircle, { backgroundColor: indexBgColor }]}>
          {isCompleted ? (
            <Ionicons name="checkmark" size={16} color={Colors.textInverse} />
          ) : (
            <Text style={styles.indexText}>{index + 1}</Text>
          )}
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.studentName}>{studentName}</Text>
        <Text style={styles.detail}>{academyName}</Text>
        {pickupAddress ? (
          <Text style={styles.detail}>{pickupAddress}</Text>
        ) : null}
        <Text style={styles.detail}>
          {t("schedule.pickupTime")}: {fmtTime(pickupTime)}
        </Text>
        {specialNotes ? (
          <View style={styles.notesRow}>
            <Ionicons name="alert-circle" size={14} color={Colors.danger} />
            <Text style={styles.notesText}>{specialNotes}</Text>
          </View>
        ) : null}
        {allergies ? (
          <View style={styles.notesRow}>
            <Ionicons name="alert-circle" size={14} color={Colors.danger} />
            <Text style={styles.notesText}>알레르기: {allergies}</Text>
          </View>
        ) : null}
        {guardianPhoneMasked ? (
          <Pressable style={styles.phoneRow} onPress={handleCallGuardian}>
            <Ionicons name="call-outline" size={14} color={Colors.info} />
            <Text style={styles.phoneText}>{guardianPhoneMasked}</Text>
          </Pressable>
        ) : null}

        {isNoShow ? (
          <Text style={[styles.statusText, { color: Colors.neutral }]}>미탑승</Text>
        ) : isCancelled ? (
          <Text style={[styles.statusText, { color: Colors.neutral }]}>
            {t("schedule.cancelled")}
          </Text>
        ) : isCompleted ? (
          <View>
            <Text style={[styles.statusText, { color: Colors.success }]}>
              {t("schedule.completed")}
            </Text>
            {notificationSent === true && (
              <View style={styles.notifRow}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                <Text style={[styles.notifText, { color: Colors.success }]}>알림 전송됨</Text>
              </View>
            )}
            {notificationSent === false && (
              <View style={styles.notifRow}>
                <Ionicons name="warning" size={14} color={Colors.danger} />
                <Text style={[styles.notifText, { color: Colors.danger }]}>알림 전송 실패</Text>
              </View>
            )}
            {!arrivalConfirmedAt ? (
              <Pressable
                style={[styles.arrivalBtn]}
                onPress={handleArrivalConfirm}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="location" size={14} color={Colors.textInverse} />
                <Text style={styles.arrivalBtnText}>도착 확인</Text>
              </Pressable>
            ) : (
              <View style={styles.notifRow}>
                <Ionicons name="checkmark-done" size={14} color={Colors.success} />
                <Text style={[styles.notifText, { color: Colors.success }]}>학원 도착 확인됨</Text>
              </View>
            )}
            {canUndo(alightedAt) && (
              <Pressable style={styles.undoBtn} onPress={handleUndoAlight} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.undoText}>하차 되돌리기</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.actions}>
            {!isBoarded ? (
              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: Colors.info }]}
                  onPress={handleBoard}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="enter-outline" size={16} color={Colors.textInverse} />
                  <Text style={styles.btnText}>{t("driver.markBoarded")}</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: Colors.neutral }]}
                  onPress={handleNoShow}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle-outline" size={16} color={Colors.textInverse} />
                  <Text style={styles.btnText}>미탑승</Text>
                </Pressable>
                <Pressable
                  style={[styles.navBtn]}
                  onPress={handleNavigate}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="navigate-outline" size={16} color={Colors.info} />
                  <Text style={styles.navBtnText}>길안내</Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: Colors.warning }]}
                  onPress={handleAlight}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="exit-outline" size={16} color={Colors.textInverse} />
                  <Text style={styles.btnText}>{t("driver.markAlighted")}</Text>
                </Pressable>
                {canUndo(boardedAt) && (
                  <Pressable style={styles.undoBtn} onPress={handleUndoBoard} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.undoText}>탑승 되돌리기</Text>
                  </Pressable>
                )}
              </View>
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
      showError('경로 데이터를 불러오는데 실패했습니다');
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

  const handleNoShow = useCallback(
    (itemId: string) => {
      Alert.alert("미탑승 사유 선택", "미탑승 사유를 선택해 주세요.", [
        { text: "취소", style: "cancel" },
        {
          text: "학생 미출현",
          onPress: async () => {
            try { await markNoShow(itemId, "student_absent"); await load(); }
            catch { Alert.alert(t("common.error")); }
          },
        },
        {
          text: "보호자 취소",
          onPress: async () => {
            try { await markNoShow(itemId, "parent_cancelled"); await load(); }
            catch { Alert.alert(t("common.error")); }
          },
        },
        {
          text: "기타",
          onPress: async () => {
            try { await markNoShow(itemId, "other"); await load(); }
            catch { Alert.alert(t("common.error")); }
          },
        },
      ]);
    },
    [load, t]
  );

  const handleUndoBoard = useCallback(
    async (itemId: string) => {
      try {
        await undoBoard(itemId);
        await load();
      } catch {
        Alert.alert("되돌리기 실패", "5분이 경과하여 되돌릴 수 없습니다.");
      }
    },
    [load]
  );

  const handleUndoAlight = useCallback(
    async (itemId: string) => {
      try {
        await undoAlight(itemId);
        await load();
      } catch {
        Alert.alert("되돌리기 실패", "5분이 경과하여 되돌릴 수 없습니다.");
      }
    },
    [load]
  );

  const [routeActive, setRouteActive] = useState(false);

  const handleRouteToggle = useCallback(async () => {
    if (!vehicleId) {
      Alert.alert("오류", "배정된 차량 정보를 찾을 수 없습니다.");
      return;
    }
    try {
      if (routeActive) {
        const unfinished = schedules.filter(s => s.status === "scheduled" || s.status === "boarded");
        if (unfinished.length > 0) {
          Alert.alert(
            "미처리 학생 있음",
            `아직 ${unfinished.length}명의 학생이 처리되지 않았습니다. 운행을 종료하시겠습니까?`,
            [
              { text: "취소", style: "cancel" },
              { text: "종료", onPress: async () => {
                await endRoute(vehicleId, todayStr());
                setRouteActive(false);
              }},
            ]
          );
          return;
        }
        await endRoute(vehicleId, todayStr());
        setRouteActive(false);
      } else {
        await startRoute(vehicleId, todayStr());
        setRouteActive(true);
      }
    } catch {
      Alert.alert("오류", "운행 상태 변경에 실패했습니다.");
    }
  }, [vehicleId, routeActive, schedules]);

  const [clearanceChecks, setClearanceChecks] = useState<Record<string, boolean>>({});
  const [showClearance, setShowClearance] = useState(false);

  const clearanceItems = React.useMemo(() => {
    const studentItems = schedules
      .filter((s) => s.status !== "cancelled")
      .map((s) => ({ key: `seat_${s.id}`, label: `좌석: ${s.student_name} 하차 확인` }));
    return [
      ...studentItems,
      { key: "trunk", label: "트렁크 잔류물/학생 없음 확인" },
      { key: "locked", label: "차량 잠금 확인" },
    ];
  }, [schedules]);

  const allClearanceChecked = clearanceItems.length > 0 && clearanceItems.every((item) => clearanceChecks[item.key]);

  const handleVehicleClearance = useCallback(async () => {
    if (!vehicleId) {
      Alert.alert("오류", "배정된 차량 정보를 찾을 수 없습니다.");
      return;
    }
    if (!allClearanceChecked) {
      Alert.alert("미완료 항목", "모든 체크리스트 항목을 확인해 주세요.");
      return;
    }
    Alert.alert("차량 점검 제출", "모든 항목을 확인하고 점검을 완료하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "제출",
        onPress: async () => {
          try {
            await submitVehicleClearance(vehicleId, todayStr(), {
              seats_checked: true,
              trunk_checked: true,
              locked: true,
            });
            Alert.alert("완료", "차량 점검이 완료되었습니다.");
            setShowClearance(false);
            setClearanceChecks({});
          } catch {
            Alert.alert("오류", "차량 점검 기록 저장에 실패했습니다.");
          }
        },
      },
    ]);
  }, [vehicleId, allClearanceChecked]);

  const firstScheduledIdx = schedules.findIndex(s => s.status === "scheduled");

  const handleArrivalConfirm = useCallback(
    async (itemId: string) => {
      try {
        await confirmArrival(itemId);
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
        studentPhotoUrl={item.student_photo_url}
        academyName={item.academy_name}
        pickupTime={item.pickup_time}
        pickupAddress={item.pickup_address}
        pickupLatitude={item.pickup_latitude}
        pickupLongitude={item.pickup_longitude}
        specialNotes={item.special_notes}
        allergies={item.allergies}
        guardianPhoneMasked={item.guardian_phone_masked}
        status={item.status}
        isBoarded={!!item.boarded_at}
        isCompleted={item.status === "completed"}
        isCancelled={item.status === "cancelled"}
        isNoShow={item.status === "no_show"}
        isNextStop={index === firstScheduledIdx}
        boardedAt={item.boarded_at}
        alightedAt={item.alighted_at}
        arrivalConfirmedAt={item.arrival_confirmed_at}
        notificationSent={item.notification_sent}
        onBoard={handleBoard}
        onAlight={handleAlight}
        onNoShow={handleNoShow}
        onUndoBoard={handleUndoBoard}
        onUndoAlight={handleUndoAlight}
        onArrivalConfirm={handleArrivalConfirm}
      />
    ),
    [handleBoard, handleAlight, handleNoShow, handleUndoBoard, handleUndoAlight, handleArrivalConfirm, firstScheduledIdx]
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={[styles.progressBadge, { backgroundColor: Colors.successLight }]}>
            <Text style={[styles.progressText, { color: Colors.success }]}>
              {completedCount}/{totalActive} 완료
            </Text>
          </View>
          {schedules.length > 0 && (
            <Pressable
              style={[styles.routeToggleBtn, { backgroundColor: routeActive ? Colors.danger : Colors.success }]}
              onPress={handleRouteToggle}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name={routeActive ? "stop-circle" : "play-circle"} size={16} color={Colors.textInverse} />
              <Text style={styles.routeToggleText}>{routeActive ? "운행 종료" : "운행 시작"}</Text>
            </Pressable>
          )}
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
        <>
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
          {/* Vehicle Clearance - shown when all active schedules are done */}
          {totalActive > 0 && completedCount + schedules.filter(s => s.status === "no_show").length >= totalActive && (
            <View style={styles.clearanceContainer}>
              {!showClearance ? (
                <Pressable style={styles.clearanceBtn} onPress={() => { setClearanceChecks({}); setShowClearance(true); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={Colors.textInverse} />
                  <Text style={styles.clearanceBtnText}>잔류 확인 시작</Text>
                </Pressable>
              ) : (
                <View>
                  <Text style={styles.clearanceTitle}>잔류 확인 체크리스트</Text>
                  {clearanceItems.map((item) => (
                    <Pressable
                      key={item.key}
                      style={styles.checklistRow}
                      onPress={() => setClearanceChecks((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                    >
                      <Ionicons
                        name={clearanceChecks[item.key] ? "checkbox" : "square-outline"}
                        size={24}
                        color={clearanceChecks[item.key] ? Colors.success : Colors.textDisabled}
                      />
                      <Text style={[styles.checklistLabel, clearanceChecks[item.key] && styles.checklistChecked]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                  <View style={styles.clearanceBtnRow}>
                    <Pressable style={styles.clearanceCancelBtn} onPress={() => setShowClearance(false)}>
                      <Text style={styles.clearanceCancelText}>취소</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.clearanceBtn, { flex: 1 }, !allClearanceChecked && styles.disabled]}
                      onPress={handleVehicleClearance}
                      disabled={!allClearanceChecked}
                    >
                      <Ionicons name="shield-checkmark-outline" size={20} color={Colors.textInverse} />
                      <Text style={styles.clearanceBtnText}>점검 완료 제출</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}
        </>
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
  cardDone: { opacity: 0.5 },
  cardNextStop: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
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
  studentPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.md,
    marginTop: 2,
  },
  studentName: {
    fontSize: 18,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  detail: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  notesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  notesText: {
    fontSize: 14,
    color: Colors.danger,
    flex: 1,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  phoneText: {
    fontSize: 14,
    color: Colors.info,
  },
  statusText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginTop: Spacing.xs,
  },
  actions: {
    marginTop: Spacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    minHeight: 60,
  },
  btnText: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.semibold,
    fontSize: 18,
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.info,
    minHeight: 60,
  },
  navBtnText: {
    color: Colors.info,
    fontWeight: Typography.weights.semibold,
    fontSize: 16,
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  notifText: {
    fontSize: 12,
    fontWeight: Typography.weights.medium,
  },
  arrivalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  arrivalBtnText: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: Typography.weights.semibold,
  },
  undoBtn: {
    marginTop: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  undoText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  clearanceContainer: {
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  clearanceTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  checklistLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    flex: 1,
  },
  checklistChecked: {
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
  },
  clearanceBtnRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  clearanceCancelBtn: {
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 60,
  },
  clearanceCancelText: {
    color: Colors.textSecondary,
    fontWeight: Typography.weights.semibold,
    fontSize: 16,
  },
  clearanceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.success,
    paddingVertical: Spacing.base,
    borderRadius: Radius.lg,
    minHeight: 60,
  },
  clearanceBtnText: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.bold,
    fontSize: 18,
  },
  disabled: { opacity: 0.5 },
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
  routeToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  routeToggleText: {
    color: Colors.textInverse,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
});
