import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ConsentScope } from "../../../api/compliance";
import { Student } from "../../../api/students";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../../constants/theme";
import { ALL_ITEMS } from "./ConsentCard";

// ── Header ──────────────────────────────────────────────────────

export function ConsentHeader() {
  return (
    <View style={styles.header}>
      <View style={[styles.iconCircle, { backgroundColor: Colors.primary + "15" }]}>
        <Ionicons name="shield-checkmark" size={36} color={Colors.primary} />
      </View>
      <Text style={styles.title}>이용 동의</Text>
      <Text style={styles.subtitle}>
        서비스 이용을 위해 아래 항목에 동의해 주세요.
      </Text>
    </View>
  );
}

// ── Children label ──────────────────────────────────────────────

export function ChildrenSectionLabel() {
  return (
    <View style={styles.childrenSection}>
      <Text style={styles.childrenLabel}>동의 대상 자녀</Text>
    </View>
  );
}

// ── Child chip (renderItem) ─────────────────────────────────────

interface ChildChipProps {
  student: Student;
}

export function ChildChip({ student }: ChildChipProps) {
  return (
    <View style={[styles.childChip, { marginHorizontal: Spacing.base }]}>
      <View style={styles.childAvatar}>
        <Text style={styles.childAvatarText}>
          {student.name.charAt(0)}
        </Text>
      </View>
      <Text style={styles.childChipText}>{student.name}</Text>
    </View>
  );
}

// ── Toggle all card ─────────────────────────────────────────────

interface ToggleAllProps {
  allChecked: boolean;
  onPress: () => void;
}

export function ToggleAllCard({ allChecked, onPress }: ToggleAllProps) {
  return (
    <Pressable
      style={[styles.toggleAllCard, Shadows.sm]}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel="전체 동의"
      accessibilityState={{ checked: allChecked }}
    >
      <View style={[styles.checkbox, allChecked && styles.checkboxChecked]}>
        {allChecked && (
          <Ionicons name="checkmark" size={16} color={Colors.textInverse} />
        )}
      </View>
      <Text style={styles.toggleAllText}>전체 동의</Text>
    </Pressable>
  );
}

// ── Note ────────────────────────────────────────────────────────

export function ConsentNote() {
  return (
    <Text style={styles.note}>
      필수 항목에 동의하지 않으면 서비스를 이용할 수 없습니다.{"\n"}
      선택 항목은 동의하지 않아도 서비스 이용이 가능합니다.
    </Text>
  );
}

// ── Submit button ───────────────────────────────────────────────

interface SubmitButtonProps {
  disabled: boolean;
  submitting: boolean;
  onPress: () => void;
}

export function SubmitButton({ disabled, submitting, onPress }: SubmitButtonProps) {
  return (
    <Pressable
      style={[
        styles.submitBtn,
        disabled && styles.submitBtnDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || submitting}
      accessibilityRole="button"
      accessibilityLabel="동의하고 시작하기"
    >
      {submitting ? (
        <ActivityIndicator size="small" color={Colors.textInverse} />
      ) : (
        <Text style={styles.submitBtnText}>동의하고 시작하기</Text>
      )}
    </Pressable>
  );
}

// ── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.base,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  // Children section
  childrenSection: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  childrenLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  childChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  childAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  childAvatarText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textInverse,
  },
  childChipText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.primaryDark,
  },

  // Toggle all
  toggleAllCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    padding: Spacing.base,
  },
  toggleAllText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },

  // Checkbox
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  // Note
  note: {
    fontSize: Typography.sizes.xs,
    color: Colors.textDisabled,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },

  // Submit
  submitBtn: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.textDisabled,
  },
  submitBtnText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textInverse,
  },
});
