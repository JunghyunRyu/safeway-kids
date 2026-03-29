/**
 * SafeWay Kids Edge AI PoC Demo — Main App Orchestrator
 *
 * - Socket.IO 연결 관리
 * - 시나리오 전환 (위저드 탭 클릭 → POST /api/mode)
 * - 이벤트 로그 추가
 * - 모달 열기/닫기
 * - 각 모듈(video-canvas, dashboard, field-ui, audio, blindspot) 초기화
 */

(function () {
  'use strict';

  // ── 상태 ─────────────────────────────────────────────────
  var state = {
    socket: null,
    connected: false,
    demoStarted: false,
    currentScenario: 1,
    boardingMode: 'board',
    scenarioPlayer: null,
    timerInterval: null,
    timerSeconds: 0,
    registeredFaces: [],
    pendingFaceName: '',       // 동의 후 등록 대기 중인 이름
    facePreviewInterval: null, // 촬영 모달 라이브 프리뷰 타이머
  };

  // ── 시나리오 정보 ────────────────────────────────────────
  var SCENARIOS = {
    1: {
      title: '승하차 안면인식',
      mode: 'boarding',
      badge: '시나리오 1',
      guide: '안면인식 기반 비접촉 승하차 인증 시나리오입니다.\n카메라가 원생의 얼굴을 인식하여 자동으로 탑승/하차를 기록합니다.\n보호자 동의 → 얼굴 등록 → 실시간 인식 순서로 시연합니다.',
      next: '"동의 & 등록" 버튼으로 보호자 동의 절차를 시연하세요.',
      model: 'YOLOv8n + ArcFace',
    },
    2: {
      title: '운행중 이상행동',
      mode: 'transit',
      badge: '시나리오 2',
      guide: 'CCTV 영상 분석 기반 이상 행동 감지 시나리오입니다.\nAI가 안전벨트 미착용, 자리 이탈, 위험 행동 등을 실시간 감지합니다.\n감지 시 인솔교사 앱과 운전기사 LED에 즉시 알림합니다.',
      next: '카메라에서 이상 행동 감지 이벤트를 관찰하세요.',
      model: 'YOLOv8n + BehaviorNet',
    },
    3: {
      title: '잔류인원 감지',
      mode: 'alighting',
      badge: '시나리오 3',
      guide: '하차 후 차량 내 잔류인원 감지 시나리오입니다.\n시동 OFF 시 자동으로 차량 내부 스캔을 실행합니다.\n인원 감지 시 시동 차단 + 보호자/관리자 긴급 알림을 발송합니다.',
      next: '"시동 OFF" 버튼을 눌러 잔류인원 스캔을 시작하세요.',
      model: 'YOLOv8n + ResidualScan',
    },
    4: {
      title: '사각지대 감지',
      mode: 'post_trip',
      badge: '시나리오 4',
      guide: 'LiDAR + 초음파 센서 융합 기반 사각지대 감지 시나리오입니다.\nBird\'s Eye View에서 차량 주변 360도를 실시간 모니터링합니다.\n3단계 경고: 주의(4m) → 경고(2.5m) → 위험(1.0m)',
      next: '시나리오를 선택하고 재생 버튼을 누르세요. 마우스 모드에서 어린이를 드래그할 수 있습니다.',
      model: 'LiDAR + Ultrasonic Fusion',
    },
  };

  // ── DOM 요소 캐시 ────────────────────────────────────────
  var dom = {};

  function cacheDom() {
    dom.landingScreen = document.getElementById('landing-screen');
    dom.demoScreen = document.getElementById('demo-screen');
    dom.demoTimer = document.getElementById('demo-timer');
    dom.wsIndicator = document.getElementById('ws-indicator');
    dom.wsLabel = document.getElementById('ws-label');
    dom.backendIndicator = document.getElementById('backend-indicator');
    dom.backendLabel = document.getElementById('backend-label');
    dom.landingCameraInd = document.getElementById('landing-camera-ind');
    dom.landingModelInd = document.getElementById('landing-model-ind');
    dom.landingBackendInd = document.getElementById('landing-backend-ind');
    dom.scenarioBadge = document.getElementById('scenario-badge');
    dom.modeLabel = document.getElementById('mode-label');
    dom.guideText = document.getElementById('guide-text');
    dom.guideNext = document.getElementById('guide-next');
    dom.statusText = document.getElementById('status-text');
    dom.eventLog = document.getElementById('event-log');
    dom.videoViewport = document.getElementById('video-viewport');
    dom.bevViewport = document.getElementById('bev-viewport');
    dom.alertBorder = document.getElementById('alert-border-overlay');
    dom.transitionOverlay = document.getElementById('transition-overlay');
    dom.transitionText = document.getElementById('transition-text');
    dom.engineControls = document.getElementById('engine-controls');
    dom.consentModal = document.getElementById('consent-modal');
    dom.consentAgree = document.getElementById('consent-agree');
    dom.consentParentName = document.getElementById('consent-parent-name');
    dom.consentChildName = document.getElementById('consent-child-name');
    dom.consentSubmitBtn = document.getElementById('btn-consent-submit');
    dom.faceNameInput = document.getElementById('face-name-input');
    dom.registeredFaces = document.getElementById('registered-faces');
    dom.regCount = document.getElementById('reg-count');
    dom.recognitionStatus = document.getElementById('recognition-status');
    dom.faceRegModal = document.getElementById('face-reg-modal');
    dom.faceCaptureCanvas = document.getElementById('face-capture-canvas');
    dom.faceRegName = document.getElementById('face-reg-name');
    dom.ctrlFace = document.getElementById('ctrl-face');
    dom.ctrlBehavior = document.getElementById('ctrl-behavior');
    dom.ctrlEngine = document.getElementById('ctrl-engine');
    dom.ctrlBev = document.getElementById('ctrl-bev');
    dom.wizardSteps = document.querySelectorAll('.wizard-step');
  }

  // ── Socket.IO 연결 ──────────────────────────────────────
  function initSocket() {
    try {
      state.socket = io({
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
      });
    } catch (e) {
      console.warn('[App] Socket.IO 연결 불가 — 오프라인 모드');
      setConnectionStatus(false);
      return;
    }

    state.socket.on('connect', function () {
      state.connected = true;
      setConnectionStatus(true);
      addEventLog('system', 'Socket.IO 연결 성공');
    });

    state.socket.on('disconnect', function () {
      state.connected = false;
      setConnectionStatus(false);
      addEventLog('system', 'Socket.IO 연결 해제');
    });

    state.socket.on('connect_error', function () {
      state.connected = false;
      setConnectionStatus(false);
    });

    // 프레임 수신 → VideoCanvas + 인식 상태 업데이트
    state.socket.on('frame', function (data) {
      if (window.VideoCanvas) VideoCanvas.handleFrame(data);
      if (data.metrics && window.Dashboard) Dashboard.update(data.metrics);
      // 실시간 인식 상태 표시
      if (data.detections && dom.recognitionStatus) {
        updateRecognitionStatus(data.detections);
      }
    });

    // 성능 지표
    state.socket.on('performance', function (data) {
      if (window.Dashboard) Dashboard.update(data);
    });

    // 얼굴 등록 성공 이벤트
    state.socket.on('face_registered', function (data) {
      if (data.success && data.face_names) {
        syncRegisteredFaces(data.face_names);
      }
    });

    // 이벤트 알림
    state.socket.on('event', function (data) {
      addEventLog(data.type || 'system', data.message || '');
      handleEventAudio(data);
    });

    // 시스템 상태
    state.socket.on('status', function (data) {
      if (dom.backendIndicator) {
        dom.backendIndicator.className = 'indicator ' + (data.backend ? 'connected' : 'disconnected');
      }
      if (dom.backendLabel) {
        dom.backendLabel.textContent = data.backend ? '백엔드 연결' : '오프라인';
      }
      // 랜딩 화면 인디케이터
      if (dom.landingBackendInd) {
        dom.landingBackendInd.className = 'indicator ' + (data.backend ? 'connected' : 'pending');
      }
    });

    // 모드 변경
    state.socket.on('mode_changed', function (data) {
      addEventLog('mode', '모드 변경: ' + (data.mode || ''));
    });

    // 경고
    state.socket.on('alert', function (data) {
      addEventLog('alert', data.message || '경고');
      handleAlertBorder(data.level);
      if (window.AudioAlert) {
        AudioAlert.alertTone(data.level);
      }
    });

    // Fallback
    state.socket.on('fallback_mode', function (data) {
      if (data.active) {
        document.body.classList.add('fallback-active');
        addEventLog('fallback', 'AI 장애 — 수동 확인 모드');
        if (window.AudioAlert) AudioAlert.speak('fallback_active');
      } else {
        document.body.classList.remove('fallback-active');
        addEventLog('system', 'AI 시스템 복구 완료');
        if (window.AudioAlert) AudioAlert.speak('fallback_recovered');
      }
    });

    // 로딩
    state.socket.on('loading', function (data) {
      if (dom.statusText) {
        dom.statusText.textContent = data.message + ' (' + Math.round((data.progress || 0) * 100) + '%)';
      }
    });
  }

  function setConnectionStatus(connected) {
    if (dom.wsIndicator) {
      dom.wsIndicator.className = 'indicator ' + (connected ? 'connected' : 'disconnected');
    }
    if (dom.wsLabel) {
      dom.wsLabel.textContent = connected ? '연결됨' : '연결 끊김';
    }
    // 랜딩 인디케이터
    if (dom.landingCameraInd) {
      dom.landingCameraInd.className = 'indicator ' + (connected ? 'connected' : 'pending');
    }
    if (dom.landingModelInd) {
      dom.landingModelInd.className = 'indicator ' + (connected ? 'connected' : 'pending');
    }
  }

  // ── 데모 시작/리셋 ──────────────────────────────────────
  function startDemo() {
    state.demoStarted = true;

    // AudioContext 초기화 (사용자 제스처 내에서)
    if (window.AudioAlert) {
      AudioAlert.init();
      AudioAlert.speak('demo_start');
    }

    // 화면 전환
    if (dom.landingScreen) dom.landingScreen.classList.add('hidden');
    if (dom.demoScreen) dom.demoScreen.classList.remove('hidden');

    // 모듈 초기화
    if (window.VideoCanvas) VideoCanvas.init('video-canvas');
    if (window.Dashboard) {
      Dashboard.init();
      Dashboard.startSimulation('boarding');
    }
    if (window.FieldUI) FieldUI.init();

    // 타이머 시작
    startTimer();

    // 시나리오 1로 시작
    switchScenario(1);

    addEventLog('system', '데모 시작');
    if (dom.statusText) dom.statusText.textContent = '데모 진행중';
  }

  function resetDemo() {
    state.demoStarted = false;
    state.currentScenario = 1;
    state.registeredFaces = [];

    // 타이머 정지
    stopTimer();

    // 모듈 정리
    if (window.Dashboard) {
      Dashboard.stopSimulation();
      Dashboard.reset();
    }
    if (window.VideoCanvas) VideoCanvas.clear();
    if (window.AudioAlert) AudioAlert.stop();
    if (state.scenarioPlayer) {
      state.scenarioPlayer.stop();
      state.scenarioPlayer = null;
    }

    // 이벤트 로그 클리어
    if (dom.eventLog) dom.eventLog.innerHTML = '';

    // 등록 얼굴 클리어
    if (dom.registeredFaces) dom.registeredFaces.innerHTML = '';

    // 화면 전환
    if (dom.demoScreen) dom.demoScreen.classList.add('hidden');
    if (dom.landingScreen) dom.landingScreen.classList.remove('hidden');

    document.body.classList.remove('fallback-active');
  }

  // ── 타이머 ──────────────────────────────────────────────
  function startTimer() {
    state.timerSeconds = 0;
    updateTimerDisplay();
    state.timerInterval = setInterval(function () {
      state.timerSeconds++;
      updateTimerDisplay();
    }, 1000);
  }

  function stopTimer() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  function updateTimerDisplay() {
    if (!dom.demoTimer) return;
    var h = Math.floor(state.timerSeconds / 3600);
    var m = Math.floor((state.timerSeconds % 3600) / 60);
    var s = state.timerSeconds % 60;
    dom.demoTimer.textContent =
      String(h).padStart(2, '0') + ':' +
      String(m).padStart(2, '0') + ':' +
      String(s).padStart(2, '0');
  }

  // ── 시나리오 전환 ───────────────────────────────────────
  function switchScenario(num) {
    var scenario = SCENARIOS[num];
    if (!scenario) return;

    var prev = state.currentScenario;
    state.currentScenario = num;

    // 전환 오버레이
    showTransition(scenario.title, function () {
      applyScenario(num, scenario);
    });

    // 위저드 탭 업데이트
    dom.wizardSteps.forEach(function (step) {
      var sn = parseInt(step.getAttribute('data-scenario'));
      step.classList.toggle('active', sn === num);
      if (sn < num) step.classList.add('completed');
    });

    // 서버에 모드 변경 요청
    if (state.connected) {
      fetch('/api/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: scenario.mode }),
      }).catch(function () { /* 오프라인 무시 */ });
    }

    addEventLog('mode', '시나리오 ' + num + ': ' + scenario.title);
    if (window.AudioAlert) AudioAlert.speak('scenario_change');
  }

  function showTransition(text, callback) {
    if (!dom.transitionOverlay || !dom.transitionText) {
      if (callback) callback();
      return;
    }

    dom.transitionText.textContent = text;
    dom.transitionOverlay.classList.remove('hidden');

    setTimeout(function () {
      dom.transitionOverlay.classList.add('hidden');
      if (callback) callback();
    }, 1200);
  }

  function applyScenario(num, scenario) {
    // 뱃지 & 모드
    if (dom.scenarioBadge) dom.scenarioBadge.textContent = scenario.badge;
    if (dom.modeLabel) dom.modeLabel.textContent = scenario.title;

    // 프레젠터 가이드
    if (dom.guideText) dom.guideText.textContent = scenario.guide;
    if (dom.guideNext) dom.guideNext.textContent = '다음 동작: ' + scenario.next;

    // 뷰포트 전환
    var isBlindspot = (num === 4);
    if (dom.videoViewport) dom.videoViewport.classList.toggle('hidden', isBlindspot);
    if (dom.bevViewport) dom.bevViewport.classList.toggle('hidden', !isBlindspot);

    // 엔진 컨트롤
    if (dom.engineControls) dom.engineControls.classList.toggle('hidden', num !== 3);

    // 경고 테두리 리셋
    if (dom.alertBorder) dom.alertBorder.className = 'alert-border';

    // 컨트롤 패널 전환
    if (dom.ctrlFace) dom.ctrlFace.classList.toggle('hidden', num !== 1);
    if (dom.ctrlBehavior) dom.ctrlBehavior.classList.toggle('hidden', num !== 2);
    if (dom.ctrlEngine) dom.ctrlEngine.classList.toggle('hidden', num !== 3);
    if (dom.ctrlBev) dom.ctrlBev.classList.toggle('hidden', num !== 4);

    // 대시보드 시뮬레이션 갱신
    if (window.Dashboard) {
      Dashboard.stopSimulation();
      Dashboard.startSimulation(scenario.mode);
    }

    // 시나리오 4: BEV 초기화
    if (num === 4) {
      initBEVScenario();
    } else {
      if (state.scenarioPlayer) {
        state.scenarioPlayer.stop();
      }
    }

    // 비디오 캔버스 초기화
    if (num !== 4 && window.VideoCanvas) {
      VideoCanvas.drawPlaceholder();
    }
  }

  // ── BEV 시나리오 (시나리오 4) ───────────────────────────
  function initBEVScenario() {
    var bevCanvas = document.getElementById('bev-canvas');
    if (!bevCanvas) return;

    // ES Module 동적 임포트
    import('/static/js/blindspot/scenario-player.js').then(function (module) {
      state.scenarioPlayer = new module.ScenarioPlayer(bevCanvas, {
        canvas: { width: 600, height: 600 },
        looping: true,
      });
      state.scenarioPlayer.init().then(function () {
        addEventLog('system', 'BEV 시나리오 플레이어 초기화 완료');
      }).catch(function (err) {
        addEventLog('system', 'BEV 시나리오 로드 실패: ' + err.message);
        // 오프라인 — 정적 렌더링
        drawBEVPlaceholder(bevCanvas);
      });
    }).catch(function () {
      addEventLog('system', 'BEV 모듈 로드 실패 — 정적 모드');
      drawBEVPlaceholder(bevCanvas);
    });
  }

  function drawBEVPlaceholder(canvas) {
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 경고 존 동심원
    var cx = canvas.width / 2;
    var cy = canvas.height / 2;
    var scale = 20; // px/m

    [{ r: 4, c: 'rgba(234,179,8,0.1)', s: 'rgba(234,179,8,0.3)' },
     { r: 2.5, c: 'rgba(249,115,22,0.1)', s: 'rgba(249,115,22,0.3)' },
     { r: 1, c: 'rgba(239,68,68,0.15)', s: 'rgba(239,68,68,0.4)' }].forEach(function (z) {
      ctx.beginPath();
      ctx.arc(cx, cy, z.r * scale, 0, Math.PI * 2);
      ctx.fillStyle = z.c;
      ctx.fill();
      ctx.strokeStyle = z.s;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 차량
    var vw = 2.0 * scale;
    var vl = 7.0 * scale;
    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    ctx.fillRect(cx - vw / 2, cy - vl / 2, vw, vl);
    ctx.strokeRect(cx - vw / 2, cy - vl / 2, vw, vl);

    ctx.fillStyle = '#4a9eff';
    ctx.font = '12px "Cascadia Code", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BEV - Bird\'s Eye View', cx, cy);
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillText('시나리오 선택 후 재생 버튼을 누르세요', cx, cy + 16);
    ctx.textAlign = 'start';
  }

  function selectBEVScenario(index) {
    if (state.scenarioPlayer && state.scenarioPlayer.loadScenario) {
      state.scenarioPlayer.loadScenario(parseInt(index));
      addEventLog('system', 'BEV 시나리오 ' + index + ' 로드');
    }
  }

  function bevPlay() {
    if (state.scenarioPlayer && state.scenarioPlayer.play) {
      state.scenarioPlayer.play();
      addEventLog('system', 'BEV 재생');
    }
  }

  function bevPause() {
    if (state.scenarioPlayer && state.scenarioPlayer.pause) {
      state.scenarioPlayer.pause();
      addEventLog('system', 'BEV 일시정지');
    }
  }

  function bevToggleInteractive() {
    if (state.scenarioPlayer && state.scenarioPlayer.toggleInteractive) {
      var active = state.scenarioPlayer.toggleInteractive();
      addEventLog('system', '마우스 모드: ' + (active ? 'ON' : 'OFF'));
    }
  }

  // ── 보호자 동의 모달 ────────────────────────────────────
  function showConsent() {
    if (dom.consentModal) dom.consentModal.classList.remove('hidden');
  }

  function closeConsent() {
    if (dom.consentModal) dom.consentModal.classList.add('hidden');
    // 리셋
    if (dom.consentAgree) dom.consentAgree.checked = false;
    if (dom.consentParentName) dom.consentParentName.value = '';
    if (dom.consentChildName) dom.consentChildName.value = '';
    if (dom.consentSubmitBtn) dom.consentSubmitBtn.disabled = true;
  }

  function submitConsent() {
    var parentName = dom.consentParentName ? dom.consentParentName.value.trim() : '';
    var childName = dom.consentChildName ? dom.consentChildName.value.trim() : '';

    if (!parentName || !childName) return;

    addEventLog('face', '보호자 동의 완료: ' + parentName + ' → ' + childName);
    if (window.AudioAlert) AudioAlert.alertTone('success');

    // 동의 모달 닫기
    closeConsent();

    // 얼굴 이름 자동 입력
    if (dom.faceNameInput) dom.faceNameInput.value = childName;

    // 촬영 모달 열기
    showFaceRegModal(childName);
  }

  function registerFace(name) {
    if (!name) {
      name = dom.faceNameInput ? dom.faceNameInput.value.trim() : '';
    }
    if (!name) return;

    if (window.VideoCanvas) {
      VideoCanvas.registerFace(name).then(function (result) {
        addEventLog('face', '얼굴 등록 성공: ' + name);
        addRegisteredFace(name);
        if (window.AudioAlert) AudioAlert.speak('face_recognized');
      }).catch(function (err) {
        // 오프라인이면 시뮬레이션 등록
        addEventLog('face', '얼굴 등록 (시뮬레이션): ' + name);
        addRegisteredFace(name);
        if (window.AudioAlert) AudioAlert.alertTone('success');
      });
    } else {
      addRegisteredFace(name);
    }

    if (dom.faceNameInput) dom.faceNameInput.value = '';
  }

  // ── 얼굴 촬영 모달 ─────────────────────────────────────
  function showFaceRegModal(name) {
    state.pendingFaceName = name;

    // 모달 열기
    if (dom.faceRegModal) dom.faceRegModal.classList.remove('hidden');

    // 이름 표시
    if (dom.faceRegName) dom.faceRegName.textContent = name;

    // 라이브 프리뷰 시작: 비디오 캔버스 → 촬영 캔버스 미러링
    startFacePreview();

    addEventLog('face', name + ' 얼굴 촬영 대기중');
  }

  function closeFaceRegModal() {
    if (dom.faceRegModal) dom.faceRegModal.classList.add('hidden');
    stopFacePreview();
    state.pendingFaceName = '';
  }

  function startFacePreview() {
    stopFacePreview();

    var videoCanvas = document.getElementById('video-canvas');
    var captureCanvas = dom.faceCaptureCanvas;
    if (!videoCanvas || !captureCanvas) return;

    var captureCtx = captureCanvas.getContext('2d');

    state.facePreviewInterval = setInterval(function () {
      // 비디오 캔버스 중앙 영역을 크롭하여 촬영 캔버스에 표시 (얼굴 중심)
      var srcW = videoCanvas.width;
      var srcH = videoCanvas.height;

      // 중앙 영역 크롭 (가로 60%, 세로 80% — 얼굴 영역 포커스)
      var cropW = srcW * 0.6;
      var cropH = srcH * 0.8;
      var cropX = (srcW - cropW) / 2;
      var cropY = (srcH - cropH) / 2 - srcH * 0.05; // 약간 위로 (얼굴 위치)
      if (cropY < 0) cropY = 0;

      captureCtx.clearRect(0, 0, captureCanvas.width, captureCanvas.height);
      captureCtx.drawImage(videoCanvas,
        cropX, cropY, cropW, cropH,
        0, 0, captureCanvas.width, captureCanvas.height
      );

      // 얼굴 가이드 오버레이
      drawFaceGuide(captureCtx, captureCanvas.width, captureCanvas.height);
    }, 1000 / 15); // 15fps 프리뷰
  }

  function stopFacePreview() {
    if (state.facePreviewInterval) {
      clearInterval(state.facePreviewInterval);
      state.facePreviewInterval = null;
    }
  }

  function drawFaceGuide(ctx, w, h) {
    // 타원형 얼굴 가이드
    var cx = w / 2;
    var cy = h * 0.45;
    var rx = w * 0.22;
    var ry = h * 0.32;

    ctx.strokeStyle = 'rgba(74, 158, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 안내 텍스트
    ctx.font = '12px "Segoe UI", "Malgun Gothic", sans-serif';
    ctx.fillStyle = 'rgba(74, 158, 255, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText('얼굴을 가이드 안에 맞춰주세요', cx, h - 12);
    ctx.textAlign = 'start';
  }

  function captureFace() {
    var name = state.pendingFaceName;
    if (!name) return;

    // 촬영 완료 → 등록 시도
    closeFaceRegModal();
    addEventLog('face', name + ' 얼굴 촬영 완료');

    registerFace(name);
  }

  function addRegisteredFace(name) {
    if (state.registeredFaces.indexOf(name) !== -1) return; // 중복 방지
    state.registeredFaces.push(name);
    renderRegisteredFaces();
  }

  function removeRegisteredFace(name) {
    var idx = state.registeredFaces.indexOf(name);
    if (idx === -1) return;

    // 서버에 삭제 요청
    fetch('/api/face/' + encodeURIComponent(name), { method: 'DELETE' })
      .catch(function () {});

    state.registeredFaces.splice(idx, 1);
    renderRegisteredFaces();
    addEventLog('face', name + ' 등록 삭제');
  }

  function clearAllFaces() {
    // 서버에 각 얼굴 삭제 요청
    state.registeredFaces.forEach(function (name) {
      fetch('/api/face/' + encodeURIComponent(name), { method: 'DELETE' })
        .catch(function () {});
    });
    state.registeredFaces = [];
    renderRegisteredFaces();
    addEventLog('system', '등록 원생 전체 삭제');
  }

  function syncRegisteredFaces(names) {
    state.registeredFaces = names.slice();
    renderRegisteredFaces();
  }

  function renderRegisteredFaces() {
    if (!dom.registeredFaces) return;
    dom.registeredFaces.innerHTML = '';

    if (dom.regCount) dom.regCount.textContent = state.registeredFaces.length;

    if (state.registeredFaces.length === 0) {
      var empty = document.createElement('li');
      empty.style.color = 'var(--text-dim)';
      empty.style.fontSize = '0.75rem';
      empty.textContent = '등록된 원생이 없습니다';
      dom.registeredFaces.appendChild(empty);
      return;
    }

    state.registeredFaces.forEach(function (name) {
      var li = document.createElement('li');
      li.innerHTML =
        '<span class="reg-face-indicator"></span>' +
        '<span class="reg-face-name">' + name + '</span>' +
        '<button class="btn-face-delete" onclick="window.demoApp && window.demoApp.removeFace(\'' +
        name.replace(/'/g, "\\'") + '\')">&times;</button>';
      dom.registeredFaces.appendChild(li);
    });
  }

  function updateRecognitionStatus(detections) {
    if (!dom.recognitionStatus) return;
    if (!detections || detections.length === 0) {
      dom.recognitionStatus.innerHTML = '<span class="rec-empty">얼굴 미감지</span>';
      return;
    }

    var html = '';
    detections.forEach(function (det) {
      if (!det.label) return;
      var isRecognized = det.label !== '미등록';
      var cls = isRecognized ? 'rec-recognized' : 'rec-unknown';
      var conf = det.confidence ? ' (' + (det.confidence * 100).toFixed(0) + '%)' : '';
      html += '<div class="' + cls + '">' + det.label + conf + '</div>';
    });
    dom.recognitionStatus.innerHTML = html || '<span class="rec-empty">감지중...</span>';
  }

  // ── 승차/하차 모드 ──────────────────────────────────────
  function setBoardingMode(mode) {
    state.boardingMode = mode;
    var btnBoard = document.getElementById('btn-board');
    var btnAlight = document.getElementById('btn-alight');
    if (btnBoard) btnBoard.classList.toggle('active', mode === 'board');
    if (btnAlight) btnAlight.classList.toggle('active', mode === 'alight');
    addEventLog('mode', mode === 'board' ? '승차 모드 전환' : '하차 모드 전환');
  }

  // ── 시동 제어 (시나리오 3) ──────────────────────────────
  function engineOff() {
    addEventLog('alert', '시동 OFF — 잔류인원 스캔 시작');
    handleAlertBorder('warning');
    if (window.AudioAlert) {
      AudioAlert.speak('alighting_complete');
      setTimeout(function () {
        AudioAlert.speak('residual_detected');
        AudioAlert.alertTone('danger');
        handleAlertBorder('danger');
        addEventLog('alert', '잔류인원 감지! 시동 차단');
      }, 3000);
    }
    if (dom.modeLabel) dom.modeLabel.textContent = '잔류인원 스캔중...';
  }

  function engineOn() {
    addEventLog('system', '시동 ON 시도');
    // 잔류인원이 있으면 차단
    addEventLog('alert', '잔류인원 감지 상태 — 시동 차단');
    if (window.AudioAlert) AudioAlert.speak('engine_blocked');
  }

  // ── 현장 UI ─────────────────────────────────────────────
  function toggleFieldUI() {
    if (window.FieldUI) FieldUI.toggle();
  }

  function closeFieldUI() {
    if (window.FieldUI) FieldUI.close();
  }

  function switchFieldTab(tab) {
    if (window.FieldUI) FieldUI.switchTab(tab);
  }

  // ── 이벤트 로그 ─────────────────────────────────────────
  function addEventLog(type, message) {
    if (!dom.eventLog) return;

    var li = document.createElement('li');
    var time = new Date().toLocaleTimeString('ko-KR', { hour12: false });

    var typeClass = 'event-system';
    var prefix = '';
    switch (type) {
      case 'alert':    typeClass = 'event-alert'; prefix = 'ALERT'; break;
      case 'face':     typeClass = 'event-face'; prefix = 'FACE'; break;
      case 'mode':     typeClass = 'event-mode'; prefix = 'MODE'; break;
      case 'blindspot': typeClass = 'event-blindspot'; prefix = 'BLIND'; break;
      case 'fallback': typeClass = 'event-fallback'; prefix = 'FAIL'; break;
      default:         typeClass = 'event-system'; prefix = 'SYS'; break;
    }

    li.className = typeClass;
    li.innerHTML = '<span style="color:var(--text-dim);">' + time + '</span> ' +
      '<span style="font-weight:600;">[' + prefix + ']</span> ' + message;

    dom.eventLog.insertBefore(li, dom.eventLog.firstChild);

    // 최대 100건
    while (dom.eventLog.children.length > 100) {
      dom.eventLog.removeChild(dom.eventLog.lastChild);
    }
  }

  // ── 경고 테두리 ─────────────────────────────────────────
  function handleAlertBorder(level) {
    if (!dom.alertBorder) return;
    dom.alertBorder.className = 'alert-border';
    if (level === 'danger') {
      dom.alertBorder.classList.add('danger');
    } else if (level === 'warning') {
      dom.alertBorder.classList.add('warning');
    }
  }

  // ── 오디오 이벤트 처리 ──────────────────────────────────
  function handleEventAudio(data) {
    if (!window.AudioAlert) return;
    var type = data.type || '';

    if (type === 'face_recognized') AudioAlert.speak('face_recognized');
    else if (type === 'face_unknown') AudioAlert.speak('face_unknown');
    else if (type === 'behavior_warning') { AudioAlert.speak('behavior_warning'); AudioAlert.alertTone('warning'); }
    else if (type === 'behavior_danger') { AudioAlert.speak('behavior_danger'); AudioAlert.alertTone('danger'); }
    else if (type === 'residual_detected') { AudioAlert.speak('residual_detected'); AudioAlert.alertTone('danger'); }
    else if (type.startsWith('blindspot')) { AudioAlert.speak(type); AudioAlert.alertTone(data.level || 'warning'); }
  }

  // ── 동의 체크박스 이벤트 ────────────────────────────────
  function initConsentCheckbox() {
    if (dom.consentAgree) {
      dom.consentAgree.addEventListener('change', function () {
        var parentFilled = dom.consentParentName && dom.consentParentName.value.trim();
        var childFilled = dom.consentChildName && dom.consentChildName.value.trim();
        if (dom.consentSubmitBtn) {
          dom.consentSubmitBtn.disabled = !(dom.consentAgree.checked && parentFilled && childFilled);
        }
      });
    }

    // 이름 입력 시에도 버튼 활성화 체크
    [dom.consentParentName, dom.consentChildName].forEach(function (input) {
      if (input) {
        input.addEventListener('input', function () {
          var parentFilled = dom.consentParentName && dom.consentParentName.value.trim();
          var childFilled = dom.consentChildName && dom.consentChildName.value.trim();
          if (dom.consentSubmitBtn) {
            dom.consentSubmitBtn.disabled = !(dom.consentAgree && dom.consentAgree.checked && parentFilled && childFilled);
          }
        });
      }
    });
  }

  // ── 초기화 ──────────────────────────────────────────────
  function boot() {
    cacheDom();
    initSocket();
    initConsentCheckbox();

    // 전역 API 노출
    window.demoApp = {
      startDemo: startDemo,
      resetDemo: resetDemo,
      switchScenario: switchScenario,
      showConsent: showConsent,
      closeConsent: closeConsent,
      submitConsent: submitConsent,
      captureFace: captureFace,
      closeFaceRegModal: closeFaceRegModal,
      removeFace: removeRegisteredFace,
      clearAllFaces: clearAllFaces,
      setBoardingMode: setBoardingMode,
      engineOff: engineOff,
      engineOn: engineOn,
      toggleFieldUI: toggleFieldUI,
      closeFieldUI: closeFieldUI,
      switchFieldTab: switchFieldTab,
      selectBEVScenario: selectBEVScenario,
      bevPlay: bevPlay,
      bevPause: bevPause,
      bevToggleInteractive: bevToggleInteractive,
    };

    console.log('[SafeWay] Edge AI PoC Demo 앱 초기화 완료');
  }

  // DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
