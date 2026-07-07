// admin/js/edit.js
import { initLocationMaps } from '../../js/location-map.js';

const slug = new URLSearchParams(location.search).get('slug');
if (!slug) location.href = '/';

const VIEWER_URL = `/report.html?slug=${encodeURIComponent(slug)}`;

let data = null;
let isDirty = false;
let previewTimer = null;

// Expose to window for inline HTML event handlers
const _e = {};
window._e = _e;

const TYPE_COLORS = {
  'supply-overview': '#2563EB',
  'bullet-card':     '#16A34A',
  'table-card':      '#D97706',
  'timeline':        '#7C3AED',
  'qa-list':         '#DC2626',
  'location-card':   '#0891B2',
};

const TYPE_NAMES = {
  'supply-overview': '공급 개요',
  'bullet-card':     '자격 조건',
  'table-card':      '임대조건',
  'timeline':        '일정',
  'qa-list':         '주의/FAQ',
  'location-card':   '위치',
};

const COMPONENT_DEFAULTS = {
  'supply-overview': { houseTypes: [{ type: '', units: 0 }], areaRange: '', locations: [] },
  'bullet-card':     { groups: [{ label: '', items: [''] }] },
  'table-card':      { rentRows: [{ label: '', deposit: '', rentRange: '' }], notes: [], conversion: null },
  'timeline':        { method: '', steps: [{ label: '', date: '', highlight: false }] },
  'qa-list':         { type: 'caution', bullets: [{ label: '', items: [''] }] },
  'location-card':   { locations: [{ name: '', address: '', detail: '', transit: '' }] },
};

// ─── Utility ─────────────────────────────────────────
function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const ICON_X = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

