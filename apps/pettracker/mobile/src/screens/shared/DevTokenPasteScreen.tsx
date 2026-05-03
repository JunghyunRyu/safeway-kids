/**
 * DevTokenPasteScreen — dev-only screen to paste an access token into SecureStore.
 * Shown when no token exists. Bypasses missing LoginScreen wiring during demo.
 *
 * Production hardening: gate behind __DEV__ in App.tsx.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { tokenStorage } from '@safeway/core-mobile/api/client';

export default function DevTokenPasteScreen({ onTokenSaved }: { onTokenSaved: () => void }) {
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const t = token.trim();
    if (!t || t.split('.').length !== 3) {
      Alert.alert('잘못된 토큰', 'JWT 형식이어야 합니다 (xxx.yyy.zzz)');
      return;
    }
    setSaving(true);
    try {
      await tokenStorage.setItem('access_token', t);
      Alert.alert('저장 완료', '토큰을 저장했습니다. 앱을 시작합니다.', [
        { text: '확인', onPress: onTokenSaved },
      ]);
    } catch (e: any) {
      Alert.alert('저장 실패', String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🔐 Dev: 토큰 붙여넣기</Text>
      <Text style={styles.subtitle}>
        터미널에서 시드 스크립트로 발급한 OWNER_TOKEN을 붙여넣으세요.
        production에서는 LoginScreen이 표시됩니다.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        placeholderTextColor="#aaa"
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
        autoCorrect={false}
        multiline
      />
      <Pressable
        style={[styles.btn, saving && { opacity: 0.5 }]}
        onPress={onSave}
        disabled={saving}
      >
        <Text style={styles.btnText}>{saving ? '저장 중...' : '토큰 저장 후 시작'}</Text>
      </Pressable>
      <Text style={styles.hint}>
        💡 토큰은 SecureStore에 저장되며 새로고침해도 유지됩니다.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 80, backgroundColor: '#FFF8F0' },
  title: { fontSize: 24, fontWeight: '700', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 20 },
  input: {
    borderWidth: 1, borderColor: '#F4A22D', borderRadius: 8,
    padding: 12, fontSize: 12, backgroundColor: '#fff',
    minHeight: 120, textAlignVertical: 'top', marginBottom: 16,
    fontFamily: 'monospace',
  },
  btn: {
    backgroundColor: '#F4A22D', borderRadius: 8, paddingVertical: 14,
    alignItems: 'center', marginBottom: 16,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  hint: { fontSize: 12, color: '#999', textAlign: 'center' },
});
