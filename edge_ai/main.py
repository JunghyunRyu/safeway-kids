"""SafeWay Kids Edge AI PoC 데모.

Flask + MJPEG 스트리밍 기반 웹 UI로 3가지 AI 안전 시나리오를 시연한다:
1. 승하차 안면 인식
2. 운행 중 이상 행동 감지
3. 하차 후 잔류 인원 감지

실행: python main.py
"""

import logging
import threading
import time
from datetime import datetime

import cv2
import numpy as np
from flask import Flask, Response, jsonify, render_template_string, request

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# ── 전역 상태 ─────────────────────────────────────────────
_current_mode = "boarding"  # boarding | transit | post_transit
_engine_off = False
_event_log: list[dict] = []
_face_manager = None
_behavior_detector = None
_passenger_detector = None
_latest_frame: np.ndarray | None = None
_processed_frame: np.ndarray | None = None
_camera_lock = threading.Lock()
_camera_running = False

# 색상
COLOR_GREEN = (0, 200, 0)
COLOR_RED = (0, 0, 255)
COLOR_YELLOW = (0, 220, 255)
COLOR_BLUE = (255, 150, 0)
COLOR_WHITE = (255, 255, 255)
COLOR_BG = (30, 30, 30)


def _log_event(event_type: str, msg: str) -> None:
    entry = {
        "time": datetime.now().strftime("%H:%M:%S"),
        "type": event_type,
        "message": msg,
    }
    _event_log.insert(0, entry)
    if len(_event_log) > 100:
        _event_log.pop()


# ── 지연 초기화 ───────────────────────────────────────────
def _ensure_face_manager():
    global _face_manager
    if _face_manager is None:
        from face_manager import FaceManager
        _face_manager = FaceManager()
    return _face_manager


def _ensure_behavior_detector():
    global _behavior_detector
    if _behavior_detector is None:
        from behavior_detector import BehaviorDetector
        _behavior_detector = BehaviorDetector()
    return _behavior_detector


def _ensure_passenger_detector():
    global _passenger_detector
    if _passenger_detector is None:
        from passenger_detector import PassengerDetector
        if _behavior_detector is not None:
            _passenger_detector = PassengerDetector(
                yolo_model=_behavior_detector._yolo
            )
        else:
            _passenger_detector = PassengerDetector()
    return _passenger_detector


# ── 드로잉 헬퍼 ───────────────────────────────────────────
def _draw_label(frame, text, x, y, color, font_scale=0.7):
    font = cv2.FONT_HERSHEY_SIMPLEX
    thickness = 2
    (tw, th), _ = cv2.getTextSize(text, font, font_scale, thickness)
    cv2.rectangle(frame, (x, y - th - 10), (x + tw + 10, y), COLOR_BG, -1)
    cv2.putText(frame, text, (x + 5, y - 5), font, font_scale, color, thickness)


