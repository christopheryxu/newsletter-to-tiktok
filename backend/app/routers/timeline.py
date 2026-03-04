from fastapi import APIRouter, HTTPException
from ..models.api import UpdateTimelineRequest
from ..models.pipeline import Timeline
from ..services import job_store

router = APIRouter(prefix="/timeline", tags=["timeline"])


@router.get("/{job_id}", response_model=Timeline)
async def get_timeline(job_id: str):
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not job.timeline:
        raise HTTPException(status_code=404, detail="Timeline not ready yet")
    return job.timeline


@router.put("/{job_id}", response_model=Timeline)
async def update_timeline(job_id: str, req: UpdateTimelineRequest):
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    updated = job_store.update_timeline(job_id, req.timeline)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update timeline")
    return updated.timeline
