import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getMyInvoices, Invoice } from "../../api/billing";
import { showError } from "../../utils/toast";
import {
  Colors,
  Typography,
  Spacing,
  Radius,
} from "../../constants/theme";
import InvoiceCard, { SummaryHeader } from "./components/InvoiceCard";
import { usePaymentFlow } from "./components/PaymentModal";

// ── Main Screen ──────────────────────────────────────────────
export default function BillingScreen() {
  const insets = useSafeAreaInsets();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getMyInvoices();
      setInvoices(data);
    } catch {
      showError("청구 내역을 불러오는데 실패했습니다");
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

  const { payingId, handlePayPress } = usePaymentFlow(load);

  const { pendingCount, pendingAmount } = useMemo(() => {
    const pending = invoices.filter((i) => i.status === "pending");
    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, i) => s + i.amount, 0),
    };
  }, [invoices]);

  const renderItem = useCallback(
    ({ item }: { item: Invoice }) => (
      <InvoiceCard
        invoice={item}
        onPayPress={handlePayPress}
        paying={payingId === item.id}
      />
    ),
    [handlePayPress, payingId],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>청구서</Text>
        <View style={[styles.countBadge, { backgroundColor: Colors.primaryLight }]}>
          <Text style={[styles.countText, { color: Colors.primary }]}>
            총 {invoices.length}건
          </Text>
        </View>
      </View>

      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          invoices.length > 0 ? (
            <SummaryHeader
              pendingCount={pendingCount}
              pendingAmount={pendingAmount}
            />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={56} color={Colors.textDisabled} />
              <Text style={styles.emptyTitle}>청구서가 없습니다</Text>
              <Text style={styles.emptyDesc}>납부 청구서가 발생하면 여기에 표시됩니다.</Text>
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
  pageHeader: {
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
  pageTitle: {
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
  list: { padding: Spacing.base, gap: Spacing.md },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    gap: Spacing.sm,
  },
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
