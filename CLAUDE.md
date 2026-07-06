# notice_report_page — 프로젝트 규칙

상위 규칙(`my-claude/CLAUDE.md`)을 상속하며, 아래 규칙이 충돌 시 이 파일이 우선합니다.

---

## 🔤 타이포그래피 규칙 (엄수)

**모든 폰트는 Pretendard로 통일합니다.**

- 한글·영문·숫자·기호 구분 없이 `Pretendard Variable` / `Pretendard` 단일 패밀리 사용
- **Syne, Noto Serif, 기타 디스플레이 폰트 사용 금지** — 히어로 타이틀·통계 수치 등 어떤 요소도 예외 없음
- 폰트 로드는 Pretendard CDN 하나로 고정:
  ```html
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">
  ```
  또는 `design-system.css` import 하나로 대체 (이미 포함됨)
- Google Fonts `<link>` 태그를 추가하지 마십시오

**CSS 선언 방식:**
```css
font-family: 'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
```

---

## 🎨 디자인 시스템

- CSS 변수는 `css/design-system.css`에서 관리 — 임의로 하드코딩 금지
- `--font-display` 변수는 Pretendard로 설정됨 (`css/styles.css` line 18)
- 주요 색상: `--blue: #2563EB` (accent), `--ink: #0F172A` (text), `--surface: #F8FAFC` (bg)

---

## 📁 파일 구조

```
notice_report_page/
├── index.html          # 리포트 목록 랜딩
├── report.html         # 리포트 뷰어
├── apply.html          # 제작 의뢰 신청 폼
├── css/
│   ├── design-system.css   # CSS 변수 + 기본 스타일
│   └── styles.css          # 뷰어 스타일
├── js/
│   ├── app.js, renderer.js
│   ├── map-config.js       # 카카오 앱키 설정 (여기서만 수정)
│   ├── location-map.js     # 카카오 지도 초기화
│   └── components/
├── admin/              # 로컬 편집기 (Express 서버)
│   ├── server.js  (port 4711)
│   └── edit.html
└── reports/            # JSON 데이터 파일
```

---

## 🗺️ 지도 연동

- Kakao Maps API 키: `js/map-config.js`의 `KAKAO_APP_KEY` 변수에만 설정
- 도메인 등록 필수: developers.kakao.com → 앱 → 플랫폼 → Web

---

## 🧩 컴포넌트 관리

- **명세서**: `docs/components.md` — 모든 컴포넌트의 단일 출처(Single Source of Truth)
- 컴포넌트 추가·수정 시 반드시 `docs/components.md`도 함께 업데이트할 것
- 새 컴포넌트 추가 순서: JS파일 생성 → renderer.js 등록 → components.md 문서화

---

## 📋 신청 폼 (apply.html)

- Google Sheets 연동: `apply.html` 상단 주석 참고
- Apps Script 배포 후 `SHEET_URL` 상수에 URL 입력
