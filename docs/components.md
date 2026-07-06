# 컴포넌트 명세서

> 이 파일은 공고 분석 리포트의 모든 컴포넌트를 정의합니다.
> **컴포넌트를 추가·수정할 때는 반드시 이 파일도 함께 업데이트하세요.**
> 에디터 UI를 개발할 때 이 파일이 단일 출처(Single Source of Truth)입니다.

---

## 컴포넌트 배치 구조

리포트 JSON의 최상위 구조:

```
meta          → 리포트 메타 정보 (제목, 날짜, slug 등)
summary       → summary-card 전용 데이터
intro         → intro-block 전용 데이터
sections[]    → 각 섹션. 섹션마다 component + blocks[] 포함
  └ component → 섹션 대표 컴포넌트 (1개)
  └ blocks[]  → 섹션 보조 블록 (0~N개, 현재는 location-card만 사용)
outro         → outro-block 전용 데이터
```

---

## 고정 위치 컴포넌트 (sections 밖)

### intro-block

**용도:** 리포트 도입부. 공고 핵심 내용을 구어체로 소개.  
**고정 텍스트:** 없음 (데이터만 렌더링)

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| headline | string | ✅ | 한 줄 요약 문장. 큰따옴표(" ")로 감싸서 표시됨 |
| body | string | ✅ | HTML 허용 (strong, p 태그 등). 2~3 문단 권장 |

```json
"intro": {
  "headline": "안양 평촌에서 월 33만원대! ...",
  "body": "<p>내용 <strong>강조</strong> ...</p>"
}
```

---

### summary-card

**용도:** 리포트 상단에 표시되는 핵심 수치 4-카드 요약.  
**고정 텍스트:** `공급기관`, `총 모집 호수`, `최저 월세`, `신청 기간` (카드 레이블)

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| organizer | string | ✅ | 공급기관명 |
| totalUnits | number | ✅ | 총 모집 호수. 숫자만 입력 (단위 "호"는 자동 붙음) |
| minRent | string | ✅ | 최저 월세 표시용 문자열. 예: `"92,720원"`. 물결표(~)는 자동 붙음 |
| applyStart | string | ✅ | 신청 시작일. 표시 형식 그대로 입력. 예: `"06.15"` |
| applyEnd | string | ✅ | 신청 마감일. 예: `"06.19"` |

```json
"summary": {
  "organizer": "안양도시공사",
  "totalUnits": 31,
  "minRent": "92,720원",
  "applyStart": "06.15",
  "applyEnd": "06.19"
}
```

---

### outro-block

**용도:** 리포트 마무리 문단 + 원문 공고 링크 버튼.  
**고정 텍스트:** 없음 (데이터만 렌더링)

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| body | string | ✅ | HTML 허용. 마무리 요약 문단 |
| ctaLabel | string | ✅ | 버튼 텍스트. 예: `"공고문 확인하기"` |
| ctaUrl | string | ✅ | 버튼 링크 URL |

```json
"outro": {
  "body": "<p>지금까지 ... <strong>핵심</strong>은 ...</p>",
  "ctaLabel": "공고문 확인하기",
  "ctaUrl": "https://..."
}
```

---

## 섹션 컴포넌트 (sections[].component)

각 섹션은 `component.type`으로 컴포넌트를 지정하고, `component.data`에 데이터를 넣습니다.

---

### supply-overview

**용도:** 공급 개요. 모집호수 구역별 바 차트 + 주택 유형 필.  
**고정 텍스트:** `모집호수`, `주택 유형` (컬럼 타이틀), `단일 유형` (유형 1개일 때 뱃지)

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| houseTypes | array | ✅ | 주택 유형 목록 |
| houseTypes[].type | string | ✅ | 유형명. 예: `"36형"` |
| houseTypes[].units | number | ✅ | 해당 유형 호수 |
| areaRange | string | ❌ | 전용면적 범위. 예: `"36.96㎡~59.98㎡"`. 파싱하여 평 자동 계산 |
| locations | array | ❌ | 구역별 공급 목록. 없으면 바 차트 미표시 |
| locations[].district | string | ✅ | 구역명. 예: `"센텀퍼스트"` |
| locations[].units | number | ✅ | 해당 구역 호수 |

```json
{
  "type": "supply-overview",
  "data": {
    "houseTypes": [
      { "type": "36형", "units": 15 },
      { "type": "46형", "units": 6 }
    ],
    "areaRange": "36.96㎡~59.98㎡",
    "locations": [
      { "district": "센텀퍼스트", "units": 21 },
      { "district": "엘프라우드", "units": 10 }
    ]
  }
}
```

---

### bullet-card

**용도:** 신청 자격 조건, 소득 기준 등 항목 목록.  
**고정 텍스트:** `구분` (소득 기준표 첫 열 헤더)  
**특수 동작:** 첫 번째 그룹의 label이 정확히 `"신청 가능 계층"`이면 아이콘 뱃지 UI로 자동 전환

**아이콘 매핑 키워드** (items의 시작 단어와 일치해야 함):

