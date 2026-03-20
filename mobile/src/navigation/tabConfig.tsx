import React from "react";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { Colors } from "../constants/theme";

/**
 * Creates shared tab screenOptions with a role-specific accent color.
 * Each navigator specifies its own accent color + Ionicons icon name map.
 */
export function createTabScreenOptions(
  accentColor: string,
  icons: Record<string, keyof typeof Ionicons.glyphMap>
): (props: { route: { name: string } }) => BottomTabNavigationOptions {
  return ({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: accentColor,
    tabBarInactiveTintColor: Colors.textDisabled,
    tabBarLabelStyle: { fontSize: 11, fontWeight: "600" as const, marginBottom: 2 },
    tabBarStyle: {
      backgroundColor: Colors.surface,
      borderTopColor: Colors.borderLight,
      borderTopWidth: 1,
      height: 60,
      paddingBottom: 6,
      paddingTop: 4,
    },
    lazy: true,
    tabBarIcon: ({ color, size }: { color: string; size: number }) => {
      const iconName = icons[route.name] ?? "ellipse-outline";
      return <Ionicons name={iconName} size={size - 2} color={color} />;
    },
  });
}
