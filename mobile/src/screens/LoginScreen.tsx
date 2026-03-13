import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { devLogin } from "../api/auth";
import { useAuth } from "../hooks/useAuth";

type RoleOption = "parent" | "driver";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { onLoginSuccess } = useAuth();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<RoleOption>("parent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!phone.trim()) {
      setError("전화번호를 입력해 주세요");
      return;
    }
    if (!name.trim()) {
      setError("이름을 입력해 주세요");
      return;
    }
    setLoading(true);
    try {
      await devLogin(phone, name, role);
      await onLoginSuccess();
    } catch {
      setError("로그인에 실패했습니다. 서버 연결을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SAFEWAY KIDS</Text>
      <Text style={styles.subtitle}>개발 모드 로그인</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Role selector */}
      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleBtn, role === "parent" && styles.roleBtnActive]}
          onPress={() => setRole("parent")}
        >
          <Text style={[styles.roleTxt, role === "parent" && styles.roleTxtActive]}>
            학부모
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleBtn, role === "driver" && styles.roleBtnActive]}
          onPress={() => setRole("driver")}
        >
          <Text style={[styles.roleTxt, role === "driver" && styles.roleTxtActive]}>
            기사
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder={t("auth.enterPhone")}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <TextInput
        style={styles.input}
        placeholder={t("auth.enterName")}
        value={name}
        onChangeText={setName}
      />
      <TouchableOpacity
        style={[styles.btn, loading && styles.disabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.btnText}>
          {loading ? t("common.loading") : t("auth.login")}
        </Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        테스트 계정: 01033333333 / 박보호자 (학부모){"\n"}
        01011111111 / 김기사 (기사)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 32, backgroundColor: "#fff" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#2196F3",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
    color: "#999",
  },
  roleRow: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 12,
  },
  roleBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  roleBtnActive: {
    borderColor: "#2196F3",
    backgroundColor: "#E3F2FD",
  },
  roleTxt: { fontSize: 15, color: "#999" },
  roleTxtActive: { color: "#2196F3", fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  btn: {
    backgroundColor: "#2196F3",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  disabled: { opacity: 0.5 },
  error: {
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    padding: 12,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 14,
    marginBottom: 16,
  },
  hint: {
    marginTop: 24,
    textAlign: "center",
    color: "#aaa",
    fontSize: 12,
    lineHeight: 20,
  },
});
