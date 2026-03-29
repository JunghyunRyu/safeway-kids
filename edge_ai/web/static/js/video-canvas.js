/**
 * SafeWay Kids Edge AI PoC — Video Canvas Module (T25)
 *
 * - Socket.IO 'frame' 이벤트 수신 → base64 → Canvas drawImage
 * - 바운딩 박스 오버레이 (초록/빨강/노랑, 라벨 포함)
 * - 얼굴 등록: 이름 입력 + 캡처 → POST /api/register_face
 */

const VideoCanvas = (function () {
  'use strict';

  let canvas = null;
  let ctx = null;
  let frameImg = new Image();
  let lastDetections = [];
  let onDetectionCallback = null;

  // 색상 매핑
  const COLORS = {
    normal: '#66bb6a',
    warning: '#eab308',
    danger: '#ef4444',
    face_recognized: '#66bb6a',
    face_unknown: '#ef4444',
    behavior: '#ff9800',
    residual: '#ef4444',
  };

  function init(canvasId) {
    canvas = document.getElementById(canvasId || 'video-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    drawPlaceholder();
  }

  function drawPlaceholder() {
    if (!ctx) return;
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2a2a4a';
    ctx.font = '16px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('카메라 대기중...', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '12px "Cascadia Code", Consolas, monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Socket.IO 프레임 수신 대기', canvas.width / 2, canvas.height / 2 + 15);
    ctx.textAlign = 'start';
  }

  function handleFrame(data) {
    if (!ctx || !data.image) return;

    frameImg.onload = function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

      if (data.detections && data.detections.length > 0) {
        lastDetections = data.detections;
        // 프레임 원본 크기 → 캔버스 크기 스케일 비율 계산
        var scaleX = (frameImg.naturalWidth > 0) ? canvas.width / frameImg.naturalWidth : 1;
        var scaleY = (frameImg.naturalHeight > 0) ? canvas.height / frameImg.naturalHeight : 1;
        drawDetections(data.detections, scaleX, scaleY);
        if (onDetectionCallback) onDetectionCallback(data.detections);
      } else {
        lastDetections = [];
      }
    };
    frameImg.src = 'data:image/jpeg;base64,' + data.image;
  }

  function drawDetections(detections, scaleX, scaleY) {
    var sx = scaleX || 1;
    var sy = scaleY || 1;

    detections.forEach(function (det) {
      var color = COLORS[det.alert_level] || COLORS[det.type] || COLORS.normal;
      var bbox = det.bbox;
      if (!bbox || bbox.length < 4) return;

      // 원본 프레임 좌표 → 캔버스 좌표로 스케일링
      var x = bbox[0] * sx;
      var y = bbox[1] * sy;
      var w = (bbox[2] - bbox[0]) * sx;
      var h = (bbox[3] - bbox[1]) * sy;

      // 바운딩 박스
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, w, h);

      // 코너 강조
      var cornerLen = Math.min(w, h) * 0.15;
      ctx.lineWidth = 3.5;
      // 좌상
      ctx.beginPath();
      ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y);
      ctx.stroke();
      // 우상
      ctx.beginPath();
      ctx.moveTo(x + w - cornerLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cornerLen);
      ctx.stroke();
      // 좌하
      ctx.beginPath();
      ctx.moveTo(x, y + h - cornerLen); ctx.lineTo(x, y + h); ctx.lineTo(x + cornerLen, y + h);
      ctx.stroke();
      // 우하
      ctx.beginPath();
      ctx.moveTo(x + w - cornerLen, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cornerLen);
      ctx.stroke();

      // 라벨 배경
      if (det.label) {
        ctx.font = '13px "Segoe UI", "Malgun Gothic", sans-serif';
        var textWidth = ctx.measureText(det.label).width;
        var labelH = 20;
        var labelY = y - labelH - 2;
        if (labelY < 0) labelY = y + h + 2;

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x, labelY, textWidth + 12, labelH);
        ctx.globalAlpha = 1.0;

        ctx.fillStyle = '#fff';
        ctx.fillText(det.label, x + 6, labelY + 14);
      }

      // 신뢰도 표시
      if (det.confidence !== undefined) {
        var confText = (det.confidence * 100).toFixed(0) + '%';
        ctx.font = '11px "Cascadia Code", Consolas, monospace';
        ctx.fillStyle = color;
        ctx.fillText(confText, x + w + 4, y + 14);
      }
    });
  }

  function registerFace(name) {
    if (!name || !name.trim()) {
      return Promise.reject(new Error('이름이 필요합니다'));
    }

    // Canvas에서 현재 프레임 캡처
    var imageData = canvas ? canvas.toDataURL('image/jpeg', 0.9) : null;
    if (!imageData) {
      return Promise.reject(new Error('캡처할 프레임이 없습니다'));
    }

    return fetch('/api/register_face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        image: imageData.split(',')[1],
        consent: true,
      }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.error) throw new Error(data.error);
        return data;
      });
  }

  function onDetection(callback) {
    onDetectionCallback = callback;
  }

  function getLastDetections() {
    return lastDetections;
  }

  function clear() {
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    drawPlaceholder();
    lastDetections = [];
  }

  return {
    init: init,
    handleFrame: handleFrame,
    registerFace: registerFace,
    onDetection: onDetection,
    getLastDetections: getLastDetections,
    clear: clear,
    drawPlaceholder: drawPlaceholder,
  };
})();

window.VideoCanvas = VideoCanvas;
