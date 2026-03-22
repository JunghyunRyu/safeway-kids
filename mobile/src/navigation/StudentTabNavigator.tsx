/**
 * StudentTabNavigator — scaffold only.
 * Routes here when role === "student" (not yet in backend UserRole enum).
 * Fully functional once backend adds UserRole.STUDENT.
 */
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createTabScreenOptions } from "./tabConfig";
import { Colors } from "../constants/theme";
import StudentScheduleScreen from "../screens/student/ScheduleScreen";
import SafetyQuizScreen from "../screens/student/SafetyQuizScreen";
import StudentProfileScreen from "../screens/student/ProfileScreen";
import MapScreen from "../screens/parent/MapScreen";
import type { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  StudentSchedule: "calendar",
  SafetyQuiz: "school",
  StudentMap: "map",
  StudentProfile: "person",
};

export default function StudentTabNavigator() {
  return (
    <Tab.Navigator screenOptions={createTabScreenOptions(Colors.roleStudent, ICONS)}>
      <Tab.Screen
        name="StudentSchedule"
        component={StudentScheduleScreen}
        options={{ tabBarLabel: "내 일정" }}
      />
      <Tab.Screen
        name="SafetyQuiz"
        component={SafetyQuizScreen}
        options={{ tabBarLabel: "안전 퀴즈" }}
      />
      <Tab.Screen
        name="StudentMap"
        component={MapScreen}
        options={{ tabBarLabel: "지도" }}
      />
      <Tab.Screen
        name="StudentProfile"
        component={StudentProfileScreen}
        options={{ tabBarLabel: "내 정보" }}
      />
    </Tab.Navigator>
  );
}
