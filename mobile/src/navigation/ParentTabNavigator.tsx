import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";
import { createTabScreenOptions } from "./tabConfig";
import { Colors } from "../constants/theme";
import ParentHomeScreen from "../screens/parent/HomeScreen";
import ScheduleScreen from "../screens/parent/ScheduleScreen";
import MapScreen from "../screens/parent/MapScreen";
import BillingScreen from "../screens/parent/BillingScreen";
import ProfileScreen from "../screens/parent/ProfileScreen";
import type { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  ParentHome: "home",
  Schedule: "calendar",
  Map: "location",
  Billing: "card",
  Profile: "person",
};

export default function ParentTabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator screenOptions={createTabScreenOptions(Colors.roleParent, ICONS)}>
      <Tab.Screen
        name="ParentHome"
        component={ParentHomeScreen}
        options={{ tabBarLabel: t("tabs.home") }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{ tabBarLabel: t("tabs.schedule") }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ tabBarLabel: t("tabs.map") }}
      />
      <Tab.Screen
        name="Billing"
        component={BillingScreen}
        options={{ tabBarLabel: t("tabs.billing") }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: t("tabs.profile") }}
      />
    </Tab.Navigator>
  );
}
