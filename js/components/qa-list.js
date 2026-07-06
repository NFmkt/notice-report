// js/components/qa-list.js

const CHEVRON_SVG = `<svg class="faq-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>`;

const WARN_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

const CAUTION_GROUP_ICONS = {
  '탈락': `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  '주의': `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  '문의': `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17.32z"/></svg>`,
};

function getCautionGroupIcon(label) {
  for (const [key, svg] of Object.entries(CAUTION_GROUP_ICONS)) {
    if (label.includes(key)) return svg;
  }
  return WARN_SVG;
}

function renderCaution(data) {
  const { bullets = [] } = data;

  const groupsHtml = bullets.map(b => {
    if (typeof b === 'string') {
      return `<div class="caution-group">
        <div class="caution-group-header">
          <span class="caution-group-icon">${WARN_SVG}</span>
          <span class="caution-group-label">${b}</span>
        </div>
      </div>`;
    }
    if (!b || !b.label) return '';
    const icon = getCautionGroupIcon(b.label);
    const itemsHtml = (b.items || []).map(item =>
      `<div class="caution-item"><span class="caution-dot"></span><span>${item}</span></div>`
    ).join('');
    return `
      <div class="caution-group">
        <div class="caution-group-header">
          <span class="caution-group-icon">${icon}</span>
          <span class="caution-group-label">${b.label}</span>
        </div>
        ${itemsHtml ? `<div class="caution-group-body">${itemsHtml}</div>` : ''}
      </div>
    `;
  }).join('');

  return `<div class="caution-card">${groupsHtml}</div>`;
}

function renderFaq(data) {
  const items = data.items || data.qa || [];
  const itemsHtml = items.map((item, i) => `
    <div class="faq-item" id="faq-item-${i}">
      <button class="faq-question" aria-expanded="false" aria-controls="faq-answer-${i}" onclick="(function(btn){const ans=document.getElementById('faq-answer-${i}');const open=btn.getAttribute('aria-expanded')==='true';btn.setAttribute('aria-expanded',String(!open));ans.style.maxHeight=open?'0':''+ans.scrollHeight+'px';ans.style.opacity=open?'0':'1';btn.querySelector('.faq-chevron').style.transform=open?'rotate(0deg)':'rotate(180deg)';})(this)">
        <span class="faq-q-text">${item.q}</span>
        ${CHEVRON_SVG}
      </button>
      <div class="faq-answer" id="faq-answer-${i}" style="max-height:0;opacity:0">
        <div class="faq-answer-inner">${item.a}</div>
      </div>
    </div>
  `).join('');
  return `<div class="faq-list">${itemsHtml}</div>`;
}

export function renderQaList(data) {
  if (data.type === 'caution') return renderCaution(data);
  if (data.type === 'faq') return renderFaq(data);

  // Legacy format: { bullets: [...], qa: [...] }
  let html = '';
  if (data.bullets && data.bullets.length) html += renderCaution(data);
  if ((data.qa && data.qa.length) || (data.items && data.items.length)) html += renderFaq(data);
  return html || '';
}
