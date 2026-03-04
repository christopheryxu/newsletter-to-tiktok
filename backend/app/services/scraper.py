from __future__ import annotations
import re
import uuid
import httpx
from bs4 import BeautifulSoup, Tag

from ..models.pipeline import Section


_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0 Safari/537.36"
    )
}


async def fetch_html(url: str) -> str:
    async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
        resp = await client.get(url, headers=_HEADERS)
        resp.raise_for_status()
        return resp.text


def extract_sections(html: str) -> list[Section]:
    soup = BeautifulSoup(html, "html.parser")

    # Remove script/style/nav/footer noise
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    sections = (
        _try_heading_split(soup)
        or _try_substack(soup)
        or _try_beehiiv(soup)
        or _try_paragraph_groups(soup)
    )

    # Deduplicate and clean
    out: list[Section] = []
    seen: set[str] = set()
    for s in sections:
        text = s.raw_text.strip()
        if len(text) < 30:
            continue
        key = text[:100]
        if key in seen:
            continue
        seen.add(key)
        s.raw_text = text
        out.append(s)

    return out or _fallback(soup)


def _make_section(heading: str, raw_text: str) -> Section:
    return Section(
        id=str(uuid.uuid4()),
        heading=heading,
        raw_text=raw_text,
    )


def _try_heading_split(soup: BeautifulSoup) -> list[Section]:
    headings = soup.find_all(["h1", "h2", "h3"])
    if not headings:
        return []
    sections: list[Section] = []
    for h in headings:
        heading_text = h.get_text(" ", strip=True)
        parts: list[str] = []
        for sib in h.next_siblings:
            if isinstance(sib, Tag) and sib.name in ("h1", "h2", "h3"):
                break
            if isinstance(sib, Tag):
                parts.append(sib.get_text(" ", strip=True))
        body = " ".join(parts).strip()
        if body:
            sections.append(_make_section(heading_text, body))
    return sections


def _try_substack(soup: BeautifulSoup) -> list[Section]:
    container = soup.find(class_="post-content")
    if not container:
        return []
    return _paragraph_sections(container, source="substack")


def _try_beehiiv(soup: BeautifulSoup) -> list[Section]:
    blocks = soup.find_all(attrs={"data-block-type": True})
    if not blocks:
        return []
    sections: list[Section] = []
    for block in blocks:
        text = block.get_text(" ", strip=True)
        if text:
            sections.append(_make_section("Section", text))
    return sections


def _try_paragraph_groups(soup: BeautifulSoup, group_size: int = 3) -> list[Section]:
    paras = [p.get_text(" ", strip=True) for p in soup.find_all("p") if p.get_text(strip=True)]
    if not paras:
        return []
    sections: list[Section] = []
    for i in range(0, len(paras), group_size):
        chunk = paras[i : i + group_size]
        sections.append(_make_section(f"Part {i // group_size + 1}", " ".join(chunk)))
    return sections


def _paragraph_sections(container: Tag, source: str = "") -> list[Section]:
    paras = [p.get_text(" ", strip=True) for p in container.find_all("p") if p.get_text(strip=True)]
    sections: list[Section] = []
    group_size = 3
    for i in range(0, len(paras), group_size):
        chunk = paras[i : i + group_size]
        sections.append(_make_section(f"Section {i // group_size + 1}", " ".join(chunk)))
    return sections


def _fallback(soup: BeautifulSoup) -> list[Section]:
    body_text = soup.get_text(" ", strip=True)
    words = body_text.split()
    chunk_size = 150
    sections: list[Section] = []
    for i in range(0, min(len(words), 900), chunk_size):
        chunk = " ".join(words[i : i + chunk_size])
        sections.append(_make_section(f"Part {i // chunk_size + 1}", chunk))
    return sections
