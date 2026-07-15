// js/components/summary-card.js
export function renderSummaryCard(summary, channel) {
  const { organizer, totalUnits, minRent, applyStart, applyEnd } = summary;
  const minRentLabel = channel === '줍줍분양' ? '최저 분양가' : '최저 월세';
  return `
    <div class="summary-2x2">
      <div class="s2-card">
        <div class="s2-icon s2-blue">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h6M3 15h6"/></svg>
        </div>
        <div class="s2-body">
          <div class="s2-label">공급기관</div>
          <div class="s2-value">${organizer}</div>
        </div>
      </div>
      <div class="s2-card">
        <div class="s2-icon s2-green">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <div class="s2-body">
          <div class="s2-label">총 모집 호수</div>
          <div class="s2-value">${totalUnits.toLocaleString()}호</div>
        </div>
      </div>
      <div class="s2-card">
        <div class="s2-icon s2-amber">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div class="s2-body">
          <div class="s2-label">${minRentLabel}</div>
          <div class="s2-value">${minRent}~</div>
        </div>
      </div>
      <div class="s2-card">
        <div class="s2-icon s2-purple">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <div class="s2-body">
          <div class="s2-label">신청 기간</div>
          <div class="s2-value">${applyStart} ~ ${applyEnd}</div>
        </div>
      </div>
    </div>
  `;
}
