import React, { memo, useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../constants/theme";
import { STATUS_COLORS, STATUS_BG_COLORS } from "../../constants/theme";
import {
  Invoice,
  getInvoicesByAcademy,
  markInvoicePaid,
  generateInvoices,
} from "../../api/billing";
import apiClient from "../../api/client";
import { useAuth } from "../../hooks/useAuth";

const STATUS_LABELS: Record<string, string> = {
  pending: "미납",
  paid: "납부완료",
  overdue: "연체",
};

const InvoiceCard = memo(function InvoiceCard({
  invoice,
  onMarkPaid,
}: {
  invoice: Invoice;
  onMarkPaid: (id: string) => void;
}) {
  const statusColor = STATUS_COLORS[invoice.status] ?? Colors.neutral;
  const statusBg = STATUS_BG_COLORS[invoice.status] ?? Colors.neutralLight;

  return (
    <View style={[styles.card, Shadows.sm]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardMonth}>{invoice.billing_month}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          {invoice.status === "paid" ? (
            <Ionicons name="checkmark-circle" size={12} color={statusColor} style={{ marginRight: 3 }} />
          ) : null}
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABELS[invoice.status] ?? invoice.status}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>탑승 횟수</Text>
          <Text style={styles.infoValue}>{invoice.total_rides}회</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>청구금액</Text>
          <Text style={[styles.infoValue, styles.amountText]}>
            {invoice.amount.toLocaleString("ko-KR")}원
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>납부기한</Text>
          <Text style={styles.infoValue}>{invoice.due_date}</Text>
        </View>
        {invoice.paid_at ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>납부일</Text>
            <Text style={[styles.infoValue, { color: Colors.success }]}>
              {invoice.paid_at.slice(0, 10)}
            </Text>
          </View>
        ) : null}
      </View>

      {invoice.status === "pending" && (
        <Pressable
          style={styles.payButton}
          onPress={() => onMarkPaid(invoice.id)}

        >
          <Ionicons name="checkmark" size={16} color={Colors.textInverse} />
          <Text style={styles.payButtonText}>납부 처리</Text>
        </Pressable>
      )}
    </View>
  );
});

export default function AdminBillingScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [academyId, setAcademyId] = useState<string | null>(null);
  const [academyName, setAcademyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      let aid = academyId;
      if (!aid) {
        if (user?.role === "academy_admin") {
          const res = await apiClient.get("/academies/mine");
          aid = res.data.id;
          setAcademyId(aid);
          setAcademyName(res.data.name);
        } else if (user?.role === "platform_admin") {
          // 플랫폼 관리자: 전체 학원 목록에서 첫 번째 학원 기본 선택
          const res = await apiClient.get("/academies");
          const list: Array<{ id: string; name: string }> = res.data ?? [];
          if (list.length > 0) {
            aid = list[0].id;
            setAcademyId(aid);
            setAcademyName(list[0].name);
          }
        }
      }
      if (aid) {
        const data = await getInvoicesByAcademy(aid);
        setInvoices(data);
      }
    } catch (err) {
      console.error("Admin billing load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, academyId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkPaid = (id: string) => {
    Alert.alert("납부 처리", "이 청구서를 납부 완료로 처리하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "처리",
        style: "default",
        onPress: async () => {
          try {
            await markInvoicePaid(id);
            setInvoices((prev) =>
              prev.map((inv) =>
                inv.id === id ? { ...inv, status: "paid", paid_at: new Date().toISOString() } : inv
              )
            );
          } catch {
            Alert.alert("오류", "납부 처리에 실패했습니다.");
          }
        },
      },
    ]);
  };

  const handleGenerate = () => {
    if (!academyId) {
      Alert.alert("오류", "청구서를 생성할 학원이 선택되지 않았습니다.");
      return;
    }
    const month = new Date().toISOString().slice(0, 7);
    Alert.alert(
      "청구서 생성",
      `${academyName ?? ""} ${month} 청구서를 일괄 생성하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "생성",
          style: "default",
          onPress: async () => {
            try {
              await generateInvoices(month, academyId);
              Alert.alert("완료", "청구서가 생성되었습니다.");
              setRefreshing(true);
              load();
            } catch {
              Alert.alert("오류", "청구서 생성에 실패했습니다.");
            }
          },
        },
      ]
    );
  };

  const { pendingCount, pendingAmount } = useMemo(() => {
    const pending = invoices.filter((i) => i.status === "pending");
    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, i) => s + i.amount, 0),
    };
  }, [invoices]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const renderItem = useCallback(
    ({ item }: { item: Invoice }) => (
      <InvoiceCard invoice={item} onMarkPaid={handleMarkPaid} />
    ),
    [handleMarkPaid]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>청구서 관리</Text>
        <Pressable style={styles.generateBtn} onPress={handleGenerate}>
          <Ionicons name="add-circle-outline" size={18} color={Colors.roleAdmin} />
          <Text style={[styles.generateBtnText, { color: Colors.roleAdmin }]}>생성</Text>
        </Pressable>
      </View>

      {/* 요약 */}
      {!loading && invoices.length > 0 && (
        <View style={[styles.summaryBanner, { backgroundColor: Colors.dangerLight }]}>
          <Ionicons name="alert-circle-outline" size={18} color={Colors.danger} />
          <Text style={[styles.summaryText, { color: Colors.danger }]}>
            미납 {pendingCount}건 · {pendingAmount.toLocaleString("ko-KR")}원
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color={Colors.roleAdmin} />
      ) : invoices.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={56} color={Colors.textDisabled} />
          <Text style={styles.emptyTitle}>청구서가 없습니다</Text>
          <Text style={styles.emptyDesc}>우측 상단 "생성"으로 이번 달 청구서를 만드세요.</Text>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.roleAdmin}
            />
          }
        />
      )}
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
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.roleAdmin,
  },
  generateBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  summaryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  summaryText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  list: { padding: Spacing.base, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  cardMonth: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  cardBody: { padding: Spacing.base, gap: Spacing.sm },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    borderRadius: Radius.md,
  },
  payButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textInverse,
  },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.sm },
  emptyTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  emptyDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.textDisabled,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
});
