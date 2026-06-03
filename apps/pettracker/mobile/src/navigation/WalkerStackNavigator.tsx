/**
 * WalkerStackNavigator — wraps WalkerTabNavigator with a stack so secondary
 * screens (Chat) are reachable via `navigation.navigate(...)` from tabs.
 *
 * QA fix: 워커가 보호자와 채팅에 도달할 경로가 없던 GAP 해소 (OwnerStack 패턴 일관).
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WalkerTabNavigator from './WalkerTabNavigator';
import ChatScreen from '../screens/shared/ChatScreen';

const Stack = createNativeStackNavigator();

export default function WalkerStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={WalkerTabNavigator} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}
