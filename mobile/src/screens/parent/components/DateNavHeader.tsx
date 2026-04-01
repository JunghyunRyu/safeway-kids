import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  Spacing,
  Radius,
} from "../../../constants/theme";

// ── Date Navigation Header ────────────────────────────────────

interface DateNavHeaderProps {
  label: string;
  sub: string;
  onPrev: () => void;
  onNext: () => void;
  onToday?: () => void;
}

const DateNavHeader = memo(function DateNavHeader({
  label,
  sub,
  onPrev,
  onNext,
  onToday,
}: DateNavHeaderProps) {
  return (
    <View style={styles.dateNav}>
      <Pressable style={styles.dateNavBtn} onPress={onPrev} hitSlop={8} accessibilityRole="button" accessibilityLabel="이전 날짜">
        <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
      </Pressable>
      <Pressable style={styles.dateNavCenter} onPress={onToday} accessibilityRole="button" accessibilityLabel="오늘 날짜로 이동">
        <Text style={styles.dateNavLabel}>{label}</Text>
        <Text style={styles.dateNavSub}>{sub}</Text>
      </Pressable>
      <Pressable style={styles.dateNavBtn} onPress={onNext} hitSlop={8} accessibilityRole="button" accessibilityLabel="다음 날짜">
        <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
      </Pressable>
    </View>
  );
});

export default DateNavHeader;

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dateNavBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceElevated,
  },
  dateNavCenter: { flex: 1, alignItems: "center" },
  dateNavLabel: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  dateNavSub: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 2 },
});
