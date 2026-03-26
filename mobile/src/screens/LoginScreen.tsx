import React, { useCallback, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { devLogin, sendOtp, verifyOtp } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import { Colors, Typography, Spacing, Radius, Shadows } from "../constants/theme";

const IS_DEV = __DEV__ || process.env.EXPO_PUBLIC_DEV_MODE === "true";

type RoleOption = "parent" | "driver" | "safety_escort" | "academy_admin" | "student";

const ROLE_OPTIONS: Array<{ value: RoleOption; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { value: "parent", label: "학부모", icon: "people-outline" },
  { value: "student", label: "학생", icon: "school-outline" },
  { value: "driver", label: "기사", icon: "car-outline" },
  { value: "safety_escort", label: "안전도우미", icon: "shield-outline" },
  { value: "academy_admin", label: "관리자", icon: "settings-outline" },
];

const ROLE_COLORS: Record<RoleOption, string> = {
  parent: Colors.roleParent,
  student: Colors.roleStudent,
  driver: Colors.roleDriver,
  safety_escort: Colors.roleEscort,
  academy_admin: Colors.roleAdmin,
};

/* ── Production Login (OTP-based) ── */
function ProductionLoginScreen() {
  const { t } = useTranslation();
  const { onLoginSuccess } = useAuth();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [role, setRole] = useState<RoleOption>("parent");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = useCallback(async () => {
    setError("");
    if (!phone.trim()) { setError("전화번호를 입력해 주세요"); return; }
    setLoading(true);
    try {
      await sendOtp(phone);
      setStep("otp");
    } catch {
      setError("인증번호 발송에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const handleVerifyOtp = useCallback(async () => {
    setError("");
    if (!otpCode.trim()) { setError("인증번호를 입력해 주세요"); return; }
    if (!name.trim()) { setError("이름을 입력해 주세요"); return; }
    setLoading(true);
    try {
      await verifyOtp(phone, otpCode, name, role);
      await onLoginSuccess();
    } catch {
      setError("인증에 실패했습니다. 인증번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  }, [phone, otpCode, name, role, onLoginSuccess]);

  const activeColor = ROLE_COLORS[role];

  return (
    <View style={styles.container}>
      <View style={styles.logoArea}>
        <View style={[styles.logoCircle, { backgroundColor: activeColor }]}>
          <Ionicons name="shield-checkmark" size={36} color={Colors.textInverse} />
        </View>
        <Text style={[styles.title, { color: activeColor }]}>SAFEWAY KIDS</Text>
        <Text style={styles.subtitle}>안전한 통학의 시작</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {step === "phone" ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="전화번호 (01012345678)"
            placeholderTextColor={Colors.textDisabled}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <Pressable
            style={[styles.loginBtn, { backgroundColor: activeColor }, loading && styles.disabled]}
            onPress={handleSendOtp}
            disabled={loading}
          >
            <Text style={styles.loginBtnText}>
              {loading ? t("common.loading") : "인증번호 받기"}
            </Text>
          </Pressable>
        </>
      ) : (
        <>
          <View style={styles.roleGrid}>
            {ROLE_OPTIONS.map(({ value, label, icon }) => {
              const isActive = role === value;
              const roleColor = ROLE_COLORS[value];
              return (
                <Pressable
                  key={value}
                  style={[
                    styles.roleBtn,
                    isActive && { borderColor: roleColor, backgroundColor: roleColor + "15" },
                  ]}
                  onPress={() => setRole(value)}
                >
                  <Ionicons name={icon} size={20} color={isActive ? roleColor : Colors.textDisabled} />
                  <Text style={[styles.roleTxt, isActive && { color: roleColor, fontWeight: Typography.weights.bold }]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            style={styles.input}
            placeholder="인증번호 6자리"
            placeholderTextColor={Colors.textDisabled}
            keyboardType="number-pad"
            maxLength={6}
            value={otpCode}
            onChangeText={setOtpCode}
          />
          <TextInput
            style={styles.input}
            placeholder={t("auth.enterName")}
            placeholderTextColor={Colors.textDisabled}
            value={name}
            onChangeText={setName}
          />
          <Pressable
            style={[styles.loginBtn, { backgroundColor: activeColor }, loading && styles.disabled]}
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            <Ionicons name="log-in-outline" size={20} color={Colors.textInverse} />
            <Text style={styles.loginBtnText}>
              {loading ? t("common.loading") : t("auth.login")}
            </Text>
          </Pressable>
          <Pressable onPress={() => { setStep("phone"); setOtpCode(""); setError(""); }}>
            <Text style={styles.hint}>전화번호 다시 입력</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

/* ── Dev Login ── */
function DevLoginScreen() {
  const { t } = useTranslation();
  const { onLoginSuccess } = useAuth();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<RoleOption>("parent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef<TextInput>(null);

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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoArea}>
            <View style={[styles.logoCircle, { backgroundColor: activeColor }]}>
              <Ionicons name="shield-checkmark" size={36} color={Colors.textInverse} />
            </View>
            <Text style={[styles.title, { color: activeColor }]}>SAFEWAY KIDS</Text>
            <Text style={styles.subtitle}>개발 모드 로그인</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.roleGrid}>
            {ROLE_OPTIONS.map(({ value, label, icon }) => {
              const isActive = role === value;
              const roleColor = ROLE_COLORS[value];
              return (
                <Pressable
                  key={value}
                  style={[
                    styles.roleBtn,
                    isActive && { borderColor: roleColor, backgroundColor: roleColor + "15" },
                  ]}
                  onPress={() => setRole(value)}
                >
                  <Ionicons name={icon} size={20} color={isActive ? roleColor : Colors.textDisabled} />
                  <Text style={[styles.roleTxt, isActive && { color: roleColor, fontWeight: Typography.weights.bold }]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            style={styles.input}
            placeholder={t("auth.enterPhone")}
            placeholderTextColor={Colors.textDisabled}
            keyboardType="number-pad"
            returnKeyType="next"
            value={phone}
            onChangeText={setPhone}
            onSubmitEditing={() => nameRef.current?.focus()}
          />
          <TextInput
            ref={nameRef}
            style={styles.input}
            placeholder={t("auth.enterName")}
            placeholderTextColor={Colors.textDisabled}
            returnKeyType="done"
            value={name}
            onChangeText={setName}
            onSubmitEditing={handleLogin}
          />

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
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

/* ── Main Export ── */
export default function LoginScreen() {
  if (IS_DEV) return <DevLoginScreen />;
  return <ProductionLoginScreen />;
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
