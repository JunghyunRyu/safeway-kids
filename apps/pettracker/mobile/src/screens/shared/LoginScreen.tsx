import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { sendOtp, verifyOtp, devLogin } from '@safeway/core-mobile/api/auth';

type Role = 'pet_owner' | 'walker';

const RESEND_COOLDOWN = 60; // seconds

export default function LoginScreen({
  onLogin,
  onDevPaste,
}: {
  onLogin: (role: Role) => void;
  onDevPaste?: () => void;
}) {
  const [step, setStep] = useState<'role' | 'phone' | 'otp'>('role');
  const [role, setRole] = useState<Role>('pet_owner');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // OTP 재전송 쿨다운 타이머
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      Alert.alert('오류', '전화번호를 확인해 주세요');
      return;
    }
    if (!agreed) {
      Alert.alert('약관 동의 필요', '서비스 이용약관과 개인정보 처리방침에 동의해 주세요');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(phone.replace(/\D/g, ''));
      setStep('otp');
      setCooldown(RESEND_COOLDOWN);
    } catch {
      Alert.alert('오류', '인증번호 발송에 실패했습니다');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      await sendOtp(phone.replace(/\D/g, ''));
      setCooldown(RESEND_COOLDOWN);
      Alert.alert('재전송', '인증번호를 다시 보냈습니다');
    } catch {
      Alert.alert('오류', '재전송에 실패했습니다');
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      Alert.alert('오류', '인증번호 6자리를 입력해 주세요');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(phone.replace(/\D/g, ''), code, name || '사용자', role);
      onLogin(role);
    } catch {
      Alert.alert('오류', '인증번호가 올바르지 않습니다');
    }
    setLoading(false);
  };

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      await devLogin('01012345678', '테스트 유저', role);
      onLogin(role);
    } catch {
      Alert.alert('오류', '로그인에 실패했습니다');
    }
    setLoading(false);
  };

  if (step === 'role') {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>🐾 패트래커</Text>
        <Text style={styles.subtitle}>우리 아이의 일상 돌봄 파트너</Text>

        <View style={styles.roleCards}>
          <Pressable
            style={[styles.roleCard, role === 'pet_owner' && styles.roleCardSelected]}
            onPress={() => setRole('pet_owner')}
            accessibilityRole="radio"
            accessibilityState={{ selected: role === 'pet_owner' }}
            accessibilityLabel="반려동물 보호자로 시작"
          >
            <Text style={styles.roleEmoji}>🐕</Text>
            <Text style={styles.roleLabel}>반려동물 보호자</Text>
            <Text style={styles.roleDesc}>산책을 맡기고 싶어요</Text>
          </Pressable>
          <Pressable
            style={[styles.roleCard, role === 'walker' && styles.roleCardSelected]}
            onPress={() => setRole('walker')}
            accessibilityRole="radio"
            accessibilityState={{ selected: role === 'walker' }}
            accessibilityLabel="산책 도우미로 시작"
          >
            <Text style={styles.roleEmoji}>🚶</Text>
            <Text style={styles.roleLabel}>산책 도우미</Text>
            <Text style={styles.roleDesc}>산책 서비스를 제공해요</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.primaryBtn}
          onPress={() => setStep('phone')}
          accessibilityRole="button"
          accessibilityLabel="시작하기"
        >
          <Text style={styles.primaryBtnText}>시작하기</Text>
        </Pressable>

        {__DEV__ && (
          <Pressable style={styles.devBtn} onPress={handleDevLogin}>
            <Text style={styles.devBtnText}>개발용 바로 로그인</Text>
          </Pressable>
        )}
        {__DEV__ && onDevPaste && (
          <Pressable style={styles.devBtn} onPress={onDevPaste}>
            <Text style={styles.devBtnText}>개발용 토큰 붙여넣기</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable
        onPress={() => setStep(step === 'otp' ? 'phone' : 'role')}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="이전 단계로"
        hitSlop={12}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
      </Pressable>

      <Text style={styles.stepTitle}>{step === 'phone' ? '전화번호 인증' : '인증번호 입력'}</Text>

      {step === 'phone' ? (
        <>
          <TextInput style={styles.input} placeholder="이름" value={name} onChangeText={setName} placeholderTextColor={Colors.textDisabled} accessibilityLabel="이름 입력" />
          <TextInput style={styles.input} placeholder="전화번호 (숫자만, 예: 01012345678)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={Colors.textDisabled} accessibilityLabel="전화번호 입력" />

          <Pressable
            style={styles.consentRow}
            onPress={() => setAgreed((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            accessibilityLabel="이용약관 및 개인정보 처리방침 동의"
            hitSlop={8}
          >
            <Ionicons
              name={agreed ? 'checkbox' : 'square-outline'}
              size={22}
              color={agreed ? Colors.primary : Colors.textDisabled}
            />
            <Text style={styles.consentText}>
              <Text style={styles.consentLink}>이용약관</Text> 및{' '}
              <Text style={styles.consentLink}>개인정보 처리방침</Text>에 동의합니다 (필수)
            </Text>
          </Pressable>

          <Pressable style={[styles.primaryBtn, !agreed && styles.primaryBtnDisabled]} onPress={handleSendOtp} disabled={loading} accessibilityRole="button" accessibilityLabel="인증번호 받기">
            <Text style={styles.primaryBtnText}>{loading ? '발송 중...' : '인증번호 받기'}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.otpHint}>{phone}로 인증번호를 보냈습니다</Text>
          <TextInput style={styles.input} placeholder="인증번호 6자리" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} placeholderTextColor={Colors.textDisabled} accessibilityLabel="인증번호 입력" />
          <Pressable style={styles.primaryBtn} onPress={handleVerify} disabled={loading} accessibilityRole="button" accessibilityLabel="로그인">
            <Text style={styles.primaryBtnText}>{loading ? '확인 중...' : '로그인'}</Text>
          </Pressable>
          <Pressable
            style={styles.resendBtn}
            onPress={handleResend}
            disabled={cooldown > 0 || loading}
            accessibilityRole="button"
            accessibilityLabel="인증번호 재전송"
          >
            <Text style={[styles.resendText, cooldown > 0 && styles.resendTextDisabled]}>
              {cooldown > 0 ? `인증번호 재전송 (${cooldown}초)` : '인증번호 재전송'}
            </Text>
          </Pressable>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', paddingHorizontal: Spacing.xl },
  logo: { fontSize: 40, textAlign: 'center' },
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
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
  devBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  devBtnText: { fontSize: Typography.sizes.sm, color: Colors.textDisabled },
  backBtn: { position: 'absolute', top: 60, left: Spacing.base, zIndex: 10, padding: 10 },
  stepTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: Spacing.xl },
  input: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md, fontSize: Typography.sizes.md, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.borderLight, marginBottom: Spacing.md,
  },
  otpHint: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  consentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.base, paddingVertical: 4 },
  consentText: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  consentLink: { color: Colors.primary, fontWeight: Typography.weights.bold },
  resendBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  resendText: { fontSize: Typography.sizes.sm, color: Colors.primary, fontWeight: Typography.weights.bold },
  resendTextDisabled: { color: Colors.textDisabled },
});
