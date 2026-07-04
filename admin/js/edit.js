// js/edit.js
import { initLocationMaps } from '../../js/location-map.js';

const slug = new URLSearchParams(location.search).get('slug');
if (!slug) location.href = '/';

const VIEWER_URL = `/report.html?slug=${encodeURIComponent(slug)}`;

let data = null;
let isDirty = false;

// ─── Toast ───────────────────────────────────────────
function showToast(msg, error = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = error ? '#DC2626' : '#1E293B';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── Dirty state ─────────────────────────────────────
function markDirty() {
  if (isDirty) return;
  isDirty = true;
  document.getElementById('dirtyIndicator').hidden = false;
}
function clearDirty() {
  isDirty = false;
  document.getElementById('dirtyIndicator').hidden = true;
}

// ─── Form fill / collect ─────────────────────────────
function fillForm(d) {
  document.getElementById('f-title').value       = d.meta?.title || '';
  document.getElementById('f-subtitle').value    = d.meta?.subtitle || '';
  document.getElementById('f-badge').value       = d.meta?.badge || '';
  document.getElementById('f-publishedAt').value = d.meta?.publishedAt || '';
  document.getElementById('f-sourceUrl').value   = d.meta?.sourceUrl || '';
  document.getElementById('f-organizer').value   = d.summary?.organizer || '';
  document.getElementById('f-totalUnits').value  = d.summary?.totalUnits || '';
  document.getElementById('f-minRent').value     = d.summary?.minRent || '';
  document.getElementById('f-applyStart').value  = d.summary?.applyStart || '';
  document.getElementById('f-applyEnd').value    = d.summary?.applyEnd || '';
  document.getElementById('pageTitle').textContent = d.meta?.title || slug;
  document.getElementById('openViewerBtn').href = VIEWER_URL;
}

function collectData() {
  const d = JSON.parse(JSON.stringify(data));
  d.meta = {
    ...d.meta,
    title:       document.getElementById('f-title').value,
    subtitle:    document.getElementById('f-subtitle').value,
    badge:       document.getElementById('f-badge').value,
    publishedAt: document.getElementById('f-publishedAt').value,
    sourceUrl:   document.getElementById('f-sourceUrl').value,
  };
  d.summary = {
    ...d.summary,
    organizer:  document.getElementById('f-organizer').value,
    totalUnits: parseInt(document.getElementById('f-totalUnits').value) || 0,
    minRent:    document.getElementById('f-minRent').value,
    applyStart: document.getElementById('f-applyStart').value,
    applyEnd:   document.getElementById('f-applyEnd').value,
  };
  // intro/sections/outro will be wired in later slices
  return d;
}

// ─── Save / Deploy ───────────────────────────────────
async function save() {
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  const d = collectData();
  try {
    const res = await fetch(`/api/reports/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d),
    });
    if (res.ok) {
      showToast('저장됐습니다.');
      clearDirty();
      refreshPreview();
    } else {
      showToast('저장 실패', true);
    }
  } catch(e) {
    showToast('저장 실패: ' + e.message, true);
  } finally {
    btn.disabled = false;
  }
}

async function deploy() {
  const btn = document.getElementById('deployBtn');
  btn.textContent = '배포 중...';
  btn.disabled = true;
  try {
    const res = await fetch('/api/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `update ${slug} ${new Date().toISOString().slice(0,10)}` }),
    });
    const json = await res.json();
    if (res.ok) showToast('배포 완료!');
    else showToast('배포 실패: ' + json.error, true);
  } catch(e) {
    showToast('배포 실패', true);
  } finally {
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>배포`;
    btn.disabled = false;
  }
}

// ─── Preview ─────────────────────────────────────────
function refreshPreview() {
  const frame = document.getElementById('previewFrame');
  frame.src = VIEWER_URL;
}

// ─── Icon sidebar panel toggle ───────────────────────
let activePanel = 'meta';

function switchPanel(panelId) {
  const isSame = panelId === activePanel;
  const leftPanel = document.getElementById('leftPanel');

  // clicking active icon collapses the panel
  if (isSame) {
    const isCollapsed = leftPanel.classList.contains('collapsed');
    leftPanel.classList.toggle('collapsed', !isCollapsed);
    return;
  }

  activePanel = panelId;
  leftPanel.classList.remove('collapsed');

  // update sidebar active state
  document.querySelectorAll('.sidebar-icon').forEach(btn => {
    const isActive = btn.dataset.panel === panelId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive);
  });

  // switch panes
  document.querySelectorAll('.panel-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `pane-${panelId}`);
  });

  if (panelId === 'location') {
    updateLocationPanel();
  }
}

// ─── Editor sub-tabs ─────────────────────────────────
let activeEditor = 'intro';

