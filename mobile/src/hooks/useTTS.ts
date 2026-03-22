/**
 * P3-65: TTS hook for driver voice announcements.
 * Uses expo-speech for text-to-speech.
 */
import { useCallback, useRef, useState } from "react";
import * as Speech from "expo-speech";

export function useTTS() {
  const [enabled, setEnabled] = useState(true);
  const speakingRef = useRef(false);

  const speak = useCallback(
    async (text: string) => {
      if (!enabled || speakingRef.current) return;
      speakingRef.current = true;
      try {
        await Speech.speak(text, {
          language: "ko-KR",
          rate: 0.9,
          onDone: () => {
            speakingRef.current = false;
          },
          onError: () => {
            speakingRef.current = false;
          },
        });
      } catch {
        speakingRef.current = false;
      }
    },
    [enabled]
  );

  const announceNextStop = useCallback(
    (studentName: string, address: string | null) => {
      const msg = address
        ? `다음 정류장: ${studentName}, ${address}`
        : `다음 정류장: ${studentName}`;
      speak(msg);
    },
    [speak]
  );

  const announceAfterAction = useCallback(
    (nextStudentName: string | null) => {
      if (nextStudentName) {
        speak(`다음 학생: ${nextStudentName}`);
      } else {
        speak("모든 학생 처리 완료");
      }
    },
    [speak]
  );

  const toggle = useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  return { enabled, toggle, speak, announceNextStop, announceAfterAction };
}
