import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
} from "react-native";
import { getMyShifts, checkIn, checkOut, EscortShift } from "../../api/escort";

export default function ShiftsScreen() {
  const [shifts, setShifts] = useState<EscortShift[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyShifts();
      setShifts(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCheckIn = async (shiftId: string) => {
    try {
      await checkIn(shiftId);
      await load();
    } catch {
      Alert.alert("오류", "출근 처리에 실패했습니다");
    }
  };

  const handleCheckOut = async (shiftId: string) => {
    try {
      await checkOut(shiftId);
      await load();
    } catch {
      Alert.alert("오류", "퇴근 처리에 실패했습니다");
    }
  };

  const statusInfo: Record<string, { text: string; color: string }> = {
    assigned: { text: "배정됨", color: "#3B82F6" },
    checked_in: { text: "출근", color: "#F59E0B" },
    completed: { text: "완료", color: "#10B981" },
    no_show: { text: "결근", color: "#EF4444" },
  };

  const renderShift = ({ item }: { item: EscortShift }) => {
    const st = statusInfo[item.status] || statusInfo.assigned;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.date}>{item.shift_date}</Text>
          <View style={[styles.badge, { backgroundColor: st.color + "20" }]}>
            <Text style={[styles.badgeText, { color: st.color }]}>
              {st.text}
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>수당</Text>
          <Text style={styles.amount}>
            {item.compensation_amount.toLocaleString()}원
          </Text>
        </View>
        {item.check_in_at && (
          <View style={styles.row}>
            <Text style={styles.label}>출근 시간</Text>
            <Text style={styles.value}>
              {new Date(item.check_in_at).toLocaleTimeString("ko-KR")}
            </Text>
          </View>
        )}
        {item.check_out_at && (
          <View style={styles.row}>
            <Text style={styles.label}>퇴근 시간</Text>
            <Text style={styles.value}>
              {new Date(item.check_out_at).toLocaleTimeString("ko-KR")}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          {item.status === "assigned" && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#3B82F6" }]}
              onPress={() => handleCheckIn(item.id)}
            >
              <Text style={styles.buttonText}>출근</Text>
            </TouchableOpacity>
          )}
          {item.status === "checked_in" && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#10B981" }]}
              onPress={() => handleCheckOut(item.id)}
            >
              <Text style={styles.buttonText}>퇴근</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>내 근무</Text>
      <FlatList
        data={shifts}
        keyExtractor={(item) => item.id}
        renderItem={renderShift}
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
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 16, color: "#94A3B8" },
});
