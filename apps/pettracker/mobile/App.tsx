import React, { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

import OwnerTabNavigator from "./src/navigation/OwnerTabNavigator";
import WalkerTabNavigator from "./src/navigation/WalkerTabNavigator";

/**
 * PetTracker App — Entry Point
 *
 * In production, role is determined by auth (JWT app_context + role).
 * For now, defaults to Owner tabs. Walker tabs activated after login as walker.
 */
export default function App() {
  // TODO: Replace with useAuth hook from core-mobile after full auth integration
  const [role] = useState<"pet_owner" | "walker">("pet_owner");

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        {role === "walker" ? <WalkerTabNavigator /> : <OwnerTabNavigator />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
