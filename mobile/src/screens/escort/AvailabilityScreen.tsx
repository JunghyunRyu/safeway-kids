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
  TextInput,
} from "react-native";
import {
  getMyAvailability,
  registerAvailability,
  EscortAvailability,
} from "../../api/escort";

const STATUS_COLOR: Record<string, string> = {
  available: "#10B981",
  matched: "#3B82F6",
  completed: "#6B7280",
  cancelled: "#EF4444",
};

interface AvailabilityCardProps {
  availableDate: string;
  status: string;
  startTime: string;
  endTime: string;
}

const AvailabilityCard = memo(function AvailabilityCard({
  availableDate,
  status,
  startTime,
  endTime,
}: AvailabilityCardProps) {
  const color = STATUS_COLOR[status] || "#6B7280";
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{availableDate}</Text>
        <View style={[styles.badge, { backgroundColor: color + "20" }]}>
          <Text style={[styles.badgeText, { color }]}>{status}</Text>
        </View>
      </View>
      <Text style={styles.time}>
        {startTime} ~ {endTime}
      </Text>
    </View>
  );
});

export default function AvailabilityScreen() {
  const [items, setItems] = useState<EscortAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("09:00");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyAvailability();
      setItems(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  const toggleForm = useCallback(() => {
    setShowForm((prev) => !prev);
  }, []);

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

  const keyExtractor = useCallback((item: EscortAvailability) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>가용시간</Text>
        <Pressable onPress={toggleForm} style={styles.addButton}>
          <Text style={styles.addButtonText}>
            {showForm ? "취소" : "+ 등록"}
          </Text>
        </Pressable>
      </View>

      {showForm ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="날짜 (2026-03-16)"
            value={date}
            onChangeText={setDate}
          />
          <View style={styles.timeRow}>
            <TextInput
              style={[styles.input, styles.timeInput]}
              placeholder="시작 (07:00)"
              value={startTime}
              onChangeText={setStartTime}
            />
            <Text style={styles.tilde}>~</Text>
            <TextInput
              style={[styles.input, styles.timeInput]}
              placeholder="종료 (09:00)"
              value={endTime}
              onChangeText={setEndTime}
            />
          </View>
          <Pressable style={styles.submitButton} onPress={handleRegister}>
            <Text style={styles.submitText}>등록</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>등록된 가용시간이 없습니다</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#1E293B" },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#3B82F6",
    borderRadius: 8,
  },
  addButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  form: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeInput: { flex: 1 },
  tilde: { fontSize: 18, color: "#64748B", marginBottom: 8 },
  submitButton: {
    backgroundColor: "#10B981",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
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
    marginBottom: 4,
  },
  date: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  time: { fontSize: 14, color: "#64748B" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 16, color: "#94A3B8" },
});
