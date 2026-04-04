import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import ParentHomeScreen from '../screens/parent/ParentHomeScreen';
import SearchScreen from '../screens/parent/SearchScreen';
import BookingsScreen from '../screens/parent/BookingsScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();
const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: string; size: number }) => <Ionicons name={name} size={size} color={color} />;

export default function ParentTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: Colors.primary, tabBarInactiveTintColor: Colors.textDisabled, headerShown: false }}>
      <Tab.Screen name="Home" component={ParentHomeScreen} options={{ tabBarLabel: '홈', tabBarIcon: icon('home') }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: '검색', tabBarIcon: icon('search') }} />
      <Tab.Screen name="Bookings" component={BookingsScreen} options={{ tabBarLabel: '예약', tabBarIcon: icon('calendar') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: '프로필', tabBarIcon: icon('person') }} />
    </Tab.Navigator>
  );
}
