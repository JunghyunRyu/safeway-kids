import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { getWallet, listTransactions, requestWithdrawal, type Wallet, type WalletTransaction } from '../../api/wallet';

const TX_TYPE_LABELS: Record<string, string> = {
  earning: '수입', withdrawal: '출금', refund: '환불', adjustment: '조정',
};

export default function EarningsScreen() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  const loadData = async () => {
    try {
      const [w, txs] = await Promise.all([getWallet(), listTransactions()]);
      setWallet(w);
      setTransactions(txs);
    } catch {
      Alert.alert('오류', '데이터를 불러올 수 없습니다');
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleWithdraw = () => {
    if (!wallet || wallet.balance <= 0) {
      Alert.alert('출금 불가', '잔액이 없습니다');
      return;
    }
    Alert.alert('출금', `${wallet.balance.toLocaleString()}원을 출금하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '출금',
        onPress: async () => {
          try {
            await requestWithdrawal(wallet.balance);
            await loadData();
            Alert.alert('완료', '출금 요청이 처리되었습니다 (D+1)');
          } catch {
            Alert.alert('오류', '출금 요청에 실패했습니다');
          }
        },
      },
    ]);
  };

  const commissionRate = wallet?.commission_rate ?? 15;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>수입 관리</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>현재 잔액</Text>
        <Text style={styles.balanceAmount}>{wallet ? `${wallet.balance.toLocaleString()}원` : '-'}</Text>
        <Pressable style={styles.withdrawBtn} onPress={handleWithdraw}>
          <Text style={styles.withdrawText}>출금하기</Text>
        </Pressable>
      </View>

      {/* Monthly Summary */}
      {transactions.length > 0 && (() => {
        const now = new Date();
        const monthTxs = transactions.filter(t => {
          const d = new Date(t.created_at);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.tx_type === 'earning';
        });
        const gross = monthTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
        const fee = Math.round(gross * commissionRate / 100);
        return gross > 0 ? (
          <View style={styles.monthCard}>
            <Text style={styles.monthLabel}>이번 달 수입</Text>
            <Text style={styles.monthAmount}>{(gross - fee).toLocaleString()}원</Text>
            <Text style={styles.monthDetail}>총 {gross.toLocaleString()}원 (수수료 {fee.toLocaleString()}원)</Text>
          </View>
        ) : null;
      })()}

      {/* Commission Rate Info */}
      <View style={styles.commissionInfo}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
        <Text style={styles.commissionText}>수수료 {commissionRate}% | 정산: 영업일 D+1</Text>
      </View>

      <Text style={styles.sectionTitle}>거래 내역</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: Spacing.base }}
        renderItem={({ item }) => (
          <View style={styles.txRow}>
            <View style={styles.txIcon}>
              <Ionicons
                name={item.amount > 0 ? 'arrow-down' : 'arrow-up'}
                size={18}
                color={item.amount > 0 ? Colors.success : Colors.danger}
              />
            </View>
            <View style={styles.txInfo}>
              <Text style={styles.txType}>{TX_TYPE_LABELS[item.tx_type] || item.tx_type}</Text>
              {item.description && <Text style={styles.txDescription}>{item.description}</Text>}
              <Text style={styles.txDate}>{new Date(item.created_at).toLocaleDateString('ko-KR')}</Text>
              {item.tx_type === 'earning' && item.platform_fee > 0 && (
                <Text style={styles.txFee}>
                  총액 {item.gross_amount.toLocaleString()}원 - 수수료 {item.platform_fee.toLocaleString()}원
                </Text>
              )}
            </View>
            <Text style={[styles.txAmount, { color: item.amount > 0 ? Colors.success : Colors.danger }]}>
              {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()}원
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}><Text style={styles.emptyText}>거래 내역이 없어요</Text></View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  balanceCard: {
    marginHorizontal: Spacing.base, padding: Spacing.xl, backgroundColor: Colors.accent,
    borderRadius: Radius.lg, alignItems: 'center', ...Shadows.md,
  },
  balanceLabel: { fontSize: Typography.sizes.sm, color: 'rgba(255,255,255,0.8)' },
  balanceAmount: { fontSize: Typography.sizes.display, fontWeight: Typography.weights.extrabold, color: '#fff', marginVertical: 8 },
  withdrawBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: Radius.md },
  withdrawText: { color: '#fff', fontWeight: Typography.weights.bold, fontSize: Typography.sizes.base },
  commissionInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: Spacing.base, marginTop: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.sm,
  },
  commissionText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  monthCard: {
    marginHorizontal: Spacing.base, marginTop: Spacing.md, padding: Spacing.base,
    backgroundColor: Colors.infoLight || Colors.surfaceElevated, borderRadius: Radius.md, gap: 4,
  },
  monthLabel: { fontSize: Typography.sizes.sm, color: Colors.info || Colors.textSecondary, fontWeight: Typography.weights.medium as any },
  monthAmount: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold as any, color: Colors.textPrimary },
  monthDetail: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
  sectionTitle: {
    fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary,
    paddingHorizontal: Spacing.base, marginTop: Spacing.xl, marginBottom: Spacing.md,
  },
  txRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.xs, ...Shadows.sm,
  },
  txIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceElevated, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1, marginLeft: Spacing.md },
  txType: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
  txDescription: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 1 },
  txDate: { fontSize: Typography.sizes.xs, color: Colors.textDisabled, marginTop: 2 },
  txFee: { fontSize: Typography.sizes.xs, color: Colors.textDisabled, marginTop: 2 },
  txAmount: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: Colors.textDisabled },
});
