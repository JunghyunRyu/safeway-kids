/**
 * LiDAR 레이 캐스팅 엔진 (VLP-16 시뮬레이션)
 *
 * Tech Spec 섹션 16.1:
 * - 360레이 (1도 간격), 최대 100m (시각화 15m)
 * - 가우시안 노이즈 sigma=3cm, 드롭아웃 2%
 * - 레이-타원 교차 (어린이), 레이-AABB 교차 (장애물)
 */

export class LidarEngine {
  constructor(config = {}) {
    this.rayCount = config.rayCount || 360;
    this.maxRange = config.maxRange || 100;       // 실제 최대 거리 (m)
    this.visualRange = config.visualRange || 15;   // 시각화 범위 (m)
    this.noiseSigma = config.noiseSigma || 0.03;   // 3cm 노이즈
    this.dropoutRate = config.dropoutRate || 0.02;  // 2% 드롭아웃
    this.updateInterval = config.updateInterval || 100; // 10Hz (ms)

    // LiDAR 위치: 차량 지붕 중앙 (0, 0)
    this.position = { x: 0, y: 0 };

    // 결과 배열
    this.distances = new Float32Array(this.rayCount);
    this.hitObjects = new Array(this.rayCount).fill(null);
    this.angles = new Float32Array(this.rayCount);

    // 각도 미리 계산
    for (let i = 0; i < this.rayCount; i++) {
      this.angles[i] = (i * 2 * Math.PI) / this.rayCount;
    }
  }

  /**
   * Box-Muller 가우시안 랜덤
   */
  _gaussian(mean, sigma) {
    let u1 = Math.random();
    let u2 = Math.random();
    // 0 방지
    if (u1 < 1e-10) u1 = 1e-10;
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + sigma * z;
  }

  /**
   * 레이-타원 교차 테스트 (어린이 = 타원 35cm x 20cm)
   * 타원 중심 (cx, cy), 반경 (rx, ry)
   * 레이 원점 (ox, oy), 방향 (dx, dy) - 정규화됨
   *
   * 타원 방정식: ((x-cx)/rx)^2 + ((y-cy)/ry)^2 = 1
   * 레이: P = O + t*D
   * 치환하면 at^2 + bt + c = 0
   */
  _rayEllipseIntersect(ox, oy, dx, dy, cx, cy, rx, ry) {
    const ex = ox - cx;
    const ey = oy - cy;

    const a = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
    const b = 2 * ((ex * dx) / (rx * rx) + (ey * dy) / (ry * ry));
    const c = (ex * ex) / (rx * rx) + (ey * ey) / (ry * ry) - 1;

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return -1;

    const sqrtD = Math.sqrt(discriminant);
    const t1 = (-b - sqrtD) / (2 * a);
    const t2 = (-b + sqrtD) / (2 * a);

    // 가장 가까운 양의 교차점
    if (t1 > 0.001) return t1;
    if (t2 > 0.001) return t2;
    return -1;
  }

  /**
   * 레이-AABB 교차 테스트 (장애물 = 직사각형)
   * AABB: 중심 (cx, cy), 반폭 (hw, hh)
   * 레이: 원점 (ox, oy), 방향 (dx, dy)
   */
  _rayAABBIntersect(ox, oy, dx, dy, cx, cy, hw, hh) {
    const minX = cx - hw;
    const maxX = cx + hw;
    const minY = cy - hh;
    const maxY = cy + hh;

    let tmin = -Infinity;
    let tmax = Infinity;

    // X 슬랩
    if (Math.abs(dx) > 1e-10) {
      let t1 = (minX - ox) / dx;
      let t2 = (maxX - ox) / dx;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
    } else {
      if (ox < minX || ox > maxX) return -1;
    }

    // Y 슬랩
    if (Math.abs(dy) > 1e-10) {
      let t1 = (minY - oy) / dy;
      let t2 = (maxY - oy) / dy;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
    } else {
      if (oy < minY || oy > maxY) return -1;
    }

    if (tmin > tmax || tmax < 0) return -1;
    return tmin > 0.001 ? tmin : (tmax > 0.001 ? tmax : -1);
  }

