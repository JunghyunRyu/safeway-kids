import React from "react";
import { Text } from "react-native";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

/**
 * Creates shared tab screenOptions with a role-specific accent color.
 * Each navigator only specifies its own accent + icon map.
 */
export function createTabScreenOptions(
  accentColor: string,
  icons: Record<string, string>
): (props: { route: { name: string } }) => BottomTabNavigationOptions {
  return ({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: accentColor,
    tabBarInactiveTintColor: "#999",
    tabBarLabelStyle: { fontSize: 12, fontWeight: "600" as const },
    lazy: true,
    tabBarIcon: ({ color }: { color: string }) => (
      <Text style={{ fontSize: 20, color }}>{icons[route.name] ?? "·"}</Text>
    ),
  });
}
