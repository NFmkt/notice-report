# Notice Landing Page — Rich Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공고문 PDF를 Claude Tool Use로 자동 파싱하여 표·타임라인·지도 등 시각 컴포넌트가 풍부한 랜딩 페이지를 생성하고, 로컬 에디터로 배포 전 검토·수정할 수 있는 서비스를 구축한다.

**Architecture:** PDF → pypdf 텍스트 추출 → Claude Tool Use(Haiku) → 고정 5섹션 JSON → 정적 랜딩 페이지 렌더링. 수정은 로컬 Flask 서버 + editor.html에서, 배포는 기존 Vercel 정적 배포 유지.

**Tech Stack:** Vanilla JS (ES Modules), Python 3.10+, pypdf, anthropic SDK, Flask (로컬 전용), SVG (서울 지도)

## Global Constraints

- JS는 ES Modules (`type="module"`) 사용. `import`/`export` 문법.
- 모든 컴포넌트 렌더러는 `data` 객체를 받아 HTML 문자열을 반환하는 순수 함수.
- `component.type` 값은 스키마에 정의된 6개만 허용: `supply-overview`, `bullet-card`, `table-card`, `timeline`, `qa-list` (intro/outro는 별도 필드).
- Python은 `anthropic` SDK, `pypdf` 라이브러리 사용.
- 로컬 서버 포트: **5173** (editor용), 기존 랜딩 정적 서버는 별도 유지.
- CSS 변수 기반 테마 — 하드코딩 색상 금지, `var(--색상명)` 사용.
- 서울 지도 SVG: 뷰박스 `0 0 500 550`, 25개 자치구 path 포함.

## 디자인 시스템 (모든 Task 공통 적용)

### 컬러 토큰
```css
:root {
  /* 배경 */
  --bg:           #FFFFFF;
  --surface:      #F8FAFC;
  --surface-2:    #F1F5F9;

  /* 텍스트 */
  --ink:          #0F172A;
  --ink-muted:    #64748B;
  --ink-subtle:   #94A3B8;

  /* 포인트 — 섹션별 역할 고정 */
  --blue:         #2563EB;   /* 메인, 공급개요, 신청일정 */
  --blue-light:   #EFF6FF;
  --sky:          #38BDF8;   /* 지도 버블, 데이터 강조 */
  --emerald:      #10B981;   /* 신청자격 */
  --amber:        #F59E0B;   /* 임대조건, 타임라인 하이라이트 */
  --red:          #EF4444;   /* 주의사항 */
  --red-light:    #FEF2F2;

  /* 보더 */
  --border:       #E2E8F0;
  --border-strong:#CBD5E1;
}
```

### 타이포그래피
- **전체 Pretendard 통일** — `font-family: 'Pretendard', -apple-system, sans-serif`
- CDN: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css`
- weight 사용: 400(본문), 500(서브), 600(강조), 700(헤딩)
- 숫자/수치도 Pretendard 사용 (font-variant-numeric: tabular-nums 적용)

### 아이콘 규칙
- **이모지 사용 금지** — JSON의 `emoji` 필드는 렌더링 시 무시
- **모든 아이콘은 커스텀 SVG** — icon-design 스킬 기준 (fill-only, viewBox `0 0 20 20`)
- stroke 속성 완전 금지, 그라데이션 금지
- 컬러: `--ti-yellow #FFC84D`, `--ti-red #EF4452`, `--ti-green #23B169`, `--ti-blue-sky #64A7FF`, `--ti-navy #313D4C`

### 아이콘 세트 (Task 0에서 생성, `js/icons.js`로 export)
| 위치 | 아이콘 ID | 용도 |
|------|-----------|------|
| 요약카드 | `icon-building` | 공급기관 |
| 요약카드 | `icon-units` | 모집호수 |
| 요약카드 | `icon-money` | 최저월세 |
| 요약카드 | `icon-calendar` | 신청기간 |
| 섹션헤더 | `icon-supply` | 공급개요 |
| 섹션헤더 | `icon-person` | 신청자격 |
| 섹션헤더 | `icon-lease` | 임대조건 |
| 섹션헤더 | `icon-schedule` | 신청방법및일정 |
| 섹션헤더 | `icon-caution` | 주의사항 |
| 타임라인 | `icon-pin` | 신청접수 강조 도트 |
| Q&A | `icon-qa` | Q 뱃지 |

---

---

## Task 0: 디자인 시스템 CSS + 아이콘 세트

전체 컴포넌트가 공유하는 CSS 변수와 커스텀 SVG 아이콘 11종을 생성한다. 이후 Task들은 이 파일들을 import해서 사용한다.

**Files:**
- Create: `css/design-system.css`
- Create: `js/icons.js`

**Interfaces:**
- Produces: `js/icons.js`에서 named export — `ICONS.building`, `ICONS.units`, `ICONS.money`, `ICONS.calendar`, `ICONS.supply`, `ICONS.person`, `ICONS.lease`, `ICONS.schedule`, `ICONS.caution`, `ICONS.pin`, `ICONS.qa`
- 각 아이콘은 `<svg>` 태그 포함 HTML 문자열

- [ ] **Step 1: `css/design-system.css` 작성**

```css
/* css/design-system.css */
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

:root {
  --bg:           #FFFFFF;
  --surface:      #F8FAFC;
  --surface-2:    #F1F5F9;
  --ink:          #0F172A;
  --ink-muted:    #64748B;
  --ink-subtle:   #94A3B8;
  --blue:         #2563EB;
  --blue-light:   #EFF6FF;
  --sky:          #38BDF8;
  --emerald:      #10B981;
  --amber:        #F59E0B;
  --red:          #EF4444;
  --red-light:    #FEF2F2;
  --border:       #E2E8F0;
  --border-strong:#CBD5E1;
}

* { box-sizing: border-box; }

body {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: var(--ink);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  line-height: 1.3;
}

/* 숫자 데이터 — tabular 정렬 */
.num { font-variant-numeric: tabular-nums; }
```

- [ ] **Step 2: `js/icons.js` 작성 — 아이콘 11종 (fill-only SVG)**

icon-design 스킬 규칙 준수: viewBox `0 0 20 20`, stroke 금지, fill 전용, 5색 이내.

```js
// js/icons.js
// 모든 아이콘: fill-only SVG, viewBox 0 0 20 20, stroke 금지

const svg = (content) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">${content}</svg>`;

