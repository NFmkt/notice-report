// js/components/bullet-card.js

const ELIGIBILITY_ICONS = {
  '청년': { icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`, color: 'blue' },
  '대학생': { icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`, color: 'green' },
  '취업준비생': { icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`, color: 'amber' },
};

function renderEligibilityBadges(items) {
  const badges = [];
  items.forEach(item => {
    for (const [key, meta] of Object.entries(ELIGIBILITY_ICONS)) {
      if (item.startsWith(key + ':') || item.startsWith(key + ' ')) {
        badges.push({ key, ...meta });
        break;
      }
    }
  });
  if (badges.length === 0) return '';
  const badgeHtml = badges.map(b => `
    <div class="elig-badge elig-${b.color}">
      <span class="elig-icon">${b.icon}</span>
      <span class="elig-name">${b.key}</span>
    </div>
  `).join('');
  return `<div class="elig-badges">${badgeHtml}</div>`;
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

  // If first group is eligibility types, show icon badges only — skip the text row
  if (groups.length > 0 && groups[0].label === '신청 가능 계층') {
    prefixHtml = renderEligibilityBadges(groups[0].items);
    groupsToRender = groups.slice(1); // skip the 신청 가능 계층 row
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
