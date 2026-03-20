import React, { memo, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../constants/theme";
import { listStudents, Student } from "../../api/students";
import { showError } from "../../utils/toast";

const StudentCard = memo(function StudentCard({ student }: { student: Student }) {
  const initials = student.name.charAt(0);
  return (
    <View style={[styles.card, Shadows.sm]}>
      <View style={[styles.avatar, { backgroundColor: Colors.roleStudent + "25" }]}>
        <Text style={[styles.avatarText, { color: Colors.roleStudent }]}>{initials}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.studentName}>{student.name}</Text>
        <Text style={styles.studentMeta}>
          {student.grade ? `${student.grade}학년` : "학년 미지정"} •{" "}
          {student.date_of_birth
            ? new Date(student.date_of_birth).getFullYear() + "년생"
            : "생년 미입력"}
        </Text>
        <Text style={styles.studentSub}>
          등록일 {student.created_at ? student.created_at.slice(0, 10) : "-"}
        </Text>
      </View>
      <View
        style={[
          styles.activeBadge,
          { backgroundColor: student.is_active ? Colors.successLight : Colors.neutralLight },
        ]}
      >
        <Text
          style={[
            styles.activeBadgeText,
            { color: student.is_active ? Colors.success : Colors.neutral },
          ]}
        >
          {student.is_active ? "활성" : "비활성"}
        </Text>
      </View>
    </View>
  );
});

export default function AdminStudentsScreen() {
  const insets = useSafeAreaInsets();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await listStudents();
      setStudents(data);
    } catch (err) {
      if (__DEV__) console.error("Admin students load error:", err);
      showError('학생 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const filtered = search.trim()
    ? students.filter((s) =>
        s.name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : students;

  const renderItem = useCallback(
    ({ item }: { item: Student }) => <StudentCard student={item} />,
    []
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>학생 관리</Text>
        <View style={[styles.countBadge, { backgroundColor: Colors.roleAdmin + "15" }]}>
          <Text style={[styles.countText, { color: Colors.roleAdmin }]}>
            총 {filtered.length}명
          </Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, Shadows.sm]}>
          <Ionicons name="search" size={18} color={Colors.textDisabled} />
          <TextInput
            style={styles.searchInput}
            placeholder="학생 이름으로 검색"
            placeholderTextColor={Colors.textDisabled}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <Ionicons
              name="close-circle"
              size={18}
              color={Colors.textDisabled}
              onPress={() => setSearch("")}
            />
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 60 }}
          size="large"
          color={Colors.roleAdmin}
        />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={56} color={Colors.textDisabled} />
          <Text style={styles.emptyTitle}>
            {search.trim() ? "검색 결과가 없습니다" : "등록된 학생이 없습니다"}
          </Text>
          <Text style={styles.emptyDesc}>
            {search.trim()
              ? "다른 이름으로 검색해 보세요."
              : "학원에 등록된 학생 목록이 표시됩니다."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.roleAdmin}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  countBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  countText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  searchContainer: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  list: { padding: Spacing.base, gap: Spacing.sm },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  cardContent: { flex: 1 },
  studentName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  studentMeta: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  studentSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textDisabled,
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  activeBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.sm },
  emptyTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  emptyDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.textDisabled,
    textAlign: "center",
  },
});
