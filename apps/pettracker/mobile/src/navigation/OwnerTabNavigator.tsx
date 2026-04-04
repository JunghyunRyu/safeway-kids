import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

import OwnerHomeScreen from '../screens/owner/OwnerHomeScreen';
import SearchScreen from '../screens/owner/SearchScreen';
import BookingsScreen from '../screens/owner/BookingsScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();

const tabIcon = (name: keyof typeof Ionicons.glyphMap) =>
  ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );

export default function OwnerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textDisabled,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={OwnerHomeScreen}
        options={{ tabBarLabel: '홈', tabBarIcon: tabIcon('home') }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarLabel: '검색', tabBarIcon: tabIcon('search') }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{ tabBarLabel: '예약', tabBarIcon: tabIcon('calendar') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: '프로필', tabBarIcon: tabIcon('person') }}
      />
    </Tab.Navigator>
  );
}
