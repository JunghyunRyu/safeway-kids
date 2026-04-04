import React, { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

import ParentTabNavigator from "./src/navigation/ParentTabNavigator";
import CaregiverTabNavigator from "./src/navigation/CaregiverTabNavigator";

/**
 * CareConnect App — Entry Point
 *
 * Role determined by auth (JWT app_context=careconnect + role=parent/caregiver).
 */
export default function App() {
  const [role] = useState<"parent" | "caregiver">("parent");

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        {role === "caregiver" ? <CaregiverTabNavigator /> : <ParentTabNavigator />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
