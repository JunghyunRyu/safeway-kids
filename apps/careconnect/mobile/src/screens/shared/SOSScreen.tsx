import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { apiClient } from '../../api/client';

export default function SOSScreen({ navigation }: any) {
  const handleSOS = useCallback(async () => {
    Alert.alert('긴급 SOS', '긴급 상황입니까?\nSOS 호출 시 관리자에게 즉시 알림되고, 112로 전화 연결됩니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: 'SOS 호출', style: 'destructive',
        onPress: async () => {
          let lat = 0, lon = 0;
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
              lat = loc.coords.latitude;
              lon = loc.coords.longitude;
            }
          } catch { /* 위치 권한 거부 시 기본 좌표 사용 */ }
          try { await apiClient.post('/notifications/sos', { latitude: lat, longitude: lon, sos_type: 'emergency' }); } catch {
            Alert.alert('알림', 'SOS 신호 전송에 실패했습니다. 112에 직접 연결합니다.');
          }
          Linking.openURL('tel:112');
        },
      },
    ]);
  }, []);

  return (
    <View style={styles.container}>
      <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
      </Pressable>
      <View style={styles.center}>
        <Text style={styles.title}>긴급 SOS</Text>
        <Text style={styles.desc}>긴급 상황 시 아래 버튼을 누르세요.{'\n'}관리자 + 112에 즉시 연결됩니다.</Text>
        <Pressable style={styles.sosBtn} onPress={handleSOS}>
          <Ionicons name="warning" size={48} color="#fff" />
          <Text style={styles.sosText}>SOS</Text>
        </Pressable>
        <Text style={styles.hint}>버튼을 누르면 현재 위치가 자동 전송됩니다</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  backBtn: { position: 'absolute', top: 60, left: Spacing.base, zIndex: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  title: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.extrabold, color: Colors.danger, marginBottom: Spacing.md },
  desc: { fontSize: Typography.sizes.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 48 },
  sosBtn: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#DC2626', justifyContent: 'center', alignItems: 'center', shadowColor: '#DC2626', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 12 },
  sosText: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 4 },
  hint: { fontSize: Typography.sizes.sm, color: Colors.textDisabled, marginTop: 32 },
});
