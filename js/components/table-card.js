// js/components/table-card.js

function getRatioColor(label) {
  if (label.includes('1순위')) return 'green';
  return 'blue';
}

function extractPct(ratio) {
  const m = String(ratio).match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

function renderRentRow(row) {
  const color = getRatioColor(row.label);
  const pct = extractPct(row.ratio);
  return `
    <div class="lease-row">
      <div class="lease-row-head">
        <span class="lease-priority lease-priority--${color}">${row.label}</span>
        <span class="lease-ratio-badge lease-ratio--${color}">${row.ratio}</span>
      </div>
      <div class="lease-bar-track">
        <div class="lease-bar-fill lease-bar--${color}" style="width:${pct}%"></div>
        <span class="lease-bar-label">${row.ratio} 시세</span>
      </div>
      <div class="lease-meta">
        <span class="lease-meta-item"><span class="lease-meta-key">보증금</span>${row.deposit}</span>
        <span class="lease-meta-item"><span class="lease-meta-key">월임대료</span>${row.rentRange}</span>
      </div>
    </div>
  `;
}

export function renderTableCard(data) {
  const { rentRows = [], notes = [], leaseTerm, renewalBonus, conversion } = data;
  const rowsHtml = rentRows.map(renderRentRow).join('');
  const notesHtml = notes.length > 0
    ? `<div class="lease-notes">${notes.map(n => `<p class="lease-note">* ${n}</p>`).join('')}</div>`
    : '';
  const extraHtml = (leaseTerm || renewalBonus || conversion) ? `
    <div class="lease-info">
      ${leaseTerm ? `<div class="lease-info-item"><span class="lease-meta-key">임대기간</span><span>${leaseTerm}</span></div>` : ''}
      ${renewalBonus ? `<div class="lease-info-item"><span class="lease-meta-key">재계약 혜택</span><span>${renewalBonus}</span></div>` : ''}
      ${conversion ? `<div class="lease-conversion"><p class="lease-conversion-title">보증금 월세 전환</p><p>${conversion.description} (${conversion.unit} 단위, ${conversion.rate})</p></div>` : ''}
    </div>
  ` : '';
  return `<div class="lease-card">${rowsHtml}${notesHtml}${extraHtml}</div>`;
}
