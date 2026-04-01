import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";
import {
  DriverDailySchedule,
  markBoarded, markAlighted, markNoShow,
  undoBoard, undoAlight, confirmArrival,
  startRoute, endRoute, batchBoard,
  createDriverMemo, reorderRoute, submitVehicleClearance,
} from "../../../api/schedules";
import { useTTS } from "../../../hooks/useTTS";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function useRouteActions(
  schedules: DriverDailySchedule[],
  setSchedules: React.Dispatch<React.SetStateAction<DriverDailySchedule[]>>,
  vehicleId: string | null,
  load: () => Promise<void>,
) {
  const { t } = useTranslation();
  const tts = useTTS();

  const [routeActive, setRouteActive] = useState(false);
  const [memoModalId, setMemoModalId] = useState<string | null>(null);
  const [memoText, setMemoText] = useState("");
  const [memoSaving, setMemoSaving] = useState(false);
  const [clearanceChecks, setClearanceChecks] = useState<Record<string, boolean>>({});
  const [showClearance, setShowClearance] = useState(false);

  const handleBoard = useCallback(async (itemId: string) => {
    try {
      await markBoarded(itemId);
      await load();
      const updated = schedules.filter(s => s.id !== itemId);
      const next = updated.find(s => s.status === "scheduled");
      tts.announceAfterAction(next?.student_name ?? null);
    } catch { Alert.alert(t("common.error")); }
  }, [load, t, schedules, tts]);

  const handleAlight = useCallback((itemId: string) => {
    Alert.alert("하차 인수자 확인", "인수자 유형을 선택해 주세요.", [
      { text: "취소", style: "cancel" },
      { text: "보호자 인수", onPress: async () => { try { await markAlighted(itemId, "guardian"); await load(); } catch { Alert.alert(t("common.error")); } } },
      { text: "학원 직원", onPress: async () => { try { await markAlighted(itemId, "academy_staff"); await load(); } catch { Alert.alert(t("common.error")); } } },
      { text: "자가 귀가", onPress: async () => { try { await markAlighted(itemId, "self"); await load(); } catch { Alert.alert(t("common.error")); } } },
    ]);
  }, [load, t]);

  const handleNoShow = useCallback((itemId: string) => {
    Alert.alert("미탑승 사유 선택", "미탑승 사유를 선택해 주세요.", [
      { text: "취소", style: "cancel" },
      { text: "학생 미출현", onPress: async () => { try { await markNoShow(itemId, "student_absent"); await load(); } catch { Alert.alert(t("common.error")); } } },
      { text: "보호자 취소", onPress: async () => { try { await markNoShow(itemId, "parent_cancelled"); await load(); } catch { Alert.alert(t("common.error")); } } },
      { text: "기타", onPress: async () => { try { await markNoShow(itemId, "other"); await load(); } catch { Alert.alert(t("common.error")); } } },
    ]);
  }, [load, t]);

  const handleUndoBoard = useCallback(async (itemId: string) => {
    try { await undoBoard(itemId); await load(); }
    catch { Alert.alert("되돌리기 실패", "5분이 경과하여 되돌릴 수 없습니다."); }
  }, [load]);

  const handleUndoAlight = useCallback(async (itemId: string) => {
    try { await undoAlight(itemId); await load(); }
    catch { Alert.alert("되돌리기 실패", "5분이 경과하여 되돌릴 수 없습니다."); }
  }, [load]);

  const handleArrivalConfirm = useCallback(async (itemId: string) => {
    try { await confirmArrival(itemId); await load(); }
    catch { Alert.alert(t("common.error")); }
  }, [load, t]);

  const handleRouteToggle = useCallback(async () => {
    if (!vehicleId) { Alert.alert("오류", "배정된 차량 정보를 찾을 수 없습니다."); return; }
    try {
      if (routeActive) {
        const unfinished = schedules.filter(s => s.status === "scheduled" || s.status === "boarded");
        if (unfinished.length > 0) {
          Alert.alert("미처리 학생 있음", `아직 ${unfinished.length}명의 학생이 처리되지 않았습니다. 운행을 종료하시겠습니까?`, [
            { text: "취소", style: "cancel" },
            { text: "종료", onPress: async () => { await endRoute(vehicleId, todayStr()); setRouteActive(false); } },
          ]);
          return;
        }
        await endRoute(vehicleId, todayStr());
        setRouteActive(false);
      } else {
        await startRoute(vehicleId, todayStr());
        setRouteActive(true);
      }
    } catch { Alert.alert("오류", "운행 상태 변경에 실패했습니다."); }
  }, [vehicleId, routeActive, schedules]);

  const handleMoveUp = useCallback(async (index: number) => {
    if (index <= 0) return;
    const newSchedules = [...schedules];
    [newSchedules[index - 1], newSchedules[index]] = [newSchedules[index], newSchedules[index - 1]];
    setSchedules(newSchedules);
    try { await reorderRoute(todayStr(), newSchedules.map((s) => s.id)); }
    catch { await load(); }
  }, [schedules, setSchedules, load]);

  const handleMoveDown = useCallback(async (index: number) => {
    if (index >= schedules.length - 1) return;
    const newSchedules = [...schedules];
    [newSchedules[index], newSchedules[index + 1]] = [newSchedules[index + 1], newSchedules[index]];
    setSchedules(newSchedules);
    try { await reorderRoute(todayStr(), newSchedules.map((s) => s.id)); }
    catch { await load(); }
  }, [schedules, setSchedules, load]);

  const handleMemo = useCallback((itemId: string) => { setMemoModalId(itemId); setMemoText(""); }, []);

  const handleMemoSave = useCallback(async () => {
    if (!memoModalId || !memoText.trim()) return;
    setMemoSaving(true);
    try {
      await createDriverMemo(memoModalId, memoText.trim());
      Alert.alert("저장 완료", "메모가 저장되었습니다.");
      setMemoModalId(null); setMemoText("");
    } catch { Alert.alert("오류", "메모 저장에 실패했습니다."); }
    finally { setMemoSaving(false); }
  }, [memoModalId, memoText]);

  const handleBatchBoard = useCallback(async (address: string) => {
    const ids = schedules.filter((s) => s.status === "scheduled" && s.pickup_address === address).map((s) => s.id);
    if (ids.length === 0) return;
    Alert.alert("일괄 탑승", `${address}의 ${ids.length}명을 일괄 탑승 처리하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      { text: "확인", onPress: async () => { try { await batchBoard(ids); await load(); } catch { Alert.alert(t("common.error")); } } },
    ]);
  }, [schedules, load, t]);

  const handleVehicleClearance = useCallback(async () => {
    if (!vehicleId) { Alert.alert("오류", "배정된 차량 정보를 찾을 수 없습니다."); return; }
    const allChecked = Object.keys(clearanceChecks).length > 0;
    if (!allChecked) { Alert.alert("미완료 항목", "모든 체크리스트 항목을 확인해 주세요."); return; }
    Alert.alert("차량 점검 제출", "모든 항목을 확인하고 점검을 완료하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "제출", onPress: async () => {
        try {
          await submitVehicleClearance(vehicleId, todayStr(), { seats_checked: true, trunk_checked: true, locked: true });
          Alert.alert("완료", "차량 점검이 완료되었습니다.");
          setShowClearance(false); setClearanceChecks({});
        } catch { Alert.alert("오류", "차량 점검 기록 저장에 실패했습니다."); }
      } },
    ]);
  }, [vehicleId, clearanceChecks]);

  return {
    tts, routeActive,
    memoModalId, memoText, memoSaving, setMemoText, setMemoModalId,
    clearanceChecks, setClearanceChecks, showClearance, setShowClearance,
    handleBoard, handleAlight, handleNoShow, handleUndoBoard, handleUndoAlight,
    handleArrivalConfirm, handleRouteToggle, handleMoveUp, handleMoveDown,
    handleMemo, handleMemoSave, handleBatchBoard, handleVehicleClearance,
  };
}