아이콘은 플랫 fill 스타일(icon-design 스킬 규칙: viewBox `0 0 20 20`, stroke 금지, `currentColor`로 배지 색 상속). 직관적 메타포 사용.

| 키워드 | 아이콘 (메타포) | 색상 |
|--------|----------------|------|
| 청년 | 1인 실루엣 | 파랑 |
| 대학생 | 학사모 | 초록 |
| 취업준비생 | 서류가방 | 주황 |
| 신혼부부 | 하트 | 분홍 |
| 한부모가족 | 어른+아이 2인 | 보라 |
| 다자녀가구 | 3인 | 초록 |

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| groups | array | ✅ | 자격 조건 그룹 목록 |
| groups[].label | string | ✅ | 그룹 제목 |
| groups[].items | array | ✅ | 문자열 목록 |
| groups[].incomeTable | object | ❌ | 소득 기준표 (아래 참고) |
| groups[].incomeTable.title | string | ❌ | 표 제목. 기본값: `"가구원수별 월평균소득 기준 (원)"` |
| groups[].incomeTable.sizes | array | ❌ | 열 헤더. 기본값: `["1인","2인","3인","4인","5인"]` |
| groups[].incomeTable.rows | array | ✅ | 행 목록 |
| groups[].incomeTable.rows[].label | string | ✅ | 행 제목. 예: `"100%"` |
| groups[].incomeTable.rows[].values | array | ✅ | 숫자 배열. null이면 `—` 표시 |

```json
{
  "type": "bullet-card",
  "data": {
    "groups": [
      {
        "label": "신청 가능 계층",
        "items": [
          "청년: 만 19~39세 무주택 미혼",
          "신혼부부: 혼인 7년 이내"
        ]
      },
      {
        "label": "소득 기준",
        "items": ["도시근로자 월평균소득 100% 이하"],
        "incomeTable": {
          "rows": [
            { "label": "100%", "values": [2228445, 3682609, 4772021] }
          ]
        }
      }
    ]
  }
}
```

---

### table-card

**용도:** 임대조건. 보증금/월임대료 행 목록 + 부가 정보.  
**고정 텍스트:** `보증금`, `월임대료` (행 메타 레이블), `임대기간`, `재계약 혜택`, `보증금 월세 전환` (부가 정보 키)

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| rentRows | array | ✅ | 임대조건 행 목록 |
| rentRows[].label | string | ✅ | 행 제목. 예: `"청년 36형 (소득 없음)"` |
| rentRows[].deposit | string | ✅ | 보증금. 예: `"8,443만원"` |
| rentRows[].rentRange | string | ✅ | 월임대료. 예: `"337,000원/월"` |
| rentRows[].ratio | string | ❌ | 공급 비율 뱃지. 예: `"1순위 60%"`. 포함 시 진행 바 표시 |
| notes | array | ❌ | 하단 주석 문자열 목록. `*` 자동 붙음 |
| leaseTerm | string | ❌ | 임대기간 문자열 |
| renewalBonus | string | ❌ | 재계약 혜택 문자열 |
| conversion | object | ❌ | 보증금 월세 전환 정보 |
| conversion.description | string | ✅ | 전환 설명 |
| conversion.unit | string | ✅ | 전환 단위. 예: `"100만원"` |
| conversion.rate | string | ✅ | 전환율. 예: `"증액 연 7% / 감액 연 3.5%"` |

```json
{
  "type": "table-card",
  "data": {
    "rentRows": [
      {
        "label": "청년 36형 (소득 없음)",
        "deposit": "8,443만원",
        "rentRange": "337,000원/월"
      }
    ],
    "notes": ["위 금액은 기준 임대료이며 변동 가능"],
    "conversion": {
      "description": "최대 50% 범위 내 상호전환 가능",
      "unit": "100만원",
      "rate": "증액 연 7% / 감액 연 3.5%"
    }
  }
}
```

---

### timeline

**용도:** 신청 방법 및 일정. 월별 캘린더 + 단계별 타임라인.  
**고정 텍스트:** `1월~12월` (캘린더 월 헤더), `일~토` (요일 헤더). 단계 색상 자동 배정 (파랑→초록→주황→보라→회색 순환)

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| method | string | ❌ | 신청 방법 문자열. 상단 바에 표시 |
| steps | array | ✅ | 일정 단계 목록 |
| steps[].label | string | ✅ | 단계명. 예: `"청약 접수"` |
| steps[].date | string | ❌ | 날짜 문자열. 형식: `"YY.MM.DD(요일)"` 또는 범위. 캘린더 파싱에 사용 |
| steps[].highlight | boolean | ❌ | true이면 해당 단계의 달을 초기 캘린더로 표시 |

```json
{
  "type": "timeline",
  "data": {
    "method": "PC 인터넷 전용 (https://...) — 모바일 불가",
    "steps": [
      { "label": "모집공고", "date": "26.05.26(화)" },
      { "label": "청약 접수", "date": "26.06.15(월) 10:00 ~ 26.06.19(금) 17:00", "highlight": true },
      { "label": "예비입주자 순번 선정", "date": "26.09.30(수) 17:00 이후" }
    ]
  }
}
```

