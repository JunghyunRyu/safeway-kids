import React, { useCallback } from "react";
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
const SOS_ENABLED = false;

export default function SOSButton() {
  const { user } = useAuth();
  const isCrewRole = user?.role === "driver" || user?.role === "safety_escort";

  const sendSos = useCallback(
    async (sosType: string, message?: string) => {
      let latitude = 0;
      let longitude = 0;
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
        // proceed without location
      }

      try {
        await apiClient.post("/notifications/sos", {
          latitude,
          longitude,
          sos_type: sosType,
          message,
        });
      } catch {
        // even if API fails, still try to call 112
      }

      Linking.openURL("tel:112");
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
