/**
 * SafeWay Kids Edge AI PoC — Audio Alert System (T28)
 *
 * - Web SpeechSynthesis API (한국어 TTS)
 * - 이벤트별 음성: 탑승확인, 이상행동 경고, 잔류인원 경보, 사각지대 경고
 * - AudioContext 초기화 (데모 시작 버튼에 연결)
 */

const AudioAlert = (function () {
  'use strict';

  let audioCtx = null;
  let enabled = false;
  let speaking = false;
  let queue = [];

  // 이벤트별 음성 메시지
  const MESSAGES = {
    // 시나리오 1: 승하차 안면인식
    face_recognized: '탑승이 확인되었습니다.',
    face_unknown: '등록되지 않은 인원이 감지되었습니다. 확인이 필요합니다.',
    boarding_complete: '전원 탑승 완료. 출발 준비되었습니다.',
    alighting_complete: '전원 하차 완료. 잔류인원 확인을 시작합니다.',

    // 시나리오 2: 이상 행동 감지
    behavior_warning: '주의. 이상 행동이 감지되었습니다. 확인해 주세요.',
    behavior_danger: '경고. 위험 행동이 감지되었습니다. 즉시 확인하세요.',
    seatbelt_warning: '안전벨트 미착용이 감지되었습니다.',

    // 시나리오 3: 잔류 인원 감지
    residual_detected: '경보. 차량 내 잔류 인원이 감지되었습니다. 즉시 확인하세요.',
    residual_clear: '잔류인원 확인 완료. 차량이 비어 있습니다.',
    engine_blocked: '잔류인원 감지. 시동이 차단되었습니다.',

    // 시나리오 4: 사각지대 감지
    blindspot_caution: '주의. 사각지대에 물체가 감지되었습니다.',
    blindspot_warning: '경고. 사각지대에 어린이가 접근하고 있습니다.',
    blindspot_danger: '위험. 사각지대에 어린이가 매우 가까이 있습니다. 즉시 정차하세요.',

    // 시스템
    demo_start: '세이프웨이 키즈 에지 AI 데모를 시작합니다.',
    scenario_change: '시나리오가 전환되었습니다.',
    fallback_active: '경고. AI 시스템 장애 발생. 수동 확인 모드로 전환합니다.',
    fallback_recovered: 'AI 시스템이 복구되었습니다.',
  };

  function init() {
    // AudioContext 초기화 (사용자 제스처 필요)
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      enabled = true;
    } catch (e) {
      console.warn('[Audio] AudioContext 초기화 실패:', e);
      enabled = false;
    }
  }

  function speak(messageKey, customText) {
    if (!enabled) return;
    if (!('speechSynthesis' in window)) {
      console.warn('[Audio] SpeechSynthesis API 미지원');
      return;
    }

    var text = customText || MESSAGES[messageKey];
    if (!text) return;

    // 큐에 추가
    queue.push(text);
    processQueue();
  }

  function processQueue() {
    if (speaking || queue.length === 0) return;

    speaking = true;
    var text = queue.shift();

    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // 한국어 음성 선택
    var voices = speechSynthesis.getVoices();
    var koVoice = voices.find(function (v) {
      return v.lang === 'ko-KR' || v.lang.startsWith('ko');
    });
    if (koVoice) utterance.voice = koVoice;

    utterance.onend = function () {
      speaking = false;
      processQueue();
    };

    utterance.onerror = function () {
      speaking = false;
      processQueue();
    };

    speechSynthesis.speak(utterance);
  }

  function playTone(frequency, duration, type) {
    if (!audioCtx || !enabled) return;

    try {
      var oscillator = audioCtx.createOscillator();
      var gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = type || 'sine';
      oscillator.frequency.value = frequency || 440;
      gainNode.gain.value = 0.15;

      // 페이드 아웃
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (duration || 0.3));

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + (duration || 0.3));
    } catch (e) {
      // 무시 — 데모에서 경고음은 부가 기능
    }
  }

  function alertTone(level) {
    if (!enabled) return;

    switch (level) {
      case 'danger':
        playTone(880, 0.15, 'square');
        setTimeout(function () { playTone(880, 0.15, 'square'); }, 200);
        setTimeout(function () { playTone(880, 0.15, 'square'); }, 400);
        break;
      case 'warning':
        playTone(660, 0.2, 'triangle');
        setTimeout(function () { playTone(660, 0.2, 'triangle'); }, 300);
        break;
      case 'caution':
        playTone(440, 0.3, 'sine');
        break;
      case 'success':
        playTone(523, 0.15, 'sine');
        setTimeout(function () { playTone(659, 0.15, 'sine'); }, 150);
        setTimeout(function () { playTone(784, 0.2, 'sine'); }, 300);
        break;
      default:
        playTone(440, 0.2, 'sine');
    }
  }

  function stop() {
    queue = [];
    speaking = false;
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }

  function isEnabled() {
    return enabled;
  }

  return {
    init: init,
    speak: speak,
    alertTone: alertTone,
    playTone: playTone,
    stop: stop,
    isEnabled: isEnabled,
  };
})();

window.AudioAlert = AudioAlert;
