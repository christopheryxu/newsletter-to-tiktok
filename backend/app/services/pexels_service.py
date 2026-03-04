from __future__ import annotations
import httpx
from pathlib import Path


_BASE = "https://api.pexels.com"


async def search_videos(query: str, api_key: str, per_page: int = 5) -> list[dict]:
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(
            f"{_BASE}/videos/search",
            params={"query": query, "per_page": per_page, "orientation": "portrait"},
            headers={"Authorization": api_key},
        )
        if resp.status_code != 200:
            return []
        data = resp.json()
        videos = []
        for v in data.get("videos", []):
            # Prefer portrait (height > width)
            files = sorted(
                v.get("video_files", []),
                key=lambda f: f.get("width", 9999),
            )
            best = next(
                (f for f in files if f.get("height", 0) > f.get("width", 0)),
                files[0] if files else None,
            )
            if best:
                videos.append({
                    "id": str(v["id"]),
                    "url": best["link"],
                    "width": best.get("width"),
                    "height": best.get("height"),
                    "duration": v.get("duration"),
                })
        return videos


async def search_photos(query: str, api_key: str, per_page: int = 5) -> list[dict]:
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(
            f"{_BASE}/v1/search",
            params={"query": query, "per_page": per_page, "orientation": "portrait"},
            headers={"Authorization": api_key},
        )
        if resp.status_code != 200:
            return []
        data = resp.json()
        photos = []
        for p in data.get("photos", []):
            photos.append({
                "id": str(p["id"]),
                "url": p["src"].get("portrait") or p["src"].get("large"),
                "width": p.get("width"),
                "height": p.get("height"),
            })
        return photos


async def download_asset(url: str, dest_path: Path) -> bool:
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
        try:
            async with client.stream("GET", url) as resp:
                resp.raise_for_status()
                with open(dest_path, "wb") as f:
                    async for chunk in resp.aiter_bytes(8192):
                        f.write(chunk)
            return True
        except Exception:
            return False
