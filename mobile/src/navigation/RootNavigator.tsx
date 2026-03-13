import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import ParentTabNavigator from "./ParentTabNavigator";
import DriverTabNavigator from "./DriverTabNavigator";
import EscortTabNavigator from "./EscortTabNavigator";
import LoginScreen from "../screens/LoginScreen";

export default function RootNavigator() {
  const { authenticated, loading, user } = useAuth();

  // Register for push notifications when authenticated
  useNotifications(authenticated);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2196F3" />
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

  const isDriver = user?.role === "driver";
  const isEscort = user?.role === "safety_escort";

  return (
    <NavigationContainer>
      {isEscort ? (
        <EscortTabNavigator />
      ) : isDriver ? (
        <DriverTabNavigator />
      ) : (
        <ParentTabNavigator />
      )}
    </NavigationContainer>
  );
}
