import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

import WalkerHomeScreen from '../screens/walker/WalkerHomeScreen';
import ScheduleScreen from '../screens/walker/ScheduleScreen';
import WalkScreen from '../screens/walker/WalkScreen';
import EarningsScreen from '../screens/walker/EarningsScreen';
import WalkerProfileScreen from '../screens/walker/WalkerProfileScreen';

const Tab = createBottomTabNavigator();

const tabIcon = (name: keyof typeof Ionicons.glyphMap) =>
  ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );

export default function WalkerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textDisabled,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="WalkerHome"
        component={WalkerHomeScreen}
        options={{ tabBarLabel: '홈', tabBarIcon: tabIcon('home') }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{ tabBarLabel: '스케줄', tabBarIcon: tabIcon('calendar') }}
      />
      <Tab.Screen
        name="Walk"
        component={WalkScreen}
        options={{ tabBarLabel: '산책', tabBarIcon: tabIcon('walk') }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ tabBarLabel: '수입', tabBarIcon: tabIcon('wallet') }}
      />
      <Tab.Screen
        name="WalkerProfile"
        component={WalkerProfileScreen}
        options={{ tabBarLabel: '프로필', tabBarIcon: tabIcon('person') }}
      />
    </Tab.Navigator>
  );
}
