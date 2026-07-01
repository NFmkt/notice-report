// js/components/timeline.js
export function renderTimeline(data) {
  const { method, steps } = data;

  // method becomes the first intro item
  const methodStep = `
    <div class="tl-step tl-step--method">
      <div class="tl-dot tl-dot--method"></div>
      <div class="tl-content">
        <span class="tl-label">신청 방법</span>
        <span class="tl-desc">${method}</span>
      </div>
    </div>
  `;

  const stepsHtml = steps.map(step => `
    <div class="tl-step ${step.highlight ? 'tl-step--highlight' : ''}">
      <div class="tl-dot"></div>
      <div class="tl-content">
        <span class="tl-label">${step.label}</span>
        ${step.date ? `<span class="tl-date-badge">${step.date}</span>` : ''}
      </div>
    </div>
  `).join('');

  return `
    <div class="timeline-card">
      <div class="timeline-steps">
        ${methodStep}
        ${stepsHtml}
      </div>
    </div>
  `;
}
