import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { listDailySchedules, DailySchedule } from "../../api/schedules";
import { useVehicleTracking } from "../../hooks/useVehicleTracking";

// Kakao Maps API key — replace with real key or load from config
const KAKAO_MAP_API_KEY = "YOUR_KAKAO_JS_API_KEY";

// Default center: Gangnam-gu
const DEFAULT_CENTER = { lat: 37.4979, lng: 127.0276 };

const MAP_HTML = require("../../../assets/kakao-map.html");

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function MapScreen() {
  const { t } = useTranslation();
  const webViewRef = useRef<WebView>(null);
  const [schedules, setSchedules] = useState<DailySchedule[]>([]);
  const [vehicleIds, setVehicleIds] = useState<string[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const { locations, connected } = useVehicleTracking({
    vehicleIds,
    enabled: vehicleIds.length > 0,
  });

  // Load schedules to find vehicle IDs
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const data = await listDailySchedules(todayStr());
          setSchedules(data);
          const ids = [
            ...new Set(
              data
                .filter((s) => s.vehicle_id && s.status !== "cancelled")
                .map((s) => s.vehicle_id!)
            ),
          ];
          setVehicleIds(ids);
        } catch {
          // silent
        }
      })();
    }, [])
  );

  // Initialize map when WebView loads
  const handleMapReady = () => {
    setMapReady(true);
    sendToMap({
      type: "init",
      apiKey: KAKAO_MAP_API_KEY,
      center: DEFAULT_CENTER,
    });
  };

  // Handle messages from WebView
  const onMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "mapReady") {
        handleMapReady();
      }
    } catch {
      // ignore
    }
  };

  // Send bus location updates to map
  useEffect(() => {
    if (!mapReady) return;

    locations.forEach((loc, vehicleId) => {
      sendToMap({
        type: "updateBus",
        vehicleId,
        lat: loc.latitude,
        lng: loc.longitude,
        heading: loc.heading,
      });
    });

    sendToMap({ type: "setStatus", connected });
  }, [locations, connected, mapReady]);

  // Calculate ETA
  useEffect(() => {
    if (!mapReady || schedules.length === 0) return;

    const activeSchedules = schedules.filter((s) => s.status !== "cancelled");
    const remaining = activeSchedules.filter(
      (s) => !s.boarded_at && s.status === "scheduled"
    ).length;

    if (remaining > 0) {
      sendToMap({
        type: "setEta",
        text: `${remaining}정거장 전`,
      });
    } else {
      sendToMap({ type: "setEta", text: null });
    }
  }, [schedules, mapReady]);

  const sendToMap = (msg: object) => {
    webViewRef.current?.injectJavaScript(
      `handleMessage('${JSON.stringify(msg).replace(/'/g, "\\'")}'); true;`
    );
  };

  // Init map on first load (in case mapReady fires before we set up listener)
  const onWebViewLoad = () => {
    sendToMap({
      type: "init",
      apiKey: KAKAO_MAP_API_KEY,
      center: DEFAULT_CENTER,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("map.tracking")}</Text>
        <View style={styles.statusRow}>
          <View
            style={[styles.dot, connected ? styles.dotGreen : styles.dotRed]}
          />
          <Text style={styles.statusText}>
            {connected ? "연결됨" : t("map.disconnected")}
          </Text>
        </View>
      </View>

      {vehicleIds.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>{t("map.noLocation")}</Text>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={MAP_HTML}
          style={styles.webview}
          onMessage={onMessage}
          onLoad={onWebViewLoad}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
          mixedContentMode="always"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: { fontSize: 20, fontWeight: "bold" },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  dotGreen: { backgroundColor: "#4CAF50" },
  dotRed: { backgroundColor: "#f44" },
  statusText: { fontSize: 12, color: "#666" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { fontSize: 14, color: "#888" },
  webview: { flex: 1 },
});
