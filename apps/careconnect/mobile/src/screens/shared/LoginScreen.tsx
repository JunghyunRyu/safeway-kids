import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { sendOtp, verifyOtp, devLogin } from '@safeway/core-mobile/api/auth';

type Role = 'parent' | 'caregiver';

export default function LoginScreen({ onLogin }: { onLogin: (role: Role) => void }) {
  const [step, setStep] = useState<'role' | 'phone' | 'otp'>('role');
  const [role, setRole] = useState<Role>('parent');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) { Alert.alert('오류', '전화번호를 확인해 주세요'); return; }
    setLoading(true);
    try {
      await sendOtp(phone);
      setStep('otp');
    } catch { Alert.alert('오류', '인증번호 발송에 실패했습니다'); }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) { Alert.alert('오류', '인증번호 6자리를 입력해 주세요'); return; }
    setLoading(true);
    try {
      await verifyOtp(phone, code, name || '사용자', role, 'careconnect');
      onLogin(role);
    } catch { Alert.alert('오류', '인증번호가 올바르지 않습니다'); }
    setLoading(false);
  };

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      await devLogin('01012345678', '테스트 유저', role, 'careconnect');
      onLogin(role);
    } catch { Alert.alert('오류', '로그인에 실패했습니다'); }
    setLoading(false);
  };

  if (step === 'role') {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>케어커넥트</Text>
        <Text style={styles.subtitle}>아이 돌봄 매칭 플랫폼</Text>

        <View style={styles.roleCards}>
          <Pressable
            style={[styles.roleCard, role === 'parent' && styles.roleCardSelected]}
            onPress={() => setRole('parent')}
          >
            <Text style={styles.roleEmoji}>{'\uD83D\uDC76'}</Text>
            <Text style={styles.roleLabel}>보호자</Text>
            <Text style={styles.roleDesc}>돌봄을 맡기고 싶어요</Text>
          </Pressable>
          <Pressable
            style={[styles.roleCard, role === 'caregiver' && styles.roleCardSelected]}
            onPress={() => setRole('caregiver')}
          >
            <Text style={styles.roleEmoji}>{'\uD83D\uDC9D'}</Text>
            <Text style={styles.roleLabel}>돌봄자</Text>
            <Text style={styles.roleDesc}>돌봄 서비스를 제공해요</Text>
          </Pressable>
        </View>

        <Pressable style={styles.primaryBtn} onPress={() => setStep('phone')}>
          <Text style={styles.primaryBtnText}>시작하기</Text>
        </Pressable>

        <Pressable style={styles.devBtn} onPress={handleDevLogin}>
          <Text style={styles.devBtnText}>개발용 바로 로그인</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable onPress={() => setStep(step === 'otp' ? 'phone' : 'role')} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
      </Pressable>

      <Text style={styles.stepTitle}>{step === 'phone' ? '전화번호 인증' : '인증번호 입력'}</Text>

      {step === 'phone' ? (
        <>
          <TextInput style={styles.input} placeholder="이름" value={name} onChangeText={setName} placeholderTextColor={Colors.textDisabled} />
          <TextInput style={styles.input} placeholder="전화번호 (010-0000-0000)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={Colors.textDisabled} />
          <Pressable style={styles.primaryBtn} onPress={handleSendOtp} disabled={loading}>
            <Text style={styles.primaryBtnText}>{loading ? '발송 중...' : '인증번호 받기'}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.otpHint}>{phone}로 인증번호를 보냈습니다</Text>
          <TextInput style={styles.input} placeholder="인증번호 6자리" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} placeholderTextColor={Colors.textDisabled} />
          <Pressable style={styles.primaryBtn} onPress={handleVerify} disabled={loading}>
            <Text style={styles.primaryBtnText}>{loading ? '확인 중...' : '로그인'}</Text>
          </Pressable>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', paddingHorizontal: Spacing.xl },
  logo: { fontSize: 36, textAlign: 'center', fontWeight: Typography.weights.extrabold, color: Colors.primary },
  subtitle: { fontSize: Typography.sizes.md, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 40 },
  roleCards: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xxl },
  roleCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg,
    alignItems: 'center', borderWidth: 2, borderColor: Colors.borderLight, ...Shadows.sm,
  },
  roleCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  roleEmoji: { fontSize: 36, marginBottom: 8 },
  roleLabel: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  roleDesc: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: Colors.primary, paddingVertical: Spacing.base, borderRadius: Radius.lg,
    alignItems: 'center', marginBottom: Spacing.md,
  },
  primaryBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
  devBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  devBtnText: { fontSize: Typography.sizes.sm, color: Colors.textDisabled },
  backBtn: { position: 'absolute', top: 60, left: Spacing.base, zIndex: 10 },
  stepTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: Spacing.xl },
  input: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md, fontSize: Typography.sizes.md, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.borderLight, marginBottom: Spacing.md,
  },
  otpHint: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
});