function switchEditor(editorKey) {
  activeEditor = editorKey;

  document.querySelectorAll('.editor-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.editor === editorKey);
  });

  document.querySelectorAll('.form-pane').forEach(el => {
    el.classList.toggle('hidden', el.id !== `form-${editorKey}`);
  });
}

// ─── Drag to resize left panel ───────────────────────
function initDragResize() {
  const handle = document.getElementById('dragHandle');
  const panel  = document.getElementById('leftPanel');
  const iconSidebarW = 52;
  let dragging = false;

  handle.addEventListener('mousedown', e => {
    dragging = true;
    handle.classList.add('dragging');
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const newW = Math.max(200, Math.min(600, e.clientX - iconSidebarW));
    panel.style.width = newW + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  });
}

// ─── Viewport toggle ─────────────────────────────────
function initViewportToggle() {
  const wrap = document.getElementById('previewFrameWrap');
  document.getElementById('vpDesktop').addEventListener('click', () => {
    wrap.classList.remove('mobile-vp');
    document.getElementById('vpDesktop').classList.add('active');
    document.getElementById('vpMobile').classList.remove('active');
  });
  document.getElementById('vpMobile').addEventListener('click', () => {
    wrap.classList.add('mobile-vp');
    document.getElementById('vpMobile').classList.add('active');
    document.getElementById('vpDesktop').classList.remove('active');
  });
}

// ─── Location panel ──────────────────────────────────
function updateLocationPanel() {
  const content = document.getElementById('locationPaneContent');
  if (!content) return;

  // Clear previous map canvases to avoid re-initialization issues
  content.innerHTML = '';

  let sections = [];
  try {
    sections = data?.sections || [];
  } catch {
    content.innerHTML = '<div class="loc-panel-empty loc-panel-error">섹션 데이터가 유효하지 않습니다.</div>';
    return;
  }

  // Collect all location-card locations from sections
  const allLocs = [];
  sections.forEach(sec => {
    if (sec.component?.type === 'location-card') {
      (sec.component.data?.locations || []).forEach(l => allLocs.push(l));
    }
    (sec.blocks || []).forEach(block => {
      if (block.type === 'location-card') {
        (block.data?.locations || []).forEach(l => allLocs.push(l));
      }
    });
  });

  if (!allLocs.length) {
    content.innerHTML = '<div class="loc-panel-empty">섹션 JSON에 location-card 블록을<br>추가하면 지도가 표시됩니다.</div>';
    return;
  }

  const listHtml = allLocs.map(l => `
    <div class="loc-panel-item">
      <div class="loc-panel-name">${l.name || ''}</div>
      <div class="loc-panel-addr">${l.address || ''}${l.detail ? `<span class="loc-panel-detail"> ${l.detail}</span>` : ''}</div>
      ${l.transit ? `<div class="loc-panel-transit">${l.transit}</div>` : ''}
    </div>
  `).join('');

  const mapData = encodeURIComponent(JSON.stringify(
    allLocs.map(l => ({ name: l.name || '', address: l.address || '' }))
  ));

  content.innerHTML = `
    <div class="loc-panel-list">${listHtml}</div>
    <div class="loc-map-container loc-map-admin" data-locations="${mapData}"></div>
  `;

  initLocationMaps(content);
}

// ─── Init ────────────────────────────────────────────
async function init() {
  const res = await fetch(`/api/reports/${encodeURIComponent(slug)}`);
  if (!res.ok) { showToast('리포트를 찾을 수 없습니다.', true); return; }
  data = await res.json();
  fillForm(data);

  // Load preview
  document.getElementById('previewFrame').src = VIEWER_URL;

  // Sidebar icon clicks
  document.querySelectorAll('.sidebar-icon').forEach(btn => {
    btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
  });

  // Editor sub-tab clicks
  document.querySelectorAll('.editor-tab').forEach(btn => {
    btn.addEventListener('click', () => switchEditor(btn.dataset.editor));
  });

  // Form dirty on any input
  document.querySelectorAll('.field-input').forEach(el => {
    el.addEventListener('input', markDirty);
  });

  // Action buttons
  document.getElementById('saveBtn').addEventListener('click', save);
  document.getElementById('deployBtn').addEventListener('click', deploy);
  document.getElementById('refreshPreviewBtn').addEventListener('click', refreshPreview);
  document.getElementById('refreshLocationBtn').addEventListener('click', updateLocationPanel);

  // Keyboard shortcut
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      save();
    }
  });

  // Unload warning
  window.addEventListener('beforeunload', e => {
    if (isDirty) { e.preventDefault(); e.returnValue = ''; }
  });

  initDragResize();
  initViewportToggle();
}

init();
