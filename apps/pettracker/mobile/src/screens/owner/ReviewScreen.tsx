import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { createReview } from '../../api/reviews';

export default function ReviewScreen({ route, navigation }: any) {
  const { bookingId } = route?.params || {};
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { Alert.alert('오류', '별점을 선택해 주세요'); return; }
    if (!bookingId) { Alert.alert('오류', '예약 정보가 없습니다'); return; }
    setLoading(true);
    try {
      await createReview({ booking_id: bookingId, rating, comment: comment || undefined });
      Alert.alert('감사합니다!', '리뷰가 등록되었습니다', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch { Alert.alert('오류', '리뷰 등록에 실패했습니다'); }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>리뷰 작성</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.prompt}>산책은 어떠셨나요?</Text>

        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)} hitSlop={8}>
              <Ionicons
                name={n <= rating ? 'star' : 'star-outline'}
                size={44}
                color={n <= rating ? '#F59E0B' : Colors.borderLight}
              />
            </Pressable>
          ))}
        </View>

        <Text style={styles.ratingLabel}>
          {rating === 0 ? '별점을 선택해 주세요' : ['', '별로예요', '아쉬워요', '괜찮아요', '좋았어요', '최고예요!'][rating]}
        </Text>

        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder="한줄평을 남겨주세요 (선택)"
          placeholderTextColor={Colors.textDisabled}
          multiline
          numberOfLines={4}
        />

        <Pressable style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading || rating === 0}>
          <Text style={styles.submitText}>{loading ? '등록 중...' : '리뷰 등록'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: 40 },
  prompt: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: Spacing.xl },
  stars: { flexDirection: 'row', gap: 8 },
  ratingLabel: { fontSize: Typography.sizes.md, color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.xxl },
  commentInput: {
    width: '100%', backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.base, fontSize: Typography.sizes.base, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.borderLight, minHeight: 100, textAlignVertical: 'top',
  },
  submitBtn: { width: '100%', marginTop: Spacing.xxl, backgroundColor: Colors.primary, paddingVertical: Spacing.base, borderRadius: Radius.lg, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: Colors.neutral, opacity: 0.5 },
  submitText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
});
