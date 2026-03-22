import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
let WebView: any = null;
if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  WebView = require("react-native-webview").WebView;
}
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { listDailySchedules, listTemplates, DailySchedule, ScheduleTemplate } from "../../api/schedules";
import { listStudents } from "../../api/students";
import { useVehicleTracking } from "../../hooks/useVehicleTracking";
import { MAP_HTML_CONTENT } from "../../constants/mapHtml";

const KAKAO_MAP_API_KEY = Constants.expoConfig?.extra?.kakaoMapApiKey ?? "";

// Default center: Gangnam-gu
const DEFAULT_CENTER = { lat: 37.4979, lng: 127.0276 };

// Stable source object — defined outside component to prevent WebView reload on re-render
const WEBVIEW_SOURCE = { html: MAP_HTML_CONTENT, baseUrl: "http://localhost" };

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function MapScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<any>(null);
  const [schedules, setSchedules] = useState<DailySchedule[]>([]);
  const [vehicleIds, setVehicleIds] = useState<string[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);

  const { locations, connected, connectionState } = useVehicleTracking({
    vehicleIds,
    enabled: vehicleIds.length > 0,
  });

  // Load schedules to find vehicle IDs and dynamic map center
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

          // Load student templates to find pickup coordinates for map center
          const students = await listStudents();
          if (students.length > 0) {
            const templates = await listTemplates(students[0].id);
            const active = templates.find(
              (t) => t.is_active && t.pickup_latitude && t.pickup_longitude
            );
            if (active) {
              setMapCenter({ lat: active.pickup_latitude, lng: active.pickup_longitude });
            }
          }
        } catch {
          // silent
        }
      })();
    }, [])
  );

  // Handle messages from WebView
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
      center: mapCenter,
    });
  };

  // Update map center when dynamic center is loaded after init
  useEffect(() => {
    if (!mapReady) return;
    if (mapCenter.lat !== DEFAULT_CENTER.lat || mapCenter.lng !== DEFAULT_CENTER.lng) {
      sendToMap({ type: "setCenter", lat: mapCenter.lat, lng: mapCenter.lng });
    }
  }, [mapCenter, mapReady]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>{t("map.tracking")}</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.dot,
              connectionState === "connected"
                ? styles.dotGreen
                : connectionState === "polling"
                  ? styles.dotOrange
                  : connectionState === "connecting" || connectionState === "reconnecting"
                    ? styles.dotYellow
                    : styles.dotRed,
            ]}
          />
          <Text style={styles.statusText}>
            {connectionState === "connected"
              ? "연결됨"
              : connectionState === "polling"
                ? "폴링 모드"
                : connectionState === "connecting" || connectionState === "reconnecting"
                  ? "연결 중..."
                  : connectionState === "auth_failed"
                    ? "인증 만료 — 다시 로그인해주세요"
                    : connectionState === "idle"
                      ? ""
                      : t("map.disconnected")}
          </Text>
        </View>
      </View>

      {vehicleIds.length === 0 && connectionState === "idle" ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>오늘 운행 스케줄이 없습니다</Text>
        </View>
      ) : Platform.OS === "web" || !WebView ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>
            지도 기능은 모바일 앱에서만 사용 가능합니다.
          </Text>
          <Text style={styles.emptySubtext}>
            차량 {vehicleIds.length}대 추적 중
            {connected ? " (연결됨)" : " (연결 대기)"}
          </Text>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={WEBVIEW_SOURCE}
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
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: { fontSize: 20, fontWeight: "bold", color: Colors.textPrimary },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  dotGreen: { backgroundColor: Colors.success },
  dotOrange: { backgroundColor: Colors.warning },
  dotYellow: { backgroundColor: "#FFC107" },
  dotRed: { backgroundColor: Colors.danger },
  statusText: { fontSize: 12, color: Colors.textSecondary },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { fontSize: 14, color: Colors.textSecondary },
  emptySubtext: { marginTop: 8, fontSize: 12, color: Colors.textDisabled },
  webview: { flex: 1 },
});
