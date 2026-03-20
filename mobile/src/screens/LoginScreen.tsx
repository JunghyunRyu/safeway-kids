import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { devLogin } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import { Colors, Typography, Spacing, Radius, Shadows } from "../constants/theme";

type RoleOption = "parent" | "driver" | "safety_escort" | "academy_admin";

const ROLE_OPTIONS: Array<{ value: RoleOption; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { value: "parent", label: "학부모", icon: "people-outline" },
  { value: "driver", label: "기사", icon: "car-outline" },
  { value: "safety_escort", label: "안전도우미", icon: "shield-outline" },
  { value: "academy_admin", label: "관리자", icon: "settings-outline" },
];

const ROLE_COLORS: Record<RoleOption, string> = {
  parent: Colors.roleParent,
  driver: Colors.roleDriver,
  safety_escort: Colors.roleEscort,
  academy_admin: Colors.roleAdmin,
};

export default function LoginScreen() {
  const { t } = useTranslation();
  const { onLoginSuccess } = useAuth();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<RoleOption>("parent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = useCallback(async () => {
    setError("");
    if (!phone.trim()) { setError("전화번호를 입력해 주세요"); return; }
    if (!name.trim()) { setError("이름을 입력해 주세요"); return; }
    setLoading(true);
    try {
      await devLogin(phone, name, role);
      await onLoginSuccess();
    } catch {
      setError("로그인에 실패했습니다. 서버 연결을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  }, [phone, name, role, onLoginSuccess]);

  const activeColor = ROLE_COLORS[role];

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoArea}>
        <View style={[styles.logoCircle, { backgroundColor: activeColor }]}>
          <Ionicons name="shield-checkmark" size={36} color={Colors.textInverse} />
        </View>
        <Text style={[styles.title, { color: activeColor }]}>SAFEWAY KIDS</Text>
        <Text style={styles.subtitle}>개발 모드 로그인</Text>
      </View>

      {/* Error */}
      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Role selector */}
      <View style={styles.roleGrid}>
        {ROLE_OPTIONS.map(({ value, label, icon }) => {
          const isActive = role === value;
          const roleColor = ROLE_COLORS[value];
          return (
            <Pressable
              key={value}
              style={[
                styles.roleBtn,
                isActive && {
                  borderColor: roleColor,
                  backgroundColor: roleColor + "15",
                },
              ]}
              onPress={() => setRole(value)}
             
            >
              <Ionicons
                name={icon}
                size={20}
                color={isActive ? roleColor : Colors.textDisabled}
              />
              <Text
                style={[
                  styles.roleTxt,
                  isActive && { color: roleColor, fontWeight: Typography.weights.bold },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Inputs */}
      <TextInput
        style={styles.input}
        placeholder={t("auth.enterPhone")}
        placeholderTextColor={Colors.textDisabled}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <TextInput
        style={styles.input}
        placeholder={t("auth.enterName")}
        placeholderTextColor={Colors.textDisabled}
        value={name}
        onChangeText={setName}
      />

      {/* Login button */}
      <Pressable
        style={[styles.loginBtn, { backgroundColor: activeColor }, loading && styles.disabled]}
        onPress={handleLogin}
        disabled={loading}
       
      >
        {loading ? (
          <Text style={styles.loginBtnText}>{t("common.loading")}</Text>
        ) : (
          <>
            <Ionicons name="log-in-outline" size={20} color={Colors.textInverse} />
            <Text style={styles.loginBtnText}>{t("auth.login")}</Text>
          </>
        )}
      </Pressable>

      <Text style={styles.hint}>
        테스트: 01033333333 / 박보호자{"\n"}
        01011111111 / 김기사
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  logoArea: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    ...Shadows.lg,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extrabold,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textDisabled,
    marginTop: 4,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.dangerLight,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.base,
  },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.sizes.sm,
    flex: 1,
  },
  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  roleBtn: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  roleTxt: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.base,
    borderRadius: Radius.lg,
    minHeight: 52,
    ...Shadows.md,
  },
  loginBtnText: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.bold,
    fontSize: Typography.sizes.md,
  },
  disabled: { opacity: 0.5 },
  hint: {
    marginTop: Spacing.lg,
    textAlign: "center",
    color: Colors.textDisabled,
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
  },
});
