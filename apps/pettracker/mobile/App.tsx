import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, DeviceEventEmitter } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { tokenStorage } from "@safeway/core-mobile/api/client";
import { getMe } from "@safeway/core-mobile/api/auth";

import OwnerStackNavigator from "./src/navigation/OwnerStackNavigator";
import WalkerStackNavigator from "./src/navigation/WalkerStackNavigator";
import LoginScreen from "./src/screens/shared/LoginScreen";
import DevTokenPasteScreen from "./src/screens/shared/DevTokenPasteScreen";

type Role = "pet_owner" | "walker";

/**
 * PetTracker App — Entry Point
 *
 * 인증 진입은 LoginScreen(OTP + 역할 선택)이 담당한다.
 * 부팅 시 토큰이 있으면 getMe()로 서버가 알려주는 실제 role로 분기한다.
 * DevTokenPasteScreen(JWT 붙여넣기)은 __DEV__ 빌드에서만 보조 경로로 노출한다.
 */
export default function App() {
  const [role, setRole] = useState<Role>("pet_owner");
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [devPaste, setDevPaste] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const t = await tokenStorage.getItem("access_token");
      if (!t) {
        if (mounted) setHasToken(false);
        return;
      }
      // 토큰의 실제 role을 서버에 묻는다 (클라이언트 추측 금지).
      try {
        const me = await getMe();
        if (mounted) {
          setRole(me.role === "walker" ? "walker" : "pet_owner");
          setHasToken(true);
        }
      } catch {
        // 만료/무효 토큰 → 로그인 화면으로 강등 (빈 화면 갇힘 방지).
        if (mounted) setHasToken(false);
      }
    })();
    const sub = DeviceEventEmitter.addListener("auth:logout", () => {
      if (mounted) {
        setHasToken(false);
        setDevPaste(false);
      }
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

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
        {__DEV__ && devPaste ? (
          <DevTokenPasteScreen
            onTokenSaved={async () => {
              try {
                const me = await getMe();
                setRole(me.role === "walker" ? "walker" : "pet_owner");
              } catch {
                /* role 기본값 유지 */
              }
              setHasToken(true);
            }}
          />
        ) : (
          <LoginScreen
            onLogin={(r) => {
              setRole(r);
              setHasToken(true);
            }}
            // __DEV__ 빌드에서만 "JWT 붙여넣기" 보조 경로 진입을 허용한다.
            onDevPaste={__DEV__ ? () => setDevPaste(true) : undefined}
          />
        )}
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        {role === "walker" ? <WalkerStackNavigator /> : <OwnerStackNavigator />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
