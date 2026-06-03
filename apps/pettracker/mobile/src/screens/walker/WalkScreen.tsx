import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, FlatList, ActivityIndicator, TextInput, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { startWalk, recordGps, endWalk } from '../../api/walks';
import { listBookings, type Booking } from '../../api/bookings';
import { getMe } from '@safeway/core-mobile/api/auth';
import { useImageUpload } from '@safeway/core-mobile/hooks/useImageUpload';

type WalkState = 'idle' | 'walking' | 'ended';

export default function WalkScreen() {
  const [state, setState] = useState<WalkState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [confirmedBookings, setConfirmedBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [walkerMemo, setWalkerMemo] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoDownloadUrl, setPhotoDownloadUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [gpsWeak, setGpsWeak] = useState(false);
  const { upload: uploadImage, uploading: photoUploading } = useImageUpload();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gpsRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gpsFailRef = useRef(0);
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    getMe()
      .then((me) => setUserId(me.id))
      .catch(() => {});
  }, []);

  // 화면이 사라질 때(탭 전환·언마운트) GPS/타이머 인터벌을 반드시 정리한다.
  // (인터벌 누수·중복 시작으로 데이터가 오염되는 것을 방지)
  useEffect(() => {
    return () => {
      if (gpsRef.current) clearInterval(gpsRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 두 GPS 좌표 사이의 거리(m)를 누적해 산책 중 실시간 거리를 보여준다.
  const haversineMeters = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  };

  const uploadWalkPhoto = useCallback(
    async (localUri: string, mimeType: string | undefined) => {
      if (!userId) {
        Alert.alert('오류', '사용자 정보를 불러오지 못했습니다');
        return;
      }
      try {
        const res = await uploadImage({
          fileUri: localUri,
          contentType: mimeType ?? 'image/jpeg',
          entityType: 'walk_photo',
          userId,
        });
        setPhotoDownloadUrl(res.downloadUrl);
      } catch {
        Alert.alert('업로드 실패', '사진 업로드에 실패했습니다. 다시 시도해 주세요.');
      }
    },
    [userId, uploadImage],
  );

  // Load confirmed bookings for today
  const loadBookings = async () => {
    setLoadingBookings(true);
    try {
      const bookings = await listBookings('confirmed');
      // Filter to today's bookings
      const today = new Date().toISOString().split('T')[0];
      const todayBookings = bookings.filter((b) => b.scheduled_at.startsWith(today));
      setConfirmedBookings(todayBookings.length > 0 ? todayBookings : bookings.slice(0, 10));
    } catch {
      Alert.alert('오류', '예약 목록을 불러올 수 없습니다');
    }
    setLoadingBookings(false);
  };

  useEffect(() => {
    if (state === 'idle') loadBookings();
  }, [state]);

  // Timer
  useEffect(() => {
    if (state === 'walking') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleStart = async (booking: Booking) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('위치 권한 필요', '산책 GPS 추적을 위해 위치 권한이 필요합니다.');
      return;
    }

    Alert.alert('산책 시작', `${booking.pet_name || '반려동물'} 산책을 시작하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '시작',
        onPress: async () => {
          try {
            const result = await startWalk(booking.id);
            setSessionId(result.session_id);
            setSelectedBooking(booking);
            setState('walking');
            setElapsed(0);
            setDistance(0);
            setGpsWeak(false);
            gpsFailRef.current = 0;
            lastPosRef.current = null;

            // 중복 시작 방지: 기존 인터벌이 있으면 먼저 정리.
            if (gpsRef.current) clearInterval(gpsRef.current);

            // Start GPS streaming every 5 seconds
            gpsRef.current = setInterval(async () => {
              try {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                if (result.session_id) {
                  await recordGps(result.session_id, {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    heading: loc.coords.heading ?? undefined,
                    speed: loc.coords.speed ?? undefined,
                    accuracy: loc.coords.accuracy ?? undefined,
                    recorded_at: new Date().toISOString(),
                  });
                }
                // 실시간 거리 누적 (W-10)
                const cur = { lat: loc.coords.latitude, lng: loc.coords.longitude };
                if (lastPosRef.current) {
                  const step = haversineMeters(lastPosRef.current, cur);
                  // GPS 지터로 인한 미세 이동(2m 미만)은 무시.
                  if (step >= 2) setDistance((d) => d + step);
                }
                lastPosRef.current = cur;
                // 성공 시 실패 카운터/약신호 배너 해제.
                gpsFailRef.current = 0;
                setGpsWeak(false);
              } catch {
                // 5초마다 Alert 반복 금지(W-01): 배너로만 표시하고,
                // 연속 실패가 누적될 때만 약신호로 간주한다.
                gpsFailRef.current += 1;
                if (gpsFailRef.current >= 2) setGpsWeak(true);
              }
            }, 5000);
          } catch {
            Alert.alert('오류', '산책을 시작할 수 없습니다.');
          }
        },
      },
    ]);
  };

  const handleEnd = () => {
    Alert.alert('산책 종료', '산책을 종료하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '종료',
        onPress: async () => {
          if (gpsRef.current) clearInterval(gpsRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          setGpsWeak(false);
          try {
            if (sessionId) {
              const result = await endWalk(sessionId, {
                walker_memo: walkerMemo.trim() || undefined,
                photo_url: photoDownloadUrl || undefined,
              });
              // 서버 거리가 있으면 그 값을, 없으면 클라이언트 누적 거리를 유지.
              if (result.distance_meters && result.distance_meters > 0) {
                setDistance(result.distance_meters);
              }
              setState('ended');
            } else {
              setState('ended');
            }
          } catch {
            // 종료 실패 시 산책 상태 유지 (GPS는 멈췄으므로 재시도 안내).
            Alert.alert('종료 실패', '산책 종료 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.');
          }
        },
      },
    ]);
  };

  const isAttentionNeeded = (booking: Booking) =>
    booking.pet_temperament === '주의필요' || booking.pet_temperament === '겁많음';

  const renderBookingCard = ({ item }: { item: Booking }) => (
    <Pressable
      style={[styles.bookingCard, isAttentionNeeded(item) && styles.bookingCardWarning]}
      onPress={() => handleStart(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.pet_name || '반려동물'} 산책 시작`}
    >
      <View style={styles.bookingCardHeader}>
        <Text style={styles.petEmoji}>{item.pet_species === 'cat' ? '🐈' : '🐕'}</Text>
        <View style={styles.bookingCardInfo}>
          <Text style={styles.petName}>{item.pet_name || '반려동물'}</Text>
          <Text style={styles.bookingTime}>
            {new Date(item.scheduled_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            {' · '}{item.duration_minutes}분
          </Text>
        </View>
        <Ionicons name="play-circle" size={36} color={Colors.accent} />
      </View>
      {/* P1-7: Pet characteristics */}
      <View style={styles.petDetails}>
        {item.pet_weight_kg != null && (
          <View style={styles.petDetailTag}>
            <Text style={styles.petDetailText}>{item.pet_weight_kg}kg</Text>
          </View>
        )}
        {item.pet_temperament && (
          <View style={[styles.petDetailTag, isAttentionNeeded(item) && styles.petDetailTagWarning]}>
            <Text style={[styles.petDetailText, isAttentionNeeded(item) && styles.petDetailTextWarning]}>
              {item.pet_temperament}
            </Text>
          </View>
        )}
        {item.pet_special_needs && (
          <View style={[styles.petDetailTag, styles.petDetailTagWarning]}>
            <Ionicons name="alert-circle" size={12} color={Colors.danger} />
            <Text style={styles.petDetailTextWarning}>{item.pet_special_needs}</Text>
          </View>
        )}
      </View>
      {item.owner_name && <Text style={styles.ownerName}>보호자: {item.owner_name}</Text>}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>산책</Text>
      </View>

      {state === 'idle' && (
        <View style={styles.idleContainer}>
          <Text style={styles.sectionTitle}>오늘의 확정 예약</Text>
          {loadingBookings ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
          ) : confirmedBookings.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="walk" size={80} color={Colors.textDisabled} />
              <Text style={styles.idleText}>
                아직 확정된 예약이 없어요.{'\n'}홈에서 새 산책 요청을 수락해 보세요.
              </Text>
            </View>
          ) : (
            <FlatList
              data={confirmedBookings}
              keyExtractor={(item) => item.id}
              renderItem={renderBookingCard}
              contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 40 }}
            />
          )}
        </View>
      )}

      {state === 'walking' && (
        <View style={styles.walkingWrap}>
          {gpsWeak && (
            <View style={styles.gpsBanner} accessibilityLiveRegion="polite">
              <Ionicons name="warning" size={16} color={Colors.warning} />
              <Text style={styles.gpsBannerText}>GPS 신호가 약해요. 잠시 이동하면 다시 잡힙니다.</Text>
            </View>
          )}

          <ScrollView contentContainerStyle={styles.walkingContent} keyboardShouldPersistTaps="handled">
            <View style={styles.timerCircle}>
              <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
              <Text style={styles.timerLabel}>산책 중</Text>
            </View>

            <Text style={styles.distanceText} accessibilityLabel={`현재까지 거리 ${(distance / 1000).toFixed(2)}킬로미터`}>
              📍 {(distance / 1000).toFixed(2)} km
            </Text>

            {selectedBooking && (
              <Text style={styles.walkingPetName}>
                {selectedBooking.pet_species === 'cat' ? '🐈' : '🐕'} {selectedBooking.pet_name || '반려동물'}
              </Text>
            )}

            {/* Walk memo input */}
            <TextInput
              style={styles.memoInput}
              value={walkerMemo}
              onChangeText={setWalkerMemo}
              placeholder="산책 메모를 입력하세요 (보호자에게 전달돼요)"
              placeholderTextColor={Colors.textDisabled}
              multiline
              accessibilityLabel="산책 메모 입력"
            />

            {/* Photo FAB — large button for one-handed use */}
            <Pressable
              style={[styles.photoFab, photoUploading && styles.photoFabDisabled]}
              disabled={photoUploading}
              accessibilityRole="button"
              accessibilityLabel="산책 사진 추가"
              onPress={() => {
                Alert.alert('사진 추가', '방법을 선택하세요', [
                  { text: '카메라', onPress: async () => {
                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== 'granted') { Alert.alert('권한 필요', '카메라 권한이 필요합니다'); return; }
                    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
                    if (!result.canceled && result.assets[0]) {
                      setPhotoUri(result.assets[0].uri);
                      setPhotoDownloadUrl(null);
                      uploadWalkPhoto(result.assets[0].uri, result.assets[0].mimeType);
                    }
                  }},
                  { text: '갤러리', onPress: async () => {
                    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
                    if (!result.canceled && result.assets[0]) {
                      setPhotoUri(result.assets[0].uri);
                      setPhotoDownloadUrl(null);
                      uploadWalkPhoto(result.assets[0].uri, result.assets[0].mimeType);
                    }
                  }},
                  { text: '취소', style: 'cancel' },
                ]);
              }}>
              <Ionicons name="camera" size={32} color={Colors.textInverse} />
              <Text style={styles.photoLabel}>사진</Text>
            </Pressable>

            {photoUri && (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photoDownloadUrl ?? photoUri }} style={styles.photoThumb} />
                {photoUploading ? (
                  <View style={styles.photoStatusRow}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.photoStatus}>업로드 중...</Text>
                  </View>
                ) : photoDownloadUrl ? (
                  <Text style={styles.photoStatusOk}>업로드 완료</Text>
                ) : (
                  <Text style={styles.photoStatus}>사진이 저장되었습니다</Text>
                )}
              </View>
            )}
          </ScrollView>

          {/* 종료 버튼은 화면 하단에 고정 — 스크롤과 무관하게 항상 보인다 (W-02) */}
          <View style={styles.footer}>
            <Pressable style={styles.endBtn} onPress={handleEnd} accessibilityRole="button" accessibilityLabel="산책 종료">
              <Ionicons name="stop" size={24} color={Colors.textInverse} />
              <Text style={styles.btnText}>산책 종료</Text>
            </Pressable>
          </View>
        </View>
      )}

      {state === 'ended' && (
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          <Text style={styles.endedTitle}>산책 완료!</Text>
          <Text style={styles.endedStat}>시간: {formatTime(elapsed)}</Text>
          <Text style={styles.endedStat}>거리: {(distance / 1000).toFixed(1)}km</Text>
          <Pressable style={styles.resetBtn} onPress={() => { setState('idle'); setElapsed(0); setDistance(0); setSelectedBooking(null); setWalkerMemo(''); setPhotoUri(null); setPhotoDownloadUrl(null); }}>
            <Text style={styles.resetText}>확인</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  sectionTitle: {
    fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary,
    paddingHorizontal: Spacing.base, marginBottom: Spacing.md,
  },
  idleContainer: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  walkingWrap: { flex: 1 },
  walkingContent: { alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  gpsBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.warningLight, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
  },
  gpsBannerText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, flex: 1 },
  distanceText: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold, color: Colors.textPrimary, marginBottom: Spacing.md },
  footer: {
    padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.borderLight, backgroundColor: Colors.surface,
  },
  idleText: { fontSize: Typography.sizes.md, color: Colors.textDisabled, marginTop: Spacing.lg, textAlign: 'center' },
  // Booking card styles
  bookingCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base,
    marginBottom: Spacing.sm, ...Shadows.sm,
  },
  bookingCardWarning: {
    backgroundColor: Colors.dangerLight, borderWidth: 1, borderColor: Colors.danger,
  },
  bookingCardHeader: {
    flexDirection: 'row', alignItems: 'center',
  },
  petEmoji: { fontSize: 32, marginRight: Spacing.md },
  bookingCardInfo: { flex: 1 },
  petName: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  bookingTime: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 2 },
  petDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.sm },
  petDetailTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceElevated, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm,
  },
  petDetailTagWarning: { backgroundColor: Colors.dangerLight },
  petDetailText: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
  petDetailTextWarning: { fontSize: Typography.sizes.xs, color: Colors.danger, fontWeight: Typography.weights.medium },
  ownerName: { fontSize: Typography.sizes.xs, color: Colors.textDisabled, marginTop: 6 },
  walkingPetName: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  // Walking state styles
  startBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.base, borderRadius: Radius.lg, gap: 8,
  },
  btnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textInverse },
  timerCircle: {
    width: 200, height: 200, borderRadius: 100, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xxl,
  },
  timerText: { fontSize: 48, fontWeight: Typography.weights.extrabold, color: '#fff' },
  timerLabel: { fontSize: Typography.sizes.base, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  photoFab: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xxl,
  },
  photoFabDisabled: { opacity: 0.6 },
  photoLabel: { color: '#fff', fontSize: Typography.sizes.xs, marginTop: 2 },
  endBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.base, borderRadius: Radius.lg, gap: 8,
  },
  endedTitle: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.success, marginTop: Spacing.lg },
  endedStat: { fontSize: Typography.sizes.lg, color: Colors.textSecondary, marginTop: Spacing.sm },
  memoInput: {
    width: '90%', backgroundColor: Colors.surface, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: Typography.sizes.base, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.borderLight, marginBottom: Spacing.md,
    minHeight: 44, textAlignVertical: 'top' as const,
  },
  photoPreview: { alignItems: 'center', marginBottom: Spacing.md },
  photoThumb: { width: 80, height: 80, borderRadius: Radius.md, marginBottom: 4 },
  photoStatus: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
  photoStatusOk: { fontSize: Typography.sizes.xs, color: Colors.success },
  photoStatusRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  resetBtn: { marginTop: Spacing.xxl, backgroundColor: Colors.primary, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, borderRadius: Radius.md },
  resetText: { color: Colors.textInverse, fontWeight: Typography.weights.bold, fontSize: Typography.sizes.md },
});
