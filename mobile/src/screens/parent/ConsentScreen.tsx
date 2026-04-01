import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { listStudents, Student } from "../../api/students";
import {
  listConsents,
  createConsent,
  ConsentScope,
} from "../../api/compliance";
import { Colors, Spacing } from "../../constants/theme";
import { showError } from "../../utils/toast";
import ConsentCard, {
  REQUIRED_ITEMS,
  OPTIONAL_ITEMS,
  ALL_ITEMS,
  makeDefaultScope,
} from "./components/ConsentCard";
import {
  ConsentHeader,
  ChildrenSectionLabel,
  ChildChip,
  ToggleAllCard,
  ConsentNote,
  SubmitButton,
} from "./components/ConsentDetail";

// ── Component ───────────────────────────────────────────────────

interface Props {
  onComplete: () => void;
}

export default function ConsentScreen({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
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
    <FlatList
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}
      data={unconsentedStudents}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <>
          <ConsentHeader />
          <ChildrenSectionLabel />
        </>
      }
      renderItem={({ item: student }) => (
        <ChildChip student={student} />
      )}
      ListFooterComponent={
        <>
          <ToggleAllCard allChecked={allChecked} onPress={toggleAll} />
          <ConsentCard
            items={REQUIRED_ITEMS}
            sectionTitle="[필수] 항목"
            scope={scope}
            onToggle={toggleItem}
          />
          <ConsentCard
            items={OPTIONAL_ITEMS}
            sectionTitle="[선택] 항목"
            scope={scope}
            onToggle={toggleItem}
          />
          <ConsentNote />
          <SubmitButton
            disabled={!allRequired}
            submitting={submitting}
            onPress={handleSubmit}
          />
        </>
      }
    />
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
});
