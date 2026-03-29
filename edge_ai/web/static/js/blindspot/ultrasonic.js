/**
 * 초음파 센서 시뮬레이션
 *
 * Tech Spec 섹션 16.2:
 * - 12개 센서: 전방 4, 후방 4, 좌측 2, 우측 2
 * - 빔 폭 15도 (반각 7.5도), 최대 4m, 최소 2cm
 * - 가우시안 노이즈 sigma=1cm
 * - 차량 크기: 2.0m(폭) x 7.0m(길이)
 */

export class UltrasonicEngine {
  constructor(config = {}) {
    this.maxRange = config.maxRange || 4.0;       // 최대 4m
    this.minRange = config.minRange || 0.02;      // 최소 2cm
    this.beamAngle = config.beamAngle || 15;      // 빔 각도 (도)
    this.beamHalfAngle = (this.beamAngle / 2) * (Math.PI / 180); // 반각 (라디안)
    this.noiseSigma = config.noiseSigma || 0.01;  // 1cm 노이즈
    this.updateInterval = config.updateInterval || 50; // 20Hz (ms)

    // 차량 크기
    const vw = config.vehicleWidth || 2.0;
    const vl = config.vehicleLength || 7.0;
    const hw = vw / 2;
    const hl = vl / 2;

    // 12개 센서 배치 (차량 기준 좌표)
    // 전방 4개: 차량 전면 (y = +hl) 에 균등 배치
    // 후방 4개: 차량 후면 (y = -hl) 에 균등 배치
    // 좌측 2개: 차량 좌측 (x = -hw) 에 전/후 배치
    // 우측 2개: 차량 우측 (x = +hw) 에 전/후 배치
    this.sensors = [
      // 전방 4개 (왼쪽→오른쪽, 전방 향함 = +Y 방향)
      { id: 'F1', x: -hw * 0.75, y: hl, angle: Math.PI / 2, label: '전방좌1' },
      { id: 'F2', x: -hw * 0.25, y: hl, angle: Math.PI / 2, label: '전방좌2' },
      { id: 'F3', x:  hw * 0.25, y: hl, angle: Math.PI / 2, label: '전방우1' },
      { id: 'F4', x:  hw * 0.75, y: hl, angle: Math.PI / 2, label: '전방우2' },
      // 후방 4개 (왼쪽→오른쪽, 후방 향함 = -Y 방향)
      { id: 'R1', x: -hw * 0.75, y: -hl, angle: -Math.PI / 2, label: '후방좌1' },
      { id: 'R2', x: -hw * 0.25, y: -hl, angle: -Math.PI / 2, label: '후방좌2' },
      { id: 'R3', x:  hw * 0.25, y: -hl, angle: -Math.PI / 2, label: '후방우1' },
      { id: 'R4', x:  hw * 0.75, y: -hl, angle: -Math.PI / 2, label: '후방우2' },
      // 좌측 2개 (-X 방향)
      { id: 'L1', x: -hw, y:  hl * 0.4, angle: Math.PI, label: '좌측전' },
      { id: 'L2', x: -hw, y: -hl * 0.4, angle: Math.PI, label: '좌측후' },
      // 우측 2개 (+X 방향)
      { id: 'S1', x:  hw, y:  hl * 0.4, angle: 0, label: '우측전' },
      { id: 'S2', x:  hw, y: -hl * 0.4, angle: 0, label: '우측후' },
    ];

    this.sensorCount = this.sensors.length;
    this.distances = new Float32Array(this.sensorCount);
    this.detectedObjects = new Array(this.sensorCount).fill(null);

    // 초기화: 모든 거리를 maxRange로
    this.distances.fill(this.maxRange);
  }

  /**
   * Box-Muller 가우시안 랜덤
   */
  _gaussian(mean, sigma) {
    let u1 = Math.random();
    let u2 = Math.random();
    if (u1 < 1e-10) u1 = 1e-10;
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + sigma * z;
  }

  /**
   * 점이 콘(부채꼴) 영역 안에 있는지 검사
   * @param {object} sensor - 센서 정보 {x, y, angle}
   * @param {number} px - 점 x
   * @param {number} py - 점 y
   * @returns {number} 거리 (콘 바깥이면 -1)
   */
  _pointInCone(sensor, px, py) {
    const dx = px - sensor.x;
    const dy = py - sensor.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 범위 체크
    if (dist > this.maxRange || dist < this.minRange) return -1;

    // 방향 각도 차이
    const pointAngle = Math.atan2(dy, dx);
    let angleDiff = pointAngle - sensor.angle;

    // -PI ~ PI 정규화
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    if (Math.abs(angleDiff) > this.beamHalfAngle) return -1;

    return dist;
  }

