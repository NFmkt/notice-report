"""
to_json.py  —  temp_html.html → reports/[slug].json 변환 스크립트

사용법:
  python to_json.py --title "든든전세주택 800호 모집" --date "26.05.29" --url "https://gobang.kr/notices/xxx"
"""

import argparse
import json
import os
import re
from pathlib import Path
from datetime import datetime

# --------------------------------------------------------------------------- #
# HTML 경로 (고정)
# --------------------------------------------------------------------------- #
HTML_PATH = Path(r"C:\Users\user\my-claude\for_Local\notice_report_auto\temp_html.html")

# --------------------------------------------------------------------------- #
# 섹션 매핑 규칙
# --------------------------------------------------------------------------- #
SECTION_RULES = [
    # (포함 키워드 목록, id, emoji, title)  — 모든 키워드가 h2 텍스트에 포함되어야 매핑
    (["어떻게", "신청"],   "application", "💻", "어떻게 신청하나요?"),
    (["신청할 수 있나요"], "eligibility", "🙋‍♀️", "누가 신청할 수 있나요?"),
    (["임대료"],           "cost",        "💰", "임대료는 얼마인가요?"),
    (["일정"],             "schedule",    "📅", "구체적인 일정"),
    (["주의"],             "caution",     "⚠️",  "신청 시 주의사항"),
]


def match_section(h2_text: str):
    """h2 텍스트를 보고 (id, emoji, title) 반환. 매핑 실패 시 None."""
    for keywords, sid, emoji, title in SECTION_RULES:
        if all(k in h2_text for k in keywords):
            return sid, emoji, title
    return None


# --------------------------------------------------------------------------- #
# slug 생성
# --------------------------------------------------------------------------- #
def make_slug(title: str, date_str: str) -> str:
    """
    date_str: "YY.MM.DD"  →  prefix "YYYYMMDD"
    title: 공백 → 하이픈, 특수문자 제거
    """
    parts = date_str.split(".")
    if len(parts) == 3:
        yy, mm, dd = parts
        year = "20" + yy
        prefix = f"{year}{mm}{dd}"
    else:
        prefix = date_str.replace(".", "")

    slug_title = re.sub(r"[^\w\s\-가-힣]", "", title)
    slug_title = re.sub(r"\s+", "-", slug_title.strip())
    return f"{prefix}-{slug_title}"


# --------------------------------------------------------------------------- #
# HTML 파싱
# --------------------------------------------------------------------------- #
def extract_subtitle(html: str) -> str:
    """첫 번째 <strong> 태그 텍스트, 큰따옴표 제거."""
    m = re.search(r"<strong>(.*?)</strong>", html, re.DOTALL)
    if not m:
        return ""
    text = re.sub(r"<[^>]+>", "", m.group(1))
    return text.replace('"', "").replace('"', "").replace('"', "").strip()


def parse_sections(html: str) -> list:
    """
    <h2> 태그 기준으로 섹션 분리.
    반환: [{"id": ..., "emoji": ..., "title": ..., "content": ...}, ...]
    """
    sections = []

    # h2 태그 위치 탐색
    h2_pattern = re.compile(r"<h2>(.*?)</h2>", re.DOTALL)
    matches = list(h2_pattern.finditer(html))

    if not matches:
        # h2 없으면 전체를 intro로
        sections.append({
            "id": "intro", "emoji": "", "title": "소개",
            "content": html.strip()
        })
        return sections

    # ── intro: h2 첫 등장 이전 ──────────────────────────────────────────────
    intro_html = html[: matches[0].start()].strip()
    if intro_html:
        sections.append({
            "id": "intro", "emoji": "", "title": "소개",
            "content": intro_html
        })

    # ── h2 기준 섹션들 ────────────────────────────────────────────────────────
    for i, m in enumerate(matches):
        h2_text = re.sub(r"<[^>]+>", "", m.group(1))  # h2 안쪽 태그 제거
        content_start = m.end()
        content_end = matches[i + 1].start() if i + 1 < len(matches) else len(html)
        content_html = html[content_start:content_end].strip()

        result = match_section(h2_text)
        if result:
            sid, emoji, title = result
        else:
            # 매핑 실패 → closing 또는 fallback
            sid = "closing"
            emoji = ""
            title = h2_text.strip()

        sections.append({
            "id": sid,
            "emoji": emoji,
            "title": title,
            "content": m.group(0) + "\n" + content_html  # h2 태그 포함
        })

    return sections


# --------------------------------------------------------------------------- #
# 메인
# --------------------------------------------------------------------------- #
def main():
    parser = argparse.ArgumentParser(description="temp_html.html → reports/[slug].json")
    parser.add_argument("--title",   required=True, help="공고 제목")
    parser.add_argument("--date",    required=True, help="공고일 (YY.MM.DD)")
    parser.add_argument("--url",     default="",    help="원문 URL")
    parser.add_argument("--created", default="",    help="아티클 작성일 (YY.MM.DD), 생략 시 오늘 날짜 자동")
    args = parser.parse_args()

    # 아티클 작성일: 입력값 또는 오늘 날짜
    created_at = args.created if args.created else datetime.now().strftime("%y.%m.%d")

    if not HTML_PATH.exists():
        raise FileNotFoundError(f"HTML 파일을 찾을 수 없습니다: {HTML_PATH}")

    html = HTML_PATH.read_text(encoding="utf-8")

    slug     = make_slug(args.title, args.date)
    subtitle = extract_subtitle(html)
    sections = parse_sections(html)

    data = {
        "meta": {
            "slug":        slug,
            "title":       args.title,
            "subtitle":    subtitle,
            "publishedAt": args.date,
            "createdAt":   created_at,
            "sourceUrl":   args.url,
            "badge":       "청년주택 공고 분석"
        },
        "sections": sections
    }

    out_dir = Path(__file__).parent / "reports"
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / f"{slug}.json"
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[OK] {out_path}")
    print(f"     섹션 수: {len(sections)}")
    for s in sections:
        print(f"       - {s['id']}")

    # index.json 업데이트
    index_path = out_dir / "index.json"
    if index_path.exists():
        index_data = json.loads(index_path.read_text(encoding="utf-8"))
    else:
        index_data = {"reports": []}

    # 중복 slug 제거 후 맨 앞에 추가 (최신순)
    index_data["reports"] = [r for r in index_data["reports"] if r["slug"] != slug]
    index_data["reports"].insert(0, {
        "slug": slug,
        "title": args.title,
        "subtitle": subtitle,
        "publishedAt": args.date,
        "createdAt": created_at,
        "badge": "청년주택 공고 분석"
    })
    index_path.write_text(json.dumps(index_data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OK] index.json 업데이트 ({len(index_data['reports'])}개)")


if __name__ == "__main__":
    main()
