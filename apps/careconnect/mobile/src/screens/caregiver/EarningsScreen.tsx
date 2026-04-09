import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { getWallet, requestWithdrawal, listTransactions, exportTransactionsCsv, type CcWallet, type CcTransaction } from '../../api/wallet';

const TX_TYPE_LABELS: Record<string, string> = {
  earning: '수입', withdrawal: '출금', refund: '환불', adjustment: '조정',
};

export default function EarningsScreen() {
  const [wallet, setWallet] = useState<CcWallet | null>(null);
  const [transactions, setTransactions] = useState<CcTransaction[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawInput, setShowWithdrawInput] = useState(false);

  const loadData = async () => {
    try {
      const w = await getWallet();
      setWallet(w);
    } catch {
      Alert.alert('오류', '데이터를 불러올 수 없습니다');
    }
    try {
      const txs = await listTransactions();
      setTransactions(txs);
    } catch {
      // transactions endpoint may not exist yet — silently continue
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleExport = async () => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    try {
      const csv = await exportTransactionsCsv(month);
      if (!csv || csv.trim().split('\n').length <= 1) {
        Alert.alert('알림', '해당 월에 거래 내역이 없습니다');
        return;
      }
      const fileUri = `${FileSystem.cacheDirectory}cc-transactions-${month}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'CSV 내보내기' });
      } else {
        Alert.alert('완료', `저장됨: ${fileUri}`);
      }
    } catch {
      Alert.alert('오류', 'CSV 내보내기에 실패했습니다');
    }
  };

  const formatAmount = (val: string) => {
    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) return '';
    return num.toLocaleString();
  };

  const getWithdrawNum = () => parseInt(withdrawAmount.replace(/[^0-9]/g, ''), 10) || 0;

  const handleWithdraw = () => {
    if (!wallet || wallet.balance <= 0) {
      Alert.alert('출금 불가', '잔액이 없습니다');
      return;
    }
    setShowWithdrawInput(true);
    setWithdrawAmount(wallet.balance.toLocaleString());
  };

  const confirmWithdraw = async () => {
    const amount = getWithdrawNum();
    if (amount < 1000) {
      Alert.alert('출금 불가', '최소 출금 금액은 1,000원입니다');
      return;
    }
    if (wallet && amount > wallet.balance) {
      Alert.alert('출금 불가', '잔액을 초과할 수 없습니다');
      return;
    }
    Alert.alert('출금 확인', `${amount.toLocaleString()}원을 출금하시겠습니까?\n영업일 기준 익일(D+1) 입금됩니다`, [
      { text: '취소', style: 'cancel' },
      {
        text: '출금',
        onPress: async () => {
          try {
            await requestWithdrawal(amount);
            setShowWithdrawInput(false);
            setWithdrawAmount('');
            await loadData();
            Alert.alert('완료', '출금 요청이 접수되었습니다\n영업일 기준 익일(D+1) 입금 예정');
          } catch {
            Alert.alert('오류', '출금 요청에 실패했습니다. 잠시 후 다시 시도해주세요');
          }
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
        <Text style={styles.settlementNote}>수수료 {wallet?.commission_rate ?? 20}% | 정산: 영업일 D+1</Text>
      </View>

      {showWithdrawInput && (
        <View style={styles.withdrawCard}>
          <Text style={styles.withdrawLabel}>출금 금액 (최소 1,000원)</Text>
          <TextInput
            style={styles.withdrawInput}
            value={withdrawAmount}
            onChangeText={(v) => setWithdrawAmount(formatAmount(v))}
            keyboardType="numeric"
            placeholder="금액 입력"
          />
          <View style={styles.presetRow}>
            <Pressable style={styles.presetBtn} onPress={() => wallet && setWithdrawAmount(wallet.balance.toLocaleString())}>
              <Text style={styles.presetText}>전액</Text>
            </Pressable>
            <Pressable style={styles.presetBtn} onPress={() => wallet && setWithdrawAmount(Math.floor(wallet.balance / 2).toLocaleString())}>
              <Text style={styles.presetText}>50%</Text>
            </Pressable>
          </View>
          <View style={styles.withdrawActions}>
            <Pressable style={styles.cancelBtn} onPress={() => setShowWithdrawInput(false)}>
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, (getWithdrawNum() < 1000 || (wallet && getWithdrawNum() > wallet.balance)) && { opacity: 0.4 }]}
              onPress={confirmWithdraw}
              disabled={getWithdrawNum() < 1000 || !!(wallet && getWithdrawNum() > wallet.balance)}
            >
              <Text style={styles.confirmText}>출금 확인</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Monthly Summary */}
      {transactions.length > 0 && (() => {
        const now = new Date();
        const monthTxs = transactions.filter(t => {
          const d = new Date(t.created_at);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.tx_type === 'earning';
        });
        const gross = monthTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
        const fee = Math.round(gross * (wallet?.commission_rate ?? 20) / 100);
        return (
          <View style={styles.infoCard}>
            <Text style={styles.monthTitle}>이번 달 수입</Text>
            <Text style={styles.monthAmount}>{(gross - fee).toLocaleString()}원</Text>
            <Text style={styles.monthDetail}>총 {gross.toLocaleString()}원 (수수료 {fee.toLocaleString()}원)</Text>
          </View>
        );
      })()}

      {/* Commission & Settlement Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle" size={16} color={Colors.info} />
          <Text style={styles.infoText}>플랫폼 수수료: {wallet?.commission_rate ?? 20}%</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={Colors.info} />
          <Text style={styles.infoText}>정산: 영업일 기준 D+1</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, marginTop: Spacing.xl, marginBottom: Spacing.md }}>
        <Text style={[styles.sectionTitle, { paddingHorizontal: 0, marginTop: 0, marginBottom: 0 }]}>거래 내역</Text>
        <Pressable onPress={handleExport} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 6 }}>
          <Ionicons name="download-outline" size={16} color={Colors.primary} />
          <Text style={{ fontSize: Typography.sizes.sm, color: Colors.primary }}>CSV 내보내기</Text>
        </Pressable>
      </View>
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
  infoCard: {
    marginHorizontal: Spacing.base, marginTop: Spacing.md, padding: Spacing.base,
    backgroundColor: Colors.infoLight, borderRadius: Radius.md, gap: 6,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: Typography.sizes.sm, color: Colors.info, fontWeight: Typography.weights.medium },
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
  settlementNote: { fontSize: Typography.sizes.xs, color: 'rgba(255,255,255,0.7)', marginTop: 8, textAlign: 'center' as const },
  withdrawCard: {
    marginHorizontal: Spacing.base, marginTop: Spacing.md, padding: Spacing.base,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, ...Shadows.sm,
  },
  withdrawLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginBottom: 8 },
  withdrawInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold as any,
    textAlign: 'right' as const, color: Colors.textPrimary,
  },
  presetRow: { flexDirection: 'row' as const, gap: Spacing.sm, marginTop: Spacing.sm },
  presetBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.sm,
  },
  presetText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  withdrawActions: { flexDirection: 'row' as const, gap: Spacing.md, marginTop: Spacing.md },
  cancelBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' as const },
  cancelText: { color: Colors.textSecondary, fontWeight: Typography.weights.medium },
  confirmBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center' as const },
  confirmText: { color: '#fff', fontWeight: Typography.weights.bold },
  monthTitle: { fontSize: Typography.sizes.sm, color: Colors.info, fontWeight: Typography.weights.medium },
  monthAmount: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginVertical: 4 },
  monthDetail: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: Colors.textDisabled },
});