// ─── Toast ───────────────────────────────────────────
function showToast(msg, error = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = error ? '#DC2626' : '#1E293B';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── Dirty / preview ─────────────────────────────────
function markDirty() {
  isDirty = true;
  document.getElementById('dirtyIndicator').hidden = false;
}
function clearDirty() {
  isDirty = false;
  document.getElementById('dirtyIndicator').hidden = true;
}

function schedulePreview() {
  markDirty();
  clearTimeout(previewTimer);
  previewTimer = setTimeout(async () => {
    try {
      await fetch(`/api/reports/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collectData()),
      });
      refreshPreview();
    } catch (_) {}
  }, 1500);
}
_e.sp = schedulePreview;

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
  renderIntroForm();
  renderSectionsForm();
  renderOutroForm();
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
  return d;
}

// ─── Intro form ──────────────────────────────────────
let quillIntro = null;

function renderIntroForm() {
  const pane = document.getElementById('form-intro');
  pane.innerHTML = `
    <div class="field-group">
      <label>헤드라인</label>
      <input type="text" class="field-input" id="intro-headline" value="${esc(data.intro?.headline || '')}">
    </div>
    <div class="field-group">
      <label>본문</label>
      <div id="quill-intro-mount" class="quill-mount"></div>
    </div>
  `;

  document.getElementById('intro-headline').addEventListener('input', e => {
    if (!data.intro) data.intro = {};
    data.intro.headline = e.target.value;
    schedulePreview();
  });

  quillIntro = new Quill('#quill-intro-mount', {
    theme: 'snow',
    modules: { toolbar: [['bold', 'italic'], ['clean']] },
  });
  if (data.intro?.body) quillIntro.root.innerHTML = data.intro.body;
  quillIntro.on('text-change', () => {
    if (!data.intro) data.intro = {};
    data.intro.body = quillIntro.root.innerHTML;
    schedulePreview();
  });
}

// ─── Outro form ──────────────────────────────────────
let quillOutro = null;

function renderOutroForm() {
  const pane = document.getElementById('form-outro');
  pane.innerHTML = `
    <div class="field-group">
      <label>본문</label>
      <div id="quill-outro-mount" class="quill-mount"></div>
    </div>
    <div class="field-group">
      <label>버튼 텍스트</label>
      <input type="text" class="field-input" id="outro-ctalabel" value="${esc(data.outro?.ctaLabel || '')}">
    </div>
    <div class="field-group">
      <label>버튼 URL</label>
      <input type="text" class="field-input" id="outro-ctaurl" value="${esc(data.outro?.ctaUrl || '')}">
    </div>
  `;

  quillOutro = new Quill('#quill-outro-mount', {
    theme: 'snow',
    modules: { toolbar: [['bold', 'italic'], ['clean']] },
  });
  if (data.outro?.body) quillOutro.root.innerHTML = data.outro.body;
  quillOutro.on('text-change', () => {
    if (!data.outro) data.outro = {};
    data.outro.body = quillOutro.root.innerHTML;
    schedulePreview();
  });

  document.getElementById('outro-ctalabel').addEventListener('input', e => {
    if (!data.outro) data.outro = {};
    data.outro.ctaLabel = e.target.value;
    schedulePreview();
  });
  document.getElementById('outro-ctaurl').addEventListener('input', e => {
    if (!data.outro) data.outro = {};
    data.outro.ctaUrl = e.target.value;
    schedulePreview();
  });
}

// ─── Sections form ───────────────────────────────────
function renderSectionsForm() {
  const pane = document.getElementById('form-sections');
  pane.innerHTML = '';

  const list = document.createElement('div');
  list.id = 'sections-list';
  list.className = 'sections-list';
  (data.sections || []).forEach((sec, i) => list.appendChild(buildSectionCard(sec, i)));
  pane.appendChild(list);

  const addBtn = document.createElement('button');
  addBtn.className = 'add-section-btn';
  addBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 섹션 추가`;
  addBtn.addEventListener('click', showAddSectionModal);
  pane.appendChild(addBtn);

  Sortable.create(list, {
    handle: '.section-drag-handle',
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd(evt) {
      const moved = data.sections.splice(evt.oldIndex, 1)[0];
      data.sections.splice(evt.newIndex, 0, moved);
      schedulePreview();
    },
  });
}
_e.rs = renderSectionsForm;

function buildSectionCard(sec, i) {
  const card = document.createElement('div');
  card.className = 'section-card';
  card.style.setProperty('--card-color', TYPE_COLORS[sec.component?.type] || '#CBD5E1');

  const typeName = TYPE_NAMES[sec.component?.type] || sec.component?.type || '—';

  card.innerHTML = `
    <div class="section-card-header">
      <span class="section-drag-handle" title="드래그해서 순서 변경">⠿</span>
      <span class="section-card-emoji">${esc(sec.emoji || '📄')}</span>
      <span class="section-card-title">${esc(sec.title || '새 섹션')}</span>
      <span class="section-type-badge" style="background:color-mix(in srgb, var(--card-color) 12%, transparent);color:var(--card-color)">${esc(typeName)}</span>
      <button class="section-card-delete" title="섹션 삭제">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
      <svg class="section-card-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
    <div class="section-card-body collapsed" id="sec-body-${i}">
      ${commonFieldsHtml(sec, i)}
      <div class="comp-form">
        <div class="comp-form-label">컴포넌트 유형</div>
        <select class="comp-type-select">
          ${Object.entries(TYPE_NAMES).map(([t, n]) =>
            `<option value="${t}"${sec.component?.type === t ? ' selected' : ''}>${n} (${t})</option>`
          ).join('')}
        </select>
        <div class="comp-form-fields" id="comp-fields-${i}">
          ${buildComponentForm(sec.component?.type, sec.component?.data || {}, i)}
        </div>
      </div>
      ${buildLocationBlockForm(sec, i)}
      ${buildImagesForm(sec, i)}
      ${buildTermsAccordion(sec.terms || [], i)}
    </div>
  `;

  // Toggle open/close — accordion: only one section open at a time
  card.querySelector('.section-card-header').addEventListener('click', e => {
    if (e.target.closest('.section-card-delete, .section-drag-handle')) return;
    const body = document.getElementById(`sec-body-${i}`);
    const willOpen = body.classList.contains('collapsed');
    // close all others
    document.querySelectorAll('.section-card-body').forEach(b => b.classList.add('collapsed'));
    document.querySelectorAll('.section-card').forEach(c => c.classList.remove('open'));
    if (willOpen) {
      body.classList.remove('collapsed');
      card.classList.add('open');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  // Delete section
  card.querySelector('.section-card-delete').addEventListener('click', e => {
    e.stopPropagation();
    if (!confirm('이 섹션을 삭제할까요?')) return;
    data.sections.splice(i, 1);
    renderSectionsForm();
    schedulePreview();
  });

  // Component type change
  card.querySelector('.comp-type-select').addEventListener('change', e => {
    const newType = e.target.value;
    if (!confirm('타입 변경 시 컴포넌트 데이터가 초기화됩니다. 계속할까요?')) {
      e.target.value = sec.component?.type || '';
      return;
    }
    data.sections[i].component = {
      type: newType,
      data: JSON.parse(JSON.stringify(COMPONENT_DEFAULTS[newType])),
    };
    renderSectionsForm();
    schedulePreview();
  });

  // Wire common fields (emoji, id, title, lead)
  card.querySelectorAll('[data-sf]').forEach(el => {
    el.addEventListener('input', e => {
      const field = e.target.dataset.sf;
      data.sections[i][field] = e.target.value;
      if (field === 'title') card.querySelector('.section-card-title').textContent = e.target.value || '새 섹션';
      if (field === 'emoji') card.querySelector('.section-card-emoji').textContent = e.target.value || '📄';
      schedulePreview();
    });
  });

  return card;
}

function commonFieldsHtml(sec, i) {
  return `
    <div class="field-row">
      <div class="field-group">
        <label>이모지</label>
        <input type="text" class="field-input" data-sf="emoji" value="${esc(sec.emoji || '')}" maxlength="4">
      </div>
      <div class="field-group">
        <label>섹션 ID</label>
        <input type="text" class="field-input" data-sf="id" value="${esc(sec.id || '')}">
      </div>
    </div>
    <div class="field-group">
      <label>제목</label>
      <input type="text" class="field-input" data-sf="title" value="${esc(sec.title || '')}">
    </div>
    <div class="field-group">
      <label>리드 문장</label>
      <textarea class="field-input field-textarea" data-sf="lead">${esc(sec.lead || '')}</textarea>
    </div>
  `;
}

// ─── Component form router ────────────────────────────
function buildComponentForm(type, d, si) {
  switch (type) {
    case 'supply-overview': return supplyOverviewHtml(d, si);
    case 'bullet-card':     return bulletCardHtml(d, si);
    case 'table-card':      return tableCardHtml(d, si);
    case 'timeline':        return timelineHtml(d, si);
    case 'qa-list':         return qaListHtml(d, si);
    default: return `<p class="comp-no-form">이 유형의 전용 폼이 없습니다.</p>`;
  }
}

function delBtn(onclick) {
  return `<button class="dyn-delete-btn" onclick="${onclick}">${ICON_X}</button>`;
}

// supply-overview
function supplyOverviewHtml(d, si) {
  const ht   = d.houseTypes || [];
  const locs = d.locations  || [];
  return `
    <div class="field-group">
      <label>전용면적 범위</label>
      <input type="text" class="field-input" placeholder="36.96㎡~59.98㎡" value="${esc(d.areaRange || '')}"
        oninput="_e.d.sections[${si}].component.data.areaRange=this.value;_e.sp()">
    </div>
    <div class="field-group">
      <label>주택 유형</label>
      <div class="dyn-list">
        ${ht.map((h, j) => `
          <div class="dyn-item">
            <input type="text" class="field-input" placeholder="36형" value="${esc(h.type || '')}"
              oninput="_e.d.sections[${si}].component.data.houseTypes[${j}].type=this.value;_e.sp()">
            <input type="number" class="field-input field-num" placeholder="호수" value="${h.units ?? 0}"
              oninput="_e.d.sections[${si}].component.data.houseTypes[${j}].units=parseInt(this.value)||0;_e.sp()">
            ${delBtn(`_e.d.sections[${si}].component.data.houseTypes.splice(${j},1);_e.rs()`)}
          </div>`).join('')}
      </div>
      <button class="dyn-add-btn" onclick="_e.d.sections[${si}].component.data.houseTypes.push({type:'',units:0});_e.rs()">+ 유형 추가</button>
    </div>
    <div class="field-group">
      <label>구역별 공급 (선택)</label>
      <div class="dyn-list">
        ${locs.map((loc, j) => `
          <div class="dyn-item">
            <input type="text" class="field-input" placeholder="구역명" value="${esc(loc.district || '')}"
              oninput="_e.d.sections[${si}].component.data.locations[${j}].district=this.value;_e.sp()">
            <input type="number" class="field-input field-num" placeholder="호수" value="${loc.units ?? 0}"
              oninput="_e.d.sections[${si}].component.data.locations[${j}].units=parseInt(this.value)||0;_e.sp()">
            ${delBtn(`_e.d.sections[${si}].component.data.locations.splice(${j},1);_e.rs()`)}
          </div>`).join('')}
      </div>
      <button class="dyn-add-btn" onclick="_e.d.sections[${si}].component.data.locations.push({district:'',units:0});_e.rs()">+ 구역 추가</button>
    </div>
  `;
}

// bullet-card
function bulletCardHtml(d, si) {
  const groups = d.groups || [];
  return `
    <div class="dyn-list">
      ${groups.map((g, gi) => `
        <div class="group-block">
          <div class="group-block-header">
            <input type="text" class="field-input" placeholder="그룹 레이블" value="${esc(g.label || '')}"
              oninput="_e.d.sections[${si}].component.data.groups[${gi}].label=this.value;_e.sp()">
            ${delBtn(`_e.d.sections[${si}].component.data.groups.splice(${gi},1);_e.rs()`)}
          </div>
          <div class="dyn-list">
            ${(g.items || []).map((item, ii) => `
              <div class="dyn-item">
                <input type="text" class="field-input" value="${esc(item)}"
                  oninput="_e.d.sections[${si}].component.data.groups[${gi}].items[${ii}]=this.value;_e.sp()">
                ${delBtn(`_e.d.sections[${si}].component.data.groups[${gi}].items.splice(${ii},1);_e.rs()`)}
              </div>`).join('')}
          </div>
          <button class="dyn-add-btn" onclick="_e.d.sections[${si}].component.data.groups[${gi}].items.push('');_e.rs()">+ 항목 추가</button>
        </div>`).join('')}
    </div>
    <button class="dyn-add-btn" onclick="_e.d.sections[${si}].component.data.groups.push({label:'',items:['']});_e.rs()">+ 그룹 추가</button>
  `;
}

// table-card
function tableCardHtml(d, si) {
  const rows     = d.rentRows || [];
  const notesVal = Array.isArray(d.notes) ? d.notes.join('\n') : '';
  const hasConv  = !!d.conversion;
  return `
    <div class="field-group">
      <label>임대조건 행</label>
      <div class="dyn-list">
        ${rows.map((row, ri) => `
          <div class="group-block">
            <div class="field-group">
              <label>행 제목</label>
              <input type="text" class="field-input" value="${esc(row.label || '')}"
                oninput="_e.d.sections[${si}].component.data.rentRows[${ri}].label=this.value;_e.sp()">
            </div>
            <div class="field-row">
              <div class="field-group">
                <label>보증금</label>
                <input type="text" class="field-input" value="${esc(row.deposit || '')}"
                  oninput="_e.d.sections[${si}].component.data.rentRows[${ri}].deposit=this.value;_e.sp()">
              </div>
              <div class="field-group">
                <label>월임대료</label>
                <input type="text" class="field-input" value="${esc(row.rentRange || '')}"
                  oninput="_e.d.sections[${si}].component.data.rentRows[${ri}].rentRange=this.value;_e.sp()">
              </div>
            </div>
            <div class="field-group">
              <label>공급비율 (선택, 예: 1순위 60%)</label>
              <input type="text" class="field-input" value="${esc(row.ratio || '')}"
                oninput="_e.d.sections[${si}].component.data.rentRows[${ri}].ratio=this.value;_e.sp()">
            </div>
            <div class="group-block-footer">
              <button class="dyn-delete-btn row-del" onclick="_e.d.sections[${si}].component.data.rentRows.splice(${ri},1);_e.rs()">
                ${ICON_X} 행 삭제
              </button>
            </div>
          </div>`).join('')}
      </div>
      <button class="dyn-add-btn" onclick="_e.d.sections[${si}].component.data.rentRows.push({label:'',deposit:'',rentRange:''});_e.rs()">+ 행 추가</button>
    </div>
    <div class="field-group">
      <label>주석 (줄바꿈으로 구분)</label>
      <textarea class="field-input field-textarea"
        oninput="_e.d.sections[${si}].component.data.notes=this.value.split('\\n').filter(Boolean);_e.sp()">${esc(notesVal)}</textarea>
    </div>
    <div class="field-row">
      <div class="field-group">
        <label>임대기간 (선택)</label>
        <input type="text" class="field-input" value="${esc(d.leaseTerm || '')}"
          oninput="_e.d.sections[${si}].component.data.leaseTerm=this.value||undefined;_e.sp()">
      </div>
      <div class="field-group">
        <label>재계약 혜택 (선택)</label>
        <input type="text" class="field-input" value="${esc(d.renewalBonus || '')}"
          oninput="_e.d.sections[${si}].component.data.renewalBonus=this.value||undefined;_e.sp()">
      </div>
    </div>
    <label class="toggle-label">
      <input type="checkbox" ${hasConv ? 'checked' : ''} onchange="
        _e.d.sections[${si}].component.data.conversion=this.checked?{description:'',unit:'100만원',rate:''}:null;_e.rs()">
      보증금-월세 전환 정보 포함
    </label>
    ${hasConv ? `
    <div class="group-block">
      <div class="field-group">
        <label>전환 설명</label>
        <input type="text" class="field-input" value="${esc(d.conversion?.description || '')}"
          oninput="_e.d.sections[${si}].component.data.conversion.description=this.value;_e.sp()">
      </div>
      <div class="field-row">
        <div class="field-group">
          <label>단위</label>
          <input type="text" class="field-input" value="${esc(d.conversion?.unit || '')}"
            oninput="_e.d.sections[${si}].component.data.conversion.unit=this.value;_e.sp()">
        </div>
        <div class="field-group">
          <label>전환율</label>
          <input type="text" class="field-input" value="${esc(d.conversion?.rate || '')}"
            oninput="_e.d.sections[${si}].component.data.conversion.rate=this.value;_e.sp()">
        </div>
      </div>
    </div>` : ''}
  `;
}

// timeline
function timelineHtml(d, si) {
  const steps = d.steps || [];
  return `
    <div class="field-group">
      <label>신청 방법 (선택)</label>
      <input type="text" class="field-input" value="${esc(d.method || '')}"
        oninput="_e.d.sections[${si}].component.data.method=this.value;_e.sp()">
    </div>
    <div class="field-group">
      <label>단계 목록</label>
      <div class="dyn-list">
        ${steps.map((step, sti) => `
          <div class="group-block">
            <div class="field-row">
              <div class="field-group">
                <label>단계명</label>
                <input type="text" class="field-input" value="${esc(step.label || '')}"
                  oninput="_e.d.sections[${si}].component.data.steps[${sti}].label=this.value;_e.sp()">
              </div>
              <div class="field-group">
                <label>날짜</label>
                <input type="text" class="field-input" placeholder="YY.MM.DD(요일)" value="${esc(step.date || '')}"
                  oninput="_e.d.sections[${si}].component.data.steps[${sti}].date=this.value;_e.sp()">
              </div>
            </div>
            <div class="step-footer">
              <label class="toggle-label">
                <input type="checkbox" ${step.highlight ? 'checked' : ''}
                  onchange="_e.d.sections[${si}].component.data.steps[${sti}].highlight=this.checked;_e.sp()">
                강조 표시 (캘린더 초기 하이라이트)
              </label>
              <button class="dyn-delete-btn row-del" onclick="_e.d.sections[${si}].component.data.steps.splice(${sti},1);_e.rs()">
                ${ICON_X} 삭제
              </button>
            </div>
          </div>`).join('')}
      </div>
      <button class="dyn-add-btn" onclick="_e.d.sections[${si}].component.data.steps.push({label:'',date:'',highlight:false});_e.rs()">+ 단계 추가</button>
    </div>
  `;
}

// qa-list
function qaListHtml(d, si) {
  const qtype = d.type || 'caution';
  return `
    <div class="field-group">
      <label>유형</label>
      <select class="comp-type-select" onchange="_e.d.sections[${si}].component.data.type=this.value;_e.rs()">
        <option value="caution" ${qtype === 'caution' ? 'selected' : ''}>주의사항 (caution)</option>
        <option value="faq"     ${qtype === 'faq'     ? 'selected' : ''}>FAQ (faq)</option>
      </select>
    </div>
    ${qtype === 'caution' ? cautionHtml(d, si) : faqHtml(d, si)}
  `;
}

function cautionHtml(d, si) {
  const bullets = d.bullets || [];
  return `
    <div class="dyn-list">
      ${bullets.map((b, bi) => `
        <div class="group-block">
          <div class="group-block-header">
            <input type="text" class="field-input" placeholder="그룹 제목 (탈락/주의/문의 포함 시 아이콘 자동)" value="${esc(b.label || '')}"
              oninput="_e.d.sections[${si}].component.data.bullets[${bi}].label=this.value;_e.sp()">
            ${delBtn(`_e.d.sections[${si}].component.data.bullets.splice(${bi},1);_e.rs()`)}
          </div>
          <div class="dyn-list">
            ${(b.items || []).map((item, ii) => `
              <div class="dyn-item">
                <input type="text" class="field-input" value="${esc(item)}"
                  oninput="_e.d.sections[${si}].component.data.bullets[${bi}].items[${ii}]=this.value;_e.sp()">
                ${delBtn(`_e.d.sections[${si}].component.data.bullets[${bi}].items.splice(${ii},1);_e.rs()`)}
              </div>`).join('')}
          </div>
          <button class="dyn-add-btn" onclick="_e.d.sections[${si}].component.data.bullets[${bi}].items.push('');_e.rs()">+ 항목 추가</button>
        </div>`).join('')}
    </div>
    <button class="dyn-add-btn" onclick="_e.d.sections[${si}].component.data.bullets.push({label:'',items:['']});_e.rs()">+ 그룹 추가</button>
  `;
}

function faqHtml(d, si) {
  const items = d.items || [];
  return `
    <div class="dyn-list">
      ${items.map((item, ii) => `
        <div class="group-block">
          <div class="field-group">
            <label>질문</label>
            <input type="text" class="field-input" value="${esc(item.q || '')}"
              oninput="_e.d.sections[${si}].component.data.items[${ii}].q=this.value;_e.sp()">
          </div>
          <div class="field-group">
            <label>답변</label>
            <textarea class="field-input field-textarea"
              oninput="_e.d.sections[${si}].component.data.items[${ii}].a=this.value;_e.sp()">${esc(item.a || '')}</textarea>
          </div>
          <div class="group-block-footer">
            <button class="dyn-delete-btn row-del" onclick="_e.d.sections[${si}].component.data.items.splice(${ii},1);_e.rs()">
              ${ICON_X} 삭제
            </button>
          </div>
        </div>`).join('')}
    </div>
    <button class="dyn-add-btn" onclick="_e.d.sections[${si}].component.data.items.push({q:'',a:''});_e.rs()">+ Q&A 추가</button>
  `;
}

// ─── Location block form ──────────────────────────────
function buildLocationBlockForm(sec, si) {
  const lb   = (sec.blocks || []).find(b => b.type === 'location-card');
  const locs = lb?.data?.locations || [];

  return `
    <div class="comp-form">
      <div class="comp-form-label">📍 위치 블록</div>
      <label class="toggle-label">
        <input type="checkbox" ${lb ? 'checked' : ''} onchange="(function(checked){
          if(checked){
            if(!_e.d.sections[${si}].blocks)_e.d.sections[${si}].blocks=[];
            _e.d.sections[${si}].blocks.push({type:'location-card',data:{locations:[{name:'',address:'',detail:'',transit:''}]}});
          } else {
            _e.d.sections[${si}].blocks=(_e.d.sections[${si}].blocks||[]).filter(b=>b.type!=='location-card');
          }
          _e.rs();
        })(this.checked)">
        위치 블록 포함
      </label>
      ${lb ? `
        <div class="dyn-list">
          ${locs.map((loc, li) => `
            <div class="group-block">
              <div class="field-row">
                <div class="field-group">
                  <label>단지명</label>
                  <input type="text" class="field-input" value="${esc(loc.name || '')}"
                    oninput="_e.d.sections[${si}].blocks.find(b=>b.type==='location-card').data.locations[${li}].name=this.value;_e.sp()">
                </div>
                <div class="field-group">
                  <label>교통</label>
                  <input type="text" class="field-input" value="${esc(loc.transit || '')}"
                    oninput="_e.d.sections[${si}].blocks.find(b=>b.type==='location-card').data.locations[${li}].transit=this.value;_e.sp()">
                </div>
              </div>
              <div class="field-group">
                <label>도로명 주소</label>
                <input type="text" class="field-input" value="${esc(loc.address || '')}"
                  oninput="_e.d.sections[${si}].blocks.find(b=>b.type==='location-card').data.locations[${li}].address=this.value;_e.sp()">
              </div>
              <div class="field-group">
                <label>부가 정보 (동/호수 등)</label>
                <input type="text" class="field-input" value="${esc(loc.detail || '')}"
                  oninput="_e.d.sections[${si}].blocks.find(b=>b.type==='location-card').data.locations[${li}].detail=this.value;_e.sp()">
              </div>
              <div class="group-block-footer">
                <button class="dyn-delete-btn row-del" onclick="(function(){
                  _e.d.sections[${si}].blocks.find(b=>b.type==='location-card').data.locations.splice(${li},1);_e.rs()
                })()">
                  ${ICON_X} 삭제
                </button>
              </div>
            </div>`).join('')}
        </div>
        <button class="dyn-add-btn" onclick="(function(){
          _e.d.sections[${si}].blocks.find(b=>b.type==='location-card').data.locations.push({name:'',address:'',detail:'',transit:''});_e.rs();
        })()">+ 위치 추가</button>
      ` : ''}
    </div>
  `;
}

// ─── Images form ─────────────────────────────────────
function buildImagesForm(sec, si) {
  const imgs = sec.images || [];
  return `
    <div class="comp-form">
      <div class="comp-form-label">🖼️ 사진</div>
      ${imgs.length ? `
        <div class="img-attach-list">
          ${imgs.map((img, ii) => `
            <div class="img-attach-item">
              <img class="img-attach-thumb" src="${esc(img.src)}" alt="">
              <input type="text" class="field-input img-attach-cap" placeholder="캡션 (선택)" value="${esc(img.caption || '')}"
                oninput="_e.d.sections[${si}].images[${ii}].caption=this.value;_e.sp()">
              ${delBtn(`_e.d.sections[${si}].images.splice(${ii},1);_e.rs()`)}
            </div>`).join('')}
        </div>` : ''}
      <label class="dyn-add-btn img-add-btn">
        + 사진 추가
        <input type="file" accept="image/*" hidden onchange="_e.upimg(${si}, this)">
      </label>
    </div>
  `;
}

// base64로 이미지를 서버에 업로드 → 섹션 images 배열에 경로 추가
_e.upimg = async function (si, input) {
  const file = input.files && input.files[0];
  input.value = '';
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('이미지 파일만 첨부할 수 있어요.', true); return; }
  showToast('사진 업로드 중...');
  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload  = () => resolve(r.result);
      r.onerror = () => reject(new Error('파일 읽기 실패'));
      r.readAsDataURL(file);
    });
    const res = await fetch(`/api/upload/${encodeURIComponent(slug)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, dataUrl }),
    });
    const json = await res.json();
    if (!res.ok) { showToast('업로드 실패: ' + (json.error || ''), true); return; }
    if (!data.sections[si].images) data.sections[si].images = [];
    data.sections[si].images.push({ src: json.path, caption: '' });
    renderSectionsForm();
    schedulePreview();
    showToast('사진이 첨부됐어요.');
  } catch (e) {
    showToast('업로드 실패: ' + e.message, true);
  }
};

// ─── Terms accordion ─────────────────────────────────
function buildTermsAccordion(terms, si) {
  return `
    <div class="terms-accordion">
      <button class="terms-toggle" onclick="(function(btn){
        const b=btn.nextElementSibling;
        b.classList.toggle('hidden');
        btn.querySelector('.terms-chevron').style.transform=b.classList.contains('hidden')?'':'rotate(180deg)';
      })(this)">
        <svg class="terms-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition:transform 0.15s;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>
        용어 해설 (${terms.length}개)
      </button>
      <div class="terms-body hidden">
        ${terms.map((t, ti) => `
          <div class="term-item">
            <button class="term-del" title="삭제" onclick="_e.d.sections[${si}].terms.splice(${ti},1);_e.rs()">✕</button>
            <div class="field-group">
              <label>용어</label>
              <input type="text" class="field-input" value="${esc(t.term || '')}"
                oninput="_e.d.sections[${si}].terms[${ti}].term=this.value;_e.sp()">
            </div>
            <div class="field-group">
              <label>설명</label>
              <textarea class="field-input field-textarea"
                oninput="_e.d.sections[${si}].terms[${ti}].definition=this.value;_e.sp()">${esc(t.definition || '')}</textarea>
            </div>
          </div>`).join('')}
        <button class="dyn-add-btn" onclick="(function(){
          if(!_e.d.sections[${si}].terms)_e.d.sections[${si}].terms=[];
          _e.d.sections[${si}].terms.push({term:'',definition:''});_e.rs();
        })()">+ 용어 추가</button>
      </div>
    </div>
  `;
}

// ─── Add section modal ───────────────────────────────
function showAddSectionModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h2 class="modal-title">섹션 추가</h2>
        <button class="modal-close">✕</button>
      </div>
      <p class="modal-desc">추가할 컴포넌트 유형을 선택하세요.</p>
      <div class="type-picker-grid">
        ${Object.entries(TYPE_NAMES).map(([type, name]) => `
          <div class="type-picker-card" data-type="${type}" style="border-left:3px solid ${TYPE_COLORS[type]}">
            <div class="type-picker-name" style="color:${TYPE_COLORS[type]}">${esc(name)}</div>
            <div class="type-picker-id">${esc(type)}</div>
          </div>`).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelectorAll('.type-picker-card').forEach(card => {
    card.addEventListener('click', () => {
      const type = card.dataset.type;
      data.sections.push({
        id:        type + '-' + Date.now(),
        emoji:     '📄',
        title:     TYPE_NAMES[type],
        lead:      '',
        component: { type, data: JSON.parse(JSON.stringify(COMPONENT_DEFAULTS[type])) },
        blocks:    [],
        terms:     [],
      });
      overlay.remove();
      renderSectionsForm();
      schedulePreview();
    });
  });
}

// ─── Save / Deploy ───────────────────────────────────
async function save() {
  clearTimeout(previewTimer);
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  try {
    const res = await fetch(`/api/reports/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectData()),
    });
    if (res.ok) { showToast('저장됐습니다.'); clearDirty(); refreshPreview(); }
    else showToast('저장 실패', true);
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
  document.getElementById('previewFrame').src = VIEWER_URL;
}

