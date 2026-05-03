import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, DeviceEventEmitter } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { tokenStorage } from "@safeway/core-mobile/api/client";

import OwnerStackNavigator from "./src/navigation/OwnerStackNavigator";
import WalkerTabNavigator from "./src/navigation/WalkerTabNavigator";
import DevTokenPasteScreen from "./src/screens/shared/DevTokenPasteScreen";

/**
 * PetTracker App — Entry Point
 *
 * In production, role is determined by auth (JWT app_context + role).
 * Demo: if no token in SecureStore, show DevTokenPasteScreen first.
 */
export default function App() {
  const [role] = useState<"pet_owner" | "walker">("pet_owner");
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    tokenStorage.getItem("access_token").then((t) => setHasToken(!!t));
    const sub = DeviceEventEmitter.addListener("auth:logout", () => setHasToken(false));
    return () => sub.remove();
  }, []);

  if (hasToken === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF8F0" }}>
        <ActivityIndicator size="large" color="#F4A22D" />
      </View>
    );
  }

  if (!hasToken) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <DevTokenPasteScreen onTokenSaved={() => setHasToken(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        {role === "walker" ? <WalkerTabNavigator /> : <OwnerStackNavigator />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
