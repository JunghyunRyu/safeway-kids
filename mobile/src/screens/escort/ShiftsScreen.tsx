import React, { memo, useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  SafeAreaView,
  Alert,
} from "react-native";
import { getMyShifts, checkIn, checkOut, EscortShift } from "../../api/escort";

const STATUS_INFO: Record<string, { text: string; color: string }> = {
  assigned: { text: "배정됨", color: "#3B82F6" },
  checked_in: { text: "출근", color: "#F59E0B" },
  completed: { text: "완료", color: "#10B981" },
  no_show: { text: "결근", color: "#EF4444" },
};

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
  const st = STATUS_INFO[status] || STATUS_INFO.assigned;

  const handleCheckIn = useCallback(() => onCheckIn(id), [id, onCheckIn]);
  const handleCheckOut = useCallback(() => onCheckOut(id), [id, onCheckOut]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{shiftDate}</Text>
        <View style={[styles.badge, { backgroundColor: st.color + "20" }]}>
          <Text style={[styles.badgeText, { color: st.color }]}>
            {st.text}
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>수당</Text>
        <Text style={styles.amount}>
          {compensationAmount.toLocaleString()}원
        </Text>
      </View>
      {checkInAt ? (
        <View style={styles.row}>
          <Text style={styles.label}>출근 시간</Text>
          <Text style={styles.value}>
            {new Date(checkInAt).toLocaleTimeString("ko-KR")}
          </Text>
        </View>
      ) : null}
      {checkOutAt ? (
        <View style={styles.row}>
          <Text style={styles.label}>퇴근 시간</Text>
          <Text style={styles.value}>
            {new Date(checkOutAt).toLocaleTimeString("ko-KR")}
          </Text>
        </View>
      ) : null}

      {/* Action buttons */}
      <View style={styles.actions}>
        {status === "assigned" ? (
          <Pressable
            style={[styles.button, styles.buttonCheckIn]}
            onPress={handleCheckIn}
          >
            <Text style={styles.buttonText}>출근</Text>
          </Pressable>
        ) : null}
        {status === "checked_in" ? (
          <Pressable
            style={[styles.button, styles.buttonCheckOut]}
            onPress={handleCheckOut}
          >
            <Text style={styles.buttonText}>퇴근</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

export default function ShiftsScreen() {
  const [shifts, setShifts] = useState<EscortShift[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyShifts();
      setShifts(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>내 근무</Text>
      <FlatList
        data={shifts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>배정된 근무가 없습니다</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  list: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  date: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  label: { fontSize: 14, color: "#64748B" },
  value: { fontSize: 14, color: "#334155" },
  amount: { fontSize: 16, fontWeight: "700", color: "#2563EB" },
  actions: { marginTop: 12, flexDirection: "row", gap: 8 },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonCheckIn: { backgroundColor: "#3B82F6" },
  buttonCheckOut: { backgroundColor: "#10B981" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 16, color: "#94A3B8" },
});