def _draw_status_bar(frame, mode_name: str, status: str, color):
    h, w = frame.shape[:2]
    cv2.rectangle(frame, (0, 0), (w, 45), COLOR_BG, -1)
    cv2.putText(
        frame, f"[{mode_name}]  {status}",
        (10, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2,
    )


# ── 이벤트 전송 (쿨다운 포함) ─────────────────────────────
_event_cooldowns: dict[str, float] = {}


def _send_event_async(event_type: str, details: dict, cooldown: float = 3.0) -> None:
    now = time.time()
    key = f"{event_type}:{details.get('student_name', details.get('behavior_type', 'check'))}"
    if key in _event_cooldowns and now - _event_cooldowns[key] < cooldown:
        return
    _event_cooldowns[key] = now

    def _send():
        try:
            from event_sender import send_event, EventType
            type_map = {
                "face": EventType.FACE_RECOGNIZED,
                "behavior": EventType.ABNORMAL_BEHAVIOR,
                "passenger": EventType.REMAINING_PASSENGER,
            }
            send_event(type_map[event_type], details)
        except Exception as e:
            logger.warning("이벤트 전송 실패: %s", e)

    threading.Thread(target=_send, daemon=True).start()


# ══════════════════════════════════════════════════════════
# 프레임 처리 함수들
# ══════════════════════════════════════════════════════════

def process_boarding(frame: np.ndarray) -> np.ndarray:
    fm = _ensure_face_manager()
    output = frame.copy()
    matches = fm.recognize(frame)
    _draw_status_bar(output, "BOARDING", f"{len(matches)} face(s)", COLOR_GREEN)

    for match in matches:
        top, right, bottom, left = match.location
        if match.name != "미등록":
            cv2.rectangle(output, (left, top), (right, bottom), COLOR_GREEN, 3)
            label = f"{match.name} ({match.confidence:.0%})"
            _draw_label(output, label, left, top, COLOR_GREEN)

            h, w = output.shape[:2]
            msg = f"{match.name} confirmed"
            (tw, th), _ = cv2.getTextSize(msg, cv2.FONT_HERSHEY_SIMPLEX, 1.2, 3)
            cx = (w - tw) // 2
            cv2.rectangle(output, (cx - 15, h - 80), (cx + tw + 15, h - 20), (0, 100, 0), -1)
            cv2.putText(output, msg, (cx, h - 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, COLOR_WHITE, 3)

            _log_event("boarding", f"{match.name} confirmed ({match.confidence:.0%})")
            _send_event_async("face", {"student_name": match.name, "confidence": match.confidence})
        else:
            cv2.rectangle(output, (left, top), (right, bottom), COLOR_YELLOW, 2)
            _draw_label(output, "Unknown", left, top, COLOR_YELLOW)

    return output


def process_transit(frame: np.ndarray) -> np.ndarray:
    bd = _ensure_behavior_detector()
    output = frame.copy()
    detections = bd.detect(frame)

    alert_count = 0
    for det in detections:
        x1, y1, x2, y2 = det.bbox
        if det.behavior.value in ("standing", "falling"):
            cv2.rectangle(output, (x1, y1), (x2, y2), COLOR_RED, 3)
            label = f"!! {det.behavior.value.upper()} ({det.confidence:.0%})"
            _draw_label(output, label, x1, y1, COLOR_RED)
            overlay = output.copy()
            cv2.rectangle(overlay, (x1, y1), (x2, y2), COLOR_RED, -1)
            cv2.addWeighted(overlay, 0.15, output, 0.85, 0, output)
            alert_count += 1
        elif det.behavior.value == "normal":
            cv2.rectangle(output, (x1, y1), (x2, y2), COLOR_GREEN, 2)
            _draw_label(output, f"Normal ({det.confidence:.0%})", x1, y1, COLOR_GREEN)
        else:
            cv2.rectangle(output, (x1, y1), (x2, y2), COLOR_BLUE, 2)

    if alert_count > 0:
        _draw_status_bar(output, "TRANSIT", f"!! {alert_count} ALERT(S) !!", COLOR_RED)
        h, w = output.shape[:2]
        cv2.rectangle(output, (0, h - 50), (w, h), (0, 0, 180), -1)
        cv2.putText(output, "!! ABNORMAL BEHAVIOR DETECTED !!", (w // 2 - 250, h - 15),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, COLOR_WHITE, 2)
        _log_event("behavior", f"Abnormal behavior x{alert_count}")
        _send_event_async("behavior", {"behavior_type": detections[0].behavior.value, "confidence": detections[0].confidence}, cooldown=5)
    else:
        _draw_status_bar(output, "TRANSIT", f"Monitoring... ({len(detections)} person(s))", COLOR_GREEN)

    return output


def process_post_transit(frame: np.ndarray) -> np.ndarray:
    global _engine_off
    pd = _ensure_passenger_detector()
    output = frame.copy()

    if not _engine_off:
        _draw_status_bar(output, "POST-TRANSIT", "Standby - Press ENGINE OFF", COLOR_BLUE)
        h, w = output.shape[:2]
        overlay = output.copy()
        cv2.rectangle(overlay, (w // 4, h // 3), (3 * w // 4, 2 * h // 3), COLOR_BG, -1)
        cv2.addWeighted(overlay, 0.7, output, 0.3, 0, output)
        cv2.putText(output, "STANDBY", (w // 4 + 60, h // 2 + 10), cv2.FONT_HERSHEY_SIMPLEX, 1.5, COLOR_YELLOW, 3)
        return output

    detection = pd.detect(frame)

    if detection.count > 0:
        _draw_status_bar(output, "POST-TRANSIT", f"!! {detection.count} PASSENGER(S) REMAINING !!", COLOR_RED)
        for bbox, conf in zip(detection.bboxes, detection.confidences):
            x1, y1, x2, y2 = bbox
            cv2.rectangle(output, (x1, y1), (x2, y2), COLOR_RED, 3)
            _draw_label(output, f"PASSENGER ({conf:.0%})", x1, y1, COLOR_RED)
            overlay = output.copy()
            cv2.rectangle(overlay, (x1, y1), (x2, y2), COLOR_RED, -1)
            cv2.addWeighted(overlay, 0.2, output, 0.8, 0, output)

        h, w = output.shape[:2]
        cv2.rectangle(output, (0, h - 60), (w, h), (0, 0, 200), -1)
        cv2.putText(output, f"!! {detection.count} REMAINING - PUSH SENT !!", (w // 2 - 240, h - 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, COLOR_WHITE, 3)

        _log_event("passenger", f"{detection.count} remaining passenger(s) - push sent")
        _send_event_async("passenger", {"passenger_count": detection.count, "confidences": detection.confidences}, cooldown=10)
    else:
        _draw_status_bar(output, "POST-TRANSIT", "ALL CLEAR", COLOR_GREEN)
        h, w = output.shape[:2]
        cv2.rectangle(output, (w // 4, h // 3), (3 * w // 4, 2 * h // 3), (0, 80, 0), -1)
        cv2.putText(output, "ALL CLEAR", (w // 4 + 50, h // 2 + 10), cv2.FONT_HERSHEY_SIMPLEX, 1.8, COLOR_GREEN, 3)

    return output


# ── 카메라 루프 ───────────────────────────────────────────
def camera_loop():
    global _latest_frame, _processed_frame, _camera_running
    from config import CAMERA_INDEX, FRAME_WIDTH, FRAME_HEIGHT

    cap = cv2.VideoCapture(CAMERA_INDEX)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)

    if not cap.isOpened():
        logger.error("웹캠을 열 수 없습니다 (index=%d)", CAMERA_INDEX)
        _camera_running = False
        return

    _camera_running = True
    logger.info("카메라 시작 (index=%d)", CAMERA_INDEX)

    processors = {
        "boarding": process_boarding,
        "transit": process_transit,
        "post_transit": process_post_transit,
    }

    while _camera_running:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.1)
            continue

        with _camera_lock:
            _latest_frame = frame.copy()

        try:
            processor = processors.get(_current_mode, process_boarding)
            processed = processor(frame)
            with _camera_lock:
                _processed_frame = processed
        except Exception:
            logger.exception("프레임 처리 오류")
            with _camera_lock:
                _processed_frame = frame

    cap.release()
    logger.info("카메라 종료")


def generate_mjpeg():
    """MJPEG 스트리밍 제너레이터."""
    while True:
        with _camera_lock:
            frame = _processed_frame

        if frame is None:
            # 대기 화면
            blank = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(blank, "Initializing camera...", (150, 240),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, COLOR_WHITE, 2)
            frame = blank

        _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n"
        )
        time.sleep(0.05)  # ~20 FPS max


# ══════════════════════════════════════════════════════════
# Flask 라우트
# ══════════════════════════════════════════════════════════

@app.route("/")
def index():
    return render_template_string(HTML_TEMPLATE)


@app.route("/video_feed")
def video_feed():
    return Response(generate_mjpeg(), mimetype="multipart/x-mixed-replace; boundary=frame")


@app.route("/api/mode", methods=["POST"])
def set_mode():
    global _current_mode, _engine_off
    data = request.json or {}
    mode = data.get("mode", "boarding")
    if mode in ("boarding", "transit", "post_transit"):
        _current_mode = mode
        _engine_off = False
        _log_event("system", f"Mode changed: {mode}")
        return jsonify({"mode": mode})
    return jsonify({"error": "invalid mode"}), 400


@app.route("/api/engine_off", methods=["POST"])
def engine_off():
    global _engine_off
    _engine_off = True
    _log_event("system", "ENGINE OFF - scanning for remaining passengers")
    return jsonify({"engine_off": True})


@app.route("/api/engine_on", methods=["POST"])
def engine_on():
    global _engine_off
    _engine_off = False
    _log_event("system", "ENGINE ON - scan stopped")
    return jsonify({"engine_off": False})


@app.route("/api/register_face", methods=["POST"])
def register_face():
    data = request.json or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "name required"}), 400

    with _camera_lock:
        frame = _latest_frame

    if frame is None:
        return jsonify({"error": "no camera frame"}), 400

    fm = _ensure_face_manager()
    success = fm.register_face(frame, name)

    if success:
        _log_event("register", f"Face registered: {name}")
        return jsonify({"success": True, "name": name, "registered": fm.get_registered_names()})
    else:
        return jsonify({"error": "no face detected"}), 400


@app.route("/api/events")
def get_events():
    return jsonify(_event_log[:30])


@app.route("/api/status")
def get_status():
    fm = _ensure_face_manager() if _face_manager else None
    return jsonify({
        "mode": _current_mode,
        "engine_off": _engine_off,
        "camera_running": _camera_running,
        "registered_faces": fm.get_registered_names() if fm else [],
    })


# ══════════════════════════════════════════════════════════
# HTML 템플릿
# ══════════════════════════════════════════════════════════

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SafeWay Kids - Edge AI Demo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: #0a0a1a;
            color: #e0e0e0;
            min-height: 100vh;
        }
        .header {
            background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%);
            padding: 16px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .header h1 {
            font-size: 1.4rem;
            font-weight: 600;
            color: white;
        }
        .header .subtitle {
            font-size: 0.8rem;
            color: rgba(255,255,255,0.7);
        }
        .header .badge {
            background: #ff6b35;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .main {
            display: grid;
            grid-template-columns: 1fr 340px;
            gap: 16px;
            padding: 16px;
            max-width: 1400px;
            margin: 0 auto;
        }
        .video-section {
            background: #111;
            border-radius: 12px;
            overflow: hidden;
            border: 2px solid #222;
        }
        .video-section img {
            width: 100%;
            display: block;
        }
        .mode-tabs {
            display: flex;
            gap: 0;
            background: #1a1a2e;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 12px;
        }
        .mode-tab {
            flex: 1;
            padding: 12px 8px;
            text-align: center;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 600;
            border: none;
            background: transparent;
            color: #888;
            transition: all 0.2s;
        }
        .mode-tab:hover { background: #252540; color: #bbb; }
        .mode-tab.active {
            background: #1565c0;
            color: white;
        }
        .mode-tab.active.alert {
            background: #c62828;
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        .sidebar {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .panel {
            background: #1a1a2e;
            border-radius: 12px;
            padding: 16px;
            border: 1px solid #2a2a4a;
        }
        .panel h3 {
            font-size: 0.85rem;
            color: #7986cb;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .register-form {
            display: flex;
            gap: 8px;
        }
        .register-form input {
            flex: 1;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #333;
            background: #0a0a1a;
            color: white;
            font-size: 0.9rem;
        }
        .btn {
            padding: 8px 16px;
            border-radius: 6px;
            border: none;
            font-weight: 600;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-primary { background: #1565c0; color: white; }
        .btn-primary:hover { background: #1976d2; }
        .btn-danger { background: #c62828; color: white; }
        .btn-danger:hover { background: #d32f2f; }
        .btn-success { background: #2e7d32; color: white; }
        .btn-success:hover { background: #388e3c; }
        .btn-lg {
            padding: 14px 24px;
            font-size: 1.1rem;
            width: 100%;
            margin-top: 8px;
        }
        .registered-list {
            margin-top: 8px;
            font-size: 0.8rem;
            color: #aaa;
        }
        .registered-list span {
            background: #252540;
            padding: 2px 8px;
            border-radius: 10px;
            margin-right: 4px;
        }
        .event-log {
            max-height: 300px;
            overflow-y: auto;
            font-family: 'Consolas', monospace;
            font-size: 0.75rem;
        }
        .event-item {
            padding: 4px 0;
            border-bottom: 1px solid #1a1a2e;
        }
        .event-item .time { color: #666; }
        .event-item.boarding .msg { color: #4caf50; }
        .event-item.behavior .msg { color: #f44336; }
        .event-item.passenger .msg { color: #ff9800; }
        .event-item.system .msg { color: #2196f3; }
        .event-item.register .msg { color: #9c27b0; }
        .status-indicator {
            display: flex; align-items: center; gap: 8px;
            font-size: 0.85rem; margin-bottom: 8px;
        }
        .status-dot {
            width: 10px; height: 10px; border-radius: 50%;
            background: #4caf50;
            animation: blink 2s infinite;
        }
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }
        .engine-controls {
            display: flex; gap: 8px;
        }
        .engine-controls .btn { flex: 1; }
        .result-msg {
            margin-top: 8px;
            padding: 8px;
            border-radius: 6px;
            font-size: 0.85rem;
            display: none;
        }
        .result-msg.show { display: block; }
        .result-msg.success { background: #1b5e20; color: #a5d6a7; }
        .result-msg.error { background: #b71c1c; color: #ef9a9a; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>SafeWay Kids Edge AI</h1>
            <div class="subtitle">AI-Powered Safety Monitoring System</div>
        </div>
        <div class="badge">PoC DEMO</div>
    </div>

    <div class="main">
        <div>
            <div class="mode-tabs">
                <button class="mode-tab active" onclick="setMode('boarding')" id="tab-boarding">
                    1. Boarding
                </button>
                <button class="mode-tab" onclick="setMode('transit')" id="tab-transit">
                    2. Transit
                </button>
                <button class="mode-tab" onclick="setMode('post_transit')" id="tab-post_transit">
                    3. Post-Transit
                </button>
            </div>
            <div class="video-section">
                <img src="/video_feed" alt="AI Video Feed" id="video-feed">
            </div>
        </div>

        <div class="sidebar">
            <div class="panel">
                <h3>System Status</h3>
                <div class="status-indicator">
                    <div class="status-dot"></div>
                    <span id="status-text">Camera Active</span>
                </div>
                <div id="mode-display" style="font-size:0.9rem;">
                    Mode: <strong id="current-mode">Boarding</strong>
                </div>
            </div>

            <div class="panel" id="boarding-panel">
                <h3>Face Registration</h3>
                <div class="register-form">
                    <input type="text" id="face-name" placeholder="Student name">
                    <button class="btn btn-primary" onclick="registerFace()">Register</button>
                </div>
                <div id="register-result" class="result-msg"></div>
                <div class="registered-list" id="registered-list">
                    Registered: <span>None</span>
                </div>
            </div>

            <div class="panel" id="engine-panel" style="display:none;">
                <h3>Engine Control</h3>
                <div class="engine-controls">
                    <button class="btn btn-danger btn-lg" onclick="engineOff()">ENGINE OFF</button>
                    <button class="btn btn-success btn-lg" onclick="engineOn()">ENGINE ON</button>
                </div>
            </div>

            <div class="panel">
                <h3>Event Log</h3>
                <div class="event-log" id="event-log">
                    <div class="event-item system">
                        <span class="time">--:--:--</span>
                        <span class="msg"> System ready</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentMode = 'boarding';

        function setMode(mode) {
            currentMode = mode;
            fetch('/api/mode', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({mode}),
            }).then(r => r.json()).then(d => {
                document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
                document.getElementById('tab-' + mode).classList.add('active');
                document.getElementById('current-mode').textContent =
                    {boarding: 'Boarding', transit: 'Transit', post_transit: 'Post-Transit'}[mode];

                document.getElementById('boarding-panel').style.display = mode === 'boarding' ? 'block' : 'none';
                document.getElementById('engine-panel').style.display = mode === 'post_transit' ? 'block' : 'none';
            });
        }

        function registerFace() {
            const name = document.getElementById('face-name').value.trim();
            if (!name) return;

            const resultEl = document.getElementById('register-result');
            fetch('/api/register_face', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name}),
            }).then(r => r.json()).then(d => {
                if (d.success) {
                    resultEl.className = 'result-msg show success';
                    resultEl.textContent = name + ' registered!';
                    document.getElementById('face-name').value = '';
                    updateRegisteredList(d.registered);
                } else {
                    resultEl.className = 'result-msg show error';
                    resultEl.textContent = d.error || 'Registration failed';
                }
            }).catch(() => {
                resultEl.className = 'result-msg show error';
                resultEl.textContent = 'Connection error';
            });
        }

        function updateRegisteredList(names) {
            const el = document.getElementById('registered-list');
            if (names && names.length > 0) {
                el.innerHTML = 'Registered: ' + names.map(n => '<span>' + n + '</span>').join('');
            }
        }

        function engineOff() {
            fetch('/api/engine_off', {method: 'POST'}).then(r => r.json());
        }

        function engineOn() {
            fetch('/api/engine_on', {method: 'POST'}).then(r => r.json());
        }

        function refreshEvents() {
            fetch('/api/events').then(r => r.json()).then(events => {
                const el = document.getElementById('event-log');
                if (events.length === 0) return;
                el.innerHTML = events.map(e =>
                    `<div class="event-item ${e.type}">` +
                    `<span class="time">${e.time}</span> ` +
                    `<span class="msg">${e.message}</span></div>`
                ).join('');
            });
        }

        function refreshStatus() {
            fetch('/api/status').then(r => r.json()).then(d => {
                if (d.registered_faces && d.registered_faces.length > 0) {
                    updateRegisteredList(d.registered_faces);
                }
            });
        }

        // Auto-refresh
        setInterval(refreshEvents, 2000);
        setInterval(refreshStatus, 5000);

        // Enter key for registration
        document.getElementById('face-name').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') registerFace();
        });
    </script>
</body>
</html>
"""


if __name__ == "__main__":
    logger.info("SafeWay Kids Edge AI PoC Demo starting...")

    # 카메라를 별도 스레드에서 시작
    cam_thread = threading.Thread(target=camera_loop, daemon=True)
    cam_thread.start()

    # Flask 서버 시작
    app.run(host="0.0.0.0", port=7860, debug=False, threaded=True)
