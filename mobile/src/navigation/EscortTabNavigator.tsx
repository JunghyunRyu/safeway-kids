import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";
import ShiftsScreen from "../screens/escort/ShiftsScreen";
import AvailabilityScreen from "../screens/escort/AvailabilityScreen";
import DriverMapScreen from "../screens/driver/MapScreen";
import DriverProfileScreen from "../screens/driver/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function EscortTabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#8B5CF6",
        tabBarInactiveTintColor: "#999",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
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
