/**
 * 시나리오 자동 재생 + 인터랙티브 모드
 *
 * - 3개 사전 정의 시나리오 JSON 로드/재생
 * - 타이머 기반 waypoint 보간 (linear)
 * - 마우스 드래그로 어린이 이동 (인터랙티브 모드)
 * - requestAnimationFrame 기반 60fps 렌더 루프
 */

import { LidarEngine } from './lidar.js';
import { UltrasonicEngine } from './ultrasonic.js';
import { SensorFusion } from './fusion.js';
import { BEVCanvas } from './bev-canvas.js';

/** 시나리오 목록 (fetch 경로) */
const SCENARIO_PATHS = [
  '/static/scenarios/rear_approach.json',
  '/static/scenarios/side_blindspot.json',
  '/static/scenarios/multi_children.json',
];

export class ScenarioPlayer {
  constructor(canvasElement, config = {}) {
    // 엔진 초기화
    this.lidar = new LidarEngine(config.lidar);
    this.ultrasonic = new UltrasonicEngine(config.ultrasonic);
    this.fusion = new SensorFusion(config.fusion);
    this.bev = new BEVCanvas(canvasElement, config.canvas);

    // 시나리오 데이터
    this.scenarios = [];
    this.currentScenarioIndex = -1;
    this.currentScenario = null;

    // 재생 상태
    this.playing = false;
    this.looping = config.looping !== false; // 기본 반복 재생
    this.startTime = 0;
    this.elapsed = 0;

    // 어린이 현재 위치
    this.children = [];     // [{id, x, y, prevX, prevY, rx, ry}]
    this.obstacles = [];    // [{x, y, w, h, label}]

    // 인터랙티브 모드
    this.interactive = false;
    this._dragChild = null;
    this._dragOffset = { x: 0, y: 0 };

    // 애니메이션 프레임 ID
    this._rafId = null;

    // 이벤트 콜백 (서버 전송용)
    this._onAlertEvent = null;

    // 센서 융합 경고 콜백 연결
    this.fusion.onAlert((event) => {
      if (this._onAlertEvent) {
        this._onAlertEvent(event);
      }
    });

    // 마우스 이벤트 바인딩
    this._bindMouseEvents(canvasElement);
  }

  // ─── 시나리오 로드 ──────────────────────────────────────

  /**
   * 모든 시나리오 JSON 로드
   */
  async loadScenarios() {
    const loaded = [];
    for (const path of SCENARIO_PATHS) {
      try {
        const resp = await fetch(path);
        if (resp.ok) {
          const data = await resp.json();
          loaded.push(data);
        }
      } catch (err) {
        console.warn(`[ScenarioPlayer] Failed to load ${path}:`, err);
      }
    }
    this.scenarios = loaded;
    return loaded;
  }

  /**
   * 외부 시나리오 데이터 직접 설정
   */
  setScenarios(scenarios) {
    this.scenarios = scenarios;
  }

  /**
   * 시나리오 선택
   */
  selectScenario(index) {
    if (index < 0 || index >= this.scenarios.length) return false;

    this.stop();
    this.currentScenarioIndex = index;
    this.currentScenario = this.scenarios[index];

    // 장애물 초기화
    this.obstacles = (this.currentScenario.obstacles || []).map(obs => ({
      x: obs.x,
      y: obs.y,
      w: obs.w || 1,
      h: obs.h || 1,
      label: obs.label || ''
    }));

    // 어린이를 시작 위치로
    this._resetChildPositions();

    return true;
  }

  /**
   * 어린이 위치를 시작점으로 리셋
   */
  _resetChildPositions() {
    if (!this.currentScenario) return;

    this.children = this.currentScenario.children.map(c => {
      const wp = c.waypoints;
      const start = wp && wp.length > 0 ? wp[0] : { x: 0, y: 0 };
      return {
        id: c.id,
        x: start.x,
        y: start.y,
        prevX: start.x,
        prevY: start.y,
        rx: 0.175,  // 35cm / 2
        ry: 0.10    // 20cm / 2
      };
    });
  }

  // ─── 재생 제어 ──────────────────────────────────────────