  /**
   * 전체 씬에 대해 360 레이캐스팅 수행
   * @param {Array} children - [{x, y, rx, ry, id}] 어린이 객체들
   * @param {Array} obstacles - [{x, y, w, h, label}] 장애물들
   * @returns {{ distances: Float32Array, hitObjects: Array, angles: Float32Array }}
   */
  cast(children = [], obstacles = []) {
    const ox = this.position.x;
    const oy = this.position.y;

    for (let i = 0; i < this.rayCount; i++) {
      const angle = this.angles[i];
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);

      // 드롭아웃 체크
      if (Math.random() < this.dropoutRate) {
        this.distances[i] = this.maxRange;
        this.hitObjects[i] = null;
        continue;
      }

      let minDist = this.maxRange;
      let hitObj = null;

      // 어린이 타원 교차 테스트
      for (let c = 0; c < children.length; c++) {
        const child = children[c];
        const rx = child.rx || 0.175; // 35cm / 2
        const ry = child.ry || 0.10;  // 20cm / 2
        const t = this._rayEllipseIntersect(ox, oy, dx, dy, child.x, child.y, rx, ry);
        if (t > 0 && t < minDist) {
          minDist = t;
          hitObj = { type: 'child', id: child.id, distance: t };
        }
      }

      // 장애물 AABB 교차 테스트
      for (let o = 0; o < obstacles.length; o++) {
        const obs = obstacles[o];
        const hw = (obs.w || 1) / 2;
        const hh = (obs.h || 1) / 2;
        const t = this._rayAABBIntersect(ox, oy, dx, dy, obs.x, obs.y, hw, hh);
        if (t > 0 && t < minDist) {
          minDist = t;
          hitObj = { type: 'obstacle', label: obs.label, distance: t };
        }
      }

      // 가우시안 노이즈 적용 (물체에 맞은 경우에만)
      if (hitObj) {
        minDist += this._gaussian(0, this.noiseSigma);
        if (minDist < 0.02) minDist = 0.02; // 최소 거리 제한
        hitObj.distance = minDist;
      }

      this.distances[i] = minDist;
      this.hitObjects[i] = hitObj;
    }

    return {
      distances: this.distances,
      hitObjects: this.hitObjects,
      angles: this.angles
    };
  }

  /**
   * 특정 방향 범위의 최소 거리 반환
   * @param {number} startAngleDeg - 시작 각도 (도)
   * @param {number} endAngleDeg - 종료 각도 (도)
   * @returns {{ minDist: number, hitObject: object|null }}
   */
  getMinDistanceInRange(startAngleDeg, endAngleDeg) {
    const startIdx = Math.floor((startAngleDeg % 360 + 360) % 360);
    const endIdx = Math.floor((endAngleDeg % 360 + 360) % 360);

    let minDist = this.maxRange;
    let hitObject = null;

    const iterate = (from, to) => {
      for (let i = from; i < to; i++) {
        if (this.distances[i] < minDist) {
          minDist = this.distances[i];
          hitObject = this.hitObjects[i];
        }
      }
    };

    if (startIdx <= endIdx) {
      iterate(startIdx, endIdx + 1);
    } else {
      iterate(startIdx, this.rayCount);
      iterate(0, endIdx + 1);
    }

    return { minDist, hitObject };
  }

  /**
   * 어린이별 최소 감지 거리 반환
   * @returns {Map<string, number>} childId -> 최소 거리
   */
  getChildDistances() {
    const result = new Map();
    for (let i = 0; i < this.rayCount; i++) {
      const hit = this.hitObjects[i];
      if (hit && hit.type === 'child') {
        const existing = result.get(hit.id);
        if (!existing || hit.distance < existing) {
          result.set(hit.id, hit.distance);
        }
      }
    }
    return result;
  }
}
