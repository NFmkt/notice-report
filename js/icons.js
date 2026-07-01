// js/icons.js
// 모든 아이콘: fill-only SVG, viewBox 0 0 20 20, stroke 금지

const svg = (content) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">${content}</svg>`;

export const ICONS = {
  // 공급기관 — 건물
  building: svg(`
    <rect x="3" y="6" width="14" height="11" rx="1.5" fill="#313D4C"/>
    <rect x="5" y="3" width="10" height="5" rx="1" fill="#64A7FF"/>
    <rect x="7" y="10" width="2.5" height="3" rx="0.5" fill="#FFFFFF"/>
    <rect x="10.5" y="10" width="2.5" height="3" rx="0.5" fill="#FFFFFF"/>
    <rect x="8.5" y="14" width="3" height="3" rx="0.5" fill="#FFFFFF"/>
  `),

  // 모집호수 — 집
  units: svg(`
    <path d="M10 2L2 8.5V17.5H7.5V13H12.5V17.5H18V8.5L10 2Z" fill="#313D4C"/>
    <path d="M10 3.5L3.5 9V16.5H6.5V12H13.5V16.5H16.5V9L10 3.5Z" fill="#64A7FF"/>
    <rect x="8.5" y="12.5" width="3" height="4" rx="0.5" fill="#313D4C"/>
  `),

  // 최저월세 — 동전 스택
  money: svg(`
    <ellipse cx="10" cy="6" rx="6" ry="2.5" fill="#FFC84D"/>
    <rect x="4" y="6" width="12" height="2" fill="#FFC84D"/>
    <ellipse cx="10" cy="8" rx="6" ry="2.5" fill="#FFC84D"/>
    <rect x="4" y="9.5" width="12" height="2" fill="#FF9000"/>
    <ellipse cx="10" cy="11.5" rx="6" ry="2.5" fill="#FF9000"/>
    <rect x="4" y="11.5" width="12" height="2" fill="#FF9000"/>
    <ellipse cx="10" cy="13.5" rx="6" ry="2.5" fill="#FF9000"/>
  `),

  // 신청기간 — 캘린더
  calendar: svg(`
    <rect x="2" y="4.5" width="16" height="13" rx="2" fill="#313D4C"/>
    <rect x="2" y="4.5" width="16" height="5" rx="2" fill="#2563EB"/>
    <rect x="9.25" y="4.5" width="1.5" height="5" fill="#2563EB"/>
    <rect x="5.5" y="2.5" width="2" height="4" rx="1" fill="#64A7FF"/>
    <rect x="12.5" y="2.5" width="2" height="4" rx="1" fill="#64A7FF"/>
    <rect x="5" y="12" width="2.5" height="2.5" rx="0.5" fill="#FFC84D"/>
    <rect x="8.75" y="12" width="2.5" height="2.5" rx="0.5" fill="#FFFFFF"/>
    <rect x="12.5" y="12" width="2.5" height="2.5" rx="0.5" fill="#FFFFFF"/>
  `),

  // 공급개요 — 아파트 블록
  supply: svg(`
    <rect x="1.5" y="5" width="8" height="12.5" rx="1" fill="#313D4C"/>
    <rect x="10.5" y="8" width="8" height="9.5" rx="1" fill="#64A7FF"/>
    <rect x="3" y="7" width="2" height="2.5" rx="0.5" fill="#64A7FF"/>
    <rect x="6.5" y="7" width="2" height="2.5" rx="0.5" fill="#64A7FF"/>
    <rect x="3" y="11" width="2" height="2.5" rx="0.5" fill="#FFFFFF"/>
    <rect x="6.5" y="11" width="2" height="2.5" rx="0.5" fill="#FFFFFF"/>
    <rect x="12" y="10" width="2" height="2.5" rx="0.5" fill="#FFFFFF"/>
    <rect x="15" y="10" width="2" height="2.5" rx="0.5" fill="#FFFFFF"/>
    <rect x="12" y="14" width="2" height="2.5" rx="0.5" fill="#FFFFFF"/>
    <rect x="15" y="14" width="2" height="2.5" rx="0.5" fill="#FFFFFF"/>
  `),

  // 신청자격 — 사람
  person: svg(`
    <circle cx="10" cy="5.5" r="3.5" fill="#313D4C"/>
    <path d="M3 17.5C3 13.36 6.13 10 10 10C13.87 10 17 13.36 17 17.5H3Z" fill="#23B169"/>
    <circle cx="10" cy="5.5" r="2" fill="#64A7FF"/>
  `),

  // 임대조건 — 계약서
  lease: svg(`
    <rect x="3" y="1.5" width="14" height="17" rx="1.5" fill="#313D4C"/>
    <rect x="5" y="4" width="10" height="1.5" rx="0.75" fill="#64A7FF"/>
    <rect x="5" y="7" width="10" height="1.5" rx="0.75" fill="#FFFFFF"/>
    <rect x="5" y="10" width="7" height="1.5" rx="0.75" fill="#FFFFFF"/>
    <rect x="5" y="13" width="5" height="1.5" rx="0.75" fill="#FFC84D"/>
    <circle cx="13.5" cy="13.75" r="3" fill="#23B169"/>
    <rect x="12.5" y="13.25" width="2" height="1" rx="0.5" fill="#FFFFFF"/>
    <rect x="13" y="12.75" width="1" height="2" rx="0.5" fill="#FFFFFF"/>
  `),

  // 신청방법및일정 — 시계
  schedule: svg(`
    <circle cx="10" cy="10" r="8.5" fill="#313D4C"/>
    <circle cx="10" cy="10" r="7" fill="#2563EB"/>
    <circle cx="10" cy="10" r="1.5" fill="#FFFFFF"/>
    <rect x="9.25" y="4" width="1.5" height="5" rx="0.75" fill="#FFFFFF"/>
    <rect x="10" y="9.25" width="4" height="1.5" rx="0.75" fill="#FFC84D"/>
  `),

  // 주의사항 — 실드 + 경고
  caution: svg(`
    <path d="M10 1.5L2.5 5V11C2.5 15 5.8 18.5 10 19.5C14.2 18.5 17.5 15 17.5 11V5L10 1.5Z" fill="#313D4C"/>
    <path d="M10 3L4 6V11C4 14.3 6.7 17.2 10 18C13.3 17.2 16 14.3 16 11V6L10 3Z" fill="#EF4452"/>
    <rect x="9.25" y="7" width="1.5" height="5" rx="0.75" fill="#FFFFFF"/>
    <circle cx="10" cy="14" r="1" fill="#FFFFFF"/>
  `),

  // 타임라인 핀 — 위치 핀
  pin: svg(`
    <circle cx="10" cy="8" r="5.5" fill="#2563EB"/>
    <circle cx="10" cy="8" r="2.5" fill="#FFFFFF"/>
    <path d="M10 12.5L6.5 17H13.5L10 12.5Z" fill="#2563EB"/>
  `),

  // Q&A — Q 뱃지
  qa: svg(`
    <circle cx="10" cy="10" r="8.5" fill="#313D4C"/>
    <circle cx="10" cy="10" r="7" fill="#64A7FF"/>
    <rect x="9.25" y="10" width="1.5" height="3" rx="0.75" fill="#FFFFFF"/>
    <path d="M10 7C10 7 8.5 7.5 8.5 8.5C8.5 9.2 9.2 9.7 10 9.7C10.8 9.7 11.5 9.2 11.5 8.5C11.5 7.5 10 7 10 7Z" fill="#FFFFFF"/>
    <circle cx="10" cy="14" r="1" fill="#FFFFFF"/>
  `)
};

// 섹션 ID → 아이콘 매핑
export const SECTION_ICONS = {
  supply:      ICONS.supply,
  eligibility: ICONS.person,
  lease:       ICONS.lease,
  schedule:    ICONS.schedule,
  caution:     ICONS.caution,
};

// 요약카드 → 아이콘 매핑
export const SUMMARY_ICONS = {
  organizer:  ICONS.building,
  totalUnits: ICONS.units,
  minRent:    ICONS.money,
  applyStart: ICONS.calendar,
};
