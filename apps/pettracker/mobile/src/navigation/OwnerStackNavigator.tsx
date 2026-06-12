/**
 * OwnerStackNavigator — wraps OwnerTabNavigator with a stack so secondary screens
 * (WalkerProfile, BookingCreate, BookingDetail, LiveTrack, WalkReport, Review,
 * PetRegistration) are reachable via `navigation.navigate(...)` from tabs.
 *
 * Gap fix: artifacts/gap-notes/2026-05-03-pt-owner-navigation-stack-missing.md
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OwnerTabNavigator from './OwnerTabNavigator';
import WalkerProfileDetailScreen from '../screens/owner/WalkerProfileDetailScreen';
import BookingCreateScreen from '../screens/owner/BookingCreateScreen';
import BookingDetailScreen from '../screens/owner/BookingDetailScreen';
import LiveTrackScreen from '../screens/owner/LiveTrackScreen';
import WalkReportScreen from '../screens/owner/WalkReportScreen';
import ReviewScreen from '../screens/owner/ReviewScreen';
import PetRegistrationScreen from '../screens/owner/PetRegistrationScreen';
import MyPetsScreen from '../screens/owner/MyPetsScreen';
import PaymentHistoryScreen from '../screens/owner/PaymentHistoryScreen';
import PaymentScreen from '../screens/owner/PaymentScreen';
import NotificationSettingsScreen from '../screens/shared/NotificationSettingsScreen';
import PolicyScreen from '../screens/shared/PolicyScreen';

const Stack = createNativeStackNavigator();

export default function OwnerStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={OwnerTabNavigator} />
      <Stack.Screen name="WalkerProfile" component={WalkerProfileDetailScreen} />
      <Stack.Screen name="BookingCreate" component={BookingCreateScreen} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <Stack.Screen name="LiveTrack" component={LiveTrackScreen} />
      <Stack.Screen name="WalkReport" component={WalkReportScreen} />
      <Stack.Screen name="Review" component={ReviewScreen} />
      <Stack.Screen name="PetRegistration" component={PetRegistrationScreen} />
      <Stack.Screen name="MyPets" component={MyPetsScreen} />
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Policy" component={PolicyScreen} />
    </Stack.Navigator>
  );
}
