import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  getMyInvoices,
  Invoice,
  preparePayment,
  confirmPayment,
} from "../../api/billing";
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
  pending: "미납",
  paid: "납부완료",
  overdue: "연체",
};

// ── Summary Header ───────────────────────────────────────────
function SummaryHeader({
  pendingCount,
  pendingAmount,
}: {
  pendingCount: number;
  pendingAmount: number;
}) {
  if (pendingCount === 0) return null;

  return (
    <View style={[styles.summaryCard, Shadows.sm]}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Ionicons name="alert-circle" size={22} color={Colors.danger} />
          <View>
            <Text style={[styles.summaryValue, { color: Colors.danger }]}>
              {pendingCount}건
            </Text>
            <Text style={styles.summaryLabel}>미납 청구서</Text>
          </View>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Ionicons name="cash-outline" size={22} color={Colors.warning} />
          <View>
            <Text style={[styles.summaryValue, { color: Colors.warning }]}>
              {pendingAmount.toLocaleString("ko-KR")}원
            </Text>
            <Text style={styles.summaryLabel}>미납 금액</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Invoice Card (accordion) ─────────────────────────────────
interface InvoiceCardProps {
  invoice: Invoice;
  onPayPress?: (invoice: Invoice) => void;
  paying?: boolean;
}

const InvoiceCard = memo(function InvoiceCard({
  invoice,
  onPayPress,
  paying,
}: InvoiceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = STATUS_COLORS[invoice.status] ?? Colors.neutral;
  const statusBg = STATUS_BG_COLORS[invoice.status] ?? Colors.neutralLight;

  return (
    <Pressable
      style={[styles.card, Shadows.sm]}
     
      onPress={() => setExpanded((v) => !v)}
    >
      {/* Collapsed header — always visible */}
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Ionicons
            name="document-text-outline"
            size={18}
            color={Colors.textSecondary}
          />
          <Text style={styles.monthText}>{invoice.billing_month}</Text>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            {invoice.status === "paid" ? (
              <Ionicons
                name="checkmark-circle"
                size={12}
                color={statusColor}
                style={{ marginRight: 3 }}
              />
            ) : null}
            {invoice.status === "overdue" ? (
              <Ionicons
                name="warning"
                size={12}
                color={statusColor}
                style={{ marginRight: 3 }}
              />
            ) : null}
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABELS[invoice.status] ?? invoice.status}
            </Text>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={Colors.textDisabled}
            style={{ marginLeft: Spacing.xs }}
          />
        </View>
      </View>

      {/* Expanded details */}
      {expanded && (
        <View style={styles.cardBody}>
          <View style={styles.detailDivider} />
          <InfoRow label="탑승 횟수" value={`${invoice.total_rides}회`} />
          <InfoRow
            label="청구 금액"
            value={`${invoice.amount.toLocaleString("ko-KR")}원`}
            valueStyle={styles.amountText}
          />
          <InfoRow label="납부 기한" value={invoice.due_date} />
          {invoice.paid_at ? (
            <InfoRow
              label="납부일"
              value={invoice.paid_at.slice(0, 10)}
              valueStyle={{ color: Colors.success }}
            />
          ) : null}
          {(invoice.status === "pending" || invoice.status === "overdue") &&
            onPayPress && (
              <Pressable
                style={[
                  styles.payButton,
                  paying && styles.payButtonDisabled,
                ]}
                onPress={() => !paying && onPayPress(invoice)}
                disabled={paying}
              >
                {paying ? (
                  <ActivityIndicator size="small" color={Colors.surface} />
                ) : (
                  <>
                    <Ionicons
                      name="card-outline"
                      size={16}
                      color={Colors.surface}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.payButtonText}>결제하기</Text>
                  </>
                )}
              </Pressable>
            )}
        </View>
      )}
    </Pressable>
  );
});

function InfoRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────
export default function BillingScreen() {
  const insets = useSafeAreaInsets();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getMyInvoices();
      setInvoices(data);
    } catch {
      // ignore
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

  const handlePayPress = useCallback(
    async (invoice: Invoice) => {
      try {
        setPayingId(invoice.id);
        // Step 1: Prepare payment
        const prepared = await preparePayment(Number(invoice.id));

        // Step 2: Show confirmation dialog
        Alert.alert(
          "결제 확인",
          `${invoice.billing_month} 청구서\n금액: ${prepared.amount.toLocaleString("ko-KR")}원\n\n결제를 진행하시겠습니까?`,
          [
            { text: "취소", style: "cancel", onPress: () => setPayingId(null) },
            {
              text: "결제하기",
              style: "default",
              onPress: async () => {
                try {
                  // Step 3: Confirm payment (simulated — in production this
                  // would go through the Toss Payments widget)
                  await confirmPayment(
                    "test_key",
                    prepared.order_id,
                    prepared.amount,
                  );
                  Alert.alert("결제 완료", "결제가 성공적으로 처리되었습니다.");
                  // Step 4: Refresh list
                  load();
                } catch {
                  Alert.alert("결제 실패", "결제 처리 중 오류가 발생했습니다.");
                } finally {
                  setPayingId(null);
                }
              },
            },
          ],
          { cancelable: false },
        );
      } catch {
        Alert.alert("오류", "결제 준비 중 오류가 발생했습니다.");
        setPayingId(null);
      }
    },
    [load],
  );

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

  // Summary Banner
  summaryCard: {
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.danger + "30",
    marginHorizontal: Spacing.md,
  },
  summaryValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  summaryLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Invoice Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  monthText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  cardBody: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  infoLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  amountText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },

  // Pay Button
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: Colors.surface,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },

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
