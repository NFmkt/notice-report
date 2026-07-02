// js/edit.js

const slug = new URLSearchParams(location.search).get('slug');
if (!slug) location.href = '/';

const VIEWER_URL = `http://localhost:4710/report?slug=${encodeURIComponent(slug)}`;

let data = null;
let editors = {};
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
  try { d.intro    = JSON.parse(editors.intro.getValue());    } catch(e) {}
  try { d.sections = JSON.parse(editors.sections.getValue()); } catch(e) {}
  try { d.outro    = JSON.parse(editors.outro.getValue());    } catch(e) {}
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
    // re-layout Monaco if expanding
    if (isCollapsed) setTimeout(() => Object.values(editors).forEach(e => e.layout()), 200);
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

  // re-layout Monaco when editor pane becomes visible
  if (panelId === 'editor') {
    setTimeout(() => Object.values(editors).forEach(e => e.layout()), 50);
  }
}

// ─── Editor sub-tabs ─────────────────────────────────
let activeEditor = 'intro';

function switchEditor(editorKey) {
  activeEditor = editorKey;

  document.querySelectorAll('.editor-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.editor === editorKey);
  });

  document.querySelectorAll('.monaco-container').forEach(el => {
    el.classList.toggle('hidden', el.id !== `editor-${editorKey}`);
  });

  // Monaco needs a layout call after becoming visible
  setTimeout(() => editors[editorKey]?.layout(), 30);
}

// ─── JSON validation status ───────────────────────────
function updateJsonStatus() {
  const key = activeEditor;
  const val = editors[key]?.getValue() || '';
  let valid = true;
  try { JSON.parse(val); } catch(e) { valid = false; }
  document.getElementById('statusOk').hidden = !valid;
  document.getElementById('statusErr').hidden = valid;
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
    // throttled Monaco layout
    Object.values(editors).forEach(ed => ed.layout());
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

// ─── Monaco setup ────────────────────────────────────
function createEditor(containerId, value) {
  return monaco.editor.create(document.getElementById(containerId), {
    value,
    language: 'json',
    theme: 'vs',
    minimap: { enabled: false },
    fontSize: 12,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    wordWrap: 'off',
    automaticLayout: false, // manual layout for performance
    formatOnPaste: true,
    tabSize: 2,
    renderLineHighlight: 'line',
    scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
  });
}

// ─── Init ────────────────────────────────────────────
async function init() {
  const res = await fetch(`/api/reports/${encodeURIComponent(slug)}`);
  if (!res.ok) { showToast('리포트를 찾을 수 없습니다.', true); return; }
  data = await res.json();
  fillForm(data);

  // Load preview
  document.getElementById('previewFrame').src = VIEWER_URL;

  // Monaco
  require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' } });
  require(['vs/editor/editor.main'], () => {
    editors.intro    = createEditor('editor-intro',    JSON.stringify(data.intro    || {}, null, 2));
    editors.sections = createEditor('editor-sections', JSON.stringify(data.sections || [], null, 2));
    editors.outro    = createEditor('editor-outro',    JSON.stringify(data.outro    || {}, null, 2));

    // watch for changes
    Object.entries(editors).forEach(([key, ed]) => {
      ed.onDidChangeModelContent(() => {
        markDirty();
        if (key === activeEditor) updateJsonStatus();
      });
    });
    updateJsonStatus();
  });

  // Sidebar icon clicks
  document.querySelectorAll('.sidebar-icon').forEach(btn => {
    btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
  });

  // Editor sub-tab clicks
  document.querySelectorAll('.editor-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      switchEditor(btn.dataset.editor);
      updateJsonStatus();
    });
  });

  // Form dirty on any input
  document.querySelectorAll('.field-input').forEach(el => {
    el.addEventListener('input', markDirty);
  });

  // Action buttons
  document.getElementById('saveBtn').addEventListener('click', save);
  document.getElementById('deployBtn').addEventListener('click', deploy);
  document.getElementById('refreshPreviewBtn').addEventListener('click', refreshPreview);

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
