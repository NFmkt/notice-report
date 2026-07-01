// js/components/timeline.js
import { ICONS } from '../icons.js';

export function renderTimeline(data) {
  const { method, steps } = data;
  const stepsHtml = steps.map(step => `
    <div class="tl-step ${step.highlight ? 'tl-step--highlight' : ''}">
      <div class="tl-dot"></div>
      <div class="tl-content">
        <span class="tl-label">${step.label}</span>
        <span class="tl-date">${step.date}</span>
      </div>
    </div>
  `).join('');
  return `
    <div class="timeline-card">
      <div class="timeline-method">
        <span class="timeline-method-icon">${ICONS.schedule}</span>
        <span>${method}</span>
      </div>
      <div class="timeline-steps">${stepsHtml}</div>
    </div>
  `;
}
