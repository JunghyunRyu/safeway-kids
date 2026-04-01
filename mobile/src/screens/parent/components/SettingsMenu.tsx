import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../../constants/theme";

interface SettingsMenuProps {
  userRole: string;
  withdrawingConsent: boolean;
  onShowChildProfile: () => void;
  onShowNotifSettings: () => void;
  onShowSupportModal: () => void;
  onShowTickets: () => void;
  onWithdrawConsent: () => void;
}

export default function SettingsMenu({
  userRole,
  withdrawingConsent,
  onShowChildProfile,
  onShowNotifSettings,
  onShowSupportModal,
  onShowTickets,
  onWithdrawConsent,
}: SettingsMenuProps) {
  return (
    <View style={[styles.infoCard, Shadows.sm]}>
      <Text style={styles.infoCardTitle}>설정</Text>
      {userRole === "parent" && (
        <Pressable style={styles.menuRow} onPress={onShowChildProfile} accessibilityRole="button" accessibilityLabel="자녀 관리">
          <Ionicons name="people-outline" size={20} color={Colors.primary} />
          <Text style={styles.menuText}>자녀 관리</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
        </Pressable>
      )}
      <Pressable style={styles.menuRow} onPress={onShowNotifSettings} accessibilityRole="button" accessibilityLabel="알림 설정">
        <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
        <Text style={styles.menuText}>알림 설정</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
      </Pressable>
      <Pressable style={styles.menuRow} onPress={onShowSupportModal} accessibilityRole="button" accessibilityLabel="문의하기">
        <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.primary} />
        <Text style={styles.menuText}>문의하기</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
      </Pressable>
      <Pressable style={styles.menuRow} onPress={onShowTickets} accessibilityRole="button" accessibilityLabel="내 문의 내역 보기">
        <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
        <Text style={styles.menuText}>내 문의 내역</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
      </Pressable>
      <Pressable
        style={styles.menuRow}
        onPress={onWithdrawConsent}
        disabled={withdrawingConsent}
        accessibilityRole="button"
        accessibilityLabel="개인정보 동의 철회"
      >
        <Ionicons name="shield-outline" size={20} color={Colors.danger} />
        <Text style={[styles.menuText, { color: Colors.danger }]}>
          {withdrawingConsent ? "처리 중..." : "개인정보 동의 철회"}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  infoCardTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  menuText: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
  },
});
