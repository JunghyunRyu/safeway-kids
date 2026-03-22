import { Linking, Platform } from "react-native";

/**
 * Open external navigation app with destination coordinates.
 * Priority: KakaoNavi → TMap → System default maps.
 */
export async function openNavigation(
  lat: number,
  lng: number,
  name: string
): Promise<void> {
  const kakaoUrl = `kakaomap://route?ep=${lat},${lng}&by=CAR`;
  const tmapUrl = `tmap://route?goalx=${lng}&goaly=${lat}&goalname=${encodeURIComponent(name)}`;
  const fallback =
    Platform.OS === "ios"
      ? `maps:?daddr=${lat},${lng}`
      : `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name)})`;

  try {
    const canKakao = await Linking.canOpenURL(kakaoUrl);
    if (canKakao) {
      await Linking.openURL(kakaoUrl);
      return;
    }
  } catch {
    // skip
  }

  try {
    const canTmap = await Linking.canOpenURL(tmapUrl);
    if (canTmap) {
      await Linking.openURL(tmapUrl);
      return;
    }
  } catch {
    // skip
  }

  await Linking.openURL(fallback);
}
