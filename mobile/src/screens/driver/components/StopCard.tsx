import React, { memo, useCallback } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors, Typography, Spacing, Radius } from "../../../constants/theme";
import { openNavigation } from "../../../utils/navigation";

const UNDO_TIMEOUT_MS = 5 * 60 * 1000;

function fmtTime(t: string): string {
  return t?.length >= 5 ? t.slice(0, 5) : t;
}

function canUndo(timestampStr: string | null): boolean {
  if (!timestampStr) return false;
  const diff = Date.now() - new Date(timestampStr).getTime();
  return diff < UNDO_TIMEOUT_MS;
}

export interface StopCardProps {
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
  onMemo: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export const StopCard = memo(function StopCard({
  id, index, studentName, studentPhotoUrl, academyName,
  pickupTime, pickupAddress, pickupLatitude, pickupLongitude,
  specialNotes, allergies, guardianPhoneMasked,
  status, isBoarded, isCompleted, isCancelled, isNoShow, isNextStop,
  boardedAt, alightedAt, arrivalConfirmedAt, notificationSent,
  onBoard, onAlight, onNoShow, onUndoBoard, onUndoAlight,
  onArrivalConfirm, onMemo, onMoveUp, onMoveDown, canMoveUp, canMoveDown,
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
    <View style={[styles.card, isDone && styles.cardDone, isNextStop && styles.cardNextStop]}>
      {studentPhotoUrl ? (
        <Image source={{ uri: studentPhotoUrl }} style={styles.studentPhoto} accessibilityLabel={`${studentName} 학생 사진`} />
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
        {pickupAddress ? <Text style={styles.detail}>{pickupAddress}</Text> : null}
        <Text style={styles.detail}>{t("schedule.pickupTime")}: {fmtTime(pickupTime)}</Text>
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
          <Pressable style={styles.phoneRow} onPress={handleCallGuardian} accessibilityRole="button" accessibilityLabel="보호자 전화 연결">
            <Ionicons name="call-outline" size={14} color={Colors.info} />
            <Text style={styles.phoneText}>{guardianPhoneMasked}</Text>
          </Pressable>
        ) : null}

        <View style={styles.cardToolRow}>
          <Pressable style={styles.memoBtn} onPress={() => onMemo(id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={`${studentName} 메모 작성`}>
            <Ionicons name="create-outline" size={14} color={Colors.info} />
            <Text style={styles.memoBtnText}>메모</Text>
          </Pressable>
          {(canMoveUp || canMoveDown) && !isDone && (
            <View style={styles.reorderRow}>
              <Pressable style={[styles.reorderBtn, !canMoveUp && styles.disabled]} onPress={onMoveUp} disabled={!canMoveUp} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }} accessibilityRole="button" accessibilityLabel="순서 위로 이동">
                <Ionicons name="chevron-up" size={16} color={canMoveUp ? Colors.info : Colors.textDisabled} />
              </Pressable>
              <Pressable style={[styles.reorderBtn, !canMoveDown && styles.disabled]} onPress={onMoveDown} disabled={!canMoveDown} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }} accessibilityRole="button" accessibilityLabel="순서 아래로 이동">
                <Ionicons name="chevron-down" size={16} color={canMoveDown ? Colors.info : Colors.textDisabled} />
              </Pressable>
            </View>
          )}
        </View>

        {isNoShow ? (
          <Text style={[styles.statusText, { color: Colors.neutral }]}>미탑승</Text>
        ) : isCancelled ? (
          <Text style={[styles.statusText, { color: Colors.neutral }]}>{t("schedule.cancelled")}</Text>
        ) : isCompleted ? (
          <View>
            <Text style={[styles.statusText, { color: Colors.success }]}>{t("schedule.completed")}</Text>
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
              <Pressable style={styles.arrivalBtn} onPress={handleArrivalConfirm} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={`${studentName} 도착 확인`}>
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
              <Pressable style={styles.undoBtn} onPress={handleUndoAlight} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="하차 되돌리기">
                <Text style={styles.undoText}>하차 되돌리기</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.actions}>
            {!isBoarded ? (
              <View style={styles.actionRow}>
                <Pressable style={[styles.actionBtn, { backgroundColor: Colors.info }]} onPress={handleBoard} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={`${studentName} 탑승 처리`}>
                  <Ionicons name="enter-outline" size={16} color={Colors.textInverse} />
                  <Text style={styles.btnText}>{t("driver.markBoarded")}</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, { backgroundColor: Colors.neutral }]} onPress={handleNoShow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={`${studentName} 미탑승 처리`}>
                  <Ionicons name="close-circle-outline" size={16} color={Colors.textInverse} />
                  <Text style={styles.btnText}>미탑승</Text>
                </Pressable>
                <Pressable style={styles.navBtn} onPress={handleNavigate} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={`${studentName} 픽업 장소 길안내`}>
                  <Ionicons name="navigate-outline" size={16} color={Colors.info} />
                  <Text style={styles.navBtnText}>길안내</Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <Pressable style={[styles.actionBtn, { backgroundColor: Colors.warning }]} onPress={handleAlight} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={`${studentName} 하차 처리`}>
                  <Ionicons name="exit-outline" size={16} color={Colors.textInverse} />
                  <Text style={styles.btnText}>{t("driver.markAlighted")}</Text>
                </Pressable>
                {canUndo(boardedAt) && (
                  <Pressable style={styles.undoBtn} onPress={handleUndoBoard} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="탑승 되돌리기">
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

const styles = StyleSheet.create({
  card: { flexDirection: "row", backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md },
  cardDone: { opacity: 0.5 },
  cardNextStop: { borderLeftWidth: 4, borderLeftColor: Colors.primary, backgroundColor: Colors.primaryLight },
  indexCircle: { width: 36, height: 36, borderRadius: Radius.full, justifyContent: "center", alignItems: "center", marginRight: Spacing.md, marginTop: 2 },
  indexText: { color: Colors.textInverse, fontWeight: Typography.weights.bold, fontSize: Typography.sizes.base },
  cardBody: { flex: 1 },
  studentPhoto: { width: 40, height: 40, borderRadius: 20, marginRight: Spacing.md, marginTop: 2 },
  studentName: { fontSize: 18, fontWeight: Typography.weights.semibold, color: Colors.textPrimary, marginBottom: 2 },
  detail: { fontSize: 16, color: Colors.textSecondary, marginBottom: 2 },
  notesRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  notesText: { fontSize: 14, color: Colors.danger, flex: 1 },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  phoneText: { fontSize: 14, color: Colors.info },
  statusText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, marginTop: Spacing.xs },
  actions: { marginTop: Spacing.sm },
  actionRow: { flexDirection: "row", gap: Spacing.sm, flexWrap: "wrap" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderRadius: Radius.md, minHeight: 60 },
  btnText: { color: Colors.textInverse, fontWeight: Typography.weights.semibold, fontSize: 18 },
  navBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.info, minHeight: 60 },
  navBtnText: { color: Colors.info, fontWeight: Typography.weights.semibold, fontSize: 16 },
  notifRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  notifText: { fontSize: 12, fontWeight: Typography.weights.medium },
  arrivalBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: Colors.success, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, marginTop: Spacing.xs },
  arrivalBtnText: { color: Colors.textInverse, fontSize: 14, fontWeight: Typography.weights.semibold },
  undoBtn: { marginTop: Spacing.xs, paddingVertical: Spacing.xs },
  undoText: { color: Colors.textSecondary, fontSize: 14, textDecorationLine: "underline" },
  cardToolRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: Spacing.xs },
  reorderRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  reorderBtn: { padding: 4, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.borderLight },
  memoBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  memoBtnText: { fontSize: 13, color: Colors.info },
  disabled: { opacity: 0.5 },
});
