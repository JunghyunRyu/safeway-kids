import React, { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { getMyAssignment, VehicleAssignment } from "../../api/vehicles";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function DriverProfileScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
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
    Alert.alert(t("auth.logout"), "", [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.confirm"), onPress: signOut },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("tabs.profile")}</Text>

      {user && (
        <View style={styles.card}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.detail}>{user.phone}</Text>
        </View>
      )}

      {assignment && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("driver.vehicleInfo")}</Text>
          <Text style={styles.detail}>
            {t("driver.licensePlate")}: {assignment.license_plate}
          </Text>
          <Text style={styles.detail}>
            {t("driver.operator")}: {assignment.operator_name ?? "-"}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>{t("auth.logout")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f0f4e8" },
  title: { fontSize: 20, fontWeight: "bold", marginTop: 40, marginBottom: 20 },
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
