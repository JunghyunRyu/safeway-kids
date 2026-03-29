/**
 * Bird's Eye View Canvas 렌더링
 *
 * Tech Spec 섹션 17:
 * - Canvas 2D, 600x600px
 * - 차량(2.0m x 7.0m) 중심 배치
 * - LiDAR 360도 레이 시각화 (방사형 선, 반사점)
 * - 초음파 12개 콘 영역 시각화 (반투명 부채꼴)
 * - 어린이 객체 (원/타원, 거리별 색상)
 * - 장애물 (회색 직사각형)
 * - 경고 존 동심원 (4m / 2.5m / 1.0m)
 * - 실시간 거리 표시, 상태 텍스트
 */

import { AlertLevel, ALERT_CONFIG } from './fusion.js';

export class BEVCanvas {
  constructor(canvasElement, config = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');

    this.width = config.width || 600;
    this.height = config.height || 600;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // 스케일: 미터 → 픽셀
    this.visualRange = config.visualRange || 15; // 보이는 범위 (m)
    this.scale = (this.width / 2) / this.visualRange; // px/m

    // 차량 크기 (m)
    this.vehicleWidth = config.vehicleWidth || 2.0;
    this.vehicleLength = config.vehicleLength || 7.0;

    // 경고 존 거리
    this.alertZones = [
      { distance: 4.0, level: AlertLevel.CAUTION },
      { distance: 2.5, level: AlertLevel.WARNING },
      { distance: 1.0, level: AlertLevel.DANGER },
    ];

    // 렌더링 상태
    this._animFrame = 0;
    this._blinkPhase = 0;

    // 색상
    this.colors = {
      background: '#0a0e1a',
      grid: 'rgba(255,255,255,0.06)',
      gridMajor: 'rgba(255,255,255,0.12)',
      vehicle: '#1e3a5f',
      vehicleBorder: '#4a9eff',
      vehicleLabel: '#4a9eff',
      lidarRay: 'rgba(0, 200, 255, 0.08)',
      lidarHit: '#00e5ff',
      lidarHitChild: '#ff4444',
      obstacle: '#6b7280',
      obstacleBorder: '#9ca3af',
      text: '#e2e8f0',
      textDim: '#94a3b8',
    };
  }

  /**
   * 미터 좌표 → Canvas 픽셀 좌표
   * 차량 중심이 Canvas 중심, +Y가 위(전방)
   */
  _toPixel(x, y) {
    return [
      this.width / 2 + x * this.scale,
      this.height / 2 - y * this.scale  // Y 반전 (위가 전방)
    ];
  }

  /**
   * 전체 프레임 렌더링
   */
  render(state) {
    const { children, obstacles, lidarResult, ultraResult, fusionResult, globalAlert } = state;

    this._animFrame++;
    this._blinkPhase = Date.now();

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. 배경
    this._drawBackground(ctx);

    // 2. 그리드
    this._drawGrid(ctx);

    // 3. 경고 존 동심원
    this._drawAlertZones(ctx, globalAlert);

    // 4. LiDAR 레이 시각화
    if (lidarResult) {
      this._drawLidarRays(ctx, lidarResult);
    }

    // 5. 초음파 콘 시각화
    if (ultraResult) {
      this._drawUltrasonicCones(ctx, ultraResult, fusionResult);
    }

    // 6. 장애물
    this._drawObstacles(ctx, obstacles);

    // 7. 어린이 객체
    this._drawChildren(ctx, children, fusionResult);

    // 8. 차량
    this._drawVehicle(ctx);

    // 9. 상태 텍스트 (HUD)
    this._drawHUD(ctx, globalAlert, fusionResult);
  }

  // ─── 배경 & 그리드 ──────────────────────────────────────

