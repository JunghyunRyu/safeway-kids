import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

export default function LiveTrackScreen({ route, navigation }: any) {
  const { sessionId } = route?.params || {};
  const [walkerPosition, setWalkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const webviewRef = useRef<WebView>(null);

  // In production: WebSocket subscription to walk_session:{id}:live
  // For now: placeholder with polling simulation
  useEffect(() => {
    // Simulated position for UI demo
    setWalkerPosition({ lat: 37.5665, lng: 126.978 });
  }, []);

  const mapHtml = `
    <!DOCTYPE html>
    <html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>body{margin:0}#map{width:100%;height:100vh;background:#e8f4f4;display:flex;justify-content:center;align-items:center;font-family:sans-serif}</style>
    </head><body>
    <div id="map">
      <div style="text-align:center">
        <div style="font-size:48px">📍</div>
        <div style="font-size:16px;color:#5a7272;margin-top:8px">실시간 위치 추적 중...</div>
        <div style="font-size:12px;color:#9eb3b3;margin-top:4px">${walkerPosition ? `${walkerPosition.lat.toFixed(4)}, ${walkerPosition.lng.toFixed(4)}` : '위치 수신 대기'}</div>
      </div>
    </div>
    </body></html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>실시간 추적</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <WebView
        ref={webviewRef}
        source={{ html: mapHtml }}
        style={styles.map}
        scrollEnabled={false}
      />

      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <Ionicons name="walk" size={18} color={Colors.primary} />
          <Text style={styles.infoText}>산책 진행 중</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="time" size={18} color={Colors.accent} />
          <Text style={styles.infoText}>진행 중...</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base,
    paddingTop: 60, paddingBottom: Spacing.md, backgroundColor: Colors.surface, zIndex: 10,
  },
  backBtn: { marginRight: Spacing.md },
  title: { flex: 1, fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dangerLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger, marginRight: 4 },
  liveText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.danger },
  map: { flex: 1 },
  infoBar: {
    flexDirection: 'row', justifyContent: 'space-around', backgroundColor: Colors.surface,
    paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
});
