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
  TextInput,
} from "react-native";
import {
  getMyAvailability,
  registerAvailability,
  EscortAvailability,
} from "../../api/escort";

export default function AvailabilityScreen() {
  const [items, setItems] = useState<EscortAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("09:00");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyAvailability();
      setItems(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRegister = async () => {
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
  };

  const statusColor: Record<string, string> = {
    available: "#10B981",
    matched: "#3B82F6",
    completed: "#6B7280",
    cancelled: "#EF4444",
  };

  const renderItem = ({ item }: { item: EscortAvailability }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{item.available_date}</Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: (statusColor[item.status] || "#6B7280") + "20",
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: statusColor[item.status] || "#6B7280" },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.time}>
        {item.start_time} ~ {item.end_time}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>가용시간</Text>
        <TouchableOpacity
          onPress={() => setShowForm(!showForm)}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>
            {showForm ? "취소" : "+ 등록"}
          </Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="날짜 (2026-03-16)"
            value={date}
            onChangeText={setDate}
          />
          <View style={styles.timeRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="시작 (07:00)"
              value={startTime}
              onChangeText={setStartTime}
            />
            <Text style={styles.tilde}>~</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="종료 (09:00)"
              value={endTime}
              onChangeText={setEndTime}
            />
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={handleRegister}>
            <Text style={styles.submitText}>등록</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
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
