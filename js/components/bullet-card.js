// js/components/bullet-card.js

// 플랫 fill 아이콘 (icon-design 스킬: viewBox 0 0 20 20, stroke 금지, currentColor로 배지 색 상속)
// 직관적 메타포 — 청년:1인 / 대학생:학사모 / 취업준비생:서류가방 / 신혼부부:하트 / 한부모:어른+아이 / 다자녀:3인
const ELIGIBILITY_ICONS = {
  '청년': { icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="5.6" r="3.2" fill="currentColor"/><path d="M3.8 16.5c0-3.4 2.8-5.7 6.2-5.7s6.2 2.3 6.2 5.7c0 .6-.5 1.1-1.1 1.1H4.9c-.6 0-1.1-.5-1.1-1.1z" fill="currentColor"/></svg>`, color: 'blue' },
  '대학생': { icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2.6 1.3 6.6 10 10.6l8.7-4z" fill="currentColor"/><path d="M5.2 10.1v3.3c0 .5.3.9.7 1.1 1.2.7 2.7 1.1 4.1 1.1s2.9-.4 4.1-1.1c.4-.2.7-.6.7-1.1v-3.3L10 12.4z" fill="currentColor"/><rect x="17.2" y="7.4" width="1.1" height="5" rx="0.5" fill="currentColor"/><circle cx="17.75" cy="13.1" r="1.15" fill="currentColor"/></svg>`, color: 'green' },
  '취업준비생': { icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7.6 3.6h4.8c1 0 1.8.8 1.8 1.8v1.1H5.8V5.4c0-1 .8-1.8 1.8-1.8z" fill="currentColor"/><rect x="2.4" y="6.6" width="15.2" height="10" rx="2" fill="currentColor"/><rect x="8.4" y="10" width="3.2" height="2.4" rx="0.6" fill="#fff"/></svg>`, color: 'amber' },
  '신혼부부': { icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 17.2S2.6 12.6 2.6 7.6C2.6 5.3 4.4 3.5 6.6 3.5c1.4 0 2.7.8 3.4 2 .7-1.2 2-2 3.4-2 2.2 0 4 1.8 4 4.1 0 5-7.4 9.6-7.4 9.6z" fill="currentColor"/></svg>`, color: 'pink' },
  '한부모가족': { icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="6.8" cy="5.2" r="2.7" fill="currentColor"/><path d="M2.4 16c0-2.9 2-4.9 4.4-4.9s4.4 2 4.4 4.9c0 .5-.4.9-.9.9H3.3c-.5 0-.9-.4-.9-.9z" fill="currentColor"/><circle cx="14.6" cy="7.8" r="2" fill="currentColor"/><path d="M11.4 16.3c0-1.9 1.4-3.3 3.2-3.3s3.2 1.4 3.2 3.3c0 .3-.2.6-.6.6h-5.2c-.4 0-.6-.3-.6-.6z" fill="currentColor"/></svg>`, color: 'purple' },
  '다자녀가구': { icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="4.8" cy="6.6" r="2.2" fill="currentColor"/><circle cx="10" cy="5.3" r="2.5" fill="currentColor"/><circle cx="15.2" cy="6.6" r="2.2" fill="currentColor"/><path d="M2 16.6c0-2.4 1.5-4.1 3.5-4.1.9 0 1.7.3 2.3 1 .6-1 1.6-1.6 2.7-1.6s2.1.6 2.7 1.6c.6-.7 1.4-1 2.3-1 2 0 3.5 1.7 3.5 4.1 0 .3-.2.5-.5.5H2.5c-.3 0-.5-.2-.5-.5z" fill="currentColor"/></svg>`, color: 'green' },
};

function renderEligibilityBadges(items) {
  const badges = [];
  const seen = new Set();
  items.forEach(item => {
    for (const [key, meta] of Object.entries(ELIGIBILITY_ICONS)) {
      if (!seen.has(key) && item.startsWith(key)) {
        seen.add(key);
        // label: item 전체에서 key 이후 설명 추출 (": " 또는 "(" 뒤)
        const rest = item.slice(key.length).replace(/^[\s:(]+/, '').replace(/[)]+$/, '').trim();
        badges.push({ key, desc: rest, ...meta });
        break;
      }
    }
  });
  if (badges.length === 0) return null;
  const gridClass = badges.length >= 4 ? ' elig-badges--grid' : '';
  const badgeHtml = badges.map(b => `
    <div class="elig-badge elig-${b.color}">
      <span class="elig-icon">${b.icon}</span>
      <div class="elig-text">
        <span class="elig-name">${b.key}</span>
        ${b.desc ? `<span class="elig-desc">${b.desc}</span>` : ''}
      </div>
    </div>
  `).join('');
  return `<div class="elig-badges${gridClass}">${badgeHtml}</div>`;
}

// 줍줍분양 청약 조건 아이콘 (icon-design 스킬: viewBox 0 0 20 20, stroke 금지, fill 전용)
// 직관적 메타포 — 청약통장:통장 / 무주택:집 / 거주지역:핀 / 재당첨:응모권
export const CONDITION_ICONS = {
  '청약통장': { icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3.4" y="2.4" width="13.2" height="15.2" rx="1.8" fill="currentColor"/><rect x="6" y="6.1" width="8" height="1.5" rx="0.75" fill="#fff"/><rect x="6" y="9.3" width="8" height="1.5" rx="0.75" fill="#fff"/><rect x="6" y="12.5" width="5" height="1.5" rx="0.75" fill="#fff"/></svg>`, color: 'blue' },
  '무주택 요건': { icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2.1 2.2 8.5v9.4h5.4v-5.9h4.8v5.9h5.4V8.5z" fill="currentColor"/></svg>`, color: 'green' },
  '거주지역': { icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 1.8c-3.7 0-6.7 2.9-6.7 6.6 0 4.7 5.8 11.6 6 11.9.4.4 1 .4 1.4 0 .2-.3 6-7.2 6-11.9 0-3.7-3-6.6-6.7-6.6z" fill="currentColor"/><circle cx="10" cy="8.2" r="2.6" fill="#fff"/></svg>`, color: 'purple' },
  '재당첨 제한': { icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M2.5 6.6c0-.9.7-1.6 1.6-1.6h11.8c.9 0 1.6.7 1.6 1.6v1.2a1.4 1.4 0 0 0 0 2.8v1.2c0 .9-.7 1.6-1.6 1.6H4.1c-.9 0-1.6-.7-1.6-1.6v-1.2a1.4 1.4 0 0 0 0-2.8z" fill="currentColor"/><rect x="9.3" y="4.2" width="1.4" height="10.4" rx="0.7" fill="#fff"/></svg>`, color: 'amber' },
};

// 상태 뱃지: O(자유·완화) 초록 체크 / X(제한·필요) 회색 X — 둘 다 fill 전용 path
export const STATE_DOTS = {
  free: `<svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#16A34A"/><path d="M8.6 13.4 5.4 10.2 6.7 8.9 8.6 10.8 13.3 6.1 14.6 7.4z" fill="#fff"/></svg>`,
  limited: `<svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#64748B"/><path d="M6.4 5.9 10 9.5 13.6 5.9 14.8 7.1 11.2 10.7 14.8 14.3 13.6 15.5 10 11.9 6.4 15.5 5.2 14.3 8.8 10.7 5.2 7.1z" fill="#fff"/></svg>`,
};
const FREE_WORDS = ['없음', '무관', '불필요', '자유', '가능', '불요'];
const LIMITED_WORDS = ['있음', '필요', '제한', '불가', '해당'];

function detectConditionState(desc) {
  if (FREE_WORDS.some(w => desc.includes(w))) return 'free';
  if (LIMITED_WORDS.some(w => desc.includes(w))) return 'limited';
  return null;
}

// items(["청약통장: 불필요", ...]) → [{ key, desc, state, icon, color }] — cardnews.js 등 외부에서도 재사용
export function parseConditionItems(items) {
  const badges = [];
  const seen = new Set();
  items.forEach(item => {
    for (const [key, meta] of Object.entries(CONDITION_ICONS)) {
      if (!seen.has(key) && item.startsWith(key)) {
        seen.add(key);
        const rest = item.slice(key.length).replace(/^[\s:(]+/, '').replace(/[)]+$/, '').trim();
        badges.push({ key, desc: rest, state: detectConditionState(rest), ...meta });
        break;
      }
    }
  });
  return badges;
}

function renderConditionBadges(items) {
  const badges = parseConditionItems(items);
  if (badges.length === 0) return null;
  const badgeHtml = badges.map(b => `
    <div class="cond-badge cond-${b.color}">
      <span class="cond-icon-wrap">
        <span class="cond-icon">${b.icon}</span>
        ${b.state ? `<span class="cond-dot">${STATE_DOTS[b.state]}</span>` : ''}
      </span>
      <div class="cond-text">
        <span class="cond-name">${b.key}</span>
        <span class="cond-desc">${b.desc}</span>
      </div>
    </div>
  `).join('');
  return `<div class="cond-badges">${badgeHtml}</div>`;
}

function renderIncomeTable(table) {
  if (!table || !table.rows || table.rows.length === 0) return '';
  const sizes = table.sizes || ['1인', '2인', '3인', '4인', '5인'];
  const headerCells = sizes.map(s => `<th>${s}</th>`).join('');
  const bodyRows = table.rows.map(row => {
    const cells = row.values.map(v => `<td>${v !== null ? v.toLocaleString() : '—'}</td>`).join('');
    return `<tr><td class="income-row-label">${row.label}</td>${cells}</tr>`;
  }).join('');
  return `
    <div class="income-table-wrap">
      <div class="income-table-title">${table.title || '가구원수별 월평균소득 기준 (원)'}</div>
      <div class="income-table-scroll">
        <table class="income-table">
          <thead><tr><th>구분</th>${headerCells}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function renderBulletCard(data) {
  const { groups } = data;
  let prefixHtml = '';
  let groupsToRender = groups;

  // If first group is eligibility types, show icon badges — skip text row only if badges rendered
  if (groups.length > 0 && groups[0].label === '신청 가능 계층') {
    const badges = renderEligibilityBadges(groups[0].items);
    if (badges) {
      prefixHtml = badges;
      groupsToRender = groups.slice(1);
    }
  } else if (groups.length > 0 && groups[0].label === '청약 조건') {
    const badges = renderConditionBadges(groups[0].items);
    if (badges) {
      prefixHtml = badges;
      groupsToRender = groups.slice(1);
    }
  }

  const groupsHtml = groupsToRender.map(group => `
    <div class="bullet-group-row">
      <div class="bullet-group-head">
        <span class="bullet-group-label">${group.label}</span>
      </div>
      <div class="bullet-group-content">
        <ul class="bullet-list">
          ${group.items.map(item => `<li>${item}</li>`).join('')}
        </ul>
        ${group.incomeTable ? renderIncomeTable(group.incomeTable) : ''}
      </div>
    </div>
  `).join('');

  return `<div class="bullet-card">${prefixHtml}${groupsHtml}</div>`;
}
