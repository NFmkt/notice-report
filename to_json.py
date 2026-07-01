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
