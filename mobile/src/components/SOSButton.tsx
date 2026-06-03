import React, { useCallback, useEffect, useRef } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import apiClient from "../api/client";
import { useAuth } from "../hooks/useAuth";

const SOS_TYPES = [
  { value: "vehicle_accident", label: "차량사고" },
  { value: "student_injury", label: "학생부상" },
  { value: "vehicle_breakdown", label: "차량고장" },
  { value: "other", label: "기타" },
];

// SOS feature is currently disabled to prevent accidental emergency calls.
// Set to true to enable when ready for production use.
const SOS_ENABLED = true;

const LOCATION_CACHE_INTERVAL_MS = 30_000;
const MAX_RETRY_COUNT = 2;

export default function SOSButton() {
  const { user } = useAuth();
  const isCrewRole = user?.role === "driver" || user?.role === "safety_escort";

  const cachedLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const sendingRef = useRef(false);
  const retryCountRef = useRef(0);

  // Mount 시 30초 주기로 위치 캐싱 (permission granted일 때만)
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const cacheLocation = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          cachedLocationRef.current = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
        }
      } catch {
        // 캐싱 실패 시 기존 캐시 유지
      }
    };

    cacheLocation();
    intervalId = setInterval(cacheLocation, LOCATION_CACHE_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const sendSos = useCallback(
    async (sosType: string, message?: string) => {
      // 중복 탭 방지
      if (sendingRef.current) return;
      sendingRef.current = true;

      // 최신 위치 시도(High accuracy), 실패 시 캐시 사용, 둘 다 없으면 null
      let latitude: number | null = null;
      let longitude: number | null = null;
      let location_unknown = false;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          latitude = loc.coords.latitude;
          longitude = loc.coords.longitude;
        }
      } catch {
        // High accuracy 실패 → 캐시로 폴백
      }

      if (latitude === null || longitude === null) {
        if (cachedLocationRef.current !== null) {
          latitude = cachedLocationRef.current.latitude;
          longitude = cachedLocationRef.current.longitude;
        } else {
          location_unknown = true;
        }
      }

      try {
        await apiClient.post("/notifications/sos", {
          latitude,
          longitude,
          location_unknown,
          sos_type: sosType,
          message,
        });

        // API 성공 시에만 112 연결
        retryCountRef.current = 0;
        sendingRef.current = false;
        Linking.openURL("tel:112");
      } catch {
        sendingRef.current = false;
        retryCountRef.current += 1;
        const canRetry = retryCountRef.current <= MAX_RETRY_COUNT;

        Alert.alert(
          "SOS 전송 실패",
          "관리자에게 전달되지 않았습니다.\n재시도하거나 직접 112에 신고하세요.",
          [
            ...(canRetry
              ? [
                  {
                    text: "재시도",
                    onPress: () => sendSos(sosType, message),
                  },
                ]
              : []),
            {
              text: "112 직접 신고",
              style: "destructive" as const,
              onPress: () => {
                retryCountRef.current = 0;
                Linking.openURL("tel:112");
              },
            },
            {
              text: "취소",
              style: "cancel" as const,
              onPress: () => {
                // 재시도 횟수 유지 (다음 탭에서 이어서 카운트)
              },
            },
          ]
        );
      }
    },
    []
  );

  const handlePress = useCallback(() => {
    if (!SOS_ENABLED) {
      Alert.alert(
        "SOS 준비 중",
        "SOS 기능은 현재 준비 중입니다.\n정식 서비스 출시 후 활성화됩니다.",
      );
      return;
    }

    Alert.alert(
      "긴급 SOS",
      "긴급 상황입니까?\nSOS 호출 시 관리자에게 즉시 알림되고, 112로 전화 연결됩니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "SOS 호출",
          style: "destructive",
          onPress: () => {
            if (isCrewRole) {
              Alert.alert("사고 유형 선택", undefined, [
                ...SOS_TYPES.map((t) => ({
                  text: t.label,
                  onPress: () => sendSos(t.value),
                })),
                { text: "취소", style: "cancel" },
              ]);
            } else {
              sendSos("emergency");
            }
          },
        },
      ]
    );
  }, [isCrewRole, sendSos]);

  return (
    <Pressable
      style={[styles.fab, !SOS_ENABLED && styles.fabDisabled]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="긴급 SOS 호출"
    >
      <View style={styles.inner}>
        <Ionicons name="warning" size={22} color={SOS_ENABLED ? "#fff" : "rgba(255,255,255,0.5)"} />
        <Text style={[styles.label, !SOS_ENABLED && styles.labelDisabled]}>SOS</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    zIndex: 999,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.6,
  },
  inner: {
    alignItems: "center",
  },
  label: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    marginTop: -2,
  },
  labelDisabled: {
    color: "rgba(255,255,255,0.5)",
  },
});
