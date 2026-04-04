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
    } catch {}
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
          } catch {}
        },
      },
    ]);
  };

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
              <Text style={styles.txDate}>{new Date(item.created_at).toLocaleDateString('ko-KR')}</Text>
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
  txDate: { fontSize: Typography.sizes.xs, color: Colors.textDisabled, marginTop: 2 },
  txAmount: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: Colors.textDisabled },
});
