import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";
import DriverHomeScreen from "../screens/driver/HomeScreen";
import DriverRouteScreen from "../screens/driver/RouteScreen";
import DriverMapScreen from "../screens/driver/MapScreen";
import DriverProfileScreen from "../screens/driver/ProfileScreen";

const Tab = createBottomTabNavigator();

const ICONS: Record<string, string> = {
  DriverHome: "🏠",
  Route: "🗺️",
  DriverMap: "📍",
  DriverProfile: "👤",
};

export default function DriverTabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#4CAF50",
        tabBarInactiveTintColor: "#999",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        lazy: true,
        tabBarIcon: ({ color }) => (
          <Text style={{ fontSize: 20, color }}>{ICONS[route.name] ?? "·"}</Text>
        ),
      })}
    >
      <Tab.Screen
        name="DriverHome"
        component={DriverHomeScreen}
        options={{ tabBarLabel: t("tabs.home") }}
      />
      <Tab.Screen
        name="Route"
        component={DriverRouteScreen}
        options={{ tabBarLabel: t("tabs.route") }}
      />
      <Tab.Screen
        name="DriverMap"
        component={DriverMapScreen}
        options={{ tabBarLabel: t("tabs.map") }}
      />
      <Tab.Screen
        name="DriverProfile"
        component={DriverProfileScreen}
        options={{ tabBarLabel: t("tabs.profile") }}
      />
    </Tab.Navigator>
  );
}
