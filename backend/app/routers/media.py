from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from ..config import settings
from ..services import job_store

router = APIRouter(prefix="/media", tags=["media"])


@router.get("/{job_id}/{media_type}/{filename}")
async def serve_media(job_id: str, media_type: str, filename: str):
    if media_type not in ("audio", "media", "subtitles"):
        raise HTTPException(status_code=400, detail="Invalid media type")

    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    file_path = settings.jobs_path / job_id / media_type / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(str(file_path))
