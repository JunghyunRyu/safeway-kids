import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Typography, Spacing, Radius } from "../constants/theme";

const { width } = Dimensions.get("window");

const ONBOARDING_KEY = "@safeway_kids_onboarded";

const SLIDES = [
  {
    icon: "shield-checkmark" as const,
    color: Colors.primary,
    title: "안전한 통학",
    description:
      "실시간 GPS 추적과 전문 안전도우미 동승으로\n아이들의 안전한 통학을 지켜드립니다.",
  },
  {
    icon: "notifications" as const,
    color: Colors.info,
    title: "실시간 알림",
    description:
      "탑승, 하차, 도착 확인까지\n모든 단계를 즉시 알림으로 받아보세요.",
  },
  {
    icon: "map" as const,
    color: Colors.success,
    title: "지도에서 확인",
    description:
      "카카오맵으로 셔틀버스의 실시간 위치를\n직접 확인할 수 있습니다.",
  },
  {
    icon: "calendar" as const,
    color: Colors.warning,
    title: "스케줄 관리",
    description:
      "요일별 등하원 스케줄 설정부터\n원터치 결석 처리까지 간편하게.",
  },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      try {
        await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      } catch {
        // AsyncStorage 실패해도 진행
      }
      onComplete();
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
      // AsyncStorage 실패해도 진행
    }
    onComplete();
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={handleSkip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.skipText}>건너뛰기</Text>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(idx);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconCircle, { backgroundColor: item.color + "20" }]}>
              <Ionicons name={item.icon} size={64} color={item.color} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <Pressable
          style={[styles.nextBtn, isLast && styles.nextBtnLast]}
          onPress={handleNext}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.nextBtnText}>
            {isLast ? "시작하기" : "다음"}
          </Text>
          {!isLast && <Ionicons name="arrow-forward" size={18} color="#fff" />}
        </Pressable>
      </View>
    </View>
  );
}

export { ONBOARDING_KEY };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  skipText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.base,
    borderRadius: Radius.lg,
  },
  nextBtnLast: {
    backgroundColor: Colors.success,
  },
  nextBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
});
