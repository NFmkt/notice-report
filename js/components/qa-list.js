// js/components/qa-list.js

const CHEVRON_SVG = `<svg class="faq-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>`;

const WARN_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

function renderCaution(data) {
  const { bullets = [], title = '주의사항' } = data;
  // bullets can be plain strings or {label, items} group objects
  let itemsHtml = '';
  bullets.forEach(b => {
    if (typeof b === 'string') {
      itemsHtml += `<div class="caution-item"><span class="caution-dot"></span><span>${b}</span></div>`;
    } else if (b && b.label) {
      // group with label + items array
      itemsHtml += `<div class="caution-item caution-item--group"><span class="caution-dot"></span><span><strong>${b.label}</strong></span></div>`;
      (b.items || []).forEach(item => {
        itemsHtml += `<div class="caution-item caution-item--sub"><span class="caution-dot caution-dot--sub"></span><span>${item}</span></div>`;
      });
    }
  });
  return `
    <div class="caution-card">
      <div class="caution-header">
        <span class="caution-icon">${WARN_SVG}</span>
        <span class="caution-title">${title}</span>
      </div>
      <div class="caution-body">${itemsHtml}</div>
    </div>
  `;
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
