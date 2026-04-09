import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { setAvailability, listAvailability, deleteAvailability, type AvailabilitySlot } from '../../api/caregivers';
import { DatePickerModal } from '@safeway/core-mobile';

export default function ScheduleScreen() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [newDate, setNewDate] = useState('');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('18:00');
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const loadSlots = async () => {
    try {
      const data = await listAvailability();
      setSlots(data);
    } catch {
      Alert.alert('오류', '데이터를 불러올 수 없습니다');
    }
  };

  useEffect(() => { loadSlots(); }, []);

  const addSlot = async () => {
    if (!newDate) return;
    try {
      await setAvailability({ available_date: newDate, start_time: newStart, end_time: newEnd });
      setNewDate('');
      await loadSlots();
    } catch {
      Alert.alert('오류', '가용 시간 등록에 실패했습니다');
    }
  };

  const handleDelete = (slot: AvailabilitySlot) => {
    Alert.alert('삭제', `${slot.available_date} ${slot.start_time}~${slot.end_time} 일정을 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAvailability(slot.id);
            await loadSlots();
          } catch {
            Alert.alert('오류', '삭제에 실패했습니다');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>스케줄 관리</Text>
      </View>

      <View style={styles.addRow}>
        <Pressable style={styles.input} onPress={() => setDatePickerVisible(true)}>
          <Text style={{ color: newDate ? Colors.textPrimary : Colors.textDisabled }}>
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
        primaryColor={Colors.primary}
      />

      <FlatList
        data={slots}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.base }}
        renderItem={({ item }) => (
          <View style={styles.slotCard}>
            <Ionicons name="calendar" size={20} color={Colors.primary} />
            <Text style={styles.slotDate}>{item.available_date}</Text>
            <Text style={styles.slotTime}>{item.start_time} ~ {item.end_time}</Text>
            <Pressable onPress={() => handleDelete(item)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
            </Pressable>
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
  addBtn: { width: 44, height: 44, backgroundColor: Colors.primary, borderRadius: Radius.sm, justifyContent: 'center', alignItems: 'center' },
  slotCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, gap: 8, ...Shadows.sm,
  },
  slotDate: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
  slotTime: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  deleteBtn: { padding: 8 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: Colors.textDisabled, fontSize: Typography.sizes.base },
});
