// js/edit.js

const slug = new URLSearchParams(location.search).get('slug');
if (!slug) location.href = '/';

let data = null;
let editors = {};

function showToast(msg, error = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = error ? '#DC2626' : '#111';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function fillForm(d) {
  document.getElementById('f-title').value = d.meta?.title || '';
  document.getElementById('f-subtitle').value = d.meta?.subtitle || '';
  document.getElementById('f-badge').value = d.meta?.badge || '';
  document.getElementById('f-publishedAt').value = d.meta?.publishedAt || '';
  document.getElementById('f-sourceUrl').value = d.meta?.sourceUrl || '';
  document.getElementById('f-organizer').value = d.summary?.organizer || '';
  document.getElementById('f-totalUnits').value = d.summary?.totalUnits || '';
  document.getElementById('f-minRent').value = d.summary?.minRent || '';
  document.getElementById('f-applyStart').value = d.summary?.applyStart || '';
  document.getElementById('f-applyEnd').value = d.summary?.applyEnd || '';
  document.getElementById('pageTitle').textContent = d.meta?.title || slug;
}

function collectData() {
  const d = JSON.parse(JSON.stringify(data));
  d.meta = {
    ...d.meta,
    title: document.getElementById('f-title').value,
    subtitle: document.getElementById('f-subtitle').value,
    badge: document.getElementById('f-badge').value,
    publishedAt: document.getElementById('f-publishedAt').value,
    sourceUrl: document.getElementById('f-sourceUrl').value,
  };
  d.summary = {
    ...d.summary,
    organizer: document.getElementById('f-organizer').value,
    totalUnits: parseInt(document.getElementById('f-totalUnits').value) || 0,
    minRent: document.getElementById('f-minRent').value,
    applyStart: document.getElementById('f-applyStart').value,
    applyEnd: document.getElementById('f-applyEnd').value,
  };
  try { d.intro = JSON.parse(editors.intro.getValue()); } catch(e) {}
  try { d.sections = JSON.parse(editors.sections.getValue()); } catch(e) {}
  try { d.outro = JSON.parse(editors.outro.getValue()); } catch(e) {}
  return d;
}

async function save() {
  const d = collectData();
  const res = await fetch(`/api/reports/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(d),
  });
  if (res.ok) showToast('저장됐습니다.');
  else showToast('저장 실패', true);
}

async function deploy() {
  const btn = document.getElementById('deployBtn');
  btn.textContent = '배포 중...';
  btn.disabled = true;
  try {
    const res = await fetch('/api/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `update ${slug} ${new Date().toISOString().slice(0,10)}` })
    });
    const d = await res.json();
    if (res.ok) showToast('배포 완료!');
    else showToast('배포 실패: ' + d.error, true);
  } finally {
    btn.textContent = '배포';
    btn.disabled = false;
  }
}

function initMonaco(callback) {
  require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' } });
  require(['vs/editor/editor.main'], callback);
}

function createEditor(containerId, value) {
  return monaco.editor.create(document.getElementById(containerId), {
    value,
    language: 'json',
    theme: 'vs',
    minimap: { enabled: false },
    fontSize: 12,
    lineNumbers: 'off',
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    automaticLayout: true,
    formatOnPaste: true,
  });
}

async function init() {
  const res = await fetch(`/api/reports/${encodeURIComponent(slug)}`);
  if (!res.ok) { showToast('리포트를 찾을 수 없습니다.', true); return; }
  data = await res.json();
  fillForm(data);

  initMonaco(() => {
    editors.intro = createEditor('editor-intro', JSON.stringify(data.intro || {}, null, 2));
    editors.sections = createEditor('editor-sections', JSON.stringify(data.sections || [], null, 2));
    editors.outro = createEditor('editor-outro', JSON.stringify(data.outro || {}, null, 2));
  });
}

document.getElementById('saveBtn').addEventListener('click', save);
document.getElementById('deployBtn').addEventListener('click', deploy);

init();
