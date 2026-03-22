import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as Location from "expo-location";
import { getDriverDailySchedules, DriverDailySchedule } from "../../api/schedules";
import { getMyAssignment } from "../../api/vehicles";
import { getMyRoute, RoutePlan } from "../../api/routes";
import { useGpsTracking } from "../../hooks/useGpsTracking";

import Constants from "expo-constants";

const KAKAO_MAP_API_KEY = Constants.expoConfig?.extra?.kakaoMapApiKey ?? "";
const DEFAULT_CENTER = { lat: 37.4979, lng: 127.0276 };
import { MAP_HTML_CONTENT } from "../../constants/mapHtml";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function DriverMapScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [schedules, setSchedules] = useState<DriverDailySchedule[]>([]);
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);

  // GPS tracking — auto-push to server
  const { active: gpsActive } = useGpsTracking({
    vehicleId,
    enabled: !!vehicleId,
  });

  // Load assignment and schedules
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const today = todayStr();
          const [assignment, sched, route] = await Promise.all([
            getMyAssignment(today),
            getDriverDailySchedules(today),
            getMyRoute(today).catch(() => null),
          ]);
          if (assignment) {
            setVehicleId(assignment.vehicle_id);
          }
          setSchedules(sched);
          setRoutePlan(route ?? null);
        } catch {
          // silent
        }
      })();
    }, [])
  );

  const sendToMap = (msg: object) => {
    webViewRef.current?.injectJavaScript(
      `handleMessage('${JSON.stringify(msg).replace(/'/g, "\\'")}'); true;`
    );
  };

  const onWebViewLoad = () => {
    sendToMap({
      type: "init",
      apiKey: KAKAO_MAP_API_KEY,
      center: DEFAULT_CENTER,
    });
  };

  const onMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "mapReady") {
        setMapReady(true);
      }
    } catch {
      // ignore
    }
  };

  // Set map center to first active stop location
  useEffect(() => {
    if (!mapReady || schedules.length === 0) return;
    const firstActive = schedules.find(
      (s) => s.status !== "completed" && s.pickup_latitude && s.pickup_longitude
    );
    if (firstActive) {
      sendToMap({
        type: "setCenter",
        lat: firstActive.pickup_latitude,
        lng: firstActive.pickup_longitude,
      });
    }
  }, [schedules, mapReady]);

  // Send stop markers to map — use optimized route order when available
  useEffect(() => {
    if (!mapReady || schedules.length === 0) return;

    let orderedSchedules = schedules;

    // Reorder by route plan if available
    if (routePlan && routePlan.stops.length > 0) {
      const orderMap = new Map(
        routePlan.stops.map((s) => [s.stop_id, s.order])
      );
      orderedSchedules = [...schedules].sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? 999;
        const orderB = orderMap.get(b.id) ?? 999;
        return orderA - orderB;
      });
    }

    const stops = orderedSchedules.map((s) => ({
      lat: s.pickup_latitude,
      lng: s.pickup_longitude,
      name: s.student_name,
      done: !!s.boarded_at || s.status === "completed",
    }));

    sendToMap({ type: "setStops", stops });

    // P2-51: Draw route polyline from ordered stop coordinates
    if (orderedSchedules.length >= 2) {
      const coords = orderedSchedules
        .filter((s) => s.pickup_latitude && s.pickup_longitude)
        .map((s) => ({ lat: s.pickup_latitude, lng: s.pickup_longitude }));
      if (coords.length >= 2) {
        sendToMap({ type: "drawRoute", coords });
      }
    }
  }, [mapReady, schedules, routePlan]);

  // Update driver position on map from local GPS
  useEffect(() => {
    if (!mapReady) return;

    const interval = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        sendToMap({
          type: "setDriverPosition",
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        });
      } catch {
        // silent
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [mapReady]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>{t("map.busLocation")}</Text>
        <View style={styles.gpsRow}>
          <View
            style={[styles.dot, gpsActive ? styles.dotGreen : styles.dotGray]}
          />
          <Text style={styles.gpsText}>
            {gpsActive ? t("driver.gpsActive") : t("driver.gpsInactive")}
          </Text>
        </View>
      </View>

      <WebView
        ref={webViewRef}
        source={{ html: MAP_HTML_CONTENT }}
        style={styles.webview}
        onMessage={onMessage}
        onLoad={onWebViewLoad}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        mixedContentMode="always"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4e8" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: { fontSize: 20, fontWeight: "bold" },
  gpsRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  dotGreen: { backgroundColor: "#4CAF50" },
  dotGray: { backgroundColor: "#ccc" },
  gpsText: { fontSize: 12, color: "#666" },
  webview: { flex: 1 },
});
