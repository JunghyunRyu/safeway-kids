import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { listStudents, Student } from "../../api/students";
import {
  listConsents,
  createConsent,
  Consent,
  ConsentScope,
} from "../../api/compliance";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../constants/theme";
import { showError } from "../../utils/toast";

// ── Consent item definitions ────────────────────────────────────

interface ConsentItem {
  key: keyof ConsentScope;
  label: string;
  desc: string;
  required: boolean;
}

const REQUIRED_ITEMS: ConsentItem[] = [
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

const OPTIONAL_ITEMS: ConsentItem[] = [
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

const ALL_ITEMS = [...REQUIRED_ITEMS, ...OPTIONAL_ITEMS];

function makeDefaultScope(): ConsentScope {
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

// ── Component ───────────────────────────────────────────────────

interface Props {
  onComplete: () => void;
}

export default function ConsentScreen({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [existingConsents, setExistingConsents] = useState<Consent[]>([]);
  const [unconsentedStudents, setUnconsentedStudents] = useState<Student[]>([]);
  const [scope, setScope] = useState<ConsentScope>(makeDefaultScope());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentData, consentData] = await Promise.all([
        listStudents(),
        listConsents(),
      ]);
      setStudents(studentData);
      setExistingConsents(consentData);

      // Find students without active (non-withdrawn) consents
      const activeConsentChildIds = new Set(
        consentData
          .filter((c) => c.withdrawn_at === null)
          .map((c) => c.child_id),
      );
      const unconsented = studentData.filter(
        (s) => !activeConsentChildIds.has(s.id),
      );
      setUnconsentedStudents(unconsented);

      // If all children already have consents, skip this screen
      if (unconsented.length === 0) {
        onComplete();
      }
    } catch {
      showError("정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [onComplete]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Derived state ──────────────────────────────────────────────

  const allRequired = REQUIRED_ITEMS.every((item) => scope[item.key]);
  const allChecked = ALL_ITEMS.every((item) => scope[item.key]);

  const toggleItem = (key: keyof ConsentScope) => {
    setScope((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = () => {
    if (allChecked) {
      setScope(makeDefaultScope());
    } else {
      const full: ConsentScope = { ...scope };
      for (const item of ALL_ITEMS) {
        full[item.key] = true;
      }
      setScope(full);
    }
  };

  const handleSubmit = async () => {
    if (!allRequired) return;

    setSubmitting(true);
    try {
      // Create consent for each unconsented child sequentially
      // to avoid partial failure issues with Promise.all
      let failCount = 0;
      for (const student of unconsentedStudents) {
        try {
          await createConsent(student.id, scope);
        } catch (err: any) {
          // 409 Conflict = consent already exists → safe to skip
          if (err?.response?.status === 409) {
            continue;
          }
          failCount++;
        }
      }
      if (failCount > 0 && failCount === unconsentedStudents.length) {
        showError("동의 처리에 실패했습니다. 다시 시도해 주세요.");
      } else {
        Alert.alert("동의 완료", "이용 동의가 완료되었습니다.", [
          { text: "확인", onPress: onComplete },
        ]);
      }
    } catch {
      showError("동의 처리에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator
          style={{ marginTop: 60 }}
          size="large"
          color={Colors.primary}
        />
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: Colors.primary + "15" }]}>
          <Ionicons name="shield-checkmark" size={36} color={Colors.primary} />
        </View>
        <Text style={styles.title}>이용 동의</Text>
        <Text style={styles.subtitle}>
          서비스 이용을 위해 아래 항목에 동의해 주세요.
        </Text>
      </View>

      {/* Children list */}
      <View style={styles.childrenSection}>
        <Text style={styles.childrenLabel}>동의 대상 자녀</Text>
        <View style={styles.childrenList}>
          {unconsentedStudents.map((student) => (
            <View key={student.id} style={styles.childChip}>
              <View style={styles.childAvatar}>
                <Text style={styles.childAvatarText}>
                  {student.name.charAt(0)}
                </Text>
              </View>
              <Text style={styles.childChipText}>{student.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Toggle all */}
      <Pressable
        style={[styles.toggleAllCard, Shadows.sm]}
        onPress={toggleAll}
      >
        <View style={[styles.checkbox, allChecked && styles.checkboxChecked]}>
          {allChecked && (
            <Ionicons name="checkmark" size={16} color={Colors.textInverse} />
          )}
        </View>
        <Text style={styles.toggleAllText}>전체 동의</Text>
      </Pressable>

      {/* Required section */}
      <View style={[styles.card, Shadows.sm]}>
        <Text style={styles.sectionTitle}>[필수] 항목</Text>
        {REQUIRED_ITEMS.map((item, idx) => (
          <Pressable
            key={item.key}
            style={[
              styles.row,
              idx < REQUIRED_ITEMS.length - 1 && styles.rowBorder,
            ]}
            onPress={() => toggleItem(item.key)}
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
              <View style={styles.rowLabelRow}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.requiredMark}>*</Text>
              </View>
              <Text style={styles.rowDesc}>{item.desc}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Optional section */}
      <View style={[styles.card, Shadows.sm]}>
        <Text style={styles.sectionTitle}>[선택] 항목</Text>
        {OPTIONAL_ITEMS.map((item, idx) => (
          <Pressable
            key={item.key}
            style={[
              styles.row,
              idx < OPTIONAL_ITEMS.length - 1 && styles.rowBorder,
            ]}
            onPress={() => toggleItem(item.key)}
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
              <Text style={styles.rowLabel}>
                {item.label}
                {item.key === "location_tracking" && (
                  <Text style={styles.recommendedBadge}> (권장)</Text>
                )}
              </Text>
              <Text style={styles.rowDesc}>{item.desc}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Note */}
      <Text style={styles.note}>
        필수 항목에 동의하지 않으면 서비스를 이용할 수 없습니다.{"\n"}
        선택 항목은 동의하지 않아도 서비스 이용이 가능합니다.
      </Text>

      {/* Submit button */}
      <Pressable
        style={[
          styles.submitBtn,
          !allRequired && styles.submitBtnDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!allRequired || submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color={Colors.textInverse} />
        ) : (
          <Text style={styles.submitBtnText}>동의하고 시작하기</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

// ── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: "center",
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.base,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  // Children section
  childrenSection: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  childrenLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  childrenList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  childChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  childAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  childAvatarText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textInverse,
  },
  childChipText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.primaryDark,
  },

  // Toggle all
  toggleAllCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    padding: Spacing.base,
  },
  toggleAllText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },

  // Card
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

  // Row
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

  // Checkbox
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

  // Note
  note: {
    fontSize: Typography.sizes.xs,
    color: Colors.textDisabled,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },

  // Submit
  submitBtn: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.textDisabled,
  },
  submitBtnText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textInverse,
  },
});
