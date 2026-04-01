import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../../constants/theme";
import InfoRow from "../../../components/InfoRow";

const ROLE_LABELS: Record<string, string> = {
  parent: "학부모",
  driver: "기사",
  safety_escort: "안전도우미",
  academy_admin: "학원 관리자",
  platform_admin: "플랫폼 관리자",
};

const ROLE_COLORS: Record<string, string> = {
  parent: Colors.roleParent,
  driver: Colors.roleDriver,
  safety_escort: Colors.roleEscort,
  academy_admin: Colors.roleAdmin,
  platform_admin: Colors.roleAdmin,
};

export { ROLE_LABELS, ROLE_COLORS };

interface ProfileHeaderProps {
  user: { name: string; phone: string; email?: string; role: string } | null;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  const roleColor = user ? (ROLE_COLORS[user.role] ?? Colors.primary) : Colors.primary;
  const initials = user?.name ? user.name.charAt(0) : "?";

  return (
    <>
      {/* 아바타 영역 */}
      <View style={[styles.avatarSection, { backgroundColor: roleColor + "12" }]}>
        <View style={[styles.avatar, { backgroundColor: roleColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        {user && (
          <>
            <Text style={styles.userName}>{user.name}</Text>
            <View style={[styles.rolePill, { backgroundColor: roleColor + "20" }]}>
              <Text style={[styles.roleText, { color: roleColor }]}>
                {ROLE_LABELS[user.role] ?? user.role}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* 정보 카드 */}
      {user && (
        <View style={[styles.infoCard, Shadows.sm]}>
          <Text style={styles.infoCardTitle}>계정 정보</Text>
          <InfoRow icon="call-outline" label="전화번호" value={user.phone} />
          {user.email ? (
            <InfoRow icon="mail-outline" label="이메일" value={user.email} />
          ) : null}
          <InfoRow
            icon="shield-checkmark-outline"
            label="역할"
            value={ROLE_LABELS[user.role] ?? user.role}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: "center",
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    marginBottom: Spacing.base,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: Typography.sizes.display,
    fontWeight: Typography.weights.bold,
    color: Colors.textInverse,
  },
  userName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  rolePill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  roleText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
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
});
