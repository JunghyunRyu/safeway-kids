import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import InfoRow from "../../components/InfoRow";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../constants/theme";

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

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const roleColor = user ? (ROLE_COLORS[user.role] ?? Colors.primary) : Colors.primary;
  const initials = user?.name ? user.name.charAt(0) : "?";

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("로그아웃 하시겠습니까?")) signOut();
    } else {
      Alert.alert(t("auth.logout"), "정말 로그아웃 하시겠습니까?", [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("common.confirm"), style: "destructive", onPress: signOut },
      ]);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
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

      {/* 앱 정보 카드 */}
      <View style={[styles.infoCard, Shadows.sm]}>
        <Text style={styles.infoCardTitle}>앱 정보</Text>
        <InfoRow icon="information-circle-outline" label="버전" value="1.0.0" />
        <InfoRow icon="school-outline" label="서비스" value="Safeway Kids" />
      </View>

      {/* 로그아웃 버튼 */}
      <Pressable
        style={styles.logoutBtn}
        onPress={handleLogout}
       
      >
        <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>{t("auth.logout")}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxl },

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
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
    minHeight: 52,
  },
  logoutText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.danger,
  },
});
