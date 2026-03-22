import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { Colors } from "../constants/theme";
import ParentTabNavigator from "./ParentTabNavigator";
import DriverTabNavigator from "./DriverTabNavigator";
import EscortTabNavigator from "./EscortTabNavigator";
import AdminTabNavigator from "./AdminTabNavigator";
import StudentTabNavigator from "./StudentTabNavigator";
import LoginScreen from "../screens/LoginScreen";
import SOSButton from "../components/SOSButton";

export default function RootNavigator() {
  const { authenticated, loading, user } = useAuth();

  useNotifications(authenticated);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!authenticated) {
    return (
      <NavigationContainer>
        <LoginScreen />
      </NavigationContainer>
    );
  }

  const role = user?.role ?? "parent";

  return (
    <NavigationContainer>
      <View style={styles.appContainer}>
        {role === "safety_escort" ? (
          <EscortTabNavigator />
        ) : role === "driver" ? (
          <DriverTabNavigator />
        ) : role === "academy_admin" || role === "platform_admin" ? (
          <AdminTabNavigator />
        ) : role === "student" ? (
          <StudentTabNavigator />
        ) : (
          <ParentTabNavigator />
        )}
        <SOSButton />
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  appContainer: {
    flex: 1,
  },
});
