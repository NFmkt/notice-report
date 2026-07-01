# 공고 랜딩 페이지 자동 생성 서비스 설계

**작성일**: 2026-07-01  
**프로젝트**: `for_Release/notice_report_page`

---

## 개요

공고문 PDF를 Claude에게 전달하면, 고정된 JSON 스키마로 자동 파싱하여 시각 컴포넌트가 풍부한 랜딩 페이지를 생성하는 서비스.

### 기존 플로우
```
공고문 PDF → (사람이 수동 작성) → JSON → 랜딩 렌더링
```

### 목표 플로우
```
공고문 PDF → pypdf 텍스트 추출 → Claude Tool Use → JSON → 랜딩 렌더링
```

---

## 섹션 구조 (고정)

섹션 순서와 ID는 고정. 추가/삭제/순서 변경 불가.

| 순서 | ID | 제목 | 컴포넌트 타입 |
|------|----|------|--------------|
| 헤더 | `summary` | 요약 카드 | `summary-card` |
| 인트로 | `intro` | (제목 없음) | `intro-block` |
| 1 | `supply` | 공급 개요 | `supply-overview` |
| 2 | `eligibility` | 신청 자격 | `bullet-card` |
| 3 | `lease` | 임대조건 | `table-card` |
| 4 | `schedule` | 신청 방법 및 일정 | `timeline` |
| 5 | `caution` | 주의사항 | `qa-list` |
| 아웃트로 | `outro` | (제목 없음) | `outro-block` |

---

## JSON 스키마

```json
{
  "meta": {
    "slug": "YYYYMMDD-공고명-슬러그",
    "title": "공고 제목",
    "subtitle": "한 줄 요약 (독자 관점, 혜택 중심)",
    "publishedAt": "YY.MM.DD",
    "sourceUrl": "https://gobang.kr/notices/...",
    "badge": "청년주택 공고 분석"
  },

  "summary": {
    "organizer": "공급기관명",
    "totalUnits": 493,
    "minRent": "156,170원",
    "applyStart": "26.07.06",
    "applyEnd": "26.07.08"
  },

  "intro": {
    "headline": "강조 헤드라인 문장 (따옴표 포함)",
    "body": "2~3문단 HTML. 공고의 핵심 혜택, 특이사항, 주의점을 독자 관점으로 서술."
  },

  "sections": [
    {
      "id": "supply",
      "emoji": "🏠",
      "title": "공급 개요",
      "lead": "2~3문장. 이 섹션에서 무엇을 확인해야 하는지 맥락 설명.",
      "component": {
        "type": "supply-overview",
        "data": {
          "organizer": "공급기관명",
          "totalUnits": 493,
          "houseTypes": [
            { "type": "오피스텔", "units": 236 },
            { "type": "도시형생활주택", "units": 156 }
          ],
          "areaRange": "12.06㎡~59.41㎡",
          "locations": [
            { "district": "관악구", "units": 84 },
            { "district": "강서구", "units": 76 }
          ]
        }
      },
      "terms": []
    },
    {
      "id": "eligibility",
      "emoji": "🙋‍♀️",
      "title": "신청 자격",
      "lead": "2~3문장.",
      "component": {
        "type": "bullet-card",
        "data": {
          "groups": [
            {
              "label": "기본 조건",
              "items": ["조건1", "조건2"]
            },
            {
              "label": "소득 조건",
              "items": ["조건1"]
            },
            {
              "label": "자산 조건",
              "items": ["조건1"]
            }
          ]
        }
      },
      "terms": [
        { "term": "용어명", "definition": "용어 설명." }
      ]
    },
    {
      "id": "lease",
      "emoji": "💰",
      "title": "임대조건",
      "lead": "2~3문장.",
      "component": {
        "type": "table-card",
        "data": {
          "rentRows": [
            { "label": "1순위", "ratio": "시세 40%", "deposit": "100만원", "rentRange": "156,170원~818,920원" }
          ],
          "leaseTerm": "2년, 재계약 4회 (최장 10년)",
          "renewalBonus": "혼인 시 5회 추가 (최장 20년)",
          "conversion": {
            "unit": "10만원",
            "rate": "연 6%",
            "description": "보증금 추가 납부로 월세 감액 가능"
          }
        }
      },
      "terms": []
    },
    {
      "id": "schedule",
      "emoji": "📅",
      "title": "신청 방법 및 일정",
      "lead": "2~3문장.",
      "component": {
        "type": "timeline",
        "data": {
          "method": "신청 방법 설명 (채널, 온/오프라인 여부 등)",
          "steps": [
            { "label": "신청접수", "date": "26.07.06 10:00 ~ 07.08 16:00", "highlight": true },
            { "label": "서류제출 대상자 발표", "date": "26.07.10 14:00 이후", "highlight": false },
            { "label": "서류제출", "date": "26.07.13 ~ 07.15", "highlight": false },
            { "label": "예비자 순번 발표", "date": "26.09.18 14:00 이후", "highlight": false },
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
      "lead": "2~3문장.",
      "component": {
        "type": "qa-list",
        "data": {
          "bullets": [
            { "label": "탈락 사유", "items": ["사유1", "사유2"] },
            { "label": "문의처", "items": ["LH 마이홈센터 ☎1600-1004"] }
          ],
          "qa": [
            { "q": "자주 묻는 질문", "a": "답변" }
          ]
        }
      },
      "terms": []
    }
  ],

  "outro": {
    "body": "마무리 줄글. 핵심 강점 재요약 + 주의사항 1~2개 + 행동 유도.",
    "ctaLabel": "공고문 확인하기",
    "ctaUrl": "https://gobang.kr/notices/..."
  }
}
```