export const ICONS = {
  // 🏢 공급기관 — 건물
  building: svg(`
    <rect x="3" y="6" width="14" height="11" rx="1.5" fill="#313D4C"/>
    <rect x="5" y="3" width="10" height="5" rx="1" fill="#64A7FF"/>
    <rect x="7" y="10" width="2.5" height="3" rx="0.5" fill="#FFFFFF"/>
    <rect x="10.5" y="10" width="2.5" height="3" rx="0.5" fill="#FFFFFF"/>
    <rect x="8.5" y="14" width="3" height="3" rx="0.5" fill="#FFFFFF"/>
  `),

  // 🏠 모집호수 — 집
  units: svg(`
    <path d="M10 2L2 8.5V17.5H7.5V13H12.5V17.5H18V8.5L10 2Z" fill="#313D4C"/>
    <path d="M10 3.5L3.5 9V16.5H6.5V12H13.5V16.5H16.5V9L10 3.5Z" fill="#64A7FF"/>
    <rect x="8.5" y="12.5" width="3" height="4" rx="0.5" fill="#313D4C"/>
  `),

  // 💰 최저월세 — 동전 스택
  money: svg(`
    <ellipse cx="10" cy="6" rx="6" ry="2.5" fill="#FFC84D"/>
    <rect x="4" y="6" width="12" height="2" fill="#FFC84D"/>
    <ellipse cx="10" cy="8" rx="6" ry="2.5" fill="#FFC84D"/>
    <rect x="4" y="9.5" width="12" height="2" fill="#FF9000"/>
    <ellipse cx="10" cy="11.5" rx="6" ry="2.5" fill="#FF9000"/>
    <rect x="4" y="11.5" width="12" height="2" fill="#FF9000"/>
    <ellipse cx="10" cy="13.5" rx="6" ry="2.5" fill="#E07B00"/>
  `),

  // 📅 신청기간 — 캘린더
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

  // 🏗 공급개요 — 아파트 블록
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

  // 🙋 신청자격 — 사람
  person: svg(`
    <circle cx="10" cy="5.5" r="3.5" fill="#313D4C"/>
    <path d="M3 17.5C3 13.36 6.13 10 10 10C13.87 10 17 13.36 17 17.5H3Z" fill="#23B169"/>
    <circle cx="10" cy="5.5" r="2" fill="#64A7FF"/>
  `),

  // 💵 임대조건 — 계약서
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

  // ⏰ 신청방법및일정 — 시계
  schedule: svg(`
    <circle cx="10" cy="10" r="8.5" fill="#313D4C"/>
    <circle cx="10" cy="10" r="7" fill="#2563EB"/>
    <circle cx="10" cy="10" r="1.5" fill="#FFFFFF"/>
    <rect x="9.25" y="4" width="1.5" height="5" rx="0.75" fill="#FFFFFF"/>
    <rect x="10" y="9.25" width="4" height="1.5" rx="0.75" fill="#FFC84D"/>
  `),

  // ⚠️ 주의사항 — 실드 + 경고
  caution: svg(`
    <path d="M10 1.5L2.5 5V11C2.5 15 5.8 18.5 10 19.5C14.2 18.5 17.5 15 17.5 11V5L10 1.5Z" fill="#313D4C"/>
    <path d="M10 3L4 6V11C4 14.3 6.7 17.2 10 18C13.3 17.2 16 14.3 16 11V6L10 3Z" fill="#EF4444"/>
    <rect x="9.25" y="7" width="1.5" height="5" rx="0.75" fill="#FFFFFF"/>
    <circle cx="10" cy="14" r="1" fill="#FFFFFF"/>
  `),

  // 📍 타임라인 핀 — 위치 핀
  pin: svg(`
    <circle cx="10" cy="8" r="5.5" fill="#2563EB"/>
    <circle cx="10" cy="8" r="2.5" fill="#FFFFFF"/>
    <path d="M10 12.5L6.5 17H13.5L10 12.5Z" fill="#2563EB"/>
  `),

  // ❓ Q&A — Q 뱃지
  qa: svg(`
    <circle cx="10" cy="10" r="8.5" fill="#313D4C"/>
    <circle cx="10" cy="10" r="7" fill="#64A7FF"/>
    <path d="M7.5 8C7.5 6.6 8.6 5.5 10 5.5C11.4 5.5 12.5 6.6 12.5 8C12.5 9.1 11.8 10 10.8 10.3L10 10.6V12" stroke="none" fill="none"/>
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
```

- [ ] **Step 3: 아이콘 시각 검토**

임시 HTML로 11종 아이콘 렌더링 확인:

```html
<!-- test-icons.html (확인 후 삭제) -->
<!DOCTYPE html>
<html><body style="padding:20px;display:flex;gap:12px;flex-wrap:wrap;background:#F8FAFC">
<script type="module">
  import { ICONS } from './js/icons.js';
  Object.entries(ICONS).forEach(([k, v]) => {
    document.body.insertAdjacentHTML('beforeend',
      `<div style="text-align:center"><div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center">${v}</div><p style="font-size:11px">${k}</p></div>`
    );
  });
</script>
</body></html>
```

브라우저로 열어 11종 아이콘 모두 렌더링 확인. stroke 사용된 아이콘 없는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add css/design-system.css js/icons.js
git commit -m "feat: add design system CSS tokens and custom SVG icon set (11 icons)"
```

---

## File Structure

```
notice_report_page/
├── js/
│   ├── app.js                      ← modify: renderer.js 사용하도록 교체
│   ├── renderer.js                 ← create: 섹션별 컴포넌트 오케스트레이터
│   ├── editor.js                   ← create: 에디터 로직
│   └── components/
│       ├── summary-card.js         ← create
│       ├── intro-block.js          ← create
│       ├── supply-overview.js      ← create (적응형 지도 포함)
│       ├── seoul-map.js            ← create (SVG 경로 + 구 좌표 데이터)
│       ├── bullet-card.js          ← create
│       ├── table-card.js           ← create
│       ├── timeline.js             ← create
│       ├── qa-list.js              ← create
│       └── outro-block.js          ← create
├── css/
│   └── styles.css                  ← modify: 컴포넌트 스타일 추가
├── reports/
│   └── *.json                      ← migrate: 기존 파일 새 스키마로 변환
├── report.html                     ← modify: renderer.js 연결
├── editor.html                     ← create
├── to_json.py                      ← rewrite: PDF → Claude Tool Use
├── server.py                       ← create: 로컬 Flask 서버
└── 시작 에디터.bat                  ← create
```

---

## Task 1: 새 JSON 스키마 정의 및 기존 파일 마이그레이션

기존 JSON 파일들의 `sections[].content` (raw HTML) 구조를 새 스키마(`lead` + `component` + `terms`)로 전환한다. 이 Task가 완료되어야 이후 렌더러가 작동한다.

**Files:**
- Create: `reports/schema-example.json` (스키마 레퍼런스)
- Migrate: `reports/20260625-LH-서울지역본부-청년매입임대주택-예비입주자-모집공고.json` (대표 1건 직접 마이그레이션 — 나머지는 Task 5에서 to_json.py로 자동 생성)

**Interfaces:**
- Produces: 아래 스키마를 따르는 JSON. 이후 모든 Task가 이 구조를 소비함.

```json
{
  "meta": {
    "slug": "string",
    "title": "string",
    "subtitle": "string",
    "publishedAt": "string (YY.MM.DD)",
    "sourceUrl": "string (URL)",
    "badge": "string"
  },
  "summary": {
    "organizer": "string",
    "totalUnits": "number",
    "minRent": "string",
    "applyStart": "string",
    "applyEnd": "string"
  },
  "intro": {
    "headline": "string",
    "body": "string (HTML)"
  },
  "sections": [
    {
      "id": "supply | eligibility | lease | schedule | caution",
      "emoji": "string",
      "title": "string",
      "lead": "string (2~3문장)",
      "component": {
        "type": "supply-overview | bullet-card | table-card | timeline | qa-list",
        "data": {}
      },
      "terms": [{ "term": "string", "definition": "string" }]
    }
  ],
  "outro": {
    "body": "string",
    "ctaLabel": "string",
    "ctaUrl": "string"
  }
}
```

- [ ] **Step 1: `reports/schema-example.json` 작성**

`reports/schema-example.json`에 각 섹션의 `component.data` 구조를 포함한 완전한 예시 JSON 작성:

