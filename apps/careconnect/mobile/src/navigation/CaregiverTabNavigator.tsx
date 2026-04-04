import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import CaregiverHomeScreen from '../screens/caregiver/CaregiverHomeScreen';
import ScheduleScreen from '../screens/caregiver/ScheduleScreen';
import SessionScreen from '../screens/caregiver/SessionScreen';
import EarningsScreen from '../screens/caregiver/EarningsScreen';
import CaregiverProfileScreen from '../screens/caregiver/CaregiverProfileScreen';

const Tab = createBottomTabNavigator();
const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: string; size: number }) => <Ionicons name={name} size={size} color={color} />;

export default function CaregiverTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: Colors.accent, tabBarInactiveTintColor: Colors.textDisabled, headerShown: false }}>
      <Tab.Screen name="CgHome" component={CaregiverHomeScreen} options={{ tabBarLabel: '홈', tabBarIcon: icon('home') }} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ tabBarLabel: '스케줄', tabBarIcon: icon('calendar') }} />
      <Tab.Screen name="Session" component={SessionScreen} options={{ tabBarLabel: '돌봄', tabBarIcon: icon('heart') }} />
      <Tab.Screen name="Earnings" component={EarningsScreen} options={{ tabBarLabel: '수입', tabBarIcon: icon('wallet') }} />
      <Tab.Screen name="CgProfile" component={CaregiverProfileScreen} options={{ tabBarLabel: '프로필', tabBarIcon: icon('person') }} />
    </Tab.Navigator>
  );
}