---

## supply-overview 지도 타입 자동 선택 규칙

`locations` 배열 길이 기준으로 렌더러가 자동 선택:

| locations 수 | 렌더링 방식 |
|-------------|------------|
| 1개 | 단일 핀 + 주소 카드 |
| 2~5개 | 버블 인포그래픽 (원 크기 = 물량) |
| 6개 이상 | 서울 자치구 choropleth (색상 강도 = 물량) |

---

## 토큰 효율화

### 1. PDF 텍스트 전처리 (`to_json.py`)
- `pypdf` 로 PDF 텍스트 추출 후 Claude에 텍스트만 전달
- 이미지/표 렌더링 토큰 제거 → 입력 토큰 대폭 절감

### 2. Tool Use 기반 파싱
- 위 JSON 스키마를 Claude Tool의 `input_schema`로 정의
- Claude가 설명 문장 없이 JSON만 직접 채워 반환
- 출력 토큰 낭비 제거 (마크다운 펜스, 설명 문장 없음)

### 구현 위치
`to_json.py`에 두 단계 파이프라인으로 추가:
```
1. pypdf.PdfReader → 페이지별 텍스트 추출 → 하나의 문자열로 합산
2. Claude API (Tool Use) → 스키마 채워서 반환 → JSON 저장
```

---

## 파싱 규칙 (Claude 지시사항)

- `lead`: 항상 2~3문장. 해당 섹션의 핵심 맥락 + 독자가 주의할 점 서술
- `terms`: 공고 특유 용어(예비입주자, 도시근로자 월평균소득 등)가 있을 때만 추가. 없으면 `[]`
- `component.type`: 위 스키마의 고정값만 사용. 임의 타입 사용 금지
- `intro.body` / `outro.body`: 독자 관점(~해요 체), 혜택 중심, 주의사항은 마지막에
- `outro.ctaUrl`: 반드시 `meta.sourceUrl`과 동일한 값
- `summary.minRent`: 1순위 기준 최저 월임대료. 없으면 전체 최저값

---

## 로컬 에디터 (`editor.html`)

배포 전 검토·수정 용도. 로컬 서버에서만 실행.

### 역할
- Claude가 생성한 JSON을 불러와 렌더링된 랜딩 페이지와 편집 폼을 나란히 표시
- 수정 후 JSON 파일로 저장 (로컬 파일 시스템 직접 write)
- 배포 후 수정이 필요할 경우: JSON 파일 교체 → git push → Vercel 자동 재배포

### 구성
- **좌측**: 섹션별 편집 폼 (lead 텍스트, component data, terms)
- **우측**: 실시간 랜딩 페이지 미리보기
- **하단**: "JSON 저장" 버튼 → `reports/{slug}.json` 덮어쓰기

### 실행 방식
`시작 {포트번호}.bat` 으로 로컬 서버 기동 (기존 방식과 동일)

---

## 현재 구현 vs 목표 구현

| 항목 | 현재 | 목표 |
|------|------|------|
| 입력 | 수동 JSON 작성 | PDF → 자동 파싱 |
| 섹션 구성 | 가변 (공고마다 다름) | 고정 5섹션 + 인트로/아웃트로 |
| 시각 컴포넌트 | HTML 불렛 위주 | 표·타임라인·지도·Q&A 아코디언 |
| 용어 설명 | 본문 혼재 | `terms[]` 필드로 분리 렌더링 |
| 지도 | 없음 | 물량 수에 따라 자동 선택 |
| 수정 방법 | JSON 직접 편집 | 로컬 에디터(`editor.html`) |
| 배포 | Vercel (현재 동일) | Vercel + GitHub 연동 자동 재배포 |
