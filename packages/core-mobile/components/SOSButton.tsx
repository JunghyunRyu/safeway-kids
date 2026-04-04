import React, { useCallback } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

interface SOSType {
  value: string;
  label: string;
}

interface SOSButtonProps {
  apiClient: { post: (url: string, data: unknown) => Promise<unknown> };
  sosEndpoint?: string;
  sosTypes?: SOSType[];
  showTypeSelector?: boolean;
  emergencyNumber?: string;
  enabled?: boolean;
}

export default function SOSButton({
  apiClient,
  sosEndpoint = "/notifications/sos",
  sosTypes = [{ value: "emergency", label: "긴급" }],
  showTypeSelector = false,
  emergencyNumber = "112",
  enabled = true,
}: SOSButtonProps) {
  const sendSos = useCallback(
    async (sosType: string) => {
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
        await apiClient.post(sosEndpoint, {
          latitude,
          longitude,
          sos_type: sosType,
        });
      } catch {
        // even if API fails, still try to call emergency
      }

      Linking.openURL(`tel:${emergencyNumber}`);
    },
    [apiClient, sosEndpoint, emergencyNumber]
  );

  const handlePress = useCallback(() => {
    if (!enabled) {
      Alert.alert("SOS 준비 중", "SOS 기능은 현재 준비 중입니다.");
      return;
    }

    Alert.alert(
      "긴급 SOS",
      `긴급 상황입니까?\nSOS 호출 시 관리자에게 즉시 알림되고, ${emergencyNumber}로 전화 연결됩니다.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "SOS 호출",
          style: "destructive",
          onPress: () => {
            if (showTypeSelector && sosTypes.length > 1) {
              Alert.alert("유형 선택", undefined, [
                ...sosTypes.map((t) => ({
                  text: t.label,
                  onPress: () => sendSos(t.value),
                })),
                { text: "취소", style: "cancel" },
              ]);
            } else {
              sendSos(sosTypes[0]?.value ?? "emergency");
            }
          },
        },
      ]
    );
  }, [enabled, showTypeSelector, sosTypes, sendSos, emergencyNumber]);

  return (
    <Pressable
      style={[styles.fab, !enabled && styles.fabDisabled]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="긴급 SOS 호출"
    >
      <View style={styles.inner}>
        <Ionicons name="warning" size={22} color={enabled ? "#fff" : "rgba(255,255,255,0.5)"} />
        <Text style={[styles.label, !enabled && styles.labelDisabled]}>SOS</Text>
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
  inner: { alignItems: "center" },
  label: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    marginTop: -2,
  },
  labelDisabled: { color: "rgba(255,255,255,0.5)" },
});
