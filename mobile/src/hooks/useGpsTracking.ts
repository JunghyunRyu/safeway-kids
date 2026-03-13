import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, Platform } from "react-native";
import * as Location from "expo-location";
import { updateGps } from "../api/vehicles";

const GPS_INTERVAL_MS = 5000;

interface GpsTrackingOptions {
  vehicleId: string | null;
  enabled: boolean;
}

export function useGpsTracking({ vehicleId, enabled }: GpsTrackingOptions) {
  const [active, setActive] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
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

  const sendLocation = useCallback(async () => {
    if (!vehicleId || !permissionGranted) return;

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
  }, [vehicleId, permissionGranted]);

  useEffect(() => {
    if (!enabled || !vehicleId || !permissionGranted) {
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
  }, [enabled, vehicleId, permissionGranted, sendLocation]);

  // Pause when app backgrounds
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active" && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setActive(false);
      } else if (state === "active" && enabled && vehicleId && permissionGranted) {
        setActive(true);
        sendLocation();
        intervalRef.current = setInterval(sendLocation, GPS_INTERVAL_MS);
      }
    });

    return () => sub.remove();
  }, [enabled, vehicleId, permissionGranted, sendLocation]);

  return { active, permissionGranted };
}
