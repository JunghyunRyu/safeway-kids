import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DatePickerModalProps {
  visible: boolean;
  value: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  onClose: () => void;
  minDate?: string; // YYYY-MM-DD, default: today
  primaryColor?: string;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS_KR = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

function formatKorean(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = WEEKDAYS[d.getDay()];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${day})`;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function buildMonthGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function DatePickerModal({ visible, value, onSelect, onClose, minDate, primaryColor = '#3B82F6' }: DatePickerModalProps) {
  const today = new Date();
  const initial = value ? new Date(value) : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const min = minDate ? new Date(minDate) : new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const cells = buildMonthGrid(viewYear, viewMonth);
  const selectedDate = value ? new Date(value) : null;

  const isDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    return d < min;
  };

  const isSelected = (day: number) =>
    selectedDate &&
    selectedDate.getFullYear() === viewYear &&
    selectedDate.getMonth() === viewMonth &&
    selectedDate.getDate() === day;

  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goNext = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelect = (day: number) => {
    if (isDisabled(day)) return;
    const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    onSelect(dateStr);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={goPrev} style={styles.navBtn} hitSlop={12}>
              <Ionicons name="chevron-back" size={24} color="#374151" />
            </Pressable>
            <Text style={styles.title}>{viewYear}년 {MONTHS_KR[viewMonth]}</Text>
            <Pressable onPress={goNext} style={styles.navBtn} hitSlop={12}>
              <Ionicons name="chevron-forward" size={24} color="#374151" />
            </Pressable>
          </View>

          {/* Weekday row */}
          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <Text key={w} style={[styles.weekday, i === 0 && { color: '#EF4444' }, i === 6 && { color: '#3B82F6' }]}>{w}</Text>
            ))}
          </View>

          {/* Date grid */}
          <FlatList
            data={cells}
            keyExtractor={(_, idx) => String(idx)}
            numColumns={7}
            scrollEnabled={false}
            renderItem={({ item, index }) => {
              if (item === null) return <View style={styles.cell} />;
              const disabled = isDisabled(item);
              const selected = isSelected(item);
              const todayCell = isToday(item);
              const weekday = index % 7;
              return (
                <Pressable
                  style={[styles.cell, selected && { backgroundColor: primaryColor, borderRadius: 22 }]}
                  onPress={() => handleSelect(item)}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.cellText,
                      disabled && { color: '#D1D5DB' },
                      selected && { color: '#fff', fontWeight: '700' },
                      !selected && !disabled && weekday === 0 && { color: '#EF4444' },
                      !selected && !disabled && weekday === 6 && { color: '#3B82F6' },
                      todayCell && !selected && { fontWeight: '700' },
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            }}
          />

          {/* Footer */}
          <View style={styles.footer}>
            {value && <Text style={styles.selectedLabel}>{formatKorean(value)}</Text>}
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>닫기</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export { formatKorean };

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '90%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  navBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  weekRow: { flexDirection: 'row', marginTop: 8, marginBottom: 4 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#6B7280', paddingVertical: 6 },
  cell: { flex: 1 / 7, height: 44, justifyContent: 'center', alignItems: 'center', margin: 1 },
  cellText: { fontSize: 15, color: '#111827' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  selectedLabel: { fontSize: 14, color: '#374151', flex: 1 },
  closeBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  closeText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
});
