import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createTabScreenOptions } from "./tabConfig";
import { Colors } from "../constants/theme";
import AdminDashboardScreen from "../screens/admin/DashboardScreen";
import AdminStudentsScreen from "../screens/admin/StudentsScreen";
import AdminBillingScreen from "../screens/admin/BillingAdminScreen";
import AdminProfileScreen from "../screens/admin/ProfileScreen";
import type { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  AdminDashboard: "grid",
  AdminStudents: "people",
  AdminBilling: "receipt",
  AdminProfile: "person",
};

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator screenOptions={createTabScreenOptions(Colors.roleAdmin, ICONS)}>
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ tabBarLabel: "대시보드" }}
      />
      <Tab.Screen
        name="AdminStudents"
        component={AdminStudentsScreen}
        options={{ tabBarLabel: "학생 관리" }}
      />
      <Tab.Screen
        name="AdminBilling"
        component={AdminBillingScreen}
        options={{ tabBarLabel: "청구서" }}
      />
      <Tab.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{ tabBarLabel: "내 정보" }}
      />
    </Tab.Navigator>
  );
}
