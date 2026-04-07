import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  { icon: 'paw' as const, title: '안심 산책', desc: '강아지, 고양이 모두\n안심하고 맡기세요.', bg: '#F4A22D' },
  { icon: 'camera' as const, title: '실시간 사진', desc: '산책 중 사진과 메시지로\n우리 아이의 모습을 확인하세요.', bg: '#2D9E6B' },
  { icon: 'map' as const, title: 'GPS 추적', desc: '실시간 위치 추적으로\n산책 경로를 직접 확인할 수 있어요.', bg: '#3B82C4' },
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
