import React from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius } from "../../../constants/theme";

interface MemoModalProps {
  visible: boolean;
  text: string;
  saving: boolean;
  onChangeText: (text: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function MemoModal({ visible, text, saving, onChangeText, onSave, onClose }: MemoModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>특이사항 메모</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="메모 닫기">
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={onChangeText}
            placeholder="특이사항을 입력하세요 (예: 차멀미 호소)"
            multiline
            autoFocus
            accessibilityLabel="특이사항 메모 입력"
          />
          <Pressable
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={onSave}
            disabled={saving || !text.trim()}
            accessibilityRole="button"
            accessibilityLabel="메모 저장"
          >
            <Text style={styles.saveBtnText}>{saving ? "저장 중..." : "저장"}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  content: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.base, paddingBottom: Spacing.xxl },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  title: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.sm, fontSize: Typography.sizes.md, color: Colors.textPrimary, minHeight: 100, textAlignVertical: "top", backgroundColor: Colors.background },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: "center", marginTop: Spacing.md },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: Colors.textInverse, fontWeight: Typography.weights.semibold, fontSize: Typography.sizes.md },
});
