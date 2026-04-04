import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { listAvailability, setAvailability } from '../../api/walkers';

export default function ScheduleScreen() {
  const [slots, setSlots] = useState<Array<{ date: string; start: string; end: string; status: string }>>([]);
  const [newDate, setNewDate] = useState('');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('18:00');

  const loadSlots = async () => {
    try { setSlots(await listAvailability()); } catch {}
  };

  useEffect(() => { loadSlots(); }, []);

  const addSlot = async () => {
    if (!newDate) return;
    try {
      await setAvailability({ available_date: newDate, start_time: newStart, end_time: newEnd });
      setNewDate('');
      await loadSlots();
    } catch {}
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>스케줄 관리</Text>
      </View>

      <View style={styles.addRow}>
        <TextInput style={styles.input} value={newDate} onChangeText={setNewDate} placeholder="날짜 (YYYY-MM-DD)" placeholderTextColor={Colors.textDisabled} />
        <TextInput style={[styles.input, { width: 80 }]} value={newStart} onChangeText={setNewStart} placeholder="시작" placeholderTextColor={Colors.textDisabled} />
        <TextInput style={[styles.input, { width: 80 }]} value={newEnd} onChangeText={setNewEnd} placeholder="종료" placeholderTextColor={Colors.textDisabled} />
        <Pressable style={styles.addBtn} onPress={addSlot}>
          <Ionicons name="add" size={22} color={Colors.textInverse} />
        </Pressable>
      </View>

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
});
