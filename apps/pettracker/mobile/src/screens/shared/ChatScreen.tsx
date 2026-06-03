import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

type MsgStatus = 'sending' | 'sent' | 'failed';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  time: string;
  status?: MsgStatus;
}

export default function ChatScreen({ route, navigation }: any) {
  const { bookingId, otherName } = route?.params || { otherName: '상대방' };
  const storageKey = `pt:chat:${bookingId ?? 'unknown'}`;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loaded, setLoaded] = useState(false);

  // 같은 기기 내 메시지를 복원한다 (앱을 닫아도 대화가 사라지지 않도록).
  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (raw) setMessages(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [storageKey]);

  const persist = (next: Message[]) => {
    AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
  };

  const nowLabel = () => new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const msg: Message = { id: Date.now().toString(), text, sender: 'me', time: nowLabel(), status: 'sent' };
    setMessages((prev) => {
      const next = [...prev, msg];
      persist(next);
      return next;
    });
    setInput('');
    // NOTE: 실시간 양방향 전송은 백엔드 채팅 엔드포인트(미구현)에 의존.
    // 현재는 같은 기기 내 로컬 스레드로만 보관된다.
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.bubble, item.sender === 'me' ? styles.myBubble : styles.otherBubble]}>
      <Text style={[styles.bubbleText, item.sender === 'me' && styles.myBubbleText]}>{item.text}</Text>
      <View style={styles.metaRow}>
        <Text style={[styles.timeText, item.sender === 'me' && styles.myTimeText]}>{item.time}</Text>
        {item.sender === 'me' && item.status === 'failed' && (
          <Ionicons name="alert-circle" size={12} color={Colors.danger} style={{ marginLeft: 4 }} />
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="뒤로 가기" hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerName}>{otherName}</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={messages.length === 0 ? styles.emptyWrap : { padding: Spacing.base }}
        ListEmptyComponent={
          loaded ? (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={Colors.textDisabled} />
              <Text style={styles.emptyText}>
                산책 관련해서 궁금한 점을{'\n'}자유롭게 이야기해 보세요.
              </Text>
            </View>
          ) : null
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="메시지 입력..."
          placeholderTextColor={Colors.textDisabled}
          accessibilityLabel="메시지 입력"
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <Pressable style={styles.sendBtn} onPress={sendMessage} accessibilityRole="button" accessibilityLabel="메시지 전송">
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
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  timeText: { fontSize: Typography.sizes.xs, color: Colors.textDisabled },
  myTimeText: { color: 'rgba(255,255,255,0.7)' },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: Spacing.xl },
  emptyText: { fontSize: Typography.sizes.base, color: Colors.textDisabled, marginTop: Spacing.md, textAlign: 'center', lineHeight: 22 },
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
