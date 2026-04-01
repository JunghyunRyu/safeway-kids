import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
  STATUS_COLORS,
  STATUS_BG_COLORS,
} from "../../../constants/theme";
import { STATUS_LABELS, fmtTime, timeFmt } from "../utils/scheduleHelpers";

// ── Schedule Card ─────────────────────────────────────────────

export interface ScheduleItemProps {
  id: string;
  studentName: string;
  pickupTime: string;
  status: string;
  boardedAt: string | null;
  alightedAt: string | null;
  academyName: string | null;
  vehiclePlate: string | null;
  driverName: string | null;
  onCancel: (id: string) => void;
  compact?: boolean;
}

const ScheduleItem = memo(function ScheduleItem({
  id, studentName, pickupTime, status, boardedAt, alightedAt,
  academyName, vehiclePlate, driverName, onCancel, compact,
}: ScheduleItemProps) {
  const { t } = useTranslation();
  const canCancel = status === "scheduled";
  const statusColor = STATUS_COLORS[status] ?? Colors.neutral;
  const statusBg = STATUS_BG_COLORS[status] ?? Colors.neutralLight;

  if (compact) {
    return (
      <View style={[styles.compactCard, Shadows.sm]}>
        <View style={styles.compactRow}>
          <Text style={styles.compactTime}>{fmtTime(pickupTime)}</Text>
          <Text style={styles.compactName} numberOfLines={1}>{studentName}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusPillText, { color: statusColor }]}>
              {STATUS_LABELS[status] ?? status}
            </Text>
          </View>
        </View>
        {(vehiclePlate || driverName) && (
          <Text style={styles.compactMeta} numberOfLines={1}>
            {[vehiclePlate, driverName].filter(Boolean).join(" · ")}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.card, Shadows.sm]}>
      <View style={styles.cardHeader}>
        <View style={[styles.timeBadge, { backgroundColor: Colors.primaryLight }]}>
          <Ionicons name="time-outline" size={14} color={Colors.primary} />
          <Text style={[styles.timeText, { color: Colors.primary }]}>{fmtTime(pickupTime)}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusPillText, { color: statusColor }]}>
            {STATUS_LABELS[status] ?? status}
          </Text>
        </View>
      </View>
      <Text style={styles.studentName}>{studentName}</Text>
      {academyName ? <Text style={styles.metaInfo}>{academyName}</Text> : null}
      {vehiclePlate || driverName ? (
        <Text style={styles.metaInfo}>
          {[vehiclePlate, driverName].filter(Boolean).join(" · ")}
        </Text>
      ) : null}
      {boardedAt ? (
        <View style={styles.metaRow}>
          <Ionicons name="enter-outline" size={14} color={Colors.statusBoarded} />
          <Text style={[styles.metaText, { color: Colors.statusBoarded }]}>
            탑승 {timeFmt.format(new Date(boardedAt))}
          </Text>
        </View>
      ) : null}
      {alightedAt ? (
        <View style={styles.metaRow}>
          <Ionicons name="exit-outline" size={14} color={Colors.statusCompleted} />
          <Text style={[styles.metaText, { color: Colors.statusCompleted }]}>
            하차 {timeFmt.format(new Date(alightedAt))}
          </Text>
        </View>
      ) : null}
      {canCancel && (
        <Pressable style={styles.cancelBtn} onPress={() => onCancel(id)} accessibilityRole="button" accessibilityLabel={`${studentName} 스케줄 취소`}>
          <Ionicons name="close-circle-outline" size={16} color={Colors.danger} />
          <Text style={styles.cancelText}>{t("schedule.cancelRide")}</Text>
        </Pressable>
      )}
    </View>
  );
});

export default ScheduleItem;

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Card (daily view)
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  timeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm },
  timeText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  statusPill: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.full },
  statusPillText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  studentName: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  metaInfo: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginBottom: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  metaText: { fontSize: Typography.sizes.sm },
  cancelBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.xs, marginTop: Spacing.md, paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.danger, backgroundColor: Colors.dangerLight, minHeight: 48 },
  cancelText: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.danger },

  // Compact card (weekly view)
  compactCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.xs },
  compactRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  compactTime: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.primary, width: 42 },
  compactName: { flex: 1, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
  compactMeta: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 2, marginLeft: 42 + Spacing.sm },
});
