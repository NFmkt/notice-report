// js/components/timeline.js

const STEP_COLORS = [
  { key: 'blue',   bg: '#2563EB', light: '#DBEAFE', text: '#fff' },
  { key: 'green',  bg: '#16A34A', light: '#DCFCE7', text: '#fff' },
  { key: 'amber',  bg: '#D97706', light: '#FEF3C7', text: '#fff' },
  { key: 'purple', bg: '#7C3AED', light: '#EDE9FE', text: '#fff' },
  { key: 'slate',  bg: '#64748B', light: '#F1F5F9', text: '#fff' },
];

function parseYYMMDD(str) {
  const m = str.match(/(\d{2})\.(\d{2})\.(\d{2})/);
  if (!m) return null;
  return { year: 2000 + parseInt(m[1]), month: parseInt(m[2]), day: parseInt(m[3]) };
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month - 1, 1).getDay();
}

function extractDayRange(dateStr, targetMonth) {
  // Find all MM.DD pairs (or YY.MM.DD) within the string
  const allDates = [];
  // Match YY.MM.DD first
  const fullMatches = [...dateStr.matchAll(/(\d{2})\.(\d{2})\.(\d{2})/g)];
  fullMatches.forEach(m => {
    const mo = parseInt(m[2]);
    const d = parseInt(m[3]);
    if (mo === targetMonth) allDates.push(d);
  });
  // Also match MM.DD patterns (without year)
  const shortMatches = [...dateStr.matchAll(/(?<!\d)(\d{2})\.(\d{2})(?:\([월화수목금토일]\))?/g)];
  shortMatches.forEach(m => {
    const mo = parseInt(m[1]);
    const d = parseInt(m[2]);
    if (mo === targetMonth && !allDates.includes(d)) allDates.push(d);
  });
  if (allDates.length < 2) return allDates;
  const min = Math.min(...allDates);
  const max = Math.max(...allDates);
  const range = [];
  for (let d = min; d <= max; d++) range.push(d);
  return range;
}

function renderCalendar(year, month, steps, navOpts) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  const dayNames = ['일','월','화','수','목','금','토'];

  const dayStepMap = {};
  steps.forEach((step, idx) => {
    if (!step.date) return;
    const days = extractDayRange(step.date, month);
    days.forEach(d => {
      if (!dayStepMap[d]) dayStepMap[d] = idx;
    });
  });

  const headerCells = dayNames.map(d => `<div class="cal-dname">${d}</div>`).join('');
  const emptyCells = Array(firstDay).fill('<div class="cal-cell"></div>').join('');

  const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    if (dayStepMap[day] !== undefined) {
      const stepIdx = dayStepMap[day];
      return `<div class="cal-cell cal-step-${stepIdx}">${day}</div>`;
    }
    return `<div class="cal-cell">${day}</div>`;
  }).join('');

  const legendSteps = steps.filter(s => {
    if (!s.date) return false;
    return extractDayRange(s.date, month).length > 0;
  });
  const legendHtml = legendSteps.map(s => {
    const stepIdx = steps.indexOf(s);
    const color = STEP_COLORS[stepIdx % STEP_COLORS.length];
    return `<span class="cal-legend-item"><span class="cal-legend-dot" style="background:${color.bg}"></span>${s.label}</span>`;
  }).join('');

  let prevBtn = '', nextBtn = '';
  if (navOpts) {
    const { id, idx, total } = navOpts;
    const prevDisabled = idx === 0 ? 'disabled' : '';
    const nextDisabled = idx === total - 1 ? 'disabled' : '';
    prevBtn = `<button class="tl-cal-btn" ${prevDisabled} onclick="(function(){
      var w=document.getElementById('${id}');
      var slides=w.querySelectorAll('.tl-cal-slide');
      slides[${idx}].style.display='none';
      slides[${idx - 1}].style.display='block';
      w.dataset.cur=${idx - 1};
    })()" aria-label="이전 달">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>`;
    nextBtn = `<button class="tl-cal-btn" ${nextDisabled} onclick="(function(){
      var w=document.getElementById('${id}');
      var slides=w.querySelectorAll('.tl-cal-slide');
      slides[${idx}].style.display='none';
      slides[${idx + 1}].style.display='block';
      w.dataset.cur=${idx + 1};
    })()" aria-label="다음 달">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </button>`;
  }

  return `
    <div class="cal-wrap">
      <div class="cal-header">
        ${prevBtn}
        <span class="cal-month">${year}년 ${monthNames[month-1]}</span>
        ${nextBtn}
      </div>
      <div class="cal-grid">
        ${headerCells}
        ${emptyCells}
        ${dayCells}
      </div>
      ${legendHtml ? `<div class="cal-legend">${legendHtml}</div>` : ''}
    </div>`;
}

function renderSteps(steps) {
  return steps.map((step, i) => {
    const color = STEP_COLORS[i % STEP_COLORS.length];
    return `
      <div class="tl-step">
        <div class="tl-dot" style="background:${color.bg}; border-color:${color.bg}"></div>
        <div class="tl-content">
          <span class="tl-label">${step.label}</span>
          ${step.date ? `<span class="tl-date-badge" style="background:${color.light}; color:${color.bg}">${step.date}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function getStepMonths(steps) {
  const seen = new Set();
  const months = [];
  steps.forEach(step => {
    if (!step.date) return;
    const fullMatches = [...step.date.matchAll(/(\d{2})\.(\d{2})\.(\d{2})/g)];
    fullMatches.forEach(m => {
      const key = `${2000 + parseInt(m[1])}-${parseInt(m[2])}`;
      if (!seen.has(key)) { seen.add(key); months.push({ year: 2000 + parseInt(m[1]), month: parseInt(m[2]) }); }
    });
  });
  if (months.length === 0) return [{ year: new Date().getFullYear(), month: new Date().getMonth() + 1 }];
  months.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  const first = months[0];
  const last = months[months.length - 1];
  const result = [];
  let y = first.year, m = first.month;
  while (y < last.year || (y === last.year && m <= last.month)) {
    result.push({ year: y, month: m });
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return result;
}

let _tlId = 0;

export function renderTimeline(data) {
  const { method, steps } = data;
  const id = `tl-cal-${++_tlId}`;

  const months = getStepMonths(steps);
  const total = months.length;

  // highlight step의 달을 초기 인덱스로
  let initIdx = 0;
  const highlightStep = steps.find(s => s.highlight);
  if (highlightStep?.date) {
    const m = highlightStep.date.match(/(\d{2})\.(\d{2})\.(\d{2})/);
    if (m) {
      const hy = 2000 + parseInt(m[1]), hm = parseInt(m[2]);
      const found = months.findIndex(mo => mo.year === hy && mo.month === hm);
      if (found >= 0) initIdx = found;
    }
  }

  const navOpts = total > 1 ? { id, total } : null;
  const calsHtml = months.map(({ year, month }, i) =>
    `<div class="tl-cal-slide" data-idx="${i}" style="display:${i === initIdx ? 'block' : 'none'}">${renderCalendar(year, month, steps, navOpts ? { ...navOpts, idx: i } : null)}</div>`
  ).join('');

  const stepsHtml = renderSteps(steps);

  return `
    <div class="timeline-v2">
      ${method ? `<div class="timeline-method-bar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        <span>${method}</span>
      </div>` : ''}
      <div class="timeline-cols">
        <div class="timeline-cal">
          <div class="tl-cal-widget" id="${id}" data-cur="${initIdx}">
            ${calsHtml}
          </div>
        </div>
        <div class="timeline-steps">${stepsHtml}</div>
      </div>
    </div>
  `;
}
