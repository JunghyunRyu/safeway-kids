import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

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
        <View style={styles.infoCard}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.detail}>{user.phone}</Text>
          <Text style={styles.detail}>{user.role}</Text>
        </View>
      )}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>{t("auth.logout")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  title: { fontSize: 20, fontWeight: "bold", marginTop: 40, marginBottom: 20 },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
  },
  name: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  detail: { fontSize: 14, color: "#666", marginBottom: 4 },
  logoutBtn: {
    backgroundColor: "#f44",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
