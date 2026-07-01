// js/components/table-card.js
export function renderTableCard(data) {
  const { rentRows, leaseTerm, renewalBonus, conversion } = data;
  const rowsHtml = rentRows.map(row => `
    <tr>
      <td class="table-label">${row.label}</td>
      <td>${row.ratio}</td>
      <td>${row.deposit}</td>
      <td>${row.rentRange}</td>
    </tr>
  `).join('');
  return `
    <div class="table-card">
      <table class="rent-table">
        <thead>
          <tr>
            <th>순위</th>
            <th>시세 비율</th>
            <th>기본 보증금</th>
            <th>월임대료 범위</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="lease-info">
        <div class="lease-info-item">
          <span class="lease-info-label">임대기간</span>
          <span>${leaseTerm}</span>
        </div>
        ${renewalBonus ? `
        <div class="lease-info-item">
          <span class="lease-info-label">재계약 혜택</span>
          <span>${renewalBonus}</span>
        </div>` : ''}
        ${conversion ? `
        <div class="lease-conversion">
          <p class="lease-conversion-title">보증금 월세 전환</p>
          <p>${conversion.description} (${conversion.unit} 단위, ${conversion.rate})</p>
        </div>` : ''}
      </div>
    </div>
  `;
}
