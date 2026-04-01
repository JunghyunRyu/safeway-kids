import React from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius } from "../../../constants/theme";

export interface SupportFormData {
  category: string;
  subject: string;
  description: string;
}

interface SupportFormModalProps {
  visible: boolean;
  form: SupportFormData;
  submitting: boolean;
  onChangeForm: (form: SupportFormData) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export default function SupportFormModal({
  visible,
  form,
  submitting,
  onChangeForm,
  onSubmit,
  onClose,
}: SupportFormModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>문의하기</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="문의하기 닫기">
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <Text style={styles.modalLabel}>카테고리</Text>
          <View style={styles.categoryRow}>
            {["일반", "운행", "결제", "안전"].map((cat) => (
              <Pressable
                key={cat}
                style={[
                  styles.categoryBtn,
                  form.category === cat && styles.categoryBtnActive,
                ]}
                onPress={() => onChangeForm({ ...form, category: cat })}
                accessibilityRole="button"
                accessibilityLabel={`${cat} 카테고리 선택`}
              >
                <Text
                  style={[
                    styles.categoryBtnText,
                    form.category === cat && styles.categoryBtnTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.modalLabel}>제목</Text>
          <TextInput
            style={styles.modalInput}
            value={form.subject}
            onChangeText={(v) => onChangeForm({ ...form, subject: v })}
            placeholder="문의 제목을 입력하세요"
            accessibilityLabel="문의 제목 입력"
          />
          <Text style={styles.modalLabel}>내용</Text>
          <TextInput
            style={[styles.modalInput, { minHeight: 100, textAlignVertical: "top" }]}
            value={form.description}
            onChangeText={(v) => onChangeForm({ ...form, description: v })}
            placeholder="문의 내용을 입력하세요"
            multiline
            accessibilityLabel="문의 내용 입력"
          />
          <Pressable
            style={[styles.submitBtn, submitting && { opacity: 0.5 }]}
            onPress={onSubmit}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="문의 접수"
          >
            <Text style={styles.submitBtnText}>
              {submitting ? "접수 중..." : "문의 접수"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.base,
    paddingBottom: Spacing.xxl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  modalLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  categoryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  categoryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryBtnText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  categoryBtnTextActive: {
    color: Colors.textInverse,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  submitBtnText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textInverse,
  },
});
