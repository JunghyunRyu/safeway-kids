import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { registerFcmToken } from "../api/notifications";
import { debugLog } from "../utils/debug";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications(authenticated: boolean) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription>(undefined);
  const responseListener = useRef<Notifications.EventSubscription>(undefined);

  useEffect(() => {
    if (!authenticated) return;

    registerForPushNotifications().then((token) => {
      if (token) {
        setExpoPushToken(token);
        registerFcmToken(token).catch(() => {
          // Silent — will retry on next app launch
        });
      }
    });

    // Listen for incoming notifications (foreground)
    notificationListener.current =
      Notifications.addNotificationReceivedListener((_notification) => {
        // Notification received while app is in foreground
      });

    // Listen for notification taps
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.screen) {
          // Navigation will be handled by the navigation container
          debugLog("[Notifications] Tapped notification, target:", data.screen);
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [authenticated]);

  return { expoPushToken };
}

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    debugLog("[Notifications] Must use physical device for push");
    return null;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    debugLog("[Notifications] Permission not granted");
    return null;
  }

  // Android needs a notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "SAFEWAY KIDS",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2196F3",
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    debugLog("[Notifications] Missing Expo project ID in app config");
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

  return tokenData.data;
}
