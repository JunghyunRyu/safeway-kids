import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ConsentScope } from "../../../api/compliance";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../../constants/theme";

// ── Consent item definitions ────────────────────────────────────

export interface ConsentItem {
  key: keyof ConsentScope;
  label: string;
  desc: string;
  required: boolean;
}

export const REQUIRED_ITEMS: ConsentItem[] = [
  {
    key: "service_terms",
    label: "서비스 이용약관",
    desc: "Safeway Kids 서비스 이용에 대한 약관입니다.",
    required: true,
  },
  {
    key: "privacy_policy",
    label: "개인정보 처리방침",
    desc: "개인정보의 수집, 이용, 보관에 관한 방침입니다.",
    required: true,
  },
  {
    key: "child_info_collection",
    label: "아동 개인정보 수집 및 이용",
    desc: "아동의 이름, 생년월일 등 개인정보 수집에 동의합니다.",
    required: true,
  },
];

export const OPTIONAL_ITEMS: ConsentItem[] = [
  {
    key: "location_tracking",
    label: "위치정보 수집",
    desc: "셔틀 탑승 시 실시간 위치를 추적합니다. (권장)",
    required: false,
  },
  {
    key: "push_notification",
    label: "푸시 알림 수신",
    desc: "탑승/하차/긴급 알림을 받습니다.",
    required: false,
  },
  {
    key: "marketing",
    label: "마케팅 정보 수신",
    desc: "이벤트, 프로모션 등 마케팅 정보를 받습니다.",
    required: false,
  },
  {
    key: "third_party_sharing",
    label: "제3자 정보 제공",
    desc: "학원 및 셔틀 운영사에 정보를 제공합니다.",
    required: false,
  },
  {
    key: "health_info_sharing",
    label: "건강정보 공유",
    desc: "알레르기, 특이사항 등 건강정보를 공유합니다.",
    required: false,
  },
];

export const ALL_ITEMS = [...REQUIRED_ITEMS, ...OPTIONAL_ITEMS];

export function makeDefaultScope(): ConsentScope {
  return {
    service_terms: false,
    privacy_policy: false,
    child_info_collection: false,
    location_tracking: false,
    push_notification: false,
    marketing: false,
    third_party_sharing: false,
    health_info_sharing: false,
  };
}

// ── ConsentCard component ───────────────────────────────────────

interface ConsentCardProps {
  items: ConsentItem[];
  sectionTitle: string;
  scope: ConsentScope;
  onToggle: (key: keyof ConsentScope) => void;
}

export default function ConsentCard({
  items,
  sectionTitle,
  scope,
  onToggle,
}: ConsentCardProps) {
  return (
    <View style={[styles.card, Shadows.sm]}>
      <Text style={styles.sectionTitle}>{sectionTitle}</Text>
      {items.map((item, idx) => (
        <Pressable
          key={item.key}
          style={[
            styles.row,
            idx < items.length - 1 && styles.rowBorder,
          ]}
          onPress={() => onToggle(item.key)}
        >
          <View
            style={[styles.checkbox, scope[item.key] && styles.checkboxChecked]}
          >
            {scope[item.key] && (
              <Ionicons
                name="checkmark"
                size={16}
                color={Colors.textInverse}
              />
            )}
          </View>
          <View style={styles.rowContent}>
            {item.required ? (
              <View style={styles.rowLabelRow}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.requiredMark}>*</Text>
              </View>
            ) : (
              <Text style={styles.rowLabel}>
                {item.label}
                {item.key === "location_tracking" && (
                  <Text style={styles.recommendedBadge}> (권장)</Text>
                )}
              </Text>
            )}
            <Text style={styles.rowDesc}>{item.desc}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
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
    alignItems: "flex-start",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowContent: {
    flex: 1,
  },
  rowLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  requiredMark: {
    fontSize: Typography.sizes.md,
    color: Colors.danger,
    marginLeft: 2,
  },
  rowDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  recommendedBadge: {
    fontSize: Typography.sizes.xs,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});