---

### qa-list

**용도:** 주의사항 또는 FAQ. `type` 필드로 UI 분기.  
**고정 텍스트:** 그룹 label에 `탈락`, `주의`, `문의` 포함 시 해당 아이콘 자동 매핑

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| type | string | ✅ | `"caution"` 또는 `"faq"` |
| **type = "caution"** | | | |
| bullets | array | ✅ | 주의사항 그룹 목록 |
| bullets[].label | string | ✅ | 그룹 제목. `탈락`/`주의`/`문의` 포함 시 아이콘 자동 매핑 |
| bullets[].items | array | ✅ | 항목 문자열 목록 |
| **type = "faq"** | | | |
| items | array | ✅ | FAQ 항목 목록 |
| items[].q | string | ✅ | 질문 |
| items[].a | string | ✅ | 답변 (HTML 허용) |

```json
// 주의사항
{
  "type": "qa-list",
  "data": {
    "type": "caution",
    "bullets": [
      {
        "label": "탈락 사유",
        "items": ["서류 누락·오기재", "중복 신청 시 전부 무효"]
      },
      {
        "label": "문의처",
        "items": ["담당자 ☎ 031-400-0000"]
      }
    ]
  }
}

// FAQ
{
  "type": "qa-list",
  "data": {
    "type": "faq",
    "items": [
      { "q": "청약통장이 없어도 신청 가능한가요?", "a": "불가능합니다. ..." }
    ]
  }
}
```

---

## 섹션 보조 블록 (sections[].blocks[])

섹션 대표 컴포넌트 아래에 추가로 렌더링되는 블록입니다.

---

### location-card

**용도:** 주소 카드 + 카카오 지도.  
**고정 텍스트:** `위치` (섹션 타이틀)  
**주의:** 지도는 `js/map-config.js`의 `KAKAO_APP_KEY`가 설정돼야 표시됨

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| locations | array | ✅ | 위치 목록 |
| locations[].name | string | ✅ | 단지명. 예: `"평촌 센텀퍼스트"` |
| locations[].address | string | ✅ | 도로명 주소. 지도 geocoding에 사용 |
| locations[].detail | string | ❌ | 동/호수 등 부가 정보. 회색으로 주소 **바로 아래 밀착** 렌더 |
| locations[].transit | string | ❌ | 교통 정보. 예: `"범계역(4호선) 인근"`. 지하철 아이콘이 붙은 알약(chip)으로 렌더 |

**렌더 구조:**
- 왼쪽 컬러 액센트 바(파랑 3px)로 위치 카드임을 강조
- `주소(검정) + 상세(회색)`를 한 블록(`.loc-addr-block`, gap 2px)으로 묶어 밀착 (같은 주소 정보)
- `교통(transit)`은 옅은 파랑 배경의 **알약(chip)** 형태로 분리 + 플랫 fill 지하철 아이콘
- 카드 목록은 `auto-fit`으로 가로 폭을 꽉 채우며 상단 정렬(`align-items:start`)

**⚠️ CSS 특이도 주의:** 위치 카드는 `.article-section` 안에 렌더되며, `.article-section p`가 `color/font-size/line-height`를 지정한다. `.loc-address`/`.loc-detail-line` 규칙은 반드시 `.loc-card` 접두사로 특이도를 높여야 덮어쓰기가 적용된다.

```json
{
  "type": "location-card",
  "data": {
    "locations": [
      {
        "name": "평촌 센텀퍼스트",
        "address": "경기도 안양시 동안구 갈산로 15",
        "detail": "118·122·123동",
        "transit": "범계역(4호선) 인근"
      }
    ]
  }
}
```

---

## 섹션 공통 필드

모든 섹션(`sections[]` 항목)이 공유하는 필드:

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| id | string | ✅ | 섹션 ID. 목차 앵커로 사용. 영문 소문자+하이픈 |
| emoji | string | ✅ | 섹션 이모지. 목차에 표시 |
| title | string | ✅ | 섹션 제목 |
| lead | string | ✅ | 섹션 소개 문장 (컴포넌트 위에 표시) |
| component | object | ✅ | 대표 컴포넌트. `type` + `data` |
| blocks | array | ❌ | 보조 블록 목록. 현재는 `location-card`만 사용 |
| terms | array | ❌ | 용어 해설 목록 |
| terms[].term | string | ✅ | 용어 |
| terms[].definition | string | ✅ | 설명 |

---

## 컴포넌트 추가 시 체크리스트

새 컴포넌트를 만들 때 아래 순서로 진행하세요:

1. `js/components/{type-name}.js` 생성 — `export function render{TypeName}(data)` 패턴
2. `js/renderer.js` — import 추가 및 type → 함수 매핑 등록
3. `docs/components.md` (이 파일) — 새 컴포넌트 항목 추가
4. `CLAUDE.md` — 필요 시 특이사항 업데이트
5. `docs/schema-example.json` — 사용 예시 추가