  /**
   * 재생 시작
   */
  play() {
    if (!this.currentScenario) {
      if (this.scenarios.length > 0) {
        this.selectScenario(0);
      } else {
        return;
      }
    }

    this.playing = true;
    this.interactive = false;
    this.startTime = performance.now();
    this.elapsed = 0;

    this._resetChildPositions();
    this._startLoop();
  }

  /**
   * 일시 정지
   */
  pause() {
    this.playing = false;
  }

  /**
   * 재개
   */
  resume() {
    if (!this.currentScenario) return;
    this.playing = true;
    this.startTime = performance.now() - this.elapsed * 1000;
    this._startLoop();
  }

  /**
   * 정지 (리셋)
   */
  stop() {
    this.playing = false;
    this.elapsed = 0;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  /**
   * 인터랙티브 모드 토글
   */
  toggleInteractive() {
    this.interactive = !this.interactive;
    if (this.interactive) {
      this.playing = false;
    }
    // 인터랙티브 모드에서도 렌더 루프는 계속
    if (!this._rafId) {
      this._startLoop();
    }
    return this.interactive;
  }

  /**
   * 경고 이벤트 콜백 설정
   */
  onAlertEvent(callback) {
    this._onAlertEvent = callback;
  }

  /**
   * 현재 시나리오 목록 반환
   */
  getScenarioList() {
    return this.scenarios.map((s, i) => ({
      index: i,
      name: s.name,
      description: s.description,
      duration: s.duration_sec,
      active: i === this.currentScenarioIndex
    }));
  }

  // ─── 렌더 루프 ──────────────────────────────────────────

  _startLoop() {
    if (this._rafId) return;

    const loop = () => {
      this._update();
      this._render();
      this._rafId = requestAnimationFrame(loop);
    };

    this._rafId = requestAnimationFrame(loop);
  }

  /**
   * 프레임 업데이트 (위치 보간 + 센서 시뮬레이션)
   */
  _update() {
    if (!this.currentScenario) return;

    const duration = this.currentScenario.duration_sec;

    // 자동 재생 모드: waypoint 보간
    if (this.playing) {
      this.elapsed = (performance.now() - this.startTime) / 1000;

      if (this.elapsed >= duration) {
        if (this.looping) {
          this.elapsed = 0;
          this.startTime = performance.now();
        } else {
          this.elapsed = duration;
          this.playing = false;
        }
      }

      // 각 어린이 위치 보간
      for (let i = 0; i < this.children.length; i++) {
        const childDef = this.currentScenario.children[i];
        if (!childDef) continue;

        const pos = this._interpolateWaypoints(childDef.waypoints, this.elapsed);
        this.children[i].prevX = this.children[i].x;
        this.children[i].prevY = this.children[i].y;
        this.children[i].x = pos.x;
        this.children[i].y = pos.y;
      }
    }

    // 센서 시뮬레이션
    const lidarResult = this.lidar.cast(this.children, this.obstacles);
    const ultraResult = this.ultrasonic.scan(this.children, this.obstacles);

    // 센서 융합
    const lidarDists = this.lidar.getChildDistances();
    const ultraDists = this.ultrasonic.getChildDistances();
    const fusionResult = this.fusion.fuse(lidarDists, ultraDists);

    // 렌더링용 상태 저장
    this._renderState = {
      children: this.children,
      obstacles: this.obstacles,
      lidarResult,
      ultraResult,
      fusionResult,
      globalAlert: this.fusion.getGlobalAlert()
    };
  }

  /**
   * Canvas 렌더링
   */
  _render() {
    if (this._renderState) {
      this.bev.render(this._renderState);

      // 진행률 바 (하단)
      if (this.currentScenario && (this.playing || this.elapsed > 0)) {
        this._drawProgressBar();
      }

      // 인터랙티브 모드 표시
      if (this.interactive) {
        this._drawInteractiveLabel();
      }
    }
  }

  /**
   * 진행률 바
   */
  _drawProgressBar() {
    const ctx = this.bev.ctx;
    const w = this.bev.width;
    const h = this.bev.height;
    const barH = 4;
    const duration = this.currentScenario.duration_sec;
    const progress = Math.min(this.elapsed / duration, 1);

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, h - barH, w, barH);
    ctx.fillStyle = '#4a9eff';
    ctx.fillRect(0, h - barH, w * progress, barH);

    // 시간 표시
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(
      `${this.elapsed.toFixed(1)}s / ${duration}s`,
      w - 10, h - barH - 5
    );
  }

