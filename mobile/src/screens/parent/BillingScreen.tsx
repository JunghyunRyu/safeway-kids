import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { getMyInvoices, Invoice } from "../../api/billing";

export default function BillingScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyInvoices();
      setInvoices(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const statusLabel: Record<string, { text: string; color: string }> = {
    pending: { text: "미결제", color: "#F59E0B" },
    paid: { text: "결제완료", color: "#10B981" },
    overdue: { text: "연체", color: "#EF4444" },
  };

  const renderInvoice = ({ item }: { item: Invoice }) => {
    const st = statusLabel[item.status] || statusLabel.pending;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.month}>{item.billing_month}</Text>
          <View style={[styles.badge, { backgroundColor: st.color + "20" }]}>
            <Text style={[styles.badgeText, { color: st.color }]}>
              {st.text}
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>탑승 횟수</Text>
          <Text style={styles.value}>{item.total_rides}회</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>청구 금액</Text>
          <Text style={styles.amount}>
            {item.amount.toLocaleString()}원
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>납부 기한</Text>
          <Text style={styles.value}>{item.due_date}</Text>
        </View>
        {item.paid_at && (
          <View style={styles.row}>
            <Text style={styles.label}>결제일</Text>
            <Text style={styles.value}>
              {item.paid_at.slice(0, 10)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>청구서</Text>
      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        renderItem={renderInvoice}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>청구서가 없습니다</Text>
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
  list: { padding: 16, gap: 12 },
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
  month: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
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
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 16, color: "#94A3B8" },
});
