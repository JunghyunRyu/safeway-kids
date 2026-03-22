import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  NotificationPref,
} from "../../api/notifications";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../constants/theme";
import { showError } from "../../utils/toast";

const NOTIFICATION_TYPES = [
  { type: "boarding", label: "탑승 알림", desc: "자녀가 차량에 탑승했을 때", icon: "enter-outline" as const },
  { type: "alighting", label: "하차 알림", desc: "자녀가 안전하게 하차했을 때", icon: "exit-outline" as const },
  { type: "schedule_cancelled", label: "스케줄 취소 알림", desc: "스케줄이 취소되었을 때", icon: "calendar-outline" as const },
  { type: "arrival_confirmed", label: "학원 도착 알림", desc: "자녀가 학원에 도착했을 때", icon: "location-outline" as const },
];

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getNotificationPreferences();
      const map = new Map<string, boolean>();
      for (const p of data) {
        map.set(`${p.channel}:${p.notification_type}`, p.enabled);
      }
      setPrefs(map);
    } catch {
      showError("알림 설정을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = useCallback(
    async (notificationType: string, channel: string, value: boolean) => {
      const key = `${channel}:${notificationType}`;
      setPrefs((prev) => {
        const next = new Map(prev);
        next.set(key, value);
        return next;
      });

      setSaving(true);
      try {
        const allPrefs: NotificationPref[] = [];
        const updatedMap = new Map(prefs);
        updatedMap.set(key, value);
        for (const [k, v] of updatedMap) {
          const [ch, nt] = k.split(":");
          allPrefs.push({ channel: ch, notification_type: nt, enabled: v });
        }
        // Also include the just-toggled one if it wasn't in the map before
        if (!prefs.has(key)) {
          allPrefs.push({ channel, notification_type: notificationType, enabled: value });
        }
        await updateNotificationPreferences(allPrefs);
      } catch {
        // Revert on error
        setPrefs((prev) => {
          const next = new Map(prev);
          next.set(key, !value);
          return next;
        });
        showError("알림 설정 변경에 실패했습니다.");
      } finally {
        setSaving(false);
      }
    },
    [prefs],
  );

  const isEnabled = (type: string, channel: string): boolean => {
    const key = `${channel}:${type}`;
    return prefs.get(key) ?? true; // default enabled
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>알림 설정</Text>
      <Text style={styles.subtitle}>수신할 알림 유형을 선택하세요</Text>

      <View style={[styles.card, Shadows.sm]}>
        <Text style={styles.sectionTitle}>푸시 알림</Text>
        {NOTIFICATION_TYPES.map((item, idx) => (
          <View
            key={item.type}
            style={[
              styles.row,
              idx < NOTIFICATION_TYPES.length - 1 && styles.rowBorder,
            ]}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={Colors.primary}
              style={styles.rowIcon}
            />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowDesc}>{item.desc}</Text>
            </View>
            <Switch
              value={isEnabled(item.type, "fcm")}
              onValueChange={(v) => handleToggle(item.type, "fcm", v)}
              trackColor={{ false: Colors.border, true: Colors.primary + "60" }}
              thumbColor={isEnabled(item.type, "fcm") ? Colors.primary : Colors.neutral}
              disabled={saving}
            />
          </View>
        ))}
      </View>

      <Text style={styles.note}>
        안전 관련 긴급 알림은 설정과 관계없이 항상 발송됩니다.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxl },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.base,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowIcon: { marginRight: Spacing.md },
  rowContent: { flex: 1 },
  rowLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  rowDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  note: {
    fontSize: Typography.sizes.xs,
    color: Colors.textDisabled,
    textAlign: "center",
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
});
