import React, { memo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Invoice } from "../../../api/billing";
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
  STATUS_COLORS,
  STATUS_BG_COLORS,
} from "../../../constants/theme";

export const STATUS_LABELS: Record<string, string> = {
  pending: "미납",
  paid: "납부완료",
  overdue: "연체",
};

// ── BillingInfoRow ──────────────────────────────────────────────

const BillingInfoRow = memo(function BillingInfoRow({
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
});

// ── SummaryHeader ───────────────────────────────────────────────

export const SummaryHeader = memo(function SummaryHeader({
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
});

// ── InvoiceCard ─────────────────────────────────────────────────

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
      accessibilityRole="button"
      accessibilityLabel={`${invoice.billing_month} 청구서 ${STATUS_LABELS[invoice.status] ?? invoice.status}${expanded ? " 접기" : " 펼치기"}`}
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
          <View>
            <Text style={styles.monthText}>{invoice.billing_month}</Text>
            {(invoice.student_name || invoice.academy_name) ? (
              <Text style={styles.cardSubtext}>
                {[invoice.student_name, invoice.academy_name].filter(Boolean).join(" · ")}
              </Text>
            ) : null}
          </View>
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
          <BillingInfoRow label="탑승 횟수" value={`${invoice.total_rides}회`} />
          <BillingInfoRow
            label="청구 금액"
            value={`${invoice.amount.toLocaleString("ko-KR")}원`}
            valueStyle={styles.amountText}
          />
          <BillingInfoRow label="납부 기한" value={invoice.due_date} />
          {invoice.paid_at ? (
            <BillingInfoRow
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
                accessibilityRole="button"
                accessibilityLabel={`${invoice.billing_month} 청구서 결제하기`}
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

export default InvoiceCard;

// ── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
  cardSubtext: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
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
});
