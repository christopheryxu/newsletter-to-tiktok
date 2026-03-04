from __future__ import annotations
import subprocess
import json
import httpx
from pathlib import Path

from ..config import settings


_BASE = "https://api.elevenlabs.io/v1"
_VOICE_MAP = {
    "Rachel": "21m00Tcm4TlvDq8ikWAM",
    "Adam": "pNInz6obpgDQGcFmaJgB",
    "Antoni": "ErXwobaYiN019PkySvjV",
    "Josh": "TxGEqnHWrfWFTfGW9XjX",
}


async def generate_audio(text: str, voice_id: str, dest_path: Path, api_key: str) -> bool:
    dest_path.parent.mkdir(parents=True, exist_ok=True)

    # Resolve friendly name to voice ID
    resolved = _VOICE_MAP.get(voice_id, voice_id)

    url = f"{_BASE}/text-to-speech/{resolved}"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
    }

    async with httpx.AsyncClient(timeout=60) as client:
        try:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                dest_path.write_bytes(resp.content)
                return True
            return False
        except Exception:
            return False


def probe_duration(audio_path: Path) -> float:
    """Use ffprobe to get audio duration in seconds."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "quiet", "-print_format", "json",
                "-show_streams", str(audio_path),
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        data = json.loads(result.stdout)
        for stream in data.get("streams", []):
            dur = stream.get("duration")
            if dur:
                return float(dur)
        # fallback: try format duration
        result2 = subprocess.run(
            [
                "ffprobe", "-v", "quiet", "-print_format", "json",
                "-show_format", str(audio_path),
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        data2 = json.loads(result2.stdout)
        dur = data2.get("format", {}).get("duration")
        if dur:
            return float(dur)
    except Exception:
        pass
    return 5.0  # safe default
