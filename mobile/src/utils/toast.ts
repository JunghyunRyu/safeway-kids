import { Alert, Platform, ToastAndroid } from 'react-native';

// Non-blocking error tracking to prevent duplicate alerts
let _lastErrorMessage = '';
let _lastErrorTime = 0;
const ERROR_DEDUP_MS = 3000;

export function showToast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('알림', message);
  }
}

export function showError(message: string) {
  // Deduplicate rapid-fire errors (e.g. multiple parallel requests failing)
  const now = Date.now();
  if (message === _lastErrorMessage && now - _lastErrorTime < ERROR_DEDUP_MS) {
    return;
  }
  _lastErrorMessage = message;
  _lastErrorTime = now;

  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    // Use non-blocking alert — auto-dismiss is not native, but at least deduplicate
    Alert.alert('오류', message);
  }
}