// ─── Icon sidebar ─────────────────────────────────────
let activePanel = 'meta';

function switchPanel(panelId) {
  const leftPanel = document.getElementById('leftPanel');
  if (panelId === activePanel) { leftPanel.classList.toggle('collapsed'); return; }
  activePanel = panelId;
  leftPanel.classList.remove('collapsed');
  document.querySelectorAll('.sidebar-icon').forEach(btn => {
    const active = btn.dataset.panel === panelId;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active);
  });
  document.querySelectorAll('.panel-pane').forEach(p => {
    p.classList.toggle('active', p.id === `pane-${panelId}`);
  });
  if (panelId === 'location') updateLocationPanel();
}

// ─── Editor tabs ─────────────────────────────────────
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

// ─── Drag resize ─────────────────────────────────────
function initDragResize() {
  const handle = document.getElementById('dragHandle');
  const panel  = document.getElementById('leftPanel');
  const frame  = document.getElementById('previewFrame');
  let dragging = false;
  handle.addEventListener('mousedown', e => {
    dragging = true;
    handle.classList.add('dragging');
    panel.classList.add('resizing');
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    frame.style.pointerEvents = 'none'; // let mousemove pass over the iframe
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const rect = panel.getBoundingClientRect();
    panel.style.width = Math.max(240, Math.min(640, e.clientX - rect.left)) + 'px';
  });
  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    panel.classList.remove('resizing');
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    frame.style.pointerEvents = '';
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
  content.innerHTML = '';

  const allLocs = [];
  (data?.sections || []).forEach(sec => {
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
    content.innerHTML = '<div class="loc-panel-empty">위치 블록을 추가하면<br>여기에 지도가 표시됩니다.</div>';
    return;
  }

  const mapData = encodeURIComponent(JSON.stringify(allLocs.map(l => ({ name: l.name || '', address: l.address || '' }))));
  content.innerHTML = `
    <div class="loc-panel-list">${allLocs.map(l => `
      <div class="loc-panel-item">
        <div class="loc-panel-name">${esc(l.name || '')}</div>
        <div class="loc-panel-addr">${esc(l.address || '')}${l.detail ? `<span class="loc-panel-detail"> ${esc(l.detail)}</span>` : ''}</div>
        ${l.transit ? `<div class="loc-panel-transit">${esc(l.transit)}</div>` : ''}
      </div>`).join('')}
    </div>
    <div class="loc-map-container loc-map-admin" data-locations="${mapData}"></div>
  `;
  initLocationMaps(content);
}

// ─── Init ────────────────────────────────────────────
async function init() {
  const res = await fetch(`/api/reports/${encodeURIComponent(slug)}`);
  if (!res.ok) { showToast('리포트를 찾을 수 없습니다.', true); return; }
  data = await res.json();
  _e.d = data;

  fillForm(data);
  document.getElementById('previewFrame').src = VIEWER_URL;

  document.querySelectorAll('.sidebar-icon').forEach(btn => {
    btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
  });
  document.querySelectorAll('.editor-tab').forEach(btn => {
    btn.addEventListener('click', () => switchEditor(btn.dataset.editor));
  });
  document.querySelectorAll('.field-input').forEach(el => {
    el.addEventListener('input', markDirty);
  });

  document.getElementById('saveBtn').addEventListener('click', save);
  document.getElementById('deployBtn').addEventListener('click', deploy);
  document.getElementById('refreshPreviewBtn').addEventListener('click', refreshPreview);
  document.getElementById('refreshLocationBtn').addEventListener('click', updateLocationPanel);

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save(); }
  });
  window.addEventListener('beforeunload', e => {
    if (isDirty) { e.preventDefault(); e.returnValue = ''; }
  });

  initDragResize();
  initViewportToggle();
}

init();
