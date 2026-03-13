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
import { sendOtp, verifyOtp } from "../api/auth";
import { useAuth } from "../hooks/useAuth";

type Step = "phone" | "otp" | "name";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { onLoginSuccess } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    try {
      await sendOtp(phone);
      setStep("otp");
    } catch {
      Alert.alert(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (!otp.trim()) return;
    setStep("name");
  };

  const handleSubmitName = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await verifyOtp(phone, otp, name);
      await onLoginSuccess();
    } catch {
      Alert.alert(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SAFEWAY KIDS</Text>

      {step === "phone" && (
        <>
          <TextInput
            style={styles.input}
            placeholder={t("auth.enterPhone")}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TouchableOpacity
            style={[styles.btn, loading && styles.disabled]}
            onPress={handleSendOtp}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? t("common.loading") : t("auth.sendOtp")}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {step === "otp" && (
        <>
          <TextInput
            style={styles.input}
            placeholder={t("auth.enterOtp")}
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
          />
          <TouchableOpacity style={styles.btn} onPress={handleVerifyOtp}>
            <Text style={styles.btnText}>{t("auth.verifyOtp")}</Text>
          </TouchableOpacity>
        </>
      )}

      {step === "name" && (
        <>
          <TextInput
            style={styles.input}
            placeholder={t("auth.enterName")}
            value={name}
            onChangeText={setName}
          />
          <TouchableOpacity
            style={[styles.btn, loading && styles.disabled]}
            onPress={handleSubmitName}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? t("common.loading") : t("auth.login")}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 32, backgroundColor: "#fff" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 48,
    color: "#2196F3",
  },
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
});
