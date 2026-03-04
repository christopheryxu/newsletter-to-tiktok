from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .services import job_store
from .routers import pipeline, timeline, media, export

app = FastAPI(title="Newsletter to TikTok API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pipeline.router)
app.include_router(timeline.router)
app.include_router(media.router)
app.include_router(export.router)


@app.on_event("startup")
async def startup():
    settings.jobs_path.mkdir(parents=True, exist_ok=True)
    job_store.hydrate_from_disk()


@app.get("/health")
async def health():
    return {"status": "ok"}
