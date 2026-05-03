import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

type PolicyKind = 'privacy' | 'terms';

interface Section {
  heading: string;
  body: string;
}

const PRIVACY: Section[] = [
  {
    heading: '1. 수집하는 개인정보 항목',
    body: '본 서비스는 다음 항목을 수집합니다.\n• 회원가입: 이름, 휴대전화번호, 역할(보호자/워커)\n• 산책 이용: 반려동물 정보(이름, 품종, 체중, 의료 정보)\n• 위치 정보: 산책 중 워커의 실시간 GPS (위치정보보호법에 따름)',
  },
  {
    heading: '2. 개인정보의 수집 및 이용 목적',
    body: '• 워커 매칭 및 예약 서비스 제공\n• 산책 진행 상황 실시간 공유 (보호자에게)\n• 안전한 결제 처리 및 분쟁 해결\n• 서비스 개선 및 통계 분석 (식별 정보 제거 후)',
  },
  {
    heading: '3. 위치정보 수집·이용에 관한 동의',
    body: '워커 앱은 산책 진행 중에만 위치 정보를 수집하며, 수집된 위치 정보는 보호자가 산책 진행 상황을 확인하는 용도로만 사용됩니다. 산책 종료 후 90일간 보관 후 자동 삭제됩니다.',
  },
  {
    heading: '4. 개인정보의 보유 및 이용 기간',
    body: '회원 탈퇴 시 즉시 파기합니다. 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.\n• 결제 기록: 5년 (전자상거래법)\n• 분쟁 처리 기록: 3년 (전자상거래법)',
  },
  {
    heading: '5. 개인정보 보호책임자',
    body: '루넨랩스 — privacy@lunenlabs.com\n개인정보 처리에 관한 문의는 이메일로 접수해 주세요.',
  },
];

const TERMS: Section[] = [
  {
    heading: '제 1 조 (목적)',
    body: '본 약관은 루넨랩스(이하 "회사")가 제공하는 PetTracker(이하 "서비스")의 이용 조건과 절차, 회사와 이용자의 권리·의무·책임 사항을 규정함을 목적으로 합니다.',
  },
  {
    heading: '제 2 조 (서비스 정의)',
    body: 'PetTracker는 반려동물 보호자와 검증된 산책 도우미(워커)를 연결하는 매칭 서비스이며, 회사는 직접 산책 서비스를 제공하지 않습니다.',
  },
  {
    heading: '제 3 조 (이용 자격)',
    body: '• 보호자: 만 14세 이상의 반려동물 양육자\n• 워커: 만 19세 이상이며 신원 확인 및 회사의 자격 검증 절차를 통과한 자',
  },
  {
    heading: '제 4 조 (서비스 이용 책임)',
    body: '워커는 산책 중 반려동물의 안전에 대한 주의 의무를 부담합니다. 회사는 매칭 플랫폼으로서, 산책 중 발생한 사고에 대해서는 워커 보험 및 회사 보험을 통해 보장합니다 (별도 보험 약관 적용).',
  },
  {
    heading: '제 5 조 (결제 및 환불)',
    body: '• 산책 시작 24시간 전 취소: 100% 환불\n• 24시간 이내 취소: 50% 환불\n• 산책 시작 후 취소: 환불 불가 (단, 워커 귀책의 경우 100% 환불)',
  },
  {
    heading: '제 6 조 (분쟁 해결)',
    body: '서비스 이용과 관련하여 발생한 분쟁은 한국 소비자분쟁조정위원회 또는 관할 법원에서 해결합니다.',
  },
];

export default function PolicyScreen({ route, navigation }: any) {
  const kind: PolicyKind = route?.params?.kind ?? 'privacy';
  const isPrivacy = kind === 'privacy';
  const sections = isPrivacy ? PRIVACY : TERMS;
  const title = isPrivacy ? '개인정보 처리방침' : '이용약관';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          {isPrivacy
            ? '루넨랩스는 이용자의 개인정보를 소중하게 다루며, 관련 법령(개인정보보호법·위치정보보호법)을 준수합니다.'
            : 'PetTracker 서비스 이용에 관한 약관입니다. 서비스를 이용하시면 본 약관에 동의한 것으로 간주됩니다.'}
        </Text>
        <Text style={styles.lastUpdated}>최종 개정일: 2026년 5월 1일</Text>

        {sections.map((s, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.heading}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md,
  },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl },
  intro: {
    fontSize: Typography.sizes.sm, color: Colors.textSecondary,
    lineHeight: 20, marginBottom: 8,
  },
  lastUpdated: { fontSize: Typography.sizes.xs, color: Colors.textDisabled, marginBottom: Spacing.lg },
  section: {
    backgroundColor: Colors.surface, padding: Spacing.base,
    borderRadius: Radius.md, marginBottom: Spacing.sm,
  },
  heading: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: 8 },
  body: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, lineHeight: 22 },
});