  /**
   * 인터랙티브 모드 라벨
   */
  _drawInteractiveLabel() {
    const ctx = this.bev.ctx;
    const w = this.bev.width;

    ctx.fillStyle = 'rgba(74, 158, 255, 0.2)';
    ctx.fillRect(w / 2 - 80, this.bev.height - 30, 160, 20);
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 1;
    ctx.strokeRect(w / 2 - 80, this.bev.height - 30, 160, 20);

    ctx.fillStyle = '#4a9eff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('\u{1f5b1} Interactive Mode', w / 2, this.bev.height - 16);
  }

  // ─── Waypoint 보간 ──────────────────────────────────────

  /**
   * 선형 보간으로 현재 시간의 위치 계산
   */
  _interpolateWaypoints(waypoints, time) {
    if (!waypoints || waypoints.length === 0) return { x: 0, y: 0 };
    if (waypoints.length === 1) return { x: waypoints[0].x, y: waypoints[0].y };

    // 시간 범위 클램핑
    if (time <= waypoints[0].t) {
      return { x: waypoints[0].x, y: waypoints[0].y };
    }
    if (time >= waypoints[waypoints.length - 1].t) {
      const last = waypoints[waypoints.length - 1];
      return { x: last.x, y: last.y };
    }

    // 구간 찾기
    for (let i = 0; i < waypoints.length - 1; i++) {
      const wp0 = waypoints[i];
      const wp1 = waypoints[i + 1];

      if (time >= wp0.t && time <= wp1.t) {
        const dt = wp1.t - wp0.t;
        if (dt === 0) return { x: wp0.x, y: wp0.y };

        const t = (time - wp0.t) / dt;
        return {
          x: wp0.x + (wp1.x - wp0.x) * t,
          y: wp0.y + (wp1.y - wp0.y) * t
        };
      }
    }

    const last = waypoints[waypoints.length - 1];
    return { x: last.x, y: last.y };
  }

  // ─── 마우스 인터랙션 ──────────────────────────────────

  _bindMouseEvents(canvas) {
    canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
    canvas.addEventListener('mouseup', () => this._onMouseUp());
    canvas.addEventListener('mouseleave', () => this._onMouseUp());

    // 터치 지원
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this._onMouseDown({ offsetX: touch.clientX - canvas.getBoundingClientRect().left,
                          offsetY: touch.clientY - canvas.getBoundingClientRect().top });
    });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this._onMouseMove({ offsetX: touch.clientX - canvas.getBoundingClientRect().left,
                          offsetY: touch.clientY - canvas.getBoundingClientRect().top });
    });
    canvas.addEventListener('touchend', () => this._onMouseUp());
  }

  _onMouseDown(e) {
    if (!this.interactive) return;

    const [mx, my] = this.bev.pixelToMeter(e.offsetX, e.offsetY);

    // 어린이 히트 테스트
    for (const child of this.children) {
      const dx = mx - child.x;
      const dy = my - child.y;
      const hitRadius = 0.5; // 히트 영역 (m)
      if (dx * dx + dy * dy < hitRadius * hitRadius) {
        this._dragChild = child;
        this._dragOffset.x = dx;
        this._dragOffset.y = dy;
        return;
      }
    }
  }

  _onMouseMove(e) {
    if (!this._dragChild) return;

    const [mx, my] = this.bev.pixelToMeter(e.offsetX, e.offsetY);
    this._dragChild.prevX = this._dragChild.x;
    this._dragChild.prevY = this._dragChild.y;
    this._dragChild.x = mx - this._dragOffset.x;
    this._dragChild.y = my - this._dragOffset.y;
  }

  _onMouseUp() {
    this._dragChild = null;
  }

  // ─── 정리 ──────────────────────────────────────────────

  /**
   * 리소스 정리
   */
  destroy() {
    this.stop();
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }
}
