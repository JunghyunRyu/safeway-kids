import React, { memo, useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getMyShifts, checkIn, checkOut, EscortShift } from "../../api/escort";
import { showError } from "../../utils/toast";
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
  assigned: "배정됨",
  checked_in: "출근",
  completed: "완료",
  no_show: "결근",
};

const timeFmt = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" });

interface ShiftCardProps {
  id: string;
  shiftDate: string;
  status: string;
  compensationAmount: number;
  checkInAt: string | null;
  checkOutAt: string | null;
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
}

const ShiftCard = memo(function ShiftCard({
  id,
  shiftDate,
  status,
  compensationAmount,
  checkInAt,
  checkOutAt,
  onCheckIn,
  onCheckOut,
}: ShiftCardProps) {
  const statusColor = STATUS_COLORS[status] ?? Colors.neutral;
  const statusBg = STATUS_BG_COLORS[status] ?? Colors.neutralLight;

  const handleCheckIn = useCallback(() => onCheckIn(id), [id, onCheckIn]);
  const handleCheckOut = useCallback(() => onCheckOut(id), [id, onCheckOut]);

  return (
    <View style={[styles.card, Shadows.sm]}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{shiftDate}</Text>
        <View style={[styles.badge, { backgroundColor: statusBg }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {STATUS_LABELS[status] ?? status}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>수당</Text>
        <Text style={[styles.infoValue, { color: Colors.primary, fontWeight: Typography.weights.bold }]}>
          {compensationAmount.toLocaleString("ko-KR")}원
        </Text>
      </View>
      {checkInAt ? (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>출근 시간</Text>
          <Text style={styles.infoValue}>{timeFmt.format(new Date(checkInAt))}</Text>
        </View>
      ) : null}
      {checkOutAt ? (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>퇴근 시간</Text>
          <Text style={styles.infoValue}>{timeFmt.format(new Date(checkOutAt))}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {status === "assigned" && (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: Colors.info }]}
            onPress={handleCheckIn}
           
          >
            <Ionicons name="enter-outline" size={16} color={Colors.textInverse} />
            <Text style={styles.actionBtnText}>출근</Text>
          </Pressable>
        )}
        {status === "checked_in" && (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: Colors.success }]}
            onPress={handleCheckOut}
           
          >
            <Ionicons name="exit-outline" size={16} color={Colors.textInverse} />
            <Text style={styles.actionBtnText}>퇴근</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
});

export default function ShiftsScreen() {
  const insets = useSafeAreaInsets();
  const [shifts, setShifts] = useState<EscortShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getMyShifts();
      setShifts(data);
    } catch {
      showError('근무 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCheckIn = useCallback(
    async (shiftId: string) => {
      try {
        await checkIn(shiftId);
        await load();
      } catch {
        Alert.alert("오류", "출근 처리에 실패했습니다");
      }
    },
    [load]
  );

  const handleCheckOut = useCallback(
    async (shiftId: string) => {
      try {
        await checkOut(shiftId);
        await load();
      } catch {
        Alert.alert("오류", "퇴근 처리에 실패했습니다");
      }
    },
    [load]
  );

  const renderItem = useCallback(
    ({ item }: { item: EscortShift }) => (
      <ShiftCard
        id={item.id}
        shiftDate={item.shift_date}
        status={item.status}
        compensationAmount={item.compensation_amount}
        checkInAt={item.check_in_at}
        checkOutAt={item.check_out_at}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
      />
    ),
    [handleCheckIn, handleCheckOut]
  );

  const keyExtractor = useCallback((item: EscortShift) => item.id, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>내 근무</Text>
        <View style={[styles.countBadge, { backgroundColor: Colors.roleEscort + "15" }]}>
          <Text style={[styles.countText, { color: Colors.roleEscort }]}>
            {shifts.length}건
          </Text>
        </View>
      </View>
      <FlatList
        data={shifts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={onRefresh}
            tintColor={Colors.roleEscort}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={56} color={Colors.textDisabled} />
              <Text style={styles.emptyTitle}>배정된 근무가 없습니다</Text>
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
  countBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  countText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  list: { padding: Spacing.base, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
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
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: { fontSize: Typography.sizes.base, color: Colors.textSecondary },
  infoValue: { fontSize: Typography.sizes.base, color: Colors.textPrimary },
  actions: { marginTop: Spacing.md, flexDirection: "row", gap: Spacing.sm },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    minHeight: 48,
  },
  actionBtnText: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.bold,
    fontSize: Typography.sizes.base,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.sizes.base,
    color: Colors.textDisabled,
  },
});
