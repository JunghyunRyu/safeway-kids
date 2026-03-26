import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { Colors } from "../constants/theme";
import ParentTabNavigator from "./ParentTabNavigator";
import DriverTabNavigator from "./DriverTabNavigator";
import EscortTabNavigator from "./EscortTabNavigator";
import AdminTabNavigator from "./AdminTabNavigator";
import StudentTabNavigator from "./StudentTabNavigator";
import LoginScreen from "../screens/LoginScreen";
import OnboardingScreen, { ONBOARDING_KEY } from "../screens/OnboardingScreen";
import ConsentScreen from "../screens/parent/ConsentScreen";
import SOSButton from "../components/SOSButton";
import { listStudents } from "../api/students";
import { listConsents } from "../api/compliance";

export default function RootNavigator() {
  const { authenticated, loading, user } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  useNotifications(authenticated);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((val) => setOnboarded(val === "true"))
      .catch(() => setOnboarded(false));
  }, []);

  // Check consent status for parent role
  const checkConsent = useCallback(async () => {
    try {
      const [students, consents] = await Promise.all([
        listStudents(),
        listConsents(),
      ]);
      if (students.length === 0) {
        setNeedsConsent(false);
        return;
      }
      const activeConsentChildIds = new Set(
        consents.filter((c) => c.withdrawn_at === null).map((c) => c.child_id),
      );
      const hasUnconsented = students.some(
        (s) => !activeConsentChildIds.has(s.id),
      );
      setNeedsConsent(hasUnconsented);
    } catch {
      // If we can't check, don't block the user
      setNeedsConsent(false);
    } finally {
      setConsentChecked(true);
    }
  }, []);

  useEffect(() => {
    if (authenticated && user?.role === "parent") {
      setConsentChecked(false);
      checkConsent();
    } else {
      setNeedsConsent(false);
      setConsentChecked(true);
    }
  }, [authenticated, user?.role, checkConsent]);

  if (loading || onboarded === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!onboarded) {
    return <OnboardingScreen onComplete={() => setOnboarded(true)} />;
  }

  if (!authenticated) {
    return (
      <NavigationContainer>
        <LoginScreen />
      </NavigationContainer>
    );
  }

  const role = user?.role ?? "parent";

  // Show consent screen for parents with unconsented children
  if (role === "parent" && !consentChecked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  if (role === "parent" && needsConsent) {
    return <ConsentScreen onComplete={() => setNeedsConsent(false)} />;
  }

  return (
    <NavigationContainer>
      <View style={styles.appContainer}>
        {role === "safety_escort" ? (
          <EscortTabNavigator />
        ) : role === "driver" ? (
          <DriverTabNavigator />
        ) : role === "academy_admin" || role === "platform_admin" ? (
          <AdminTabNavigator />
        ) : role === "student" ? (
          <StudentTabNavigator />
        ) : (
          <ParentTabNavigator />
        )}
        <SOSButton />
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  appContainer: {
    flex: 1,
  },
});
