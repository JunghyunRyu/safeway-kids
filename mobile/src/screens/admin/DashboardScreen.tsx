import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import apiClient from "../../api/client";

interface AcademySummary {
  id: string;
  name: string;
}

interface DashboardStats {
  todaySchedules: number;
  boardedCount: number;
  completedCount: number;
  pendingInvoices: number;
  pendingAmount: number;
}

function StatCard({
  icon,
  label,
  value,
  color,
  sub,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}) {
  return (
    <View style={[styles.statCard, Shadows.md]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [academy, setAcademy] = useState<AcademySummary | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = () => new Date().toISOString().split("T")[0];

  const load = useCallback(async () => {
    try {
      // 학원 정보 조회 (academy_admin)
      let academyId: string | null = null;
      if (user?.role === "academy_admin") {
        try {
          const res = await apiClient.get("/academies/mine");
          setAcademy(res.data);
          academyId = res.data.id;
        } catch {
          // platform_admin: 학원 미귀속
        }
      }

      // 오늘 스케줄
      const schedRes = await apiClient.get(`/schedules/daily?target_date=${todayStr()}`);
      const schedules: Array<{ status: string }> = schedRes.data ?? [];

      const todaySchedules = schedules.length;
      const boardedCount = schedules.filter((s) => s.status === "boarded").length;
      const completedCount = schedules.filter((s) => s.status === "completed").length;

      // 청구서 현황 — academy_id 없으면 플랫폼 관리자 전체 조회
      const params = academyId ? `?academy_id=${academyId}` : "";
      const billRes = await apiClient.get(`/billing/invoices${params}`);
      const invoices: Array<{ status: string; amount: number }> = billRes.data ?? [];

      const pendingInvoices = invoices.filter((i) => i.status === "pending").length;
      const pendingAmount = invoices
        .filter((i) => i.status === "pending")
        .reduce((sum, i) => sum + (i.amount ?? 0), 0);

      setStats({ todaySchedules, boardedCount, completedCount, pendingInvoices, pendingAmount });
    } catch (err) {
      console.error("Admin dashboard load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.roleAdmin}
        />
      }
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>관리자 대시보드</Text>
          <Text style={styles.subGreeting}>
            {academy ? academy.name : user?.name ?? ""}
          </Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: Colors.roleAdmin + "20" }]}>
          <Text style={[styles.roleBadgeText, { color: Colors.roleAdmin }]}>
            {user?.role === "platform_admin" ? "플랫폼" : "학원"} 관리자
          </Text>
        </View>
      </View>

      {/* 날짜 */}
      <Text style={styles.dateText}>
        {new Date().toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        })}
      </Text>

      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 40 }}
          size="large"
          color={Colors.roleAdmin}
        />
      ) : stats ? (
        <>
          {/* 오늘 운행 현황 */}
          <Text style={styles.sectionTitle}>오늘 운행 현황</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="calendar"
              label="총 일정"
              value={stats.todaySchedules}
              color={Colors.info}
            />
            <StatCard
              icon="bus"
              label="탑승 중"
              value={stats.boardedCount}
              color={Colors.warning}
            />
            <StatCard
              icon="checkmark-circle"
              label="완료"
              value={stats.completedCount}
              color={Colors.success}
            />
          </View>

          {/* 청구서 현황 */}
          <Text style={styles.sectionTitle}>청구서 현황</Text>
          <View style={[styles.billSummaryCard, Shadows.md]}>
            <View style={styles.billRow}>
              <View style={styles.billItem}>
                <Text style={styles.billItemValue}>{stats.pendingInvoices}건</Text>
                <Text style={styles.billItemLabel}>미납 청구서</Text>
              </View>
              <View style={styles.billDivider} />
              <View style={styles.billItem}>
                <Text style={[styles.billItemValue, { color: Colors.danger }]}>
                  {stats.pendingAmount.toLocaleString("ko-KR")}원
                </Text>
                <Text style={styles.billItemLabel}>미납 금액</Text>
              </View>
            </View>
          </View>
        </>
      ) : (
        <Text style={styles.errorText}>데이터를 불러올 수 없습니다.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxl },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  greeting: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  subGreeting: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  roleBadgeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  dateText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textDisabled,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.base,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  statSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textDisabled,
    marginTop: 1,
  },
  billSummaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  billRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  billItem: { flex: 1, alignItems: "center" },
  billDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.md,
  },
  billItemValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  billItemLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  errorText: {
    textAlign: "center",
    color: Colors.textDisabled,
    marginTop: 40,
    fontSize: Typography.sizes.base,
  },
});
