// js/components/qa-list.js
export function renderQaList(data) {
  const { bullets, qa } = data;
  const bulletsHtml = (bullets || []).map(group => `
    <div class="qa-bullet-group">
      <p class="qa-bullet-label">${group.label}</p>
      <ul class="qa-bullet-list">
        ${group.items.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  `).join('');
  const qaHtml = (qa || []).map(item => `
    <details class="qa-item">
      <summary class="qa-question">Q. ${item.q}</summary>
      <p class="qa-answer">A. ${item.a}</p>
    </details>
  `).join('');
  return `
    <div class="qa-list">
      ${bulletsHtml}
      ${qa && qa.length ? `<div class="qa-accordion">${qaHtml}</div>` : ''}
    </div>
  `;
}
