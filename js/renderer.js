/**
 * renderer.js — 모든 컴포넌트를 통합해 리포트를 렌더링
 */
import { renderSummaryCard } from './components/summary-card.js';
import { renderIntroBlock } from './components/intro-block.js';
import { renderSupplyOverview } from './components/supply-overview.js';
import { renderBulletCard } from './components/bullet-card.js';
import { renderTableCard } from './components/table-card.js';
import { renderTimeline } from './components/timeline.js';
import { renderQaList } from './components/qa-list.js';
import { renderLocationCard } from './components/location-card.js';
import { renderOutroBlock } from './components/outro-block.js';
import { SECTION_ICONS } from './icons.js';

const COMPONENT_RENDERERS = {
  'supply-overview': renderSupplyOverview,
  'bullet-card':     renderBulletCard,
  'table-card':      renderTableCard,
  'timeline':        renderTimeline,
  'qa-list':         renderQaList,
  'location-card':   renderLocationCard,
};

// TOC에 포함할 섹션 id 목록 (supply/intro/outro 제외)
const TOC_SECTION_IDS = ['supply', 'eligibility', 'lease', 'schedule', 'caution'];

function renderTerms(terms) {
  if (!terms || terms.length === 0) return '';
  const items = terms.map(t => `
    <div class="term-item">
      <dt class="term-name">${t.term}</dt>
      <dd class="term-def">${t.definition}</dd>
    </div>
  `).join('');
  return `<dl class="terms-box">${items}</dl>`;
}

function renderSection(section) {
  const renderer = COMPONENT_RENDERERS[section.component && section.component.type];
  const componentHtml = renderer ? renderer(section.component.data) : '';
  const blocksHtml = (section.blocks || []).map(block => {
    const r = COMPONENT_RENDERERS[block.type];
    return r ? `<div class="section-block">${r(block.data)}</div>` : '';
  }).join('');
  const iconSvg = SECTION_ICONS[section.id] || '';
  return `
    <section id="section-${section.id}" class="article-section" data-section-id="${section.id}">
      <h2 class="article-section-title">
        ${iconSvg ? `<span class="section-icon">${iconSvg}</span>` : ''}
        <span class="section-title-text">${section.title}</span>
      </h2>
      ${section.lead ? `<p class="section-lead">${section.lead}</p>` : ''}
      ${componentHtml}
      ${blocksHtml}
      ${renderTerms(section.terms)}
    </section>
  `;
}

export function renderReport(data, container, sectionIndexList) {
  // 요약 카드
  const summaryEl = document.getElementById('summaryCard');
  if (summaryEl && data.summary) {
    summaryEl.innerHTML = renderSummaryCard(data.summary);
  }

  // 인트로
  const introEl = document.getElementById('introBlock');
  if (introEl && data.intro) {
    introEl.innerHTML = renderIntroBlock(data.intro);
  }

  // 섹션들
  container.innerHTML = '';
  if (sectionIndexList) sectionIndexList.innerHTML = '';

  (data.sections || []).forEach(section => {
    container.insertAdjacentHTML('beforeend', renderSection(section));

    // TOC: 지정된 섹션만
    if (sectionIndexList && TOC_SECTION_IDS.includes(section.id)) {
      sectionIndexList.insertAdjacentHTML('beforeend', `
        <li>
          <a href="#section-${section.id}" data-target="${section.id}">
            ${section.emoji ? section.emoji + ' ' : ''}${section.title}
          </a>
        </li>
      `);
    }
  });

  // 아웃트로
  const outroEl = document.getElementById('outroBlock');
  if (outroEl && data.outro) {
    outroEl.innerHTML = renderOutroBlock(data.outro);
  }
}
