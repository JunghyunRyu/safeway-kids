import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";
import { createTabScreenOptions } from "./tabConfig";
import { Colors } from "../constants/theme";
import DriverHomeScreen from "../screens/driver/HomeScreen";
import DriverRouteScreen from "../screens/driver/RouteScreen";
import DriverMapScreen from "../screens/driver/MapScreen";
import DriverProfileScreen from "../screens/driver/ProfileScreen";
import type { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  DriverHome: "home",
  Route: "navigate",
  DriverMap: "location",
  DriverProfile: "person",
};

export default function DriverTabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator screenOptions={createTabScreenOptions(Colors.roleDriver, ICONS)}>
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
