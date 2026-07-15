// js/components/table-card.js

const LABELS = {
  rent: { deposit: '보증금', price: '월임대료', term: '임대기간', bonus: '재계약 혜택', conversion: '보증금 월세 전환' },
  sale: { deposit: '계약금', price: '분양가', term: '전매제한', bonus: '특약사항', conversion: '중도금 안내' },
};

function getRatioColor(label) {
  if (label.includes('1순위')) return 'green';
  return 'blue';
}

function extractPct(ratio) {
  const m = String(ratio).match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

function renderRentRow(row, labels) {
  const color = getRatioColor(row.label);
  const pct = extractPct(row.ratio);
  const showBar = pct > 0 && row.ratio;
  return `
    <div class="lease-row">
      <div class="lease-row-head">
        <span class="lease-priority lease-priority--${color}">${row.label}</span>
        ${showBar ? `<span class="lease-ratio-badge lease-ratio--${color}">${row.ratio}</span>` : ''}
      </div>
      ${showBar ? `<div class="lease-bar-track"><div class="lease-bar-fill lease-bar--${color}" style="width:${pct}%"></div></div>` : ''}
      <div class="lease-meta">
        <span class="lease-meta-item"><span class="lease-meta-key">${labels.deposit}</span>${row.deposit}</span>
        <span class="lease-meta-item"><span class="lease-meta-key">${labels.price}</span>${row.rentRange}</span>
      </div>
    </div>
  `;
}

export function renderTableCard(data, channel) {
  const labels = channel === '줍줍분양' ? LABELS.sale : LABELS.rent;
  const { rentRows = [], notes = [], leaseTerm, renewalBonus, conversion } = data;
  const rowsHtml = rentRows.map(row => renderRentRow(row, labels)).join('');
  const notesHtml = notes.length > 0
    ? `<div class="lease-notes">${notes.map(n => `<p class="lease-note">* ${n}</p>`).join('')}</div>`
    : '';
  const extraHtml = (leaseTerm || renewalBonus || conversion) ? `
  <div class="lease-extra">
    ${leaseTerm ? `<div class="lease-extra-row"><span class="lease-extra-key">${labels.term}</span><span class="lease-extra-val">${leaseTerm}</span></div>` : ''}
    ${renewalBonus ? `<div class="lease-extra-row"><span class="lease-extra-key">${labels.bonus}</span><span class="lease-extra-val">${renewalBonus}</span></div>` : ''}
    ${conversion ? `<div class="lease-extra-row lease-extra-row--full"><span class="lease-extra-key">${labels.conversion}</span><span class="lease-extra-val">${conversion.description} (${conversion.unit} 단위, ${conversion.rate})</span></div>` : ''}
  </div>
` : '';
  return `<div class="lease-card">${rowsHtml}${notesHtml}${extraHtml}</div>`;
}
