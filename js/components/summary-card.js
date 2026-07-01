// js/components/summary-card.js
import { SUMMARY_ICONS } from '../icons.js';

export function renderSummaryCard(summary) {
  const { organizer, totalUnits, minRent, applyStart, applyEnd } = summary;
  return `
    <div class="summary-card">
      <div class="summary-item">
        <span class="summary-icon">${SUMMARY_ICONS.organizer}</span>
        <span class="summary-label">공급기관</span>
        <span class="summary-value">${organizer}</span>
      </div>
      <div class="summary-item highlight">
        <span class="summary-icon">${SUMMARY_ICONS.totalUnits}</span>
        <span class="summary-label">모집 호수</span>
        <span class="summary-value">${totalUnits.toLocaleString()}호</span>
      </div>
      <div class="summary-item highlight">
        <span class="summary-icon">${SUMMARY_ICONS.minRent}</span>
        <span class="summary-label">최저 월세</span>
        <span class="summary-value">${minRent}~</span>
      </div>
      <div class="summary-item highlight">
        <span class="summary-icon">${SUMMARY_ICONS.applyStart}</span>
        <span class="summary-label">신청 기간</span>
        <span class="summary-value">${applyStart} ~ ${applyEnd}</span>
      </div>
    </div>
  `;
}
