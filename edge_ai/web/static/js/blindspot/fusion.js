/**
 * 센서 융합 + 경고 시스템
 *
 * Tech Spec 섹션 16.5, 16.6:
 * - LiDAR(0.7) + 초음파(0.3) 가중 평균
 * - 3단계 경고: CAUTION 4m / WARNING 2.5m / DANGER 1.0m
 * - 단독 감지 신뢰도: LiDAR 0.70, 초음파 0.60
 * - 양 센서 감지 시 신뢰도 0.95
 */

/** 경고 레벨 상수 */
export const AlertLevel = Object.freeze({
  CLEAR:   'CLEAR',
  CAUTION: 'CAUTION',
  WARNING: 'WARNING',
  DANGER:  'DANGER'
});

/** 경고 레벨별 설정 */
export const ALERT_CONFIG = Object.freeze({
  [AlertLevel.CLEAR]:   { threshold: Infinity, color: '#22c55e', label: '안전', blinkHz: 0 },
  [AlertLevel.CAUTION]: { threshold: 4.0,      color: '#eab308', label: '주의', blinkHz: 0 },
  [AlertLevel.WARNING]: { threshold: 2.5,      color: '#f97316', label: '경고', blinkHz: 1 },
  [AlertLevel.DANGER]:  { threshold: 1.0,      color: '#ef4444', label: '위험', blinkHz: 2 },
});

export class SensorFusion {
  constructor(config = {}) {
    this.lidarWeight = config.lidarWeight || 0.7;
    this.ultraWeight = config.ultraWeight || 0.3;

    this.thresholdCaution = config.thresholdCaution || 4.0;
    this.thresholdWarning = config.thresholdWarning || 2.5;
    this.thresholdDanger  = config.thresholdDanger  || 1.0;

    // 융합 결과 (어린이별)
    this.fusedResults = new Map();

    // 전체 최소 거리 기반 경고 상태
    this.globalAlert = AlertLevel.CLEAR;
    this.globalMinDistance = Infinity;
    this.globalMinChildId = null;

    // 이벤트 콜백
    this._onAlert = null;

    // 이벤트 쿨다운 (동일 레벨 5초)
    this._lastAlertTime = {};
    this._cooldownMs = config.cooldownMs || 5000;
  }

  /**
   * 경고 이벤트 콜백 설정
   * @param {Function} callback - (alertEvent) => void
   */
  onAlert(callback) {
    this._onAlert = callback;
  }

  /**
   * 거리로부터 경고 레벨 결정
   */
  _getAlertLevel(distance) {
    if (distance <= this.thresholdDanger)  return AlertLevel.DANGER;
    if (distance <= this.thresholdWarning) return AlertLevel.WARNING;
    if (distance <= this.thresholdCaution) return AlertLevel.CAUTION;
    return AlertLevel.CLEAR;
  }

  /**
   * LiDAR + 초음파 융합 수행
   * @param {Map<string, number>} lidarChildDists - childId -> LiDAR 최소 거리
   * @param {Map<string, {distance: number, sensorId: string}>} ultraChildDists - childId -> 초음파 최소 거리
   * @returns {Map<string, FusedResult>} childId -> 융합 결과
   */
  fuse(lidarChildDists, ultraChildDists) {
    this.fusedResults.clear();

    // 모든 감지된 어린이 ID 수집
    const allChildIds = new Set([
      ...lidarChildDists.keys(),
      ...ultraChildDists.keys()
    ]);

    let globalMin = Infinity;
    let globalMinChild = null;

    for (const childId of allChildIds) {
      const hasLidar = lidarChildDists.has(childId);
      const hasUltra = ultraChildDists.has(childId);

      let distance, confidence, source;

      if (hasLidar && hasUltra) {
        // 양 센서 감지: 가중 평균 융합
        const lidarDist = lidarChildDists.get(childId);
        const ultraDist = ultraChildDists.get(childId).distance;
        distance = lidarDist * this.lidarWeight + ultraDist * this.ultraWeight;
        confidence = 0.95;
        source = 'FUSION';
      } else if (hasLidar) {
        // LiDAR 단독
        distance = lidarChildDists.get(childId);
        confidence = 0.70;
        source = 'LIDAR_ONLY';
      } else {
        // 초음파 단독
        distance = ultraChildDists.get(childId).distance;
        confidence = 0.60;
        source = 'ULTRASONIC_ONLY';
      }

      const alertLevel = this._getAlertLevel(distance);
      const alertConfig = ALERT_CONFIG[alertLevel];

      const result = {
        childId,
        distance,
        confidence,
        source,
        alertLevel,
        alertColor: alertConfig.color,
        alertLabel: alertConfig.label,
        lidarDist: hasLidar ? lidarChildDists.get(childId) : null,
        ultraDist: hasUltra ? ultraChildDists.get(childId).distance : null
      };

      this.fusedResults.set(childId, result);

      if (distance < globalMin) {
        globalMin = distance;
        globalMinChild = childId;
      }
    }

    // 글로벌 경고 업데이트
    this.globalMinDistance = globalMin;
    this.globalMinChildId = globalMinChild;
    const newGlobalAlert = this._getAlertLevel(globalMin);

    // 경고 레벨 변경 시 이벤트 발생
    if (newGlobalAlert !== this.globalAlert || newGlobalAlert !== AlertLevel.CLEAR) {
      this._emitAlert(newGlobalAlert, globalMin, globalMinChild);
    }

    this.globalAlert = newGlobalAlert;

    return this.fusedResults;
  }

  /**
   * 경고 이벤트 발생
   */
  _emitAlert(level, distance, childId) {
    if (!this._onAlert) return;
    if (level === AlertLevel.CLEAR) return;

    // 쿨다운 체크
    const now = Date.now();
    const lastTime = this._lastAlertTime[level] || 0;
    if (now - lastTime < this._cooldownMs) return;

    this._lastAlertTime[level] = now;

    const alertEvent = {
      type: level.toLowerCase(),
      distance: Math.round(distance * 100) / 100,
      childId,
      confidence: this.fusedResults.has(childId) ? this.fusedResults.get(childId).confidence : 0,
      source: this.fusedResults.has(childId) ? this.fusedResults.get(childId).source : 'UNKNOWN',
      timestamp: new Date().toISOString()
    };

    this._onAlert(alertEvent);
  }

  /**
   * 글로벌 경고 상태 반환
   */
  getGlobalAlert() {
    return {
      level: this.globalAlert,
      config: ALERT_CONFIG[this.globalAlert],
      minDistance: this.globalMinDistance,
      minChildId: this.globalMinChildId
    };
  }

  /**
   * 전체 경고 레벨 순서 비교 (DANGER > WARNING > CAUTION > CLEAR)
   */
  static compareAlertLevel(a, b) {
    const order = { CLEAR: 0, CAUTION: 1, WARNING: 2, DANGER: 3 };
    return (order[a] || 0) - (order[b] || 0);
  }
}
