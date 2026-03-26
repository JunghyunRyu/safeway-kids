import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  listStudents,
  getStudent,
  updateStudentProfile,
  Student,
} from "../../api/students";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../constants/theme";
import { showError } from "../../utils/toast";

export default function ChildProfileScreen() {
  const insets = useSafeAreaInsets();
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    special_notes: "",
    allergies: "",
    emergency_contact: "",
    school_name: "",
    grade: "",
  });
  const [saving, setSaving] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listStudents();
      if (!mountedRef.current) return;
      setStudents(data);
    } catch {
      if (mountedRef.current) showError("자녀 목록을 불러올 수 없습니다.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const selectChild = useCallback(async (s: Student) => {
    try {
      const detail = await getStudent(s.id);
      if (!mountedRef.current) return;
      setSelected(detail);
      setForm({
        special_notes: detail.special_notes || "",
        allergies: detail.allergies || "",
        emergency_contact: detail.emergency_contact || "",
        school_name: detail.school_name || "",
        grade: detail.grade || "",
      });
      setEditing(false);
    } catch {
      if (mountedRef.current) showError("자녀 정보를 불러올 수 없습니다.");
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await updateStudentProfile(selected.id, form);
      setSelected(updated);
      setEditing(false);
      Alert.alert("저장 완료", "자녀 정보가 수정되었습니다.");
    } catch {
      showError("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }, [selected, form]);

  if (selected) {
    return (
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.content}
      >
        <Pressable onPress={() => setSelected(null)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
          <Text style={styles.backText}>목록으로</Text>
        </Pressable>

        <View style={[styles.card, Shadows.sm]}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatar, { backgroundColor: Colors.roleParent }]}>
              <Text style={styles.avatarText}>{selected.name.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.childName}>{selected.name}</Text>
              <Text style={styles.childSub}>{selected.date_of_birth}</Text>
            </View>
            <Pressable onPress={() => setEditing(!editing)} style={styles.editBtn}>
              <Ionicons name={editing ? "close" : "create-outline"} size={20} color={Colors.primary} />
            </Pressable>
          </View>

          <Field label="학년" value={form.grade} editing={editing}
            onChange={(v) => setForm({ ...form, grade: v })} />
          <Field label="학교" value={form.school_name} editing={editing}
            onChange={(v) => setForm({ ...form, school_name: v })} />
          <Field label="비상연락처" value={form.emergency_contact} editing={editing}
            onChange={(v) => setForm({ ...form, emergency_contact: v })} keyboardType="phone-pad" />
          <Field label="특이사항" value={form.special_notes} editing={editing}
            onChange={(v) => setForm({ ...form, special_notes: v })} multiline />
          <Field label="알레르기" value={form.allergies} editing={editing}
            onChange={(v) => setForm({ ...form, allergies: v })} multiline />

          {editing && (
            <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? "저장 중..." : "저장"}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>자녀 관리</Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable style={[styles.childRow, Shadows.sm]} onPress={() => selectChild(item)}>
              <View style={[styles.avatarSm, { backgroundColor: Colors.roleParent }]}>
                <Text style={styles.avatarSmText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.childRowName}>{item.name}</Text>
                <Text style={styles.childRowSub}>{item.grade ? `${item.grade}학년` : ""} {item.date_of_birth}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>등록된 자녀가 없습니다.</Text>}
        />
      )}
    </View>
  );
}

function Field({
  label, value, editing, onChange, multiline, keyboardType,
}: {
  label: string; value: string; editing: boolean;
  onChange: (v: string) => void; multiline?: boolean; keyboardType?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editing ? (
        <TextInput
          style={[styles.fieldInput, multiline && { minHeight: 60, textAlignVertical: "top" }]}
          value={value}
          onChangeText={onChange}
          multiline={multiline}
          keyboardType={keyboardType as any}
          placeholder={`${label} 입력`}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || "-"}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxl },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, padding: Spacing.base },
  listContent: { padding: Spacing.base, gap: Spacing.sm },
  childRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base },
  childRowName: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  childRowSub: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  avatarSm: { width: 40, height: 40, borderRadius: Radius.full, justifyContent: "center", alignItems: "center" },
  avatarSmText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", color: Colors.textSecondary, marginTop: Spacing.xl },
  backBtn: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, padding: Spacing.base },
  backText: { fontSize: Typography.sizes.md, color: Colors.primary },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, marginHorizontal: Spacing.base, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.md, padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar: { width: 48, height: 48, borderRadius: Radius.full, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textInverse },
  childName: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  childSub: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  editBtn: { padding: Spacing.sm },
  field: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  fieldLabel: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginBottom: 2 },
  fieldValue: { fontSize: Typography.sizes.md, color: Colors.textPrimary },
  fieldInput: { fontSize: Typography.sizes.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.sm, backgroundColor: Colors.background },
  saveBtn: { margin: Spacing.base, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: "center" },
  saveBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textInverse },
});
