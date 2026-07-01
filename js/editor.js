// js/editor.js
let currentData = null;
let currentSlug = null;

const reportSelect = document.getElementById('reportSelect');
const editorPane = document.getElementById('editorPane');
const previewFrame = document.getElementById('previewFrame');
const btnSave = document.getElementById('btnSave');
const statusBar = document.getElementById('statusBar');

async function loadIndex() {
  const res = await fetch('/reports/index.json');
  const { reports } = await res.json();
  reports.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.slug;
    opt.textContent = r.title;
    reportSelect.appendChild(opt);
  });
  if (reports.length > 0) loadReport(reports[0].slug);
}

async function loadReport(slug) {
  currentSlug = slug;
  const res = await fetch(`/reports/${slug}.json`);
  currentData = await res.json();
  renderEditor(currentData);
  updatePreview();
  statusBar.textContent = `로드됨: ${slug}.json`;
}

function renderEditor(data) {
  editorPane.innerHTML = `
    <div class="section-block">
      <p class="section-block-title">메타</p>
      <div class="field-group">
        <label class="field-label">제목</label>
        <input class="field-input" data-path="meta.title" value="${esc(data.meta.title)}">
      </div>
      <div class="field-group">
        <label class="field-label">부제목</label>
        <textarea class="field-textarea" data-path="meta.subtitle">${esc(data.meta.subtitle)}</textarea>
      </div>
    </div>
    <div class="section-block">
      <p class="section-block-title">요약 카드</p>
      <div class="field-group">
        <label class="field-label">공급기관</label>
        <input class="field-input" data-path="summary.organizer" value="${esc(data.summary.organizer)}">
      </div>
      <div class="field-group">
        <label class="field-label">모집 호수</label>
        <input class="field-input" type="number" data-path="summary.totalUnits" value="${data.summary.totalUnits}">
      </div>
      <div class="field-group">
        <label class="field-label">최저 월세</label>
        <input class="field-input" data-path="summary.minRent" value="${esc(data.summary.minRent)}">
      </div>
      <div class="field-group">
        <label class="field-label">신청 시작</label>
        <input class="field-input" data-path="summary.applyStart" value="${esc(data.summary.applyStart)}">
      </div>
      <div class="field-group">
        <label class="field-label">신청 마감</label>
        <input class="field-input" data-path="summary.applyEnd" value="${esc(data.summary.applyEnd)}">
      </div>
    </div>
    <div class="section-block">
      <p class="section-block-title">인트로</p>
      <div class="field-group">
        <label class="field-label">헤드라인</label>
        <input class="field-input" data-path="intro.headline" value="${esc(data.intro.headline)}">
      </div>
      <div class="field-group">
        <label class="field-label">본문 (HTML)</label>
        <textarea class="field-textarea" data-path="intro.body">${esc(data.intro.body)}</textarea>
      </div>
    </div>
    ${data.sections.map((s, i) => `
    <div class="section-block">
      <p class="section-block-title">${s.emoji} ${s.title}</p>
      <div class="field-group">
        <label class="field-label">리드 문구</label>
        <textarea class="field-textarea" data-path="sections.${i}.lead">${esc(s.lead)}</textarea>
      </div>
      <div class="field-group">
        <label class="field-label">컴포넌트 데이터 (JSON)</label>
        <textarea class="json-raw" data-path="sections.${i}.component.data" data-json="true">${JSON.stringify(s.component.data, null, 2)}</textarea>
      </div>
    </div>`).join('')}
    <div class="section-block">
      <p class="section-block-title">아웃트로</p>
      <div class="field-group">
        <label class="field-label">본문</label>
        <textarea class="field-textarea" data-path="outro.body">${esc(data.outro.body)}</textarea>
      </div>
    </div>
  `;
  bindInputs();
}

function bindInputs() {
  editorPane.querySelectorAll('[data-path]').forEach(el => {
    el.addEventListener('input', () => {
      const path = el.dataset.path.split('.');
      const isJson = el.dataset.json === 'true';
      try {
        const value = isJson ? JSON.parse(el.value) : (el.type === 'number' ? Number(el.value) : el.value);
        setDeep(currentData, path, value);
        updatePreview();
      } catch (e) {
        // JSON parse error — don't update yet
      }
    });
  });
}

function setDeep(obj, path, value) {
  const key = isNaN(path[0]) ? path[0] : Number(path[0]);
  if (path.length === 1) { obj[key] = value; return; }
  setDeep(obj[key], path.slice(1), value);
}

function updatePreview() {
  const slug = currentSlug;
  previewFrame.src = `/report.html?slug=${slug}&_t=${Date.now()}`;
}

btnSave.addEventListener('click', async () => {
  if (!currentSlug || !currentData) return;
  btnSave.textContent = '저장 중...';
  try {
    const res = await fetch(`/api/save/${currentSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentData)
    });
    const { ok } = await res.json();
    if (ok) {
      btnSave.textContent = '저장됨 ✓';
      btnSave.classList.add('saved');
      updatePreview();
      statusBar.textContent = `저장 완료: reports/${currentSlug}.json`;
      setTimeout(() => {
        btnSave.textContent = '저장';
        btnSave.classList.remove('saved');
      }, 2000);
    }
  } catch (e) {
    btnSave.textContent = '오류';
    statusBar.textContent = `저장 실패: ${e.message}`;
  }
});

reportSelect.addEventListener('change', () => loadReport(reportSelect.value));

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

loadIndex();
