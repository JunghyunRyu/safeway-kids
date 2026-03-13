import React, { useCallback, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { getMyAssignment, VehicleAssignment } from "../../api/vehicles";

const ROLE_LABELS: Record<string, string> = {
  parent: "학부모",
  driver: "기사",
  safety_escort: "안전도우미",
  academy_admin: "학원 관리자",
  platform_admin: "플랫폼 관리자",
};

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function DriverProfileScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [assignment, setAssignment] = useState<VehicleAssignment | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const a = await getMyAssignment(todayStr());
          setAssignment(a);
        } catch {
          // silent
        }
      })();
    }, [])
  );

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("로그아웃 하시겠습니까?")) {
        signOut();
      }
    } else {
      Alert.alert(t("auth.logout"), "", [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("common.confirm"), onPress: signOut },
      ]);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>{t("tabs.profile")}</Text>

      {user ? (
        <View style={styles.card}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.detail}>{user.phone}</Text>
          <Text style={styles.detail}>{ROLE_LABELS[user.role] ?? user.role}</Text>
        </View>
      ) : null}

      {assignment ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("driver.vehicleInfo")}</Text>
          <Text style={styles.detail}>
            {t("driver.licensePlate")}: {assignment.license_plate}
          </Text>
          <Text style={styles.detail}>
            {t("driver.operator")}: {assignment.operator_name ?? "-"}
          </Text>
        </View>
      ) : null}

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>{t("auth.logout")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f0f4e8" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  name: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  detail: { fontSize: 14, color: "#666", marginBottom: 4 },
  logoutBtn: {
    backgroundColor: "#f44",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
