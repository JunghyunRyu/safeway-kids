import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, DeviceEventEmitter } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { tokenStorage } from "@safeway/core-mobile/api/client";

import OwnerStackNavigator from "./src/navigation/OwnerStackNavigator";
import WalkerTabNavigator from "./src/navigation/WalkerTabNavigator";
import OnboardingScreen from "./src/screens/shared/OnboardingScreen";
import LoginScreen from "./src/screens/shared/LoginScreen";
import DevTokenPasteScreen from "./src/screens/shared/DevTokenPasteScreen";
import { initFirebaseIfConfigured } from "./src/auth/firebaseAdapter";

// Firebase 어댑터는 화면 mount 전에 동기 등록 (config 없으면 no-op — FR-M5)
initFirebaseIfConfigured();

type Role = "pet_owner" | "walker";
type UnauthView = "onboarding" | "login" | "devtoken";

/**
 * PetTracker App — Entry Point (FR-M1)
 *
 * 미인증: Onboarding → Login(역할 선택→약관 동의→OTP/카카오).
 * 인증: 로그인 응답의 role(저장: user_role)로 Owner/Walker 네비게이터 분기.
 * DevTokenPasteScreen은 __DEV__ 전용 진입으로 보존.
 */
export default function App() {
  const [role, setRole] = useState<Role>("pet_owner");
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [unauthView, setUnauthView] = useState<UnauthView>("onboarding");

  useEffect(() => {
    Promise.all([
      tokenStorage.getItem("access_token"),
      tokenStorage.getItem("user_role"),
    ]).then(([token, storedRole]) => {
      if (storedRole === "walker" || storedRole === "pet_owner") setRole(storedRole);
      setHasToken(!!token);
    });
    const sub = DeviceEventEmitter.addListener("auth:logout", () => {
      setUnauthView("login");
      setHasToken(false);
    });
    return () => sub.remove();
  }, []);

  const handleLogin = (loginRole: Role) => {
    setRole(loginRole);
    setHasToken(true);
  };

  if (hasToken === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF8F0" }}>
        <ActivityIndicator size="large" color="#F4A22D" />
      </View>
    );
  }

  if (!hasToken) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {unauthView === "onboarding" && (
          <OnboardingScreen onComplete={() => setUnauthView("login")} />
        )}
        {unauthView === "login" && (
          <LoginScreen
            onLogin={handleLogin}
            onDevTokenPaste={__DEV__ ? () => setUnauthView("devtoken") : undefined}
          />
        )}
        {unauthView === "devtoken" && (
          <DevTokenPasteScreen onTokenSaved={() => setHasToken(true)} />
        )}
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        {role === "walker" ? <WalkerTabNavigator /> : <OwnerStackNavigator />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
