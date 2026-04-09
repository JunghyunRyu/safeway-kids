import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { listAvailability, setAvailability } from '../../api/walkers';
import { DatePickerModal } from '@safeway/core-mobile';

export default function ScheduleScreen() {
  const [slots, setSlots] = useState<Array<{ date: string; start: string; end: string; status: string }>>([]);
  const [newDate, setNewDate] = useState('');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('18:00');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [repeatType, setRepeatType] = useState<'none' | 'daily' | 'weekly' | 'biweekly'>('none');
  const [repeatCount, setRepeatCount] = useState(1);

  const loadSlots = async () => {
    try { setSlots(await listAvailability()); } catch { Alert.alert('오류', '데이터를 불러올 수 없습니다'); }
  };

  useEffect(() => { loadSlots(); }, []);

  const computeDates = (): string[] => {
    if (!newDate) return [];
    if (repeatType === 'none') return [newDate];
    const start = new Date(newDate);
    const stepDays = repeatType === 'daily' ? 1 : repeatType === 'weekly' ? 7 : 14;
    const dates: string[] = [];
    for (let i = 0; i < repeatCount; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i * stepDays);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const addSlot = async () => {
    if (!newDate) return;
    const dates = computeDates();
    let success = 0;
    let failed = 0;
    for (const d of dates) {
      try {
        await setAvailability({ available_date: d, start_time: newStart, end_time: newEnd });
        success += 1;
      } catch {
        failed += 1;
      }
    }
    if (failed > 0) {
      Alert.alert('일부 실패', `${success}건 생성, ${failed}건 충돌 또는 실패`);
    } else if (success > 1) {
      Alert.alert('완료', `${success}건의 슬롯이 등록되었습니다`);
    }
    setNewDate('');
    setRepeatType('none');
    setRepeatCount(1);
    await loadSlots();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>스케줄 관리</Text>
      </View>

      <View style={styles.addRow}>
        <Pressable style={styles.input} onPress={() => setDatePickerVisible(true)}>
          <Text style={{ color: newDate ? Colors.textPrimary : Colors.textDisabled, fontSize: Typography.sizes.sm }}>
            {newDate || '날짜 선택'}
          </Text>
        </Pressable>
        <TextInput style={[styles.input, { width: 80 }]} value={newStart} onChangeText={setNewStart} placeholder="시작" placeholderTextColor={Colors.textDisabled} />
        <TextInput style={[styles.input, { width: 80 }]} value={newEnd} onChangeText={setNewEnd} placeholder="종료" placeholderTextColor={Colors.textDisabled} />
        <Pressable style={styles.addBtn} onPress={addSlot}>
          <Ionicons name="add" size={22} color={Colors.textInverse} />
        </Pressable>
      </View>

      <DatePickerModal
        visible={datePickerVisible}
        value={newDate}
        onSelect={setNewDate}
        onClose={() => setDatePickerVisible(false)}
        primaryColor={Colors.accent}
      />

      {/* Recurrence options */}
      <View style={styles.repeatRow}>
        <Text style={styles.repeatLabel}>반복:</Text>
        {([['none', '없음'], ['daily', '매일'], ['weekly', '매주'], ['biweekly', '격주']] as const).map(([key, label]) => (
          <Pressable
            key={key}
            style={[styles.repeatChip, repeatType === key && styles.repeatChipActive]}
            onPress={() => setRepeatType(key)}
          >
            <Text style={[styles.repeatChipText, repeatType === key && { color: '#fff' }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {repeatType !== 'none' && (
        <View style={styles.repeatRow}>
          <Text style={styles.repeatLabel}>횟수:</Text>
          {[2, 4, 8, 12].map((n) => (
            <Pressable
              key={n}
              style={[styles.repeatChip, repeatCount === n && styles.repeatChipActive]}
              onPress={() => setRepeatCount(n)}
            >
              <Text style={[styles.repeatChipText, repeatCount === n && { color: '#fff' }]}>{n}회</Text>
            </Pressable>
          ))}
        </View>
      )}

      <FlatList
        data={slots}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: Spacing.base }}
        renderItem={({ item }) => (
          <View style={styles.slotCard}>
            <Ionicons name="calendar" size={20} color={Colors.accent} />
            <Text style={styles.slotDate}>{item.date}</Text>
            <Text style={styles.slotTime}>{item.start} ~ {item.end}</Text>
            <View style={[styles.statusBadge, { backgroundColor: Colors.successLight }]}>
              <Text style={[styles.statusText, { color: Colors.success }]}>{item.status}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>등록된 가용 시간이 없어요</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  addRow: { flexDirection: 'row', paddingHorizontal: Spacing.base, gap: 6, marginBottom: Spacing.md },
  input: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm, fontSize: Typography.sizes.sm, borderWidth: 1, borderColor: Colors.borderLight, color: Colors.textPrimary,
  },
  addBtn: { width: 40, height: 40, backgroundColor: Colors.accent, borderRadius: Radius.sm, justifyContent: 'center', alignItems: 'center' },
  slotCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, gap: 8, ...Shadows.sm,
  },
  slotDate: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
  slotTime: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.xs },
  statusText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: Colors.textDisabled, fontSize: Typography.sizes.base },
  repeatRow: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingHorizontal: Spacing.base, gap: 6, marginBottom: Spacing.sm, flexWrap: 'wrap' as const },
  repeatLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginRight: 4 },
  repeatChip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  repeatChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  repeatChipText: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
});
