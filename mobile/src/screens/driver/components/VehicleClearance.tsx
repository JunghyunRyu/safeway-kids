import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius } from "../../../constants/theme";

interface ClearanceItem {
  key: string;
  label: string;
}

interface VehicleClearanceProps {
  visible: boolean;
  vehicleId: string | null;
  clearanceItems: ClearanceItem[];
  clearanceChecks: Record<string, boolean>;
  setClearanceChecks: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onShow: () => void;
  onHide: () => void;
  onSubmit: () => void;
}

export function VehicleClearance({
  visible, vehicleId, clearanceItems, clearanceChecks,
  setClearanceChecks, onShow, onHide, onSubmit,
}: VehicleClearanceProps) {
  const allChecked = clearanceItems.length > 0 && clearanceItems.every((item) => clearanceChecks[item.key]);

  return (
    <View style={styles.container}>
      {!visible ? (
        <Pressable style={styles.startBtn} onPress={onShow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="잔류 확인 시작">
          <Ionicons name="shield-checkmark-outline" size={20} color={Colors.textInverse} />
          <Text style={styles.startBtnText}>잔류 확인 시작</Text>
        </Pressable>
      ) : (
        <View>
          <Text style={styles.title}>잔류 확인 체크리스트</Text>
          {clearanceItems.map((item) => (
            <Pressable
              key={item.key}
              style={styles.checklistRow}
              onPress={() => setClearanceChecks((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
              accessibilityRole="button"
              accessibilityLabel={`${item.label} ${clearanceChecks[item.key] ? '체크 해제' : '체크'}`}
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
          <View style={styles.btnRow}>
            <Pressable style={styles.cancelBtn} onPress={onHide} accessibilityRole="button" accessibilityLabel="잔류 확인 취소">
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable
              style={[styles.startBtn, { flex: 1 }, !allChecked && styles.disabled]}
              onPress={onSubmit}
              disabled={!allChecked}
              accessibilityRole="button"
              accessibilityLabel="점검 완료 제출"
            >
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.textInverse} />
              <Text style={styles.startBtnText}>점검 완료 제출</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.borderLight, backgroundColor: Colors.surface },
  title: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  checklistRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  checklistLabel: { fontSize: Typography.sizes.base, color: Colors.textPrimary, flex: 1 },
  checklistChecked: { color: Colors.textSecondary, textDecorationLine: "line-through" },
  btnRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
  cancelBtn: { paddingVertical: Spacing.base, paddingHorizontal: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, justifyContent: "center", alignItems: "center", minHeight: 60 },
  cancelText: { color: Colors.textSecondary, fontWeight: Typography.weights.semibold, fontSize: 16 },
  startBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Colors.success, paddingVertical: Spacing.base, borderRadius: Radius.lg, minHeight: 60 },
  startBtnText: { color: Colors.textInverse, fontWeight: Typography.weights.bold, fontSize: 18 },
  disabled: { opacity: 0.5 },
});
