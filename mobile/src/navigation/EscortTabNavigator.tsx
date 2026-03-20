import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";
import { createTabScreenOptions } from "./tabConfig";
import { Colors } from "../constants/theme";
import ShiftsScreen from "../screens/escort/ShiftsScreen";
import AvailabilityScreen from "../screens/escort/AvailabilityScreen";
import DriverMapScreen from "../screens/driver/MapScreen";
import DriverProfileScreen from "../screens/driver/ProfileScreen";
import type { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  EscortShifts: "briefcase",
  EscortAvailability: "time",
  EscortMap: "location",
  EscortProfile: "person",
};

export default function EscortTabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator screenOptions={createTabScreenOptions(Colors.roleEscort, ICONS)}>
      <Tab.Screen
        name="EscortShifts"
        component={ShiftsScreen}
        options={{ tabBarLabel: t("tabs.shifts") }}
      />
      <Tab.Screen
        name="EscortAvailability"
        component={AvailabilityScreen}
        options={{ tabBarLabel: t("tabs.availability") }}
      />
      <Tab.Screen
        name="EscortMap"
        component={DriverMapScreen}
        options={{ tabBarLabel: t("tabs.map") }}
      />
      <Tab.Screen
        name="EscortProfile"
        component={DriverProfileScreen}
        options={{ tabBarLabel: t("tabs.profile") }}
      />
    </Tab.Navigator>
  );
}
