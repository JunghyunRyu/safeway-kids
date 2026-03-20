import React, { memo, useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { showError } from "../../utils/toast";
import {
  getMyAvailability,
  registerAvailability,
  EscortAvailability,
} from "../../api/escort";
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
  STATUS_COLORS,
  STATUS_BG_COLORS,
} from "../../constants/theme";

const STATUS_LABELS: Record<string, string> = {
  available: "가능",
  matched: "배정됨",
  completed: "완료",
  cancelled: "취소됨",
};

const AvailabilityCard = memo(function AvailabilityCard({
  availableDate,
  status,
  startTime,
  endTime,
}: {
  availableDate: string;
  status: string;
  startTime: string;
  endTime: string;
}) {
  const statusColor = STATUS_COLORS[status] ?? Colors.neutral;
  const statusBg = STATUS_BG_COLORS[status] ?? Colors.neutralLight;

  return (
    <View style={[styles.card, Shadows.sm]}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{availableDate}</Text>
        <View style={[styles.badge, { backgroundColor: statusBg }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {STATUS_LABELS[status] ?? status}
          </Text>
        </View>
      </View>
      <View style={styles.timeRow}>
        <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
        <Text style={styles.timeText}>
          {startTime?.slice(0, 5)} ~ {endTime?.slice(0, 5)}
        </Text>
      </View>
    </View>
  );
});

export default function AvailabilityScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<EscortAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("09:00");

  const load = useCallback(async () => {
    try {
      const data = await getMyAvailability();
      setItems(data);
    } catch {
      showError('가용시간을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRegister = useCallback(async () => {
    if (!date) {
      Alert.alert("알림", "날짜를 입력해 주세요 (예: 2026-03-16)");
      return;
    }
    try {
      await registerAvailability(date, startTime + ":00", endTime + ":00");
      setShowForm(false);
      setDate("");
      await load();
    } catch {
      Alert.alert("오류", "가용시간 등록에 실패했습니다");
    }
  }, [date, startTime, endTime, load]);

  const renderItem = useCallback(
    ({ item }: { item: EscortAvailability }) => (
      <AvailabilityCard
        availableDate={item.available_date}
        status={item.status}
        startTime={item.start_time}
        endTime={item.end_time}
      />
    ),
    []
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>가용시간</Text>
        <Pressable
          onPress={() => setShowForm((p) => !p)}
          style={[
            styles.addBtn,
            { backgroundColor: showForm ? Colors.neutral : Colors.roleEscort },
          ]}
         
        >
          <Ionicons
            name={showForm ? "close" : "add"}
            size={18}
            color={Colors.textInverse}
          />
          <Text style={styles.addBtnText}>{showForm ? "취소" : "등록"}</Text>
        </Pressable>
      </View>

      {showForm && (
        <View style={[styles.form, Shadows.sm]}>
          <Text style={styles.formLabel}>날짜</Text>
          <TextInput
            style={styles.input}
            placeholder="2026-03-16"
            value={date}
            onChangeText={setDate}
            placeholderTextColor={Colors.textDisabled}
          />
          <Text style={styles.formLabel}>시간</Text>
          <View style={styles.timeInputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="07:00"
              value={startTime}
              onChangeText={setStartTime}
              placeholderTextColor={Colors.textDisabled}
            />
            <Text style={styles.tilde}>~</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="09:00"
              value={endTime}
              onChangeText={setEndTime}
              placeholderTextColor={Colors.textDisabled}
            />
          </View>
          <Pressable
            style={styles.submitBtn}
            onPress={handleRegister}
           
          >
            <Text style={styles.submitText}>등록하기</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={Colors.roleEscort}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={56} color={Colors.textDisabled} />
              <Text style={styles.emptyTitle}>등록된 가용시간이 없습니다</Text>
              <Text style={styles.emptyDesc}>상단 "등록"으로 가용시간을 추가하세요.</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.list}
      />
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
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  addBtnText: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.semibold,
    fontSize: Typography.sizes.sm,
  },
  form: {
    margin: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  formLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    marginBottom: Spacing.sm,
  },
  timeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  tilde: {
    fontSize: Typography.sizes.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  submitBtn: {
    backgroundColor: Colors.roleEscort,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.xs,
    minHeight: 48,
  },
  submitText: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.bold,
    fontSize: Typography.sizes.base,
  },
  list: { padding: Spacing.base, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  dateText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  timeText: { fontSize: Typography.sizes.base, color: Colors.textSecondary },
  emptyState: {
    flex: 1,
    alignItems: "center",
    paddingTop: 60,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  emptyDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.textDisabled,
    textAlign: "center",
  },
});