  _drawBackground(ctx) {
    ctx.fillStyle = this.colors.background;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  _drawGrid(ctx) {
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // 동심원 그리드 (1m 간격)
    for (let r = 1; r <= this.visualRange; r++) {
      const radius = r * this.scale;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = r % 5 === 0 ? this.colors.gridMajor : this.colors.grid;
      ctx.lineWidth = r % 5 === 0 ? 1 : 0.5;
      ctx.stroke();

      // 5m 간격 거리 라벨
      if (r % 5 === 0) {
        ctx.fillStyle = this.colors.textDim;
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${r}m`, centerX + 3, centerY - radius + 12);
      }
    }

    // 십자 기준선
    ctx.strokeStyle = this.colors.gridMajor;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, this.height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(this.width, centerY);
    ctx.stroke();
  }

  // ─── 경고 존 ──────────────────────────────────────────

  _drawAlertZones(ctx, globalAlert) {
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    for (const zone of this.alertZones) {
      const radius = zone.distance * this.scale;
      const config = ALERT_CONFIG[zone.level];
      const isActive = globalAlert &&
        globalAlert.level !== AlertLevel.CLEAR &&
        globalAlert.minDistance <= zone.distance;

      // 블링크 효과
      let alpha = 0.08;
      if (isActive) {
        const blinkHz = config.blinkHz;
        if (blinkHz > 0) {
          alpha = 0.12 + 0.08 * Math.sin(this._blinkPhase * blinkHz * Math.PI / 500);
        } else {
          alpha = 0.15;
        }
      }

      // 존 영역 채우기
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = config.color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
      // hex -> rgba 변환
      ctx.fillStyle = this._hexToRgba(config.color, alpha);
      ctx.fill();

      // 존 경계선
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = this._hexToRgba(config.color, isActive ? 0.6 : 0.25);
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.setLineDash(isActive ? [] : [4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 존 라벨
      ctx.fillStyle = this._hexToRgba(config.color, 0.7);
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(
        `${config.label} ${zone.distance}m`,
        centerX - 5,
        centerY - radius + 14
      );
    }
  }

  // ─── LiDAR 레이 ──────────────────────────────────────────

  _drawLidarRays(ctx, lidarResult) {
    const { distances, hitObjects, angles } = lidarResult;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    for (let i = 0; i < distances.length; i++) {
      const angle = angles[i];
      const dist = Math.min(distances[i], this.visualRange);
      const px = dist * Math.cos(angle) * this.scale;
      const py = dist * Math.sin(angle) * this.scale;

      // 레이 선
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + px, centerY - py);
      ctx.strokeStyle = this.colors.lidarRay;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // 반사점 (물체에 맞은 경우)
      if (hitObjects[i] && dist < this.visualRange) {
        const hitX = centerX + px;
        const hitY = centerY - py;
        const isChild = hitObjects[i].type === 'child';

        ctx.beginPath();
        ctx.arc(hitX, hitY, isChild ? 3 : 2, 0, Math.PI * 2);
        ctx.fillStyle = isChild ? this.colors.lidarHitChild : this.colors.lidarHit;
        ctx.fill();
      }
    }
  }

  // ─── 초음파 콘 ──────────────────────────────────────────

  _drawUltrasonicCones(ctx, ultraResult, fusionResult) {
    const { distances, sensors } = ultraResult;

    for (let s = 0; s < sensors.length; s++) {
      const sensor = sensors[s];
      const dist = Math.min(distances[s], 4.0);
      const [sx, sy] = this._toPixel(sensor.x, sensor.y);
      const radiusPx = dist * this.scale;

      // 콘 방향 (Canvas 좌표에서 Y 반전)
      const coneAngle = -sensor.angle; // Y 반전
      const halfAngle = 7.5 * Math.PI / 180;

      // 감지 상태에 따른 색상
      const detected = ultraResult.detectedObjects[s];
      let coneColor = 'rgba(100, 200, 255, 0.08)';
      let borderColor = 'rgba(100, 200, 255, 0.3)';

      if (detected) {
        if (detected.type === 'child') {
          const childFused = fusionResult && fusionResult.get(detected.id);
          if (childFused) {
            const alertConfig = ALERT_CONFIG[childFused.alertLevel];
            coneColor = this._hexToRgba(alertConfig.color, 0.15);
            borderColor = this._hexToRgba(alertConfig.color, 0.5);
          } else {
            coneColor = 'rgba(255, 100, 100, 0.15)';
            borderColor = 'rgba(255, 100, 100, 0.5)';
          }
        }
      }

      // 부채꼴 (콘) 그리기
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.arc(sx, sy, radiusPx, coneAngle - halfAngle, coneAngle + halfAngle);
      ctx.closePath();
      ctx.fillStyle = coneColor;
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      // 센서 포인트
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fillStyle = detected ? '#ff9800' : '#64b5f6';
      ctx.fill();
    }
  }

  // ─── 장애물 ──────────────────────────────────────────────

  _drawObstacles(ctx, obstacles) {
    if (!obstacles) return;

    for (const obs of obstacles) {
      const [cx, cy] = this._toPixel(obs.x, obs.y);
      const w = (obs.w || 1) * this.scale;
      const h = (obs.h || 1) * this.scale;

      ctx.fillStyle = this.colors.obstacle;
      ctx.strokeStyle = this.colors.obstacleBorder;
      ctx.lineWidth = 1;
      ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
      ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);

      // 라벨
      if (obs.label) {
        ctx.fillStyle = this.colors.textDim;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(obs.label, cx, cy + h / 2 + 12);
      }
    }
  }

  // ─── 어린이 ──────────────────────────────────────────────

  _drawChildren(ctx, children, fusionResult) {
    if (!children) return;

    for (const child of children) {
      const [cx, cy] = this._toPixel(child.x, child.y);
      const rx = (child.rx || 0.175) * this.scale;
      const ry = (child.ry || 0.10) * this.scale;

      // 융합 결과에서 색상 결정
      let color = '#22c55e'; // 기본 초록
      let alertLabel = '';
      let distance = null;

      if (fusionResult && fusionResult.has(child.id)) {
        const fused = fusionResult.get(child.id);
        color = fused.alertColor;
        alertLabel = fused.alertLabel;
        distance = fused.distance;
      }

      // 위험 시 펄스 효과
      const pulse = alertLabel === '위험'
        ? 1 + 0.15 * Math.sin(this._blinkPhase * 0.01)
        : 1;

      // 어린이 타원
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * pulse, ry * pulse, 0, 0, Math.PI * 2);
      ctx.fillStyle = this._hexToRgba(color, 0.5);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 중심점
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // 이동 궤적선 (이전 위치가 있는 경우)
      if (child.prevX !== undefined && child.prevY !== undefined) {
        const [px, py] = this._toPixel(child.prevX, child.prevY);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = this._hexToRgba(color, 0.3);
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 거리 + 라벨 표시
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = color;
      const labelY = cy - ry - 8;

      if (child.id) {
        ctx.fillText(child.id, cx, labelY - 14);
      }
      if (distance !== null) {
        ctx.fillText(`${distance.toFixed(2)}m`, cx, labelY);
      }
      if (alertLabel) {
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(alertLabel, cx, labelY + 14);
      }
    }
  }

  // ─── 차량 ──────────────────────────────────────────────

  _drawVehicle(ctx) {
    const [cx, cy] = this._toPixel(0, 0);
    const w = this.vehicleWidth * this.scale;
    const h = this.vehicleLength * this.scale;

    // 차량 본체
    ctx.fillStyle = this.colors.vehicle;
    ctx.strokeStyle = this.colors.vehicleBorder;
    ctx.lineWidth = 2;

    // 둥근 모서리 사각형
    const cornerR = 4;
    this._roundRect(ctx, cx - w / 2, cy - h / 2, w, h, cornerR);
    ctx.fill();
    ctx.stroke();

    // 전방 표시 (삼각형 화살표)
    ctx.beginPath();
    ctx.moveTo(cx, cy - h / 2 + 8);
    ctx.lineTo(cx - 8, cy - h / 2 + 20);
    ctx.lineTo(cx + 8, cy - h / 2 + 20);
    ctx.closePath();
    ctx.fillStyle = this.colors.vehicleBorder;
    ctx.fill();

    // 차량 라벨
    ctx.fillStyle = this.colors.vehicleLabel;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('통학차량', cx, cy + 4);

    // LiDAR 센서 마크 (지붕 중앙)
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#00e5ff';
    ctx.fill();
    ctx.strokeStyle = '#004d66';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ─── HUD ──────────────────────────────────────────────

  _drawHUD(ctx, globalAlert, fusionResult) {
    const padding = 10;
    const lineHeight = 16;

    // 좌상단: 경고 상태
    if (globalAlert) {
      const alertConfig = ALERT_CONFIG[globalAlert.level];
      const bg = globalAlert.level === AlertLevel.CLEAR
        ? 'rgba(0,0,0,0.6)'
        : this._hexToRgba(alertConfig.color, 0.2);

      ctx.fillStyle = bg;
      ctx.fillRect(padding, padding, 160, 50);
      ctx.strokeStyle = alertConfig.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(padding, padding, 160, 50);

      ctx.fillStyle = alertConfig.color;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${alertConfig.label}`, padding + 8, padding + 20);

      ctx.font = '12px monospace';
      ctx.fillStyle = this.colors.text;
      const distText = globalAlert.minDistance < Infinity
        ? `${globalAlert.minDistance.toFixed(2)}m`
        : '--';
      ctx.fillText(`최근접: ${distText}`, padding + 8, padding + 40);
    }

    // 우상단: 센서 정보
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(this.width - 170, padding, 160, 65);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.width - 170, padding, 160, 65);

    ctx.fillStyle = this.colors.text;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    const infoX = this.width - 162;
    ctx.fillText('Sensor Status', infoX, padding + 15);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('LiDAR: VLP-16 (360ray)', infoX, padding + 32);
    ctx.fillStyle = '#64b5f6';
    ctx.fillText('Ultrasonic: 12ch (15\u00b0)', infoX, padding + 47);
    ctx.fillStyle = '#4ade80';
    ctx.fillText('Fusion: ON (L0.7+U0.3)', infoX, padding + 62);

    // 하단: 감지된 어린이 수
    if (fusionResult && fusionResult.size > 0) {
      const count = fusionResult.size;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(padding, this.height - 35, 200, 25);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.strokeRect(padding, this.height - 35, 200, 25);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`\u26a0 ${count}명 감지`, padding + 8, this.height - 17);
    }
  }

  // ─── 유틸리티 ──────────────────────────────────────────

  _hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  /**
   * Canvas 크기 재조정
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.scale = (this.width / 2) / this.visualRange;
  }

  /**
   * Canvas 좌표 → 미터 좌표 변환 (마우스 인터랙션용)
   */
  pixelToMeter(px, py) {
    return [
      (px - this.width / 2) / this.scale,
      -(py - this.height / 2) / this.scale
    ];
  }
}
