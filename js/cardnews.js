/**
 * js/cardnews.js — 리포트 데이터를 인스타그램 카드뉴스(3장, 1080x1350) 전용으로 렌더링.
 * report.html의 웹 컴포넌트를 그대로 재사용하지 않고, 세로형 카드 캔버스에 맞춘
 * 전용 마크업/타이포 스케일을 사용한다(데이터 소스는 report.html과 동일한 JSON).
 * ?slug=xxx&card=1|2|3
 */
import { parseConditionItems, STATE_DOTS } from './components/bullet-card.js';
import { parseAreaRange } from './components/supply-overview.js';

const PIN_SVG = `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 1.8c-3.7 0-6.7 2.9-6.7 6.6 0 4.7 5.8 11.6 6 11.9.4.4 1 .4 1.4 0 .2-.3 6-7.2 6-11.9 0-3.7-3-6.6-6.7-6.6z" fill="currentColor"/><circle cx="10" cy="8.2" r="2.6" fill="#fff"/></svg>`;

function esc(s) { return String(s ?? ''); }

// ────────────────────────────────────────────────────────
// 카드 1: 표지 — 큰 사진 + 타이틀 + 히어로 숫자(총 모집 호수) + 보조 스탯 3개
// ────────────────────────────────────────────────────────
function renderCard1(data) {
  const { meta, summary } = data;
  return `
    <div class="cn-cover-media">
      ${meta.thumbnail ? `<img src="${esc(meta.thumbnail)}" alt="">` : ''}
      <div class="cn-cover-fade"></div>
    </div>
    <span class="cn-badge cn-badge--overlay">${esc(meta.badge)}</span>
    <div class="cn-pad cn-pad--cover">
      <h1 class="cn-title">${esc(meta.title)}</h1>
      <p class="cn-subtitle">${esc(meta.subtitle)}</p>

      <div class="cn-chip-row">
        <div class="cn-chip"><span class="cn-chip-label">총 모집 호수</span><span class="cn-chip-val">${esc(summary.totalUnits)}호</span></div>
        <div class="cn-chip"><span class="cn-chip-label">최저 분양가</span><span class="cn-chip-val">${esc(summary.minRent)}~</span></div>
        <div class="cn-chip"><span class="cn-chip-label">신청 기간</span><span class="cn-chip-val">${esc(summary.applyStart)}~${esc(summary.applyEnd)}</span></div>
      </div>
    </div>
  `;
}

// ────────────────────────────────────────────────────────
// 카드 2: 공급개요 — 리드 + 히어로 숫자(모집호수) + 타입 그리드 + 위치
// ────────────────────────────────────────────────────────
function renderCard2(section) {
  const supply = section.component.data;
  const loc = (section.blocks || []).find(b => b.type === 'location-card');
  const district = supply.locations && supply.locations[0];

  const typeChips = (supply.houseTypes || []).map(t => `
    <div class="cn-type-chip">
      <span class="cn-type-name">${esc(t.type)}</span>
      <span class="cn-type-units">${esc(t.units)}세대</span>
    </div>
  `).join('');
  const typeGridCols = (supply.houseTypes || []).length >= 5 ? 3 : 2;

  const locData = loc && loc.data.locations && loc.data.locations[0];
  const area = parseAreaRange(supply.areaRange);

  return `
    <div class="cn-pad">
      <div class="cn-card-header">
        <span class="cn-accent-bar"></span>
        <h2 class="cn-card-title">${esc(section.title)}</h2>
      </div>

      ${district ? `
      <div class="cn-hero-stat cn-hero-stat--boxed">
        <span class="cn-eyebrow">모집호수</span>
        <div class="cn-hero-num">${esc(district.units)}<span class="cn-hero-unit">호</span></div>
        <span class="cn-hero-caption">${esc(district.district)} 단일 공급</span>
      </div>` : ''}

      <div class="cn-type-grid" style="grid-template-columns:repeat(${typeGridCols},1fr)">${typeChips}</div>
      ${area ? `<p class="cn-area-caption">${area.minSqm}㎡~${area.maxSqm}㎡ · ${area.minPyeong}평~${area.maxPyeong}평</p>` : supply.areaRange ? `<p class="cn-area-caption">${esc(supply.areaRange)}</p>` : ''}

      ${locData ? `
      <div class="cn-loc-block">
        <span class="cn-loc-pin">${PIN_SVG}</span>
        <div>
          <div class="cn-loc-name">${esc(locData.name)}</div>
          <div class="cn-loc-addr">${esc(locData.address)}</div>
        </div>
      </div>` : ''}
    </div>
  `;
}

// ────────────────────────────────────────────────────────
// 카드 3: 신청 자격 — 리드 + 조건 3행(아이콘+값+O/X) + 불릿 그룹
// ────────────────────────────────────────────────────────
function renderCard3(section) {
  const groups = section.component.data.groups || [];
  const condGroup = groups.find(g => g.label === '청약 조건');
  const restGroups = groups.filter(g => g !== condGroup);
  const conditions = condGroup ? parseConditionItems(condGroup.items) : [];

  const condRows = conditions.map(c => `
    <div class="cn-cond-row">
      <span class="cn-cond-icon cn-cond-${c.color}">${c.icon}</span>
      <span class="cn-cond-label">${esc(c.key)}</span>
      <span class="cn-cond-value">${esc(c.desc)}</span>
      ${c.state ? `<span class="cn-cond-dot">${STATE_DOTS[c.state]}</span>` : ''}
    </div>
  `).join('');

  const bulletGroups = restGroups.map(g => `
    <div class="cn-bullet-group">
      <span class="cn-bullet-label">${esc(g.label)}</span>
      <ul class="cn-bullet-list">
        ${g.items.map(item => `<li>${esc(item)}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  return `
    <div class="cn-pad">
      <div class="cn-card-header">
        <span class="cn-accent-bar"></span>
        <h2 class="cn-card-title">${esc(section.title)}</h2>
      </div>
      <div class="cn-cond-list">${condRows}</div>
      ${bulletGroups}
    </div>
  `;
}

async function main() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const card = params.get('card') || '1';
  const root = document.getElementById('cardRoot');
  if (!slug) { root.textContent = 'slug 파라미터가 필요합니다.'; return; }

  const res = await fetch('reports/' + slug + '.json');
  const data = await res.json();
  const sections = data.sections || [];

  root.classList.add(`cn-card--${card}`);

  if (card === '1') {
    root.innerHTML = renderCard1(data);
  } else if (card === '2') {
    root.innerHTML = renderCard2(sections.find(s => s.id === 'supply'));
  } else if (card === '3') {
    root.innerHTML = renderCard3(sections.find(s => s.id === 'eligibility'));
  }

  root.insertAdjacentHTML('beforeend', '<img class="cn-logo" src="logo.svg" alt="">');

  await document.fonts.ready;
  document.body.setAttribute('data-cardnews-ready', 'true');
}

main();
