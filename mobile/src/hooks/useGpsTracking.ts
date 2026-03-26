import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, Platform } from "react-native";
import * as Location from "expo-location";
import { updateGps } from "../api/vehicles";
import { checkDriverConsent, createDriverConsent } from "../api/compliance";

const GPS_INTERVAL_MS = 5000;

interface GpsTrackingOptions {
  vehicleId: string | null;
  enabled: boolean;
}

export function useGpsTracking({ vehicleId, enabled }: GpsTrackingOptions) {
  const [active, setActive] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  // null = unknown (checking), true = consented, false = declined
  const [consentGranted, setConsentGranted] = useState<boolean | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Request permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setPermissionGranted(true);
      } else {
        Alert.alert(
          "위치 권한 필요",
          "GPS 위치 전송을 위해 위치 권한을 허용해주세요.",
        );
      }
    })();
  }, []);

  // Check GPS consent on mount (once)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const consented = await checkDriverConsent();
        if (cancelled) return;

        if (consented) {
          setConsentGranted(true);
          return;
        }

        // Not yet consented — show consent alert
        Alert.alert(
          "위치정보 수집 동의",
          "운행 중 차량 위치를 학부모에게 실시간으로 제공하기 위해 GPS 위치정보를 수집합니다.\n\n수집된 위치정보는 운행 목적으로만 사용되며, 180일 후 자동 삭제됩니다.\n\n동의하시겠습니까?",
          [
            {
              text: "거부",
              style: "cancel",
              onPress: () => {
                if (!cancelled) setConsentGranted(false);
              },
            },
            {
              text: "동의",
              onPress: async () => {
                try {
                  await createDriverConsent();
                  if (!cancelled) setConsentGranted(true);
                } catch {
                  // Consent record failed to save — proceed anyway (fail-open for safety)
                  if (!cancelled) setConsentGranted(true);
                }
              },
            },
          ],
          { cancelable: false },
        );
      } catch {
        // Consent check API failed — fail-open for safety, allow GPS
        if (!cancelled) setConsentGranted(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const sendLocation = useCallback(async () => {
    if (!vehicleId || !permissionGranted || !consentGranted) return;

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      const heading = location.coords.heading ?? undefined;
      const speed = location.coords.speed
        ? location.coords.speed * 3.6 // m/s → km/h
        : undefined;

      await updateGps(vehicleId, latitude, longitude, heading, speed);
    } catch {
      // GPS send failed — silent retry on next interval
    }
  }, [vehicleId, permissionGranted, consentGranted]);

  useEffect(() => {
    if (!enabled || !vehicleId || !permissionGranted || !consentGranted) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setActive(false);
      return;
    }

    setActive(true);
    sendLocation(); // send immediately
    intervalRef.current = setInterval(sendLocation, GPS_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setActive(false);
    };
  }, [enabled, vehicleId, permissionGranted, consentGranted, sendLocation]);

  // Pause when app backgrounds
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active" && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setActive(false);
      } else if (state === "active" && enabled && vehicleId && permissionGranted && consentGranted) {
        setActive(true);
        sendLocation();
        intervalRef.current = setInterval(sendLocation, GPS_INTERVAL_MS);
      }
    });

    return () => sub.remove();
  }, [enabled, vehicleId, permissionGranted, consentGranted, sendLocation]);

  return { active, permissionGranted, consentGranted };
}
