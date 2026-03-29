/**
 * SafeWay Kids Edge AI PoC — Field UI Preview (T27)
 *
 * - 모달 팝업으로 현장 UI 프리뷰
 * - 인솔교사 뷰: 큰 버튼 3개(승차/운행/하차) + 체크리스트
 * - 운전기사 뷰: 최소 정보 + LED 상태
 * - 전환 토글
 */

const FieldUI = (function () {
  'use strict';

  let modalEl = null;
  let bodyEl = null;
  let tabTeacher = null;
  let tabDriver = null;
  let currentTab = 'teacher';
  let currentStatus = 'boarding'; // boarding, transit, alighting

  // 체크리스트 상태
  let checklist = {
    seatbelt: false,
    headcount: false,
    door_closed: false,
    emergency_kit: false,
    camera_active: false,
  };

  function init() {
    modalEl = document.getElementById('field-ui-modal');
    bodyEl = document.getElementById('field-ui-body');
    tabTeacher = document.getElementById('tab-teacher');
    tabDriver = document.getElementById('tab-driver');
  }

  function open() {
    if (modalEl) modalEl.classList.remove('hidden');
    render();
  }

  function close() {
    if (modalEl) modalEl.classList.add('hidden');
  }

  function toggle() {
    if (!modalEl) return;
    if (modalEl.classList.contains('hidden')) {
      open();
    } else {
      close();
    }
  }

  function switchTab(tab) {
    currentTab = tab;
    if (tabTeacher && tabDriver) {
      tabTeacher.classList.toggle('active', tab === 'teacher');
      tabDriver.classList.toggle('active', tab === 'driver');
    }
    render();
  }

  function setStatus(status) {
    currentStatus = status;
    render();
  }

  function render() {
    if (!bodyEl) return;
    if (currentTab === 'teacher') {
      renderTeacherView();
    } else {
      renderDriverView();
    }
  }

  function renderTeacherView() {
    var statusLabels = {
      boarding: '승차 진행중',
      transit: '운행중',
      alighting: '하차 진행중',
    };

    var html = '';

    // 상태 표시
    html += '<div style="text-align:center;margin-bottom:16px;">';
    html += '<div style="font-size:0.75rem;color:var(--text-dim);margin-bottom:4px;">현재 상태</div>';
    html += '<div style="font-size:1.1rem;font-weight:700;color:var(--blue-light);">' + (statusLabels[currentStatus] || '대기') + '</div>';
    html += '</div>';

    // 큰 버튼 3개
    html += '<div class="field-big-buttons">';
    html += '<button class="btn-field-action btn-board' + (currentStatus === 'boarding' ? ' active-field' : '') + '" onclick="FieldUI.setStatus(\'boarding\')">';
    html += '<span style="font-size:1.4rem;">&#x1F6B8;</span> 승차 확인';
    html += '</button>';
    html += '<button class="btn-field-action btn-transit' + (currentStatus === 'transit' ? ' active-field' : '') + '" onclick="FieldUI.setStatus(\'transit\')">';
    html += '<span style="font-size:1.4rem;">&#x1F68C;</span> 운행 시작';
    html += '</button>';
    html += '<button class="btn-field-action btn-alight' + (currentStatus === 'alighting' ? ' active-field' : '') + '" onclick="FieldUI.setStatus(\'alighting\')">';
    html += '<span style="font-size:1.4rem;">&#x1F6B6;</span> 하차 확인';
    html += '</button>';
    html += '</div>';

    // 체크리스트
    html += '<div style="font-size:0.8rem;color:var(--text-dim);font-weight:600;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">안전 체크리스트</div>';
    html += '<ul class="field-checklist">';

    var items = [
      { key: 'seatbelt', label: '안전벨트 착용 확인' },
      { key: 'headcount', label: '탑승 인원 확인' },
      { key: 'door_closed', label: '차량 문 잠금' },
      { key: 'emergency_kit', label: '비상 키트 확인' },
      { key: 'camera_active', label: 'AI 카메라 정상 작동' },
    ];

    items.forEach(function (item) {
      var done = checklist[item.key];
      html += '<li onclick="FieldUI.toggleCheck(\'' + item.key + '\')" style="cursor:pointer;">';
      html += '<span class="check-icon ' + (done ? 'check-done' : 'check-pending') + '">';
      html += done ? '&#10003;' : '&#9675;';
      html += '</span>';
      html += '<span style="color:' + (done ? 'var(--text-primary)' : 'var(--text-secondary)') + '">' + item.label + '</span>';
      html += '</li>';
    });

    html += '</ul>';
    bodyEl.innerHTML = html;
  }

  function renderDriverView() {
    var ledStates = {
      boarding: { green: true, yellow: false, red: false, msg: '승차 진행중 — 안전 운행 준비', color: 'var(--green-light)' },
      transit: { green: true, yellow: false, red: false, msg: '정상 운행중', color: 'var(--green-light)' },
      alighting: { green: false, yellow: true, red: false, msg: '하차 확인중 — 대기', color: 'var(--yellow)' },
      alert: { green: false, yellow: false, red: true, msg: '경고 — 즉시 정차', color: 'var(--red-light)' },
    };

    var state = ledStates[currentStatus] || ledStates.boarding;

    var html = '';

    // LED 디스플레이
    html += '<div class="driver-status-led">';
    html += '<div class="led ' + (state.green ? 'led-green' : '') + '" style="' + (state.green ? '' : 'opacity:0.15;box-shadow:none;') + '"></div>';
    html += '<div class="led ' + (state.yellow ? 'led-yellow' : '') + '" style="' + (state.yellow ? 'opacity:1;' : 'opacity:0.15;box-shadow:none;') + '"></div>';
    html += '<div class="led ' + (state.red ? 'led-red' : '') + '" style="' + (state.red ? 'opacity:1;' : 'opacity:0.15;box-shadow:none;') + '"></div>';
    html += '</div>';

    // 상태 메시지
    html += '<div class="driver-message" style="color:' + state.color + ';">' + state.msg + '</div>';

    // 최소 정보
    html += '<div style="text-align:center;padding:16px;border-top:1px solid var(--border-panel);">';
    html += '<div style="font-size:0.75rem;color:var(--text-dim);margin-bottom:8px;">운전기사 뷰는 운전 중 최소한의 정보만 표시합니다</div>';
    html += '<div style="display:flex;justify-content:center;gap:24px;font-size:0.85rem;">';
    html += '<div><span style="color:var(--text-dim);">탑승:</span> <span style="color:var(--text-primary);font-weight:700;">3명</span></div>';
    html += '<div><span style="color:var(--text-dim);">AI:</span> <span style="color:var(--green-light);font-weight:700;">정상</span></div>';
    html += '</div>';
    html += '</div>';

    bodyEl.innerHTML = html;
  }

  function toggleCheck(key) {
    checklist[key] = !checklist[key];
    render();
  }

  function resetChecklist() {
    Object.keys(checklist).forEach(function (k) {
      checklist[k] = false;
    });
  }

  return {
    init: init,
    open: open,
    close: close,
    toggle: toggle,
    switchTab: switchTab,
    setStatus: setStatus,
    toggleCheck: toggleCheck,
    resetChecklist: resetChecklist,
  };
})();

window.FieldUI = FieldUI;
