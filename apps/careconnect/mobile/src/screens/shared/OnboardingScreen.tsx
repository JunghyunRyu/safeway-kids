import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

const SLIDES = [
  { icon: 'shield-checkmark' as const, title: '검증된 돌봄자', desc: '범죄경력, 아동학대전력, 성범죄전력\n3중 조회를 통과한 돌봄자만 활동합니다.', bg: '#0F7A7A' },
  { icon: 'time' as const, title: '실시간 활동 보고', desc: '돌봄 중 활동, 식사, 상태를\n실시간으로 확인하세요.', bg: '#2D9E6B' },
  { icon: 'call' as const, title: '즉시 연결', desc: '긴급 상황 시 SOS 버튼 하나로\n관리자와 112에 즉시 연결됩니다.', bg: '#D44C3E' },
  { icon: 'card' as const, title: '안전한 결제', desc: '서비스 완료 후 결제 확정.\n배상책임보험으로 안심하세요.', bg: '#3B82C4' },
];

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [page, setPage] = useState(0);

  const isLast = page === SLIDES.length - 1;
  const slide = SLIDES[page];

  return (
    <View style={[styles.container, { backgroundColor: slide.bg }]}>
      <View style={styles.content}>
        <Ionicons name={slide.icon} size={80} color="rgba(255,255,255,0.9)" />
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.desc}>{slide.desc}</Text>
      </View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      <Pressable
        style={styles.btn}
        onPress={() => isLast ? onComplete() : setPage(page + 1)}
      >
        <Text style={styles.btnText}>{isLast ? '시작하기' : '다음'}</Text>
        <Ionicons name={isLast ? 'checkmark' : 'arrow-forward'} size={20} color={Colors.textPrimary} />
      </Pressable>

      {!isLast && (
        <Pressable onPress={onComplete} style={styles.skip}>
          <Text style={styles.skipText}>건너뛰기</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', paddingHorizontal: 40 },
  title: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.extrabold, color: '#fff', marginTop: Spacing.xxl },
  desc: { fontSize: Typography.sizes.md, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: Spacing.md, lineHeight: 24 },
  dots: { flexDirection: 'row', marginTop: 48, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: '#fff', width: 24 },
  btn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 32, paddingVertical: 14, borderRadius: Radius.lg, marginTop: 40, gap: 8,
  },
  btnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  skip: { marginTop: Spacing.lg },
  skipText: { fontSize: Typography.sizes.base, color: 'rgba(255,255,255,0.7)' },
});
