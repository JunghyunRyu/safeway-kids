import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { consentItemsFor, requiredSatisfied, type PtRole } from '../../constants/consent';
import PolicyScreen from './PolicyScreen';

interface Props {
  role: PtRole;
  onAgree: (checkedDocTypes: string[]) => void;
  onBack: () => void;
}

/**
 * ConsentScreen — 가입 필수/선택 동의 (FR-M2).
 * 필수(이용약관·개인정보·연령 확인, walker는 위치정보) 미체크 시 진행 불가.
 */
export default function ConsentScreen({ role, onAgree, onBack }: Props) {
  const items = useMemo(() => consentItemsFor(role), [role]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [policyKind, setPolicyKind] = useState<'terms' | 'privacy' | null>(null);

  const allChecked = items.every((i) => checked.has(i.docType));
  const canProceed = requiredSatisfied(role, checked);

  const toggle = (docType: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(docType)) next.delete(docType);
      else next.add(docType);
      return next;
    });
  };

  const toggleAll = () => {
    setChecked(allChecked ? new Set() : new Set(items.map((i) => i.docType)));
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} style={styles.backBtn} accessibilityLabel="뒤로">
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
      </Pressable>

      <Text style={styles.title}>약관 동의</Text>
      <Text style={styles.subtitle}>서비스 이용을 위해 아래 항목에 동의해 주세요</Text>

      <Pressable style={[styles.allRow, allChecked && styles.allRowActive]} onPress={toggleAll}>
        <Ionicons
          name={allChecked ? 'checkbox' : 'square-outline'}
          size={24}
          color={allChecked ? Colors.primary : Colors.textDisabled}
        />
        <Text style={styles.allLabel}>전체 동의</Text>
      </Pressable>

      <View style={styles.list}>
        {items.map((item) => {
          const isChecked = checked.has(item.docType);
          return (
            <View key={item.docType} style={styles.row}>
              <Pressable
                style={styles.rowMain}
                onPress={() => toggle(item.docType)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isChecked }}
              >
                <Ionicons
                  name={isChecked ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={isChecked ? Colors.primary : Colors.textDisabled}
                />
                <Text style={styles.rowLabel}>
                  {item.required ? '[필수] ' : '[선택] '}
                  {item.label}
                </Text>
              </Pressable>
              {item.policyKind && (
                <Pressable onPress={() => setPolicyKind(item.policyKind!)} hitSlop={8}>
                  <Text style={styles.viewLink}>보기</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      <Pressable
        style={[styles.primaryBtn, !canProceed && styles.primaryBtnDisabled]}
        disabled={!canProceed}
        onPress={() => onAgree([...checked])}
        accessibilityLabel="동의하고 계속"
      >
        <Text style={styles.primaryBtnText}>동의하고 계속</Text>
      </Pressable>

      <Modal visible={policyKind !== null} animationType="slide" onRequestClose={() => setPolicyKind(null)}>
        <PolicyScreen
          route={{ params: { kind: policyKind ?? 'privacy' } }}
          navigation={{ goBack: () => setPolicyKind(null) }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.xl, paddingTop: 100 },
  backBtn: { position: 'absolute', top: 60, left: Spacing.base, zIndex: 10 },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 6, marginBottom: Spacing.xl },
  allRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base,
    borderWidth: 2, borderColor: Colors.borderLight, ...Shadows.sm,
  },
  allRowActive: { borderColor: Colors.primary },
  allLabel: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  list: { marginTop: Spacing.md, marginBottom: Spacing.xl },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs,
  },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  rowLabel: { fontSize: Typography.sizes.sm, color: Colors.textPrimary, flexShrink: 1 },
  viewLink: {
    fontSize: Typography.sizes.xs, color: Colors.textSecondary,
    textDecorationLine: 'underline', paddingHorizontal: Spacing.xs,
  },
  primaryBtn: {
    backgroundColor: Colors.primary, paddingVertical: Spacing.base, borderRadius: Radius.lg,
    alignItems: 'center',
  },
  primaryBtnDisabled: { backgroundColor: Colors.borderLight },
  primaryBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
});