  /**
   * 타원 객체의 센서 콘 내 최소 거리 계산
   * 타원 경계의 여러 포인트를 샘플링하여 콘 내 최소 거리를 구함
   */
  _ellipseInCone(sensor, cx, cy, rx, ry) {
    let minDist = -1;

    // 타원 경계 + 중심점에서 샘플링 (16포인트 + 중심)
    const samples = 17;
    for (let i = 0; i < samples; i++) {
      let px, py;
      if (i === 0) {
        px = cx;
        py = cy;
      } else {
        const theta = ((i - 1) * 2 * Math.PI) / (samples - 1);
        px = cx + rx * Math.cos(theta);
        py = cy + ry * Math.sin(theta);
      }

      const d = this._pointInCone(sensor, px, py);
      if (d > 0 && (minDist < 0 || d < minDist)) {
        minDist = d;
      }
    }

    return minDist;
  }

  /**
   * AABB 객체의 센서 콘 내 최소 거리 계산
   * 사각형 꼭지점 + 변 중점에서 샘플링
   */
  _aabbInCone(sensor, cx, cy, hw, hh) {
    let minDist = -1;

    // 4꼭지점 + 4변 중점 + 중심 = 9포인트
    const points = [
      [cx, cy],
      [cx - hw, cy - hh], [cx + hw, cy - hh],
      [cx - hw, cy + hh], [cx + hw, cy + hh],
      [cx, cy - hh], [cx, cy + hh],
      [cx - hw, cy], [cx + hw, cy],
    ];

    for (const [px, py] of points) {
      const d = this._pointInCone(sensor, px, py);
      if (d > 0 && (minDist < 0 || d < minDist)) {
        minDist = d;
      }
    }

    return minDist;
  }

  /**
   * 전체 센서에 대해 감지 수행
   * @param {Array} children - [{x, y, rx, ry, id}] 어린이 객체들
   * @param {Array} obstacles - [{x, y, w, h, label}] 장애물들
   * @returns {{ distances: Float32Array, detectedObjects: Array, sensors: Array }}
   */
  scan(children = [], obstacles = []) {
    for (let s = 0; s < this.sensorCount; s++) {
      const sensor = this.sensors[s];
      let minDist = this.maxRange;
      let detected = null;

      // 어린이 타원 검사
      for (const child of children) {
        const rx = child.rx || 0.175;
        const ry = child.ry || 0.10;
        const d = this._ellipseInCone(sensor, child.x, child.y, rx, ry);
        if (d > 0 && d < minDist) {
          minDist = d;
          detected = { type: 'child', id: child.id, distance: d };
        }
      }

      // 장애물 AABB 검사
      for (const obs of obstacles) {
        const hw = (obs.w || 1) / 2;
        const hh = (obs.h || 1) / 2;
        const d = this._aabbInCone(sensor, obs.x, obs.y, hw, hh);
        if (d > 0 && d < minDist) {
          minDist = d;
          detected = { type: 'obstacle', label: obs.label, distance: d };
        }
      }

      // 노이즈 적용
      if (detected) {
        minDist += this._gaussian(0, this.noiseSigma);
        minDist = Math.max(this.minRange, minDist);
        detected.distance = minDist;
      }

      this.distances[s] = minDist;
      this.detectedObjects[s] = detected;
    }

    return {
      distances: this.distances,
      detectedObjects: this.detectedObjects,
      sensors: this.sensors
    };
  }

  /**
   * 어린이별 최소 초음파 감지 거리 반환
   * @returns {Map<string, {distance: number, sensorId: string}>}
   */
  getChildDistances() {
    const result = new Map();
    for (let s = 0; s < this.sensorCount; s++) {
      const det = this.detectedObjects[s];
      if (det && det.type === 'child') {
        const existing = result.get(det.id);
        if (!existing || det.distance < existing.distance) {
          result.set(det.id, {
            distance: det.distance,
            sensorId: this.sensors[s].id
          });
        }
      }
    }
    return result;
  }

  /**
   * 영역별 최소 거리 반환 (전방/후방/좌측/우측)
   */
  getZoneDistances() {
    const zones = {
      front: { min: this.maxRange, sensor: null },
      rear:  { min: this.maxRange, sensor: null },
      left:  { min: this.maxRange, sensor: null },
      right: { min: this.maxRange, sensor: null }
    };

    for (let s = 0; s < this.sensorCount; s++) {
      const sensor = this.sensors[s];
      const dist = this.distances[s];
      let zone;

      if (sensor.id.startsWith('F')) zone = 'front';
      else if (sensor.id.startsWith('R')) zone = 'rear';
      else if (sensor.id.startsWith('L')) zone = 'left';
      else zone = 'right';

      if (dist < zones[zone].min) {
        zones[zone].min = dist;
        zones[zone].sensor = sensor.id;
      }
    }

    return zones;
  }
}