```json
{
  "meta": {
    "slug": "20260625-LH-서울지역본부-청년매입임대주택-예비입주자-모집공고",
    "title": "서울지역본부 청년매입임대주택 예비입주자 모집공고",
    "subtitle": "서울 22개 자치구에 가전 완비 청년 임대주택이 떴어요!",
    "publishedAt": "26.06.25",
    "sourceUrl": "https://gobang.kr/notices/20544",
    "badge": "청년주택 공고 분석"
  },
  "summary": {
    "organizer": "LH 서울지역본부",
    "totalUnits": 493,
    "minRent": "156,170원",
    "applyStart": "26.07.06",
    "applyEnd": "26.07.08"
  },
  "intro": {
    "headline": "서울 22개 자치구에 가전 완비 청년 임대주택이 떴어요!",
    "body": "<p>한국토지주택공사(LH) 서울지역본부가 총 <strong>493호</strong>의 예비입주자를 모집해요...</p>"
  },
  "sections": [
    {
      "id": "supply",
      "emoji": "🏠",
      "title": "공급 개요",
      "lead": "이번 공고는 서울 22개 자치구에 걸쳐 총 493호를 공급해요. 오피스텔·도시형생활주택 등 다양한 유형으로 구성되어 있으니 내 생활 방식에 맞는 유형을 먼저 확인해두세요.",
      "component": {
        "type": "supply-overview",
        "data": {
          "organizer": "LH 서울지역본부",
          "totalUnits": 493,
          "houseTypes": [
            { "type": "오피스텔", "units": 236 },
            { "type": "도시형생활주택", "units": 156 },
            { "type": "다세대주택", "units": 71 },
            { "type": "다가구주택", "units": 23 },
            { "type": "아파트", "units": 7 }
          ],
          "areaRange": "12.06㎡~59.41㎡",
          "locations": [
            { "district": "관악구", "units": 84 },
            { "district": "강서구", "units": 76 },
            { "district": "중랑구", "units": 74 },
            { "district": "동대문구", "units": 54 },
            { "district": "서초구", "units": 50 },
            { "district": "강동구", "units": 40 }
          ]
        }
      },
      "terms": []
    },
    {
      "id": "eligibility",
      "emoji": "🙋‍♀️",
      "title": "신청 자격",
      "lead": "공고일 현재 무주택자인 미혼이라면 신청 가능해요. 부모가 집을 가지고 있어도 신청할 수 있다는 점이 이번 공고의 가장 큰 장점이에요. 순위별로 소득·자산 기준이 다르니 내 순위를 먼저 확인하세요.",
      "component": {
        "type": "bullet-card",
        "data": {
          "groups": [
            {
              "label": "신청 가능 계층",
              "items": [
                "청년: 만 19~39세 (1986.06.26~2007.06.25 출생)",
                "대학생: 입학·복학 예정자 포함 (19~39세 해당 안 되는 경우만)",
                "취업준비생: 졸업·중퇴 후 2년 이내 미취업자"
              ]
            },
            {
              "label": "소득 조건",
              "items": [
                "1순위: 수급자·차상위·한부모가족 — 소득·자산 검증 없음",
                "2순위: 본인+부모 월평균소득 100% 이하 (1인 4,576,036원)",
                "3순위: 본인 월평균소득 100% 이하 (1인 4,576,036원)"
              ]
            },
            {
              "label": "신청 불가",
              "items": [
                "외국인 (재외국민 주민등록신고자는 가능)",
                "중복 신청 시 전부 무효"
              ]
            }
          ]
        }
      },
      "terms": [
        {
          "term": "도시근로자 월평균소득",
          "definition": "통계청이 매년 발표하는 도시 근로자 가구의 월평균 소득으로, 공공임대 소득기준 산정에 사용돼요."
        }
      ]
    },
    {
      "id": "lease",
      "emoji": "💰",
      "title": "임대조건",
      "lead": "1순위는 시세의 40%, 2·3순위는 50% 수준이에요. 보증금을 추가로 납부하면 월세를 낮출 수 있고, 최장 20년까지 거주할 수 있어요.",
      "component": {
        "type": "table-card",
        "data": {
          "rentRows": [
            { "label": "1순위", "ratio": "시세 40%", "deposit": "100만원", "rentRange": "156,170원~818,920원" },
            { "label": "2·3순위", "ratio": "시세 50%", "deposit": "200만원", "rentRange": "189,520원~1,008,340원" }
          ],
          "leaseTerm": "2년, 재계약 4회 (최장 10년)",
          "renewalBonus": "혼인 시 5회 추가 연장 (최장 20년)",
          "conversion": {
            "unit": "10만원",
            "rate": "연 6%",
            "description": "보증금 추가 납부로 월세 감액 가능 (최대 기본 월임대료의 60%까지)"
          }
        }
      },
      "terms": [
        {
          "term": "보증금 전환",
          "definition": "보증금을 더 내고 월세를 낮추는 방식이에요. 연 6% 이율로 계산해요."
        }
      ]
    },
    {
      "id": "schedule",
      "emoji": "📅",
      "title": "신청 방법 및 일정",
      "lead": "LH 청약플러스 앱 또는 PC에서만 신청 가능하고, 방문 접수는 없어요. 접수 기간이 3일뿐이니 공동인증서를 미리 준비해두세요.",
      "component": {
        "type": "timeline",
        "data": {
          "method": "LH 청약플러스(apply.lh.or.kr) 또는 LH청약플러스 앱 (PC·모바일, 방문 접수 없음)",
          "steps": [
            { "label": "청약 신청접수", "date": "26.07.06(월) 10:00 ~ 07.08(수) 16:00", "highlight": true },
            { "label": "서류제출 대상자 발표", "date": "26.07.10(금) 14:00 이후", "highlight": false },
            { "label": "서류제출 (온라인)", "date": "26.07.13(월) ~ 07.15(수) 16:00", "highlight": false },
            { "label": "예비자 순번 발표", "date": "26.09.18(금) 14:00 이후", "highlight": false },
            { "label": "계약 및 입주", "date": "순번 도래 시 개별 안내", "highlight": false }
          ]
        }
      },
      "terms": []
    },
    {
      "id": "caution",
      "emoji": "⚠️",
      "title": "주의사항",
      "lead": "자격이 되더라도 작은 실수 하나로 탈락할 수 있어요. 예비입주자 방식의 특성과 성별 구분은 이번 공고의 핵심 체크포인트예요.",
      "component": {
        "type": "qa-list",
        "data": {
          "bullets": [
            {
              "label": "탈락 사유",
              "items": [
                "착오·허위 기재, 기한 내 서류 미제출",
                "19~39세인데 대학생·취업준비생으로 신청 (반드시 청년 유형으로)",
                "중복 신청 시 전부 무효 (타지역 동일 공고일 포함)"
              ]
            },
            {
              "label": "문의처",
              "items": ["LH 마이홈센터 ☎1600-1004 (평일 09:00~18:00, 2번→3번)"]
            }
          ],
          "qa": [
            {
              "q": "예비입주자 방식이란 뭔가요?",
              "a": "즉시 입주가 아니라, 공가가 생겼을 때 순번에 따라 연락받고 입주하는 대기자 성격의 모집이에요. 순번 발표일로부터 60일간 예비자 자격이 유지돼요."
            },
            {
              "q": "성별 구분을 꼭 확인해야 하나요?",
              "a": "네. 공급주택목록에 남성전용(1호)·여성전용(2호) 주택이 있어요. 잘못 신청하면 곧바로 부적격 처리돼요."
            }
          ]
        }
      },
      "terms": []
    }
  ],
  "outro": {
    "body": "이번 공고는 서울 22개 자치구 전역에 493호를 공급하는 규모에, 가전이 기본 비치되어 짐 없이 입주할 수 있다는 점이 큰 강점이에요. 1순위 기준 최저 월 156,170원부터 입주 가능하니 조건에 해당한다면 꼭 확인해보세요. 단 예비입주자 방식이라 즉시 입주가 아님을 꼭 기억하고, 성별 구분을 반드시 사전 확인해주세요.",
    "ctaLabel": "공고문 확인하기",
    "ctaUrl": "https://gobang.kr/notices/20544"
  }
}
```

- [ ] **Step 2: 대표 JSON 파일 마이그레이션**

`reports/20260625-LH-서울지역본부-청년매입임대주택-예비입주자-모집공고.json`을 Step 1의 schema-example.json 내용으로 교체한다 (이미 예시가 이 공고 기준으로 작성됨).

```bash
cp reports/schema-example.json "reports/20260625-LH-서울지역본부-청년매입임대주택-예비입주자-모집공고.json"
```

- [ ] **Step 3: 나머지 기존 JSON 파일 임시 처리**

나머지 JSON 파일들(`20260526-*`, `20260529-*` 등)은 Task 5에서 to_json.py로 재생성할 예정이므로, 현재는 `reports/legacy/` 폴더로 이동해 렌더러 오류를 방지한다.

```bash
mkdir -p reports/legacy
mv reports/20260526-*.json reports/legacy/
mv reports/20260529-*.json reports/legacy/
mv reports/20260611-*.json reports/legacy/
mv reports/20260615-*.json reports/legacy/
mv reports/20260619-*.json reports/legacy/
mv reports/20260626-*.json reports/legacy/
```

- [ ] **Step 4: `reports/index.json` 업데이트**

마이그레이션된 1건만 남기도록 `reports/index.json` 수정:

```json
{
  "reports": [
    {
      "slug": "20260625-LH-서울지역본부-청년매입임대주택-예비입주자-모집공고",
      "title": "서울지역본부 청년매입임대주택 예비입주자 모집공고",
      "subtitle": "서울 22개 자치구에 가전 완비 청년 임대주택이 떴어요!",
      "publishedAt": "26.06.25",
      "badge": "청년주택 공고 분석"
    }
  ]
}
```

- [ ] **Step 5: 커밋**

```bash
git add reports/
git commit -m "feat: migrate JSON schema to fixed 5-section structure"
```

---

## Task 2: 컴포넌트 렌더러 (JS 모듈)

`js/components/` 아래 각 컴포넌트 렌더러를 생성한다. 모두 `data` 객체를 받아 HTML 문자열을 반환하는 순수 함수.

**Files:**
- Create: `js/components/summary-card.js`
- Create: `js/components/intro-block.js`
- Create: `js/components/bullet-card.js`
- Create: `js/components/table-card.js`
- Create: `js/components/timeline.js`
- Create: `js/components/qa-list.js`
- Create: `js/components/outro-block.js`

**Interfaces:**
- Consumes: `summary` 객체, `intro` 객체, `outro` 객체, `section.component.data` 객체
- Produces: 각 파일에서 named export 함수. `renderer.js`(Task 3)가 import해서 사용.

```
renderSummaryCard(summary) → HTML string
renderIntroBlock(intro) → HTML string
renderBulletCard(data) → HTML string
renderTableCard(data) → HTML string
renderTimeline(data) → HTML string
renderQaList(data) → HTML string
renderOutroBlock(outro) → HTML string
```

- [ ] **Step 1: `js/components/summary-card.js` 작성**

