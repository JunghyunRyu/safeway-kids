import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
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
  const [pickupPoints, setPickupPoints] = useState<Array<{lat: number; lng: number; label: string}>>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(false);

  const { locations, connected, connectionState } = useVehicleTracking({
    vehicleIds,
    enabled: vehicleIds.length > 0,
  });

  // Load schedules to find vehicle IDs and dynamic map center
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setDataLoading(true);
        setDataError(false);
        try {
          const data = await listDailySchedules(todayStr());
          if (cancelled) return;
          setSchedules(data);
          const ids = [
            ...new Set(
              data
                .filter((s) => s.vehicle_id && s.status !== "cancelled")
                .map((s) => s.vehicle_id!)
            ),
          ];
          setVehicleIds(ids);

          // Load student templates to find pickup coordinates for map center and markers
          const students = await listStudents();
          if (cancelled) return;
          const points: Array<{lat: number; lng: number; label: string}> = [];
          if (students.length > 0) {
            let centerSet = false;
            for (const stu of students) {
              const templates = await listTemplates(stu.id);
              if (cancelled) return;
              templates.forEach((tmpl) => {
                if (tmpl.is_active && tmpl.pickup_latitude && tmpl.pickup_longitude) {
                  if (!centerSet) {
                    setMapCenter({ lat: tmpl.pickup_latitude, lng: tmpl.pickup_longitude });
                    centerSet = true;
                  }
                  points.push({
                    lat: tmpl.pickup_latitude,
                    lng: tmpl.pickup_longitude,
                    label: tmpl.pickup_address ?? "픽업 지점",
                  });
                }
              });
            }
          }
          setPickupPoints(points);
        } catch {
          if (!cancelled) setDataError(true);
        } finally {
          if (!cancelled) setDataLoading(false);
        }
      })();
      return () => { cancelled = true; };
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
      // P2-43: Include vehicle license plate as label
      const schedule = schedules.find((s) => s.vehicle_id === vehicleId);
      sendToMap({
        type: "updateBus",
        vehicleId,
        lat: loc.latitude,
        lng: loc.longitude,
        heading: loc.heading,
        label: schedule?.vehicle_license_plate ?? undefined,
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

    const AVG_STOP_MINUTES = 3;
    if (remaining > 0) {
      const etaMinutes = remaining * AVG_STOP_MINUTES;
      sendToMap({
        type: "setEta",
        text: remaining === 0 ? "곧 도착합니다" : `약 ${etaMinutes}분 후 도착`,
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

  // Send pickup markers to map
  useEffect(() => {
    if (!mapReady || pickupPoints.length === 0) return;
    pickupPoints.forEach((p) => {
      sendToMap({
        type: "addPickupMarker",
        lat: p.lat,
        lng: p.lng,
        label: p.label,
      });
    });
  }, [pickupPoints, mapReady]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>{t("map.tracking")}</Text>
        {connectionState !== "idle" && (
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
                      : connectionState === "error" || connectionState === "auth_failed"
                        ? styles.dotRed
                        : styles.dotGray,
              ]}
            />
            <Text style={styles.statusText}>
              {connectionState === "connected"
                ? "연결됨"
                : connectionState === "polling"
                  ? "위치 업데이트 중"
                  : connectionState === "connecting" || connectionState === "reconnecting"
                    ? "연결 중..."
                    : connectionState === "auth_failed"
                      ? "인증 만료 — 다시 로그인해주세요"
                      : t("map.disconnected")}
            </Text>
          </View>
        )}
      </View>

      {dataLoading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.empty, { marginTop: 12 }]}>데이터를 불러오는 중...</Text>
        </View>
      ) : dataError ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>데이터를 불러오지 못했습니다</Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => { setDataLoading(true); setDataError(false); }}
          >
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : Platform.OS === "web" || !WebView ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>
            지도 기능은 모바일 앱에서만 사용 가능합니다.
          </Text>
          {vehicleIds.length > 0 && (
            <Text style={styles.emptySubtext}>
              차량 {vehicleIds.length}대 추적 중
              {connected ? " (연결됨)" : " (연결 대기)"}
            </Text>
          )}
        </View>
      ) : (
        <>
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
          {vehicleIds.length === 0 && !dataLoading && (
            <View style={styles.noVehicleOverlay}>
              <Text style={styles.noVehicleText}>오늘 운행 스케줄이 없습니다</Text>
              <Text style={styles.noVehicleSub}>픽업 지점은 지도에 표시됩니다</Text>
            </View>
          )}
        </>
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
  dotGray: { backgroundColor: Colors.textDisabled },
  statusText: { fontSize: 12, color: Colors.textSecondary },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { fontSize: 14, color: Colors.textSecondary },
  emptySubtext: { marginTop: 8, fontSize: 12, color: Colors.textDisabled },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  webview: { flex: 1 },
  noVehicleOverlay: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noVehicleText: { fontSize: 14, color: Colors.textSecondary, fontWeight: "600" },
  noVehicleSub: { fontSize: 12, color: Colors.textDisabled, marginTop: 4 },
});
