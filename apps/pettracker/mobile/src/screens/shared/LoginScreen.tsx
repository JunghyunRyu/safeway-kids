import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { sendOtp, verifyOtp, devLogin, updateConsents, type TokenResponse } from '@safeway/core-mobile/api/auth';
import ConsentScreen from './ConsentScreen';
import { toConsentPayload } from '../../constants/consent';
import { isKakaoLoginAvailable, signInWithKakao } from '../../auth/kakao';
import { bridgeJwtToFirebase } from '../../auth/firebaseAdapter';

type Role = 'pet_owner' | 'walker';
type Step = 'role' | 'consent' | 'phone' | 'otp' | 'reconsent';

const RESEND_SECONDS = 60;

interface Props {
  onLogin: (role: Role) => void;
  /** __DEV__ 토큰 직접 입력 화면 진입 (DevTokenPasteScreen 보존) */
  onDevTokenPaste?: () => void;
}

/**
 * 가입/로그인 플로우 (FR-M1~M4): 역할 선택 → 약관 동의 → 전화번호 OTP.
 * Kakao 버튼은 config-gate (extra.kakaoRestApiKey 존재 시에만 노출).
 * 동의 도입 전 가입자는 서버의 required_consents 응답으로 재동의 유도.
 */
export default function LoginScreen({ onLogin, onDevTokenPaste }: Props) {
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<Role>('pet_owner');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [consentDocs, setConsentDocs] = useState<string[]>([]);
  const [resendIn, setResendIn] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startResendTimer = () => {
    setResendIn(RESEND_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendIn((s) => {
        if (s <= 1 && timerRef.current) clearInterval(timerRef.current);
        return Math.max(0, s - 1);
      });
    }, 1000);
  };

  const finishLogin = async (data: TokenResponse, loginRole: Role) => {
    if (data.required_consents && data.required_consents.length > 0) {
      // 동의 도입 전 가입자(또는 소셜 신규) — 재동의 후 진입 (FR-C3)
      setStep('reconsent');
      return;
    }
    void bridgeJwtToFirebase(); // best-effort, 로그인 차단 안 함 (FR-M5)
    onLogin(loginRole);
  };

  const handleSendOtp = async (isResend = false) => {
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length < 10) { Alert.alert('오류', '전화번호를 확인해 주세요'); return; }
    setLoading(true);
    try {
      await sendOtp(digits);
      startResendTimer();
      if (!isResend) setStep('otp');
    } catch { Alert.alert('오류', '인증번호 발송에 실패했습니다'); }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) { Alert.alert('오류', '인증번호 6자리를 입력해 주세요'); return; }
    setLoading(true);
    try {
      const digits = phone.replace(/[^0-9]/g, '');
      // 기존 사용자는 name이 비어 있어도 로그인 가능 (이름 덮어쓰기 방지, FR-M3)
      const data = await verifyOtp(digits, code, name.trim(), role, toConsentPayload(consentDocs));
      await finishLogin(data, role);
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      if (detail?.missing_consents) {
        Alert.alert('동의 필요', '필수 약관 동의 후 가입할 수 있습니다');
        setStep('consent');
      } else if (typeof detail === 'string' && detail.includes('이름')) {
        Alert.alert('오류', '처음 가입하시는 경우 이름을 입력해 주세요');
        setStep('phone');
      } else {
        Alert.alert('오류', '인증번호가 올바르지 않습니다');
      }
    }
    setLoading(false);
  };

  const handleKakao = async () => {
    setLoading(true);
    try {
      const data = await signInWithKakao(role);
      if (data) await finishLogin(data, role);
    } catch { Alert.alert('오류', '카카오 로그인에 실패했습니다'); }
    setLoading(false);
  };

  const handleReconsent = async (checked: string[]) => {
    setLoading(true);
    try {
      await updateConsents({ grant: toConsentPayload(checked) });
      void bridgeJwtToFirebase();
      onLogin(role);
    } catch { Alert.alert('오류', '동의 처리에 실패했습니다. 다시 시도해 주세요'); }
    setLoading(false);
  };

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      await devLogin('01012345678', '테스트 유저', role);
      onLogin(role);
    } catch { Alert.alert('오류', '로그인에 실패했습니다'); }
    setLoading(false);
  };

  if (step === 'consent') {
    return (
      <ConsentScreen
        role={role}
        onBack={() => setStep('role')}
        onAgree={(docs) => { setConsentDocs(docs); setStep('phone'); }}
      />
    );
  }

  if (step === 'reconsent') {
    return (
      <ConsentScreen
        role={role}
        onBack={() => setStep('role')}
        onAgree={handleReconsent}
      />
    );
  }

  if (step === 'role') {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>🐾 패트래커</Text>
        <Text style={styles.subtitle}>반려동물 산책 매칭 플랫폼</Text>

        <View style={styles.roleCards}>
          <Pressable
            style={[styles.roleCard, role === 'pet_owner' && styles.roleCardSelected]}
            onPress={() => setRole('pet_owner')}
          >
            <Text style={styles.roleEmoji}>🐕</Text>
            <Text style={styles.roleLabel}>반려동물 보호자</Text>
            <Text style={styles.roleDesc}>산책을 맡기고 싶어요</Text>
          </Pressable>
          <Pressable
            style={[styles.roleCard, role === 'walker' && styles.roleCardSelected]}
            onPress={() => setRole('walker')}
          >
            <Text style={styles.roleEmoji}>🚶</Text>
            <Text style={styles.roleLabel}>산책 도우미</Text>
            <Text style={styles.roleDesc}>산책 서비스를 제공해요</Text>
          </Pressable>
        </View>

        <Pressable style={styles.primaryBtn} onPress={() => setStep('consent')}>
          <Text style={styles.primaryBtnText}>시작하기</Text>
        </Pressable>

        {isKakaoLoginAvailable() && (
          <Pressable style={styles.kakaoBtn} onPress={handleKakao} disabled={loading}>
            <Text style={styles.kakaoBtnText}>카카오로 시작하기</Text>
          </Pressable>
        )}

        {__DEV__ && (
          <>
            <Pressable style={styles.devBtn} onPress={handleDevLogin}>
              <Text style={styles.devBtnText}>개발용 바로 로그인</Text>
            </Pressable>
            {onDevTokenPaste && (
              <Pressable style={styles.devBtn} onPress={onDevTokenPaste}>
                <Text style={styles.devBtnText}>토큰 직접 입력</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable onPress={() => setStep(step === 'otp' ? 'phone' : 'consent')} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
      </Pressable>

      <Text style={styles.stepTitle}>{step === 'phone' ? '전화번호 인증' : '인증번호 입력'}</Text>

      {step === 'phone' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="이름 (처음 가입 시에만 입력)"
            value={name}
            onChangeText={setName}
            placeholderTextColor={Colors.textDisabled}
          />
          <TextInput
            style={styles.input}
            placeholder="전화번호 (010-0000-0000)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor={Colors.textDisabled}
          />
          <Pressable style={styles.primaryBtn} onPress={() => handleSendOtp(false)} disabled={loading}>
            <Text style={styles.primaryBtnText}>{loading ? '발송 중...' : '인증번호 받기'}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.otpHint}>{phone}로 인증번호를 보냈습니다</Text>
          <TextInput
            style={styles.input}
            placeholder="인증번호 6자리"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            placeholderTextColor={Colors.textDisabled}
          />
          <Pressable style={styles.primaryBtn} onPress={handleVerify} disabled={loading}>
            <Text style={styles.primaryBtnText}>{loading ? '확인 중...' : '로그인'}</Text>
          </Pressable>
          <Pressable
            style={styles.resendBtn}
            onPress={() => handleSendOtp(true)}
            disabled={loading || resendIn > 0}
          >
            <Text style={[styles.resendText, resendIn > 0 && styles.resendTextDisabled]}>
              {resendIn > 0 ? `인증번호 재전송 (${resendIn}초)` : '인증번호 재전송'}
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
  primaryBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
  kakaoBtn: {
    backgroundColor: '#FEE500', paddingVertical: Spacing.base, borderRadius: Radius.lg,
    alignItems: 'center', marginBottom: Spacing.md,
  },
  kakaoBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: '#191919' },
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
  resendBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  resendText: { fontSize: Typography.sizes.sm, color: Colors.primary },
  resendTextDisabled: { color: Colors.textDisabled },
});