```js
// js/components/summary-card.js
export function renderSummaryCard(summary) {
  const { organizer, totalUnits, minRent, applyStart, applyEnd } = summary;
  return `
    <div class="summary-card">
      <div class="summary-item">
        <span class="summary-label">공급기관</span>
        <span class="summary-value">${organizer}</span>
      </div>
      <div class="summary-item highlight">
        <span class="summary-label">모집 호수</span>
        <span class="summary-value">${totalUnits.toLocaleString()}호</span>
      </div>
      <div class="summary-item highlight">
        <span class="summary-label">최저 월세</span>
        <span class="summary-value">${minRent}~</span>
      </div>
      <div class="summary-item highlight">
        <span class="summary-label">신청 기간</span>
        <span class="summary-value">${applyStart} ~ ${applyEnd}</span>
      </div>
    </div>
  `;
}
```

- [ ] **Step 2: `js/components/intro-block.js` 작성**

```js
// js/components/intro-block.js
export function renderIntroBlock(intro) {
  const { headline, body } = intro;
  return `
    <div class="intro-block">
      <p class="intro-headline">"${headline}"</p>
      <div class="intro-body">${body}</div>
    </div>
  `;
}
```

- [ ] **Step 3: `js/components/bullet-card.js` 작성**

```js
// js/components/bullet-card.js
export function renderBulletCard(data) {
  const { groups } = data;
  const groupsHtml = groups.map(group => `
    <div class="bullet-group">
      <p class="bullet-group-label">${group.label}</p>
      <ul class="bullet-list">
        ${group.items.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  `).join('');
  return `<div class="bullet-card">${groupsHtml}</div>`;
}
```

- [ ] **Step 4: `js/components/table-card.js` 작성**

```js
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
          <p class="lease-conversion-title">보증금 ↔ 월세 전환</p>
          <p>${conversion.description} (${conversion.unit} 단위, ${conversion.rate})</p>
        </div>` : ''}
      </div>
    </div>
  `;
}
```

- [ ] **Step 5: `js/components/timeline.js` 작성**

```js
// js/components/timeline.js
export function renderTimeline(data) {
  const { method, steps } = data;
  const stepsHtml = steps.map(step => `
    <div class="tl-step ${step.highlight ? 'tl-step--highlight' : ''}">
      <div class="tl-dot"></div>
      <div class="tl-content">
        <span class="tl-label">${step.label}</span>
        <span class="tl-date">${step.date}</span>
      </div>
    </div>
  `).join('');
  return `
    <div class="timeline-card">
      <div class="timeline-method">
        <span class="timeline-method-icon">💻</span>
        <span>${method}</span>
      </div>
      <div class="timeline-steps">${stepsHtml}</div>
    </div>
  `;
}
```

- [ ] **Step 6: `js/components/qa-list.js` 작성**

