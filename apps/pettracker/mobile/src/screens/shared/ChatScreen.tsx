import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  time: string;
}

export default function ChatScreen({ route, navigation }: any) {
  const { bookingId, otherName } = route?.params || { otherName: '상대방' };
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: '안녕하세요! 오늘 산책 예약 관련해서요.', sender: 'other', time: '14:30' },
    { id: '2', text: '네, 안녕하세요! 무엇이 궁금하신가요?', sender: 'me', time: '14:31' },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text: input.trim(), sender: 'me', time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setInput('');
    // TODO: API call to send message
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.bubble, item.sender === 'me' ? styles.myBubble : styles.otherBubble]}>
      <Text style={[styles.bubbleText, item.sender === 'me' && styles.myBubbleText]}>{item.text}</Text>
      <Text style={[styles.timeText, item.sender === 'me' && styles.myTimeText]}>{item.time}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerName}>{otherName}</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: Spacing.base }}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="메시지 입력..."
          placeholderTextColor={Colors.textDisabled}
        />
        <Pressable style={styles.sendBtn} onPress={sendMessage}>
          <Ionicons name="send" size={20} color={Colors.textInverse} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  headerName: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  bubble: { maxWidth: '75%', padding: Spacing.md, borderRadius: Radius.lg, marginBottom: 8 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  otherBubble: { alignSelf: 'flex-start', backgroundColor: Colors.surface, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: Typography.sizes.base, color: Colors.textPrimary, lineHeight: 20 },
  myBubbleText: { color: Colors.textInverse },
  timeText: { fontSize: Typography.sizes.xs, color: Colors.textDisabled, marginTop: 4 },
  myTimeText: { color: 'rgba(255,255,255,0.7)' },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.sm,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  textInput: {
    flex: 1, backgroundColor: Colors.background, borderRadius: Radius.full,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, fontSize: Typography.sizes.base,
    color: Colors.textPrimary, marginRight: 8,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
});
