import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "./src/constants/theme";

/**
 * CareConnect App — Entry Point
 * TODO: Replace placeholder with createRootNavigator in M4
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Text style={styles.title}>👶 돌봄커넥트</Text>
        <Text style={styles.subtitle}>검증된 돌봄 매칭 플랫폼</Text>
        <Text style={styles.status}>앱 준비 중...</Text>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  status: {
    fontSize: 14,
    color: Colors.textDisabled,
  },
});