```js
// js/components/qa-list.js
export function renderQaList(data) {
  const { bullets, qa } = data;
  const bulletsHtml = bullets.map(group => `
    <div class="qa-bullet-group">
      <p class="qa-bullet-label">${group.label}</p>
      <ul class="qa-bullet-list">
        ${group.items.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  `).join('');
  const qaHtml = qa.map((item, i) => `
    <details class="qa-item">
      <summary class="qa-question">Q. ${item.q}</summary>
      <p class="qa-answer">A. ${item.a}</p>
    </details>
  `).join('');
  return `
    <div class="qa-list">
      ${bulletsHtml}
      ${qa.length ? `<div class="qa-accordion">${qaHtml}</div>` : ''}
    </div>
  `;
}
```

- [ ] **Step 7: `js/components/outro-block.js` 작성**

```js
// js/components/outro-block.js
export function renderOutroBlock(outro) {
  const { body, ctaLabel, ctaUrl } = outro;
  return `
    <div class="outro-block">
      <p class="outro-body">${body}</p>
      <a class="outro-cta" href="${ctaUrl}" target="_blank" rel="noopener">
        ✅ ${ctaLabel} &gt;
      </a>
    </div>
  `;
}
```

- [ ] **Step 8: 커밋**

```bash
git add js/components/
git commit -m "feat: add component renderers (bullet-card, table-card, timeline, qa-list, etc.)"
```

---

## Task 3: 서울 지도 + supply-overview 컴포넌트

`supply-overview` 컴포넌트는 `locations` 배열 길이에 따라 세 가지 모드로 렌더링한다.

**Files:**
- Create: `js/components/seoul-map.js`
- Create: `js/components/supply-overview.js`

**Interfaces:**
- Consumes: `section.component.data` where `type === 'supply-overview'`
- Produces: `renderSupplyOverview(data) → HTML string`

지도 모드 결정 규칙:
- `locations.length === 1` → 단일 핀 카드
- `locations.length 2~5` → 버블 SVG (구 이름 + 원 크기)
- `locations.length >= 6` → 서울 choropleth SVG

- [ ] **Step 1: `js/components/seoul-map.js` 작성**

서울 25개 자치구의 SVG 좌표 데이터 (뷰박스 `0 0 500 550` 기준 중심점 + 간략 path):

```js
// js/components/seoul-map.js
// 25개 자치구 중심 좌표 (버블 모드용) — 뷰박스 0 0 500 550
export const DISTRICT_CENTERS = {
  '종로구':  { cx: 230, cy: 160 },
  '중구':    { cx: 245, cy: 195 },
  '용산구':  { cx: 220, cy: 225 },
  '성동구':  { cx: 295, cy: 200 },
  '광진구':  { cx: 335, cy: 195 },
  '동대문구':{ cx: 290, cy: 170 },
  '중랑구':  { cx: 335, cy: 155 },
  '성북구':  { cx: 265, cy: 135 },
  '강북구':  { cx: 255, cy: 105 },
  '도봉구':  { cx: 255, cy: 75 },
  '노원구':  { cx: 300, cy: 90 },
  '은평구':  { cx: 175, cy: 120 },
  '서대문구':{ cx: 190, cy: 165 },
  '마포구':  { cx: 185, cy: 205 },
  '양천구':  { cx: 145, cy: 270 },
  '강서구':  { cx: 115, cy: 245 },
  '구로구':  { cx: 155, cy: 305 },
  '금천구':  { cx: 175, cy: 345 },
  '영등포구':{ cx: 195, cy: 270 },
  '동작구':  { cx: 225, cy: 295 },
  '관악구':  { cx: 220, cy: 340 },
  '서초구':  { cx: 255, cy: 335 },
  '강남구':  { cx: 305, cy: 305 },
  '송파구':  { cx: 355, cy: 320 },
  '강동구':  { cx: 385, cy: 270 },
};

// 서울시 외곽선 (choropleth 배경용 단순화 path)
export const SEOUL_OUTLINE = 'M175,60 L215,45 L260,50 L310,65 L355,60 L400,80 L420,115 L415,155 L400,185 L410,230 L400,270 L390,310 L370,345 L340,370 L300,385 L255,390 L210,375 L170,355 L140,320 L120,280 L105,235 L110,195 L130,160 L150,120 L175,90 Z';
```

- [ ] **Step 2: `js/components/supply-overview.js` 작성**

```js
// js/components/supply-overview.js
import { DISTRICT_CENTERS, SEOUL_OUTLINE } from './seoul-map.js';

function renderSinglePin(data) {
  const loc = data.locations[0];
  return `
    <div class="supply-single">
      <div class="supply-pin-card">
        <span class="supply-pin-icon">📍</span>
        <div>
          <p class="supply-pin-district">${loc.district}</p>
          <p class="supply-pin-units">${loc.units}호</p>
        </div>
      </div>
    </div>
  `;
}

function renderBubble(data) {
  const maxUnits = Math.max(...data.locations.map(l => l.units));
  const bubbles = data.locations.map(loc => {
    const center = DISTRICT_CENTERS[loc.district] || { cx: 250, cy: 275 };
    const r = 15 + (loc.units / maxUnits) * 35;
    return `
      <g class="bubble-group">
        <circle cx="${center.cx}" cy="${center.cy}" r="${r}"
          fill="var(--color-primary)" fill-opacity="0.25" stroke="var(--color-primary)" stroke-width="1.5"/>
        <text x="${center.cx}" y="${center.cy}" text-anchor="middle"
          dy="0.35em" font-size="11" fill="var(--color-primary)" font-weight="600">
          ${loc.units}
        </text>
        <text x="${center.cx}" y="${center.cy + r + 12}" text-anchor="middle"
          font-size="9" fill="var(--color-text-muted)">
          ${loc.district}
        </text>
      </g>
    `;
  }).join('');
  return `
    <svg viewBox="0 0 500 550" class="supply-map-svg" aria-label="공급 위치 버블 차트">
      <path d="${SEOUL_OUTLINE}" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.5"/>
      ${bubbles}
    </svg>
  `;
}

function renderChoropleth(data) {
  const maxUnits = Math.max(...data.locations.map(l => l.units));
  const unitMap = Object.fromEntries(data.locations.map(l => [l.district, l.units]));
  const districtElements = Object.entries(DISTRICT_CENTERS).map(([name, center]) => {
    const units = unitMap[name] || 0;
    const intensity = units / maxUnits;
    const opacity = units > 0 ? 0.15 + intensity * 0.7 : 0.05;
    return `
      <g class="district-group">
        <circle cx="${center.cx}" cy="${center.cy}" r="18"
          fill="var(--color-primary)" fill-opacity="${opacity.toFixed(2)}"/>
        ${units > 0 ? `
          <text x="${center.cx}" y="${center.cy}" text-anchor="middle"
            dy="0.35em" font-size="9" fill="${intensity > 0.5 ? 'white' : 'var(--color-primary)'}">
            ${units}
          </text>` : ''}
      </g>
    `;
  }).join('');
  return `
    <svg viewBox="0 0 500 550" class="supply-map-svg" aria-label="서울 자치구별 공급 물량">
      <path d="${SEOUL_OUTLINE}" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.5"/>
      ${districtElements}
    </svg>
  `;
}

export function renderSupplyOverview(data) {
  const { organizer, totalUnits, houseTypes, areaRange, locations } = data;

  const typesHtml = houseTypes.map(t => `
    <div class="supply-type-item">
      <span class="supply-type-name">${t.type}</span>
      <span class="supply-type-units">${t.units}호</span>
    </div>
  `).join('');

  let mapHtml;
  if (locations.length === 1) {
    mapHtml = renderSinglePin(data);
  } else if (locations.length <= 5) {
    mapHtml = renderBubble(data);
  } else {
    mapHtml = renderChoropleth(data);
  }

  return `
    <div class="supply-overview">
      <div class="supply-meta">
        <div class="supply-stat">
          <span class="supply-stat-label">공급기관</span>
          <span class="supply-stat-value">${organizer}</span>
        </div>
        <div class="supply-stat">
          <span class="supply-stat-label">총 모집 호수</span>
          <span class="supply-stat-value">${totalUnits.toLocaleString()}호</span>
        </div>
        ${areaRange ? `
        <div class="supply-stat">
          <span class="supply-stat-label">전용면적</span>
          <span class="supply-stat-value">${areaRange}</span>
        </div>` : ''}
      </div>
      <div class="supply-types">${typesHtml}</div>
      <div class="supply-map">${mapHtml}</div>
      ${locations.length > 1 ? `
      <div class="supply-location-table">
        <table>
          <thead><tr><th>지역</th><th>호수</th></tr></thead>
          <tbody>
            ${locations.map(l => `<tr><td>${l.district}</td><td>${l.units}호</td></tr>`).join('')}
          </tbody>
        </table>
      </div>` : ''}
    </div>
  `;
}
```

- [ ] **Step 3: 커밋**

```bash
git add js/components/seoul-map.js js/components/supply-overview.js
git commit -m "feat: add supply-overview with adaptive Seoul map (pin/bubble/choropleth)"
```

---

## Task 4: renderer.js + report.html + CSS 업데이트

컴포넌트들을 통합하는 `renderer.js`를 작성하고 `report.html`과 `app.js`에 연결. CSS 변수 및 컴포넌트 스타일 추가.

**Files:**
- Create: `js/renderer.js`
- Modify: `report.html`
- Modify: `js/app.js`
- Modify: `css/styles.css`

**Interfaces:**
- Consumes: 모든 `js/components/*.js` export
- Produces: `renderReport(data, container)` — `container` DOM 요소에 전체 리포트 렌더링

- [ ] **Step 1: `js/renderer.js` 작성**

```js
// js/renderer.js
import { renderSummaryCard } from './components/summary-card.js';
import { renderIntroBlock } from './components/intro-block.js';
import { renderSupplyOverview } from './components/supply-overview.js';
import { renderBulletCard } from './components/bullet-card.js';
import { renderTableCard } from './components/table-card.js';
import { renderTimeline } from './components/timeline.js';
import { renderQaList } from './components/qa-list.js';
import { renderOutroBlock } from './components/outro-block.js';

const COMPONENT_RENDERERS = {
  'supply-overview': renderSupplyOverview,
  'bullet-card':     renderBulletCard,
  'table-card':      renderTableCard,
  'timeline':        renderTimeline,
  'qa-list':         renderQaList,
};

function renderTerms(terms) {
  if (!terms || terms.length === 0) return '';
  const items = terms.map(t => `
    <div class="term-item">
      <span class="term-name">${t.term}</span>
      <span class="term-def">${t.definition}</span>
    </div>
  `).join('');
  return `<div class="terms-box">${items}</div>`;
}

function renderSection(section) {
  const renderer = COMPONENT_RENDERERS[section.component.type];
  const componentHtml = renderer ? renderer(section.component.data) : '';
  return `
    <section id="section-${section.id}" class="article-section" data-section-id="${section.id}">
      <h2 class="article-section-title">
        ${section.emoji ? `<span class="section-emoji">${section.emoji}</span>` : ''}
        ${section.title}
      </h2>
      ${section.lead ? `<p class="section-lead">${section.lead}</p>` : ''}
      ${componentHtml}
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

  data.sections.forEach(section => {
    container.insertAdjacentHTML('beforeend', renderSection(section));
    if (sectionIndexList) {
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
```

- [ ] **Step 2: `report.html` 수정**

`<script>` 태그를 `type="module"`로 변경하고, 새 렌더러 블록 추가:

```html
<!-- report.html의 articleBody 위에 추가 -->
<div id="summaryCard"></div>
<div id="introBlock"></div>

<!-- articleBody는 유지 (renderer.js가 채움) -->
<div id="articleBody"></div>

<!-- 아웃트로 -->
<div id="outroBlock"></div>

<!-- 스크립트 교체 -->
<script type="module" src="js/app.js"></script>
```

- [ ] **Step 3: `js/app.js` 수정**

`renderMagazineView`와 `renderCardView` 함수를 `renderer.js`의 `renderReport`로 교체:

```js
// app.js 상단에 추가
import { renderReport } from './renderer.js';

// loadReport 함수 내 renderMagazineView(data); renderCardView(data); 를 교체:
const articleBody = document.getElementById('articleBody');
const sectionIndexList = document.getElementById('sectionIndexList');
renderReport(data, articleBody, sectionIndexList);
initSectionObserver();
```

기존 `renderMagazineView`, `renderCardView`, `buildEligibilityCard` 등 하드코딩 빌더 함수 전부 삭제.

- [ ] **Step 4: `css/styles.css`에 컴포넌트 스타일 추가**

파일 끝에 아래 CSS 변수 및 컴포넌트 스타일 추가 (기존 스타일 유지):

```css
/* ── CSS 변수 (없으면 추가) ─────────────────────── */
:root {
  --color-primary: #2563EB;
  --color-primary-light: #EFF6FF;
  --color-surface: #F8FAFC;
  --color-border: #E2E8F0;
  --color-text: #1E293B;
  --color-text-muted: #64748B;
}

/* ── Summary Card ────────────────────────────── */
.summary-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  padding: 20px;
  background: var(--color-primary-light);
  border-radius: 12px;
  margin-bottom: 32px;
}
.summary-item { display: flex; flex-direction: column; gap: 4px; }
.summary-label { font-size: 12px; color: var(--color-text-muted); }
.summary-value { font-size: 18px; font-weight: 700; color: var(--color-text); }
.summary-item.highlight .summary-value { color: var(--color-primary); }

/* ── Section Lead ────────────────────────────── */
.section-lead {
  color: var(--color-text-muted);
  line-height: 1.7;
  margin-bottom: 16px;
  font-size: 15px;
}

/* ── Bullet Card ─────────────────────────────── */
.bullet-card { display: flex; flex-direction: column; gap: 16px; }
.bullet-group-label {
  font-size: 13px; font-weight: 600;
  color: var(--color-primary); margin-bottom: 6px;
}
.bullet-list { padding-left: 20px; }
.bullet-list li { margin-bottom: 6px; line-height: 1.6; }

/* ── Table Card ──────────────────────────────── */
.table-card { overflow-x: auto; }
.rent-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.rent-table th {
  background: var(--color-primary-light);
  color: var(--color-primary);
  padding: 10px 14px; text-align: left;
}
.rent-table td { padding: 10px 14px; border-bottom: 1px solid var(--color-border); }
.lease-info { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
.lease-info-label { font-weight: 600; margin-right: 8px; }
.lease-conversion {
  background: var(--color-surface); border-radius: 8px;
  padding: 12px; margin-top: 8px; font-size: 14px;
}
.lease-conversion-title { font-weight: 600; margin-bottom: 4px; }

/* ── Timeline ────────────────────────────────── */
.timeline-card { display: flex; flex-direction: column; gap: 16px; }
.timeline-method {
  display: flex; align-items: flex-start; gap: 8px;
  background: var(--color-surface); border-radius: 8px; padding: 12px;
  font-size: 14px;
}
.timeline-steps { display: flex; flex-direction: column; gap: 0; position: relative; }
.tl-step {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 12px 0; position: relative;
}
.tl-step::before {
  content: ''; position: absolute; left: 9px; top: 28px;
  width: 2px; height: calc(100% - 14px); background: var(--color-border);
}
.tl-step:last-child::before { display: none; }
.tl-dot {
  width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
  background: var(--color-border); border: 2px solid var(--color-border);
  margin-top: 2px;
}
.tl-step--highlight .tl-dot {
  background: var(--color-primary); border-color: var(--color-primary);
}
.tl-content { display: flex; flex-direction: column; gap: 2px; }
.tl-label { font-weight: 600; font-size: 15px; }
.tl-step--highlight .tl-label { color: var(--color-primary); }
.tl-date { font-size: 13px; color: var(--color-text-muted); }

/* ── QA List ─────────────────────────────────── */
.qa-list { display: flex; flex-direction: column; gap: 16px; }
.qa-bullet-label {
  font-size: 13px; font-weight: 600;
  color: #EF4444; margin-bottom: 6px;
}
.qa-bullet-list { padding-left: 20px; }
.qa-bullet-list li { margin-bottom: 6px; }
.qa-accordion { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
.qa-item {
  border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden;
}
.qa-question {
  padding: 12px 16px; cursor: pointer;
  font-weight: 600; list-style: none;
  background: var(--color-surface);
}
.qa-question::-webkit-details-marker { display: none; }
.qa-answer { padding: 12px 16px; line-height: 1.7; font-size: 14px; }

/* ── Supply Overview ─────────────────────────── */
.supply-overview { display: flex; flex-direction: column; gap: 16px; }
.supply-meta { display: flex; flex-wrap: wrap; gap: 16px; }
.supply-stat { display: flex; flex-direction: column; gap: 2px; }
.supply-stat-label { font-size: 12px; color: var(--color-text-muted); }
.supply-stat-value { font-size: 16px; font-weight: 700; }
.supply-types { display: flex; flex-wrap: wrap; gap: 8px; }
.supply-type-item {
  display: flex; gap: 6px; align-items: center;
  background: var(--color-primary-light); border-radius: 6px;
  padding: 4px 10px; font-size: 13px;
}
.supply-type-units { font-weight: 600; color: var(--color-primary); }
.supply-map-svg { width: 100%; max-width: 400px; height: auto; display: block; }
.supply-location-table table { width: 100%; border-collapse: collapse; font-size: 14px; }
.supply-location-table td, .supply-location-table th {
  padding: 8px 12px; border-bottom: 1px solid var(--color-border); text-align: left;
}

/* ── Terms Box ───────────────────────────────── */
.terms-box {
  background: var(--color-surface); border-left: 3px solid var(--color-primary);
  border-radius: 6px; padding: 12px 16px; margin-top: 16px;
  display: flex; flex-direction: column; gap: 8px;
}
.term-item { display: flex; gap: 8px; flex-wrap: wrap; font-size: 14px; }
.term-name { font-weight: 600; color: var(--color-primary); flex-shrink: 0; }
.term-def { color: var(--color-text-muted); line-height: 1.6; }

/* ── Outro Block ─────────────────────────────── */
.outro-block { text-align: center; padding: 32px 0; }
.outro-body { line-height: 1.8; color: var(--color-text); margin-bottom: 24px; }
.outro-cta {
  display: inline-block; padding: 14px 28px;
  background: var(--color-primary); color: white;
  border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 16px;
}
.outro-cta:hover { opacity: 0.9; }

/* ── Intro Block ─────────────────────────────── */
.intro-headline {
  font-size: 18px; font-weight: 700; line-height: 1.6;
  color: var(--color-primary); margin-bottom: 16px;
}
.intro-body { line-height: 1.8; }
```

- [ ] **Step 5: 브라우저에서 동작 확인**

로컬 서버 실행 후 `?slug=20260625-LH-서울지역본부-청년매입임대주택-예비입주자-모집공고`로 접근:
- 요약 카드 4개 항목 표시 확인
- 공급 개요 지도 렌더링 확인 (6개 구 → choropleth 모드)
- 타임라인 5단계 표시 확인
- Q&A 아코디언 열림/닫힘 확인

- [ ] **Step 6: 커밋**

```bash
git add js/renderer.js report.html js/app.js css/styles.css
git commit -m "feat: wire up renderer.js and rich visual components in report.html"
```

---

## Task 5: PDF 파서 파이프라인 (to_json.py 재작성)

기존 HTML 파싱 방식을 버리고, PDF → pypdf 텍스트 추출 → Claude Tool Use(Haiku) → 새 스키마 JSON으로 전환한다.

**Files:**
- Rewrite: `to_json.py`

**Interfaces:**
- Consumes: PDF 파일 경로, sourceUrl, badge 값
- Produces: `reports/{slug}.json` + `reports/index.json` 업데이트

- [ ] **Step 1: 의존성 설치**

```bash
pip install pypdf anthropic
```

설치 확인:
```bash
python -c "import pypdf; import anthropic; print('OK')"
```

- [ ] **Step 2: `to_json.py` 재작성**

```python
"""
to_json.py  —  공고문 PDF → reports/[slug].json 변환

사용법:
  python to_json.py --pdf "C:/path/to/notice.pdf" --url "https://gobang.kr/notices/xxx"

옵션:
  --badge   (기본값: "청년주택 공고 분석")
  --model   (기본값: "claude-haiku-4-5-20251001")
"""

import argparse
import json
import os
import re
from pathlib import Path

import anthropic
import pypdf

REPORTS_DIR = Path(__file__).parent / "reports"

# ── 스키마 (Tool Use input_schema) ───────────────────────────────────────── #
TOOL_SCHEMA = {
    "name": "parse_notice",
    "description": "공고문 텍스트를 파싱하여 랜딩 페이지 JSON을 생성합니다.",
    "input_schema": {
        "type": "object",
        "required": ["meta", "summary", "intro", "sections", "outro"],
        "properties": {
            "meta": {
                "type": "object",
                "required": ["slug", "title", "subtitle", "publishedAt", "sourceUrl", "badge"],
                "properties": {
                    "slug":        {"type": "string", "description": "YYYYMMDD-제목-슬러그 형식"},
                    "title":       {"type": "string"},
                    "subtitle":    {"type": "string", "description": "한 줄 요약, 독자 관점 혜택 중심"},
                    "publishedAt": {"type": "string", "description": "YY.MM.DD 형식"},
                    "sourceUrl":   {"type": "string"},
                    "badge":       {"type": "string"}
                }
            },
            "summary": {
                "type": "object",
                "required": ["organizer", "totalUnits", "minRent", "applyStart", "applyEnd"],
                "properties": {
                    "organizer":   {"type": "string"},
                    "totalUnits":  {"type": "number"},
                    "minRent":     {"type": "string", "description": "1순위 기준 최저 월임대료, 없으면 전체 최저값"},
                    "applyStart":  {"type": "string", "description": "YY.MM.DD 형식"},
                    "applyEnd":    {"type": "string", "description": "YY.MM.DD 형식"}
                }
            },
            "intro": {
                "type": "object",
                "required": ["headline", "body"],
                "properties": {
                    "headline": {"type": "string", "description": "핵심 혜택을 담은 한 문장"},
                    "body":     {"type": "string", "description": "2~3문단 HTML. <p><strong> 태그 허용"}
                }
            },
            "sections": {
                "type": "array",
                "minItems": 5,
                "maxItems": 5,
                "items": {
                    "type": "object",
                    "required": ["id", "emoji", "title", "lead", "component", "terms"],
                    "properties": {
                        "id":    {"type": "string", "enum": ["supply", "eligibility", "lease", "schedule", "caution"]},
                        "emoji": {"type": "string"},
                        "title": {"type": "string"},
                        "lead":  {"type": "string", "description": "2~3문장. 섹션 맥락 설명"},
                        "component": {
                            "type": "object",
                            "required": ["type", "data"],
                            "properties": {
                                "type": {"type": "string", "enum": ["supply-overview", "bullet-card", "table-card", "timeline", "qa-list"]},
                                "data": {"type": "object"}
                            }
                        },
                        "terms": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "required": ["term", "definition"],
                                "properties": {
                                    "term":       {"type": "string"},
                                    "definition": {"type": "string"}
                                }
                            }
                        }
                    }
                }
            },
            "outro": {
                "type": "object",
                "required": ["body", "ctaLabel", "ctaUrl"],
                "properties": {
                    "body":     {"type": "string", "description": "마무리 줄글. 핵심 강점 재요약"},
                    "ctaLabel": {"type": "string"},
                    "ctaUrl":   {"type": "string"}
                }
            }
        }
    }
}

SYSTEM_PROMPT = """당신은 공공임대주택 공고문을 분석하는 전문가입니다.
주어진 공고문 텍스트를 parse_notice 도구를 사용하여 정확하게 파싱해주세요.

파싱 규칙:
1. sections는 반드시 supply, eligibility, lease, schedule, caution 순서로 5개 고정
2. supply.component.type은 항상 "supply-overview"
3. eligibility.component.type은 항상 "bullet-card"
4. lease.component.type은 항상 "table-card"
5. schedule.component.type은 항상 "timeline"
6. caution.component.type은 항상 "qa-list"
7. lead는 반드시 2~3문장, 독자 관점(~해요 체)으로 작성
8. terms는 공고 특유 용어만 포함, 없으면 빈 배열
9. intro.body는 HTML <p>, <strong> 태그 사용 가능
10. bullet-card의 groups는 "신청 가능 계층", "소득 조건", "자산 조건", "신청 불가" 라벨 사용
11. qa-list의 qa 배열에는 독자가 혼동하기 쉬운 포인트를 Q&A 형식으로 2~3개 작성
12. timeline의 steps에서 신청접수 단계는 반드시 highlight: true"""


def extract_text(pdf_path: str) -> str:
    reader = pypdf.PdfReader(pdf_path)
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n\n".join(pages)


def parse_with_claude(text: str, source_url: str, badge: str, model: str) -> dict:
    client = anthropic.Anthropic()
    response = client.messages.create(
        model=model,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        tools=[TOOL_SCHEMA],
        tool_choice={"type": "tool", "name": "parse_notice"},
        messages=[{
            "role": "user",
            "content": (
                f"아래 공고문을 파싱해주세요.\n\n"
                f"sourceUrl: {source_url}\n"
                f"badge: {badge}\n\n"
                f"---\n{text}"
            )
        }]
    )
    for block in response.content:
        if block.type == "tool_use" and block.name == "parse_notice":
            return block.input
    raise ValueError("Tool use 응답을 찾을 수 없습니다.")


def update_index(slug: str, data: dict):
    index_path = REPORTS_DIR / "index.json"
    if index_path.exists():
        index_data = json.loads(index_path.read_text(encoding="utf-8"))
    else:
        index_data = {"reports": []}

    index_data["reports"] = [r for r in index_data["reports"] if r["slug"] != slug]
    index_data["reports"].insert(0, {
        "slug":        data["meta"]["slug"],
        "title":       data["meta"]["title"],
        "subtitle":    data["meta"]["subtitle"],
        "publishedAt": data["meta"]["publishedAt"],
        "badge":       data["meta"]["badge"],
    })
    index_path.write_text(json.dumps(index_data, ensure_ascii=False, indent=2), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="공고문 PDF → reports/[slug].json")
    parser.add_argument("--pdf",   required=True, help="공고문 PDF 경로")
    parser.add_argument("--url",   default="",    help="원문 URL (gobang.kr 링크 등)")
    parser.add_argument("--badge", default="청년주택 공고 분석")
    parser.add_argument("--model", default="claude-haiku-4-5-20251001")
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF 파일을 찾을 수 없습니다: {pdf_path}")

    print(f"[1/3] PDF 텍스트 추출 중... ({pdf_path.name})")
    text = extract_text(str(pdf_path))
    print(f"      추출 완료: {len(text):,}자")

    print(f"[2/3] Claude({args.model}) 파싱 중...")
    data = parse_with_claude(text, args.url, args.badge, args.model)

    REPORTS_DIR.mkdir(exist_ok=True)
    slug = data["meta"]["slug"]
    out_path = REPORTS_DIR / f"{slug}.json"
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[3/3] index.json 업데이트 중...")
    update_index(slug, data)

    print(f"\n[완료] {out_path}")
    print(f"       섹션 수: {len(data['sections'])}")
    for s in data["sections"]:
        print(f"         - {s['id']} ({s['component']['type']})")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: 동작 확인**

테스트용 PDF로 실행:
```bash
python to_json.py --pdf "reports/legacy/sample.pdf" --url "https://gobang.kr/notices/test"
```

예상 출력:
```
[1/3] PDF 텍스트 추출 중...
      추출 완료: 12,345자
[2/3] Claude(claude-haiku-4-5-20251001) 파싱 중...
[3/3] index.json 업데이트 중...

[완료] reports/20260625-xxx.json
       섹션 수: 5
         - supply (supply-overview)
         - eligibility (bullet-card)
         - lease (table-card)
         - schedule (timeline)
         - caution (qa-list)
```

- [ ] **Step 4: 커밋**

```bash
git add to_json.py
git commit -m "feat: rewrite to_json.py with pypdf + Claude Tool Use pipeline"
```

---

## Task 6: 로컬 에디터 (editor.html + server.py)

배포 전 JSON을 브라우저에서 검토·수정할 수 있는 로컬 에디터. Flask 서버가 정적 파일 서빙 + JSON 저장 API를 담당한다.

**Files:**
- Create: `server.py`
- Create: `editor.html`
- Create: `js/editor.js`
- Create: `시작 에디터.bat`

**Interfaces:**
- `GET /` → `index.html`
- `GET /editor.html` → 에디터 페이지
- `GET /reports/{slug}.json` → 기존 정적 파일 서빙
- `POST /api/save/{slug}` → JSON body → `reports/{slug}.json` 덮어쓰기

- [ ] **Step 1: `server.py` 작성**

```python
"""
server.py — 로컬 에디터용 Flask 서버 (포트 5173)
정적 파일 서빙 + JSON 저장 API
"""
from flask import Flask, send_from_directory, request, jsonify, send_file
import json
from pathlib import Path

BASE_DIR = Path(__file__).parent
REPORTS_DIR = BASE_DIR / "reports"

app = Flask(__name__)


@app.route('/')
def index():
    return send_file(BASE_DIR / 'index.html')


@app.route('/editor.html')
def editor():
    return send_file(BASE_DIR / 'editor.html')


@app.route('/reports/index.json')
def reports_index():
    return send_from_directory(str(REPORTS_DIR), 'index.json')


@app.route('/reports/<path:filename>')
def reports(filename):
    return send_from_directory(str(REPORTS_DIR), filename)


@app.route('/css/<path:filename>')
def css(filename):
    return send_from_directory(str(BASE_DIR / 'css'), filename)


@app.route('/js/<path:filename>')
def js(filename):
    return send_from_directory(str(BASE_DIR / 'js'), filename)


@app.route('/api/save/<slug>', methods=['POST'])
def save_report(slug):
    data = request.get_json()
    if not data:
        return jsonify({'ok': False, 'error': 'No JSON body'}), 400
    out_path = REPORTS_DIR / f'{slug}.json'
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    return jsonify({'ok': True, 'path': str(out_path)})


@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(str(BASE_DIR), filename)


if __name__ == '__main__':
    print("에디터 서버 시작: http://localhost:5173/editor.html")
    app.run(port=5173, debug=True)
```

- [ ] **Step 2: `시작 에디터.bat` 작성**

```bat
@echo off
chcp 65001
cd /d "%~dp0"
start http://localhost:5173/editor.html
python server.py
```

- [ ] **Step 3: `editor.html` 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>공고 리포트 에디터</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, sans-serif; height: 100vh; display: flex; flex-direction: column; }
    .editor-header {
      padding: 12px 20px; background: #1E293B; color: white;
      display: flex; align-items: center; gap: 16px; flex-shrink: 0;
    }
    .editor-header h1 { font-size: 16px; font-weight: 600; }
    .report-select { padding: 6px 10px; border-radius: 6px; border: none; font-size: 14px; }
    .btn-save {
      margin-left: auto; padding: 8px 18px;
      background: #2563EB; color: white; border: none;
      border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: 600;
    }
    .btn-save:hover { background: #1D4ED8; }
    .btn-save.saved { background: #10B981; }
    .editor-body { display: flex; flex: 1; overflow: hidden; }
    .editor-pane {
      width: 40%; border-right: 1px solid #E2E8F0;
      overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px;
    }
    .preview-pane { flex: 1; overflow-y: auto; padding: 20px; background: #F8FAFC; }
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 12px; font-weight: 600; color: #64748B; text-transform: uppercase; }
    .field-input, .field-textarea {
      width: 100%; padding: 8px 10px; border: 1px solid #E2E8F0;
      border-radius: 6px; font-size: 14px; font-family: inherit;
    }
    .field-textarea { min-height: 80px; resize: vertical; }
    .section-block {
      border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px;
    }
    .section-block-title {
      font-size: 14px; font-weight: 700; margin-bottom: 12px; color: #1E293B;
    }
    .json-raw {
      width: 100%; min-height: 120px; font-family: monospace; font-size: 12px;
      padding: 8px; border: 1px solid #E2E8F0; border-radius: 6px; resize: vertical;
    }
    .status-bar {
      padding: 6px 20px; background: #F1F5F9; border-top: 1px solid #E2E8F0;
      font-size: 12px; color: #64748B; flex-shrink: 0;
    }
  </style>
</head>
<body>
  <div class="editor-header">
    <h1>공고 리포트 에디터</h1>
    <select class="report-select" id="reportSelect"></select>
    <button class="btn-save" id="btnSave">저장</button>
  </div>
  <div class="editor-body">
    <div class="editor-pane" id="editorPane">
      <p style="color:#94A3B8">리포트를 선택하세요.</p>
    </div>
    <div class="preview-pane">
      <iframe id="previewFrame" style="width:100%;height:100%;border:none;background:white"></iframe>
    </div>
  </div>
  <div class="status-bar" id="statusBar">준비됨</div>
  <script type="module" src="js/editor.js"></script>
</body>
</html>
```

- [ ] **Step 4: `js/editor.js` 작성**

```js
// js/editor.js
let currentData = null;
let currentSlug = null;

const reportSelect = document.getElementById('reportSelect');
const editorPane = document.getElementById('editorPane');
const previewFrame = document.getElementById('previewFrame');
const btnSave = document.getElementById('btnSave');
const statusBar = document.getElementById('statusBar');

async function loadIndex() {
  const res = await fetch('/reports/index.json');
  const { reports } = await res.json();
  reports.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.slug;
    opt.textContent = r.title;
    reportSelect.appendChild(opt);
  });
  if (reports.length > 0) loadReport(reports[0].slug);
}

async function loadReport(slug) {
  currentSlug = slug;
  const res = await fetch(`/reports/${slug}.json`);
  currentData = await res.json();
  renderEditor(currentData);
  updatePreview();
  statusBar.textContent = `로드됨: ${slug}.json`;
}

function renderEditor(data) {
  editorPane.innerHTML = `
    <div class="section-block">
      <p class="section-block-title">메타</p>
      <div class="field-group">
        <label class="field-label">제목</label>
        <input class="field-input" data-path="meta.title" value="${esc(data.meta.title)}">
      </div>
      <div class="field-group">
        <label class="field-label">부제목</label>
        <textarea class="field-textarea" data-path="meta.subtitle">${esc(data.meta.subtitle)}</textarea>
      </div>
    </div>
    <div class="section-block">
      <p class="section-block-title">요약 카드</p>
      <div class="field-group">
        <label class="field-label">공급기관</label>
        <input class="field-input" data-path="summary.organizer" value="${esc(data.summary.organizer)}">
      </div>
      <div class="field-group">
        <label class="field-label">모집 호수</label>
        <input class="field-input" type="number" data-path="summary.totalUnits" value="${data.summary.totalUnits}">
      </div>
      <div class="field-group">
        <label class="field-label">최저 월세</label>
        <input class="field-input" data-path="summary.minRent" value="${esc(data.summary.minRent)}">
      </div>
      <div class="field-group">
        <label class="field-label">신청 시작</label>
        <input class="field-input" data-path="summary.applyStart" value="${esc(data.summary.applyStart)}">
      </div>
      <div class="field-group">
        <label class="field-label">신청 마감</label>
        <input class="field-input" data-path="summary.applyEnd" value="${esc(data.summary.applyEnd)}">
      </div>
    </div>
    <div class="section-block">
      <p class="section-block-title">인트로</p>
      <div class="field-group">
        <label class="field-label">헤드라인</label>
        <input class="field-input" data-path="intro.headline" value="${esc(data.intro.headline)}">
      </div>
      <div class="field-group">
        <label class="field-label">본문 (HTML)</label>
        <textarea class="field-textarea" data-path="intro.body">${esc(data.intro.body)}</textarea>
      </div>
    </div>
    ${data.sections.map((s, i) => `
    <div class="section-block">
      <p class="section-block-title">${s.emoji} ${s.title}</p>
      <div class="field-group">
        <label class="field-label">리드 문구</label>
        <textarea class="field-textarea" data-path="sections.${i}.lead">${esc(s.lead)}</textarea>
      </div>
      <div class="field-group">
        <label class="field-label">컴포넌트 데이터 (JSON)</label>
        <textarea class="json-raw" data-path="sections.${i}.component.data" data-json="true">${JSON.stringify(s.component.data, null, 2)}</textarea>
      </div>
    </div>`).join('')}
    <div class="section-block">
      <p class="section-block-title">아웃트로</p>
      <div class="field-group">
        <label class="field-label">본문</label>
        <textarea class="field-textarea" data-path="outro.body">${esc(data.outro.body)}</textarea>
      </div>
    </div>
  `;
  bindInputs();
}

function bindInputs() {
  editorPane.querySelectorAll('[data-path]').forEach(el => {
    el.addEventListener('input', () => {
      const path = el.dataset.path.split('.');
      const isJson = el.dataset.json === 'true';
      try {
        const value = isJson ? JSON.parse(el.value) : (el.type === 'number' ? Number(el.value) : el.value);
        setDeep(currentData, path, value);
        updatePreview();
      } catch (e) {
        // JSON parse error — don't update yet
      }
    });
  });
}

function setDeep(obj, path, value) {
  const key = isNaN(path[0]) ? path[0] : Number(path[0]);
  if (path.length === 1) { obj[key] = value; return; }
  setDeep(obj[key], path.slice(1), value);
}

function updatePreview() {
  const slug = currentSlug;
  previewFrame.src = `/report.html?slug=${slug}&_t=${Date.now()}`;
  // 프리뷰는 저장된 파일 기반이므로 실시간 미리보기는 저장 후 갱신
}

btnSave.addEventListener('click', async () => {
  if (!currentSlug || !currentData) return;
  btnSave.textContent = '저장 중...';
  try {
    const res = await fetch(`/api/save/${currentSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentData)
    });
    const { ok } = await res.json();
    if (ok) {
      btnSave.textContent = '저장됨 ✓';
      btnSave.classList.add('saved');
      updatePreview();
      statusBar.textContent = `저장 완료: reports/${currentSlug}.json`;
      setTimeout(() => {
        btnSave.textContent = '저장';
        btnSave.classList.remove('saved');
      }, 2000);
    }
  } catch (e) {
    btnSave.textContent = '오류';
    statusBar.textContent = `저장 실패: ${e.message}`;
  }
});

reportSelect.addEventListener('change', () => loadReport(reportSelect.value));

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

loadIndex();
```

- [ ] **Step 5: Flask 설치 확인**

```bash
pip install flask
python -c "import flask; print('Flask OK')"
```

- [ ] **Step 6: 에디터 실행 테스트**

```bash
python server.py
```

브라우저에서 `http://localhost:5173/editor.html` 접속:
- 리포트 선택 드롭다운에 마이그레이션된 공고 표시 확인
- 인트로 헤드라인 수정 → 저장 → 미리보기 갱신 확인
- `reports/{slug}.json` 파일이 실제로 수정되었는지 확인

- [ ] **Step 7: 커밋**

```bash
git add server.py editor.html js/editor.js "시작 에디터.bat"
git commit -m "feat: add local editor with Flask server and live preview"
```

---

## Self-Review

**스펙 커버리지 체크:**
- [x] PDF → pypdf → Claude Tool Use → JSON (Task 5)
- [x] 고정 5섹션 스키마 (Task 1)
- [x] supply-overview (적응형 지도) (Task 3)
- [x] bullet-card, table-card, timeline, qa-list (Task 2)
- [x] 인트로/아웃트로 + CTA (Task 2)
- [x] lead 2~3문장, terms 필드 (Task 2 renderer.js)
- [x] 로컬 에디터 (Task 6)
- [x] Vercel 배포 — 기존 vercel.json 유지, 정적 파일만 배포 (변경 없음)
- [x] 토큰 효율화 — pypdf 전처리 + Tool Use 적용 (Task 5)
- [x] 요약 카드 상단 헤더 (Task 4 renderer.js)

**타입 일관성:**
- `renderReport(data, container, sectionIndexList)` — Task 4 app.js와 renderer.js 일치
- `COMPONENT_RENDERERS` 키 ↔ `component.type` enum 값 일치: `supply-overview`, `bullet-card`, `table-card`, `timeline`, `qa-list`
- `setDeep(obj, path, value)` — editor.js에서 사용, path는 `string[]`
