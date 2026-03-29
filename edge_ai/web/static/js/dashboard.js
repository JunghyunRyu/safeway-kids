/**
 * SafeWay Kids Edge AI PoC — Performance Dashboard (T26)
 *
 * - 실시간 성능: CPU%, Memory MB, FPS, Inference ms
 * - div width% 방식의 bar 시각화
 * - Socket.IO 'performance' 이벤트 수신
 */

const Dashboard = (function () {
  'use strict';

  // DOM 요소 캐시
  let els = {};

  // 모델 이름 매핑
  const MODEL_NAMES = {
    boarding: 'YOLOv8n + ArcFace',
    transit: 'YOLOv8n + BehaviorNet',
    alighting: 'YOLOv8n + ResidualScan',
    post_trip: 'LiDAR + Ultrasonic Fusion',
  };

  function init() {
    els = {
      cpu: document.getElementById('metric-cpu'),
      memory: document.getElementById('metric-memory'),
      fps: document.getElementById('metric-fps'),
      inference: document.getElementById('metric-inference'),
      model: document.getElementById('metric-model'),
      barCpu: document.getElementById('bar-cpu'),
      barMemory: document.getElementById('bar-memory'),
    };
  }

  function update(data) {
    if (!data) return;

    var cpuPct = (data.cpu_percent || 0);
    var memPct = (data.memory_percent || 0);
    var fps = (data.fps || 0);
    var inferenceMs = (data.inference_ms || 0);

    if (els.cpu) els.cpu.textContent = cpuPct.toFixed(1) + '%';
    if (els.memory) els.memory.textContent = memPct.toFixed(1) + '%';
    if (els.fps) els.fps.textContent = fps.toFixed(1);
    if (els.inference) els.inference.textContent = inferenceMs.toFixed(0) + ' ms';

    // 바 업데이트
    if (els.barCpu) {
      els.barCpu.style.width = Math.min(cpuPct, 100) + '%';
      els.barCpu.style.background = cpuPct > 80 ? 'var(--red)' : cpuPct > 60 ? 'var(--orange)' : 'var(--blue)';
    }
    if (els.barMemory) {
      els.barMemory.style.width = Math.min(memPct, 100) + '%';
      els.barMemory.style.background = memPct > 80 ? 'var(--red)' : memPct > 60 ? 'var(--orange)' : 'var(--orange)';
    }

    if (data.model_name && els.model) {
      els.model.textContent = data.model_name;
    }
  }

  function setModel(scenarioMode) {
    if (els.model && MODEL_NAMES[scenarioMode]) {
      els.model.textContent = MODEL_NAMES[scenarioMode];
    }
  }

  function reset() {
    update({ cpu_percent: 0, memory_percent: 0, fps: 0, inference_ms: 0 });
    if (els.model) els.model.textContent = '--';
  }

  // 시뮬레이션 모드: 서버 없이도 동적 지표 표시
  let simInterval = null;

  function startSimulation(scenarioMode) {
    stopSimulation();
    setModel(scenarioMode);

    var baseCpu = scenarioMode === 'post_trip' ? 15 : 35;
    var baseMem = scenarioMode === 'post_trip' ? 20 : 45;
    var baseFps = scenarioMode === 'post_trip' ? 10 : 24;
    var baseInf = scenarioMode === 'post_trip' ? 8 : 42;

    simInterval = setInterval(function () {
      update({
        cpu_percent: baseCpu + (Math.random() * 15 - 5),
        memory_percent: baseMem + (Math.random() * 10 - 3),
        fps: baseFps + (Math.random() * 6 - 2),
        inference_ms: baseInf + (Math.random() * 10 - 3),
      });
    }, 1000);
  }

  function stopSimulation() {
    if (simInterval) {
      clearInterval(simInterval);
      simInterval = null;
    }
  }

  return {
    init: init,
    update: update,
    setModel: setModel,
    reset: reset,
    startSimulation: startSimulation,
    stopSimulation: stopSimulation,
  };
})();

window.Dashboard = Dashboard;
