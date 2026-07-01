// js/components/timeline.js

function parseYYMMDD(str) {
  // Matches "26.07.06" or "26.07.06(월)" patterns
  const m = str.match(/(\d{2})\.(\d{2})\.(\d{2})/);
  if (!m) return null;
  return { year: 2000 + parseInt(m[1]), month: parseInt(m[2]), day: parseInt(m[3]) };
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month - 1, 1).getDay(); // 0=Sun
}

function parseHighlightRange(dateStr) {
  // Extract all day numbers from a date string like "26.07.06(월) 10:00 ~ 07.08(수) 16:00"
  const days = [];
  const matches = dateStr.matchAll(/\.(\d{2})(?:\([월화수목금토일]\))?/g);
  for (const m of matches) days.push(parseInt(m[1]));
  return days; // e.g. [6, 8] for a range
}

function buildRangeDays(dateStr) {
  // Returns array of day numbers that should be highlighted
  const days = parseHighlightRange(dateStr);
  if (days.length >= 2) {
    const result = [];
    for (let d = days[0]; d <= days[days.length - 1]; d++) result.push(d);
    return result;
  }
  return days;
}

function renderCalendar(year, month, steps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  const dayNames = ['일','월','화','수','목','금','토'];

  // Find apply range days (highlight steps)
  const applyDays = new Set();
  const eventDays = new Set();
  steps.forEach(step => {
    const range = buildRangeDays(step.date || '');
    const parsed = step.date ? parseYYMMDD(step.date) : null;
    if (parsed && parsed.month === month) {
      range.forEach(d => {
        if (step.highlight) applyDays.add(d);
        else eventDays.add(d);
      });
    }
  });

  const headerCells = dayNames.map(d => `<div class="cal-dname">${d}</div>`).join('');
  const emptyCells = Array(firstDay).fill('<div class="cal-cell"></div>').join('');

  const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    let cls = 'cal-cell';
    if (applyDays.has(day)) {
      const isFirst = day === Math.min(...applyDays);
      const isLast = day === Math.max(...applyDays);
      if (isFirst && isLast) cls += ' cal-apply';
      else if (isFirst) cls += ' cal-apply cal-apply-start';
      else if (isLast) cls += ' cal-apply cal-apply-end';
      else cls += ' cal-apply cal-apply-mid';
    } else if (eventDays.has(day)) {
      cls += ' cal-event';
    }
    return `<div class="${cls}">${day}</div>`;
  }).join('');

  return `
    <div class="cal-wrap">
      <div class="cal-header">
        <span class="cal-month">${year}년 ${monthNames[month-1]}</span>
        <span class="cal-hint">신청 달력</span>
      </div>
      <div class="cal-grid">
        ${headerCells}
        ${emptyCells}
        ${dayCells}
      </div>
      <div class="cal-legend">
        <span class="cal-legend-item"><span class="cal-legend-dot apply"></span>신청 기간</span>
        <span class="cal-legend-item"><span class="cal-legend-dot event"></span>주요 일정</span>
      </div>
    </div>`;
}

function renderSteps(steps) {
  return steps.map((step, i) => `
    <div class="tl-step ${step.highlight ? 'tl-step--highlight' : ''}">
      <div class="tl-dot ${step.highlight ? 'tl-dot--active' : ''}"></div>
      <div class="tl-content">
        <span class="tl-label">${step.label}</span>
        ${step.date ? `<span class="tl-date-badge">${step.date}</span>` : ''}
      </div>
    </div>
  `).join('');
}

export function renderTimeline(data) {
  const { method, steps } = data;

  // Find the month to show from the highlighted (apply) step
  let calYear = new Date().getFullYear();
  let calMonth = new Date().getMonth() + 1;
  const highlightStep = steps.find(s => s.highlight);
  if (highlightStep && highlightStep.date) {
    const parsed = parseYYMMDD(highlightStep.date);
    if (parsed) { calYear = parsed.year; calMonth = parsed.month; }
  }

  const calHtml = renderCalendar(calYear, calMonth, steps);
  const stepsHtml = renderSteps(steps);

  return `
    <div class="timeline-v2">
      ${method ? `<div class="timeline-method-bar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        <span>${method}</span>
      </div>` : ''}
      <div class="timeline-cols">
        <div class="timeline-cal">${calHtml}</div>
        <div class="timeline-steps">${stepsHtml}</div>
      </div>
    </div>
  `;
}
