from __future__ import annotations
import json
import re
import anthropic

from ..config import settings


_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


_SYSTEM = """You are a social-media content strategist. Given a newsletter section, return ONLY valid JSON (no markdown, no extra text) with these fields:
{
  "category": "<Technology|Finance|Health|Politics|Entertainment|Science|Lifestyle|Other>",
  "summary": "<one sentence, max 20 words>",
  "voice_script": "<engaging TikTok voiceover, 30-60 words, first-person energetic tone>",
  "keywords": ["<3-5 search keywords for stock footage>"]
}"""


async def analyze_section(heading: str, raw_text: str) -> dict:
    client = _get_client()
    prompt = f"Heading: {heading}\n\nContent: {raw_text[:1500]}"

    message = await client.messages.create(
        model="claude-opus-4-6",
        max_tokens=512,
        system=_SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    # Strip markdown code fences
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    raw = raw.strip()

    data = json.loads(raw)
    return {
        "category": str(data.get("category", "Other")),
        "summary": str(data.get("summary", "")),
        "voice_script": str(data.get("voice_script", raw_text[:200])),
        "keywords": [str(k) for k in data.get("keywords", [heading])],
    }
