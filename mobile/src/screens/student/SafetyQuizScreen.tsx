/**
 * P3-63: Safety Quiz Screen — O/X quiz for student traffic safety education.
 */
import React, { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../constants/theme";
import { SAFETY_QUIZ_DATA, type QuizQuestion } from "../../constants/safetyQuizData";

export default function SafetyQuizScreen() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  const question: QuizQuestion = SAFETY_QUIZ_DATA[currentIndex];

  const handleAnswer = useCallback(
    (answer: boolean) => {
      if (answered) return;
      setSelectedAnswer(answer);
      setAnswered(true);
      if (answer === question.answer) {
        setCorrectCount((c) => c + 1);
      }
    },
    [answered, question]
  );

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= SAFETY_QUIZ_DATA.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  }, [currentIndex]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setCorrectCount(0);
    setFinished(false);
  }, []);

  if (finished) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>안전 퀴즈 결과</Text>
        </View>
        <View style={styles.resultContainer}>
          <Ionicons
            name={correctCount >= 7 ? "trophy" : "ribbon"}
            size={64}
            color={correctCount >= 7 ? Colors.warning : Colors.info}
          />
          <Text style={styles.resultScore}>
            {correctCount} / {SAFETY_QUIZ_DATA.length}
          </Text>
          <Text style={styles.resultMessage}>
            {correctCount === SAFETY_QUIZ_DATA.length
              ? "완벽해요! 안전 박사!"
              : correctCount >= 7
              ? "잘했어요! 조금만 더 공부해요!"
              : "다시 도전해 봐요!"}
          </Text>
          <Pressable style={styles.restartBtn} onPress={handleRestart}>
            <Text style={styles.restartBtnText}>다시 풀기</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isCorrect = selectedAnswer === question.answer;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>안전 퀴즈</Text>
        <Text style={styles.progress}>
          {currentIndex + 1} / {SAFETY_QUIZ_DATA.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / SAFETY_QUIZ_DATA.length) * 100}%` },
            ]}
          />
        </View>

        {/* Question */}
        <View style={[styles.questionCard, Shadows.sm]}>
          <Text style={styles.questionNumber}>Q{currentIndex + 1}</Text>
          <Text style={styles.questionText}>{question.question}</Text>
        </View>

        {/* O/X Buttons */}
        <View style={styles.answerRow}>
          <Pressable
            style={[
              styles.answerBtn,
              { backgroundColor: "#E3F2FD" },
              answered && selectedAnswer === true && (isCorrect ? styles.correct : styles.wrong),
              answered && !selectedAnswer && question.answer === true && styles.correct,
            ]}
            onPress={() => handleAnswer(true)}
            disabled={answered}
          >
            <Text style={[styles.answerText, { color: "#1565C0" }]}>O</Text>
          </Pressable>
          <Pressable
            style={[
              styles.answerBtn,
              { backgroundColor: "#FFEBEE" },
              answered && selectedAnswer === false && (isCorrect ? styles.correct : styles.wrong),
              answered && selectedAnswer !== false && question.answer === false && styles.correct,
            ]}
            onPress={() => handleAnswer(false)}
            disabled={answered}
          >
            <Text style={[styles.answerText, { color: "#C62828" }]}>X</Text>
          </Pressable>
        </View>

        {/* Feedback */}
        {answered && (
          <View style={[styles.feedbackCard, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
            <View style={styles.feedbackHeader}>
              <Ionicons
                name={isCorrect ? "checkmark-circle" : "close-circle"}
                size={24}
                color={isCorrect ? Colors.success : Colors.danger}
              />
              <Text
                style={[styles.feedbackTitle, { color: isCorrect ? Colors.success : Colors.danger }]}
              >
                {isCorrect ? "정답이에요!" : "아쉬워요!"}
              </Text>
            </View>
            <Text style={styles.explanation}>{question.explanation}</Text>
            <Pressable style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>
                {currentIndex + 1 >= SAFETY_QUIZ_DATA.length ? "결과 보기" : "다음 문제"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.textInverse} />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7FF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.roleStudent,
  },
  title: {
    fontSize: 24,
    fontWeight: Typography.weights.bold,
    color: Colors.textInverse,
  },
  progress: {
    fontSize: Typography.sizes.base,
    color: "rgba(255,255,255,0.8)",
    fontWeight: Typography.weights.semibold,
  },
  content: { padding: Spacing.base, gap: Spacing.md },
  progressBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.roleStudent,
    borderRadius: 4,
  },
  questionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.md,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: Typography.weights.bold,
    color: Colors.roleStudent,
  },
  questionText: {
    fontSize: 20,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    textAlign: "center",
    lineHeight: 30,
  },
  answerRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  answerBtn: {
    flex: 1,
    height: 100,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  answerText: {
    fontSize: 48,
    fontWeight: Typography.weights.bold,
  },
  correct: {
    borderWidth: 3,
    borderColor: Colors.success,
  },
  wrong: {
    borderWidth: 3,
    borderColor: Colors.danger,
    opacity: 0.6,
  },
  feedbackCard: {
    borderRadius: 16,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  feedbackCorrect: {
    backgroundColor: "#E8F5E9",
  },
  feedbackWrong: {
    backgroundColor: "#FFEBEE",
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: Typography.weights.bold,
  },
  explanation: {
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.roleStudent,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
  },
  nextBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
    padding: Spacing.base,
  },
  resultScore: {
    fontSize: 48,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  resultMessage: {
    fontSize: 20,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  restartBtn: {
    backgroundColor: Colors.roleStudent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  restartBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
});
