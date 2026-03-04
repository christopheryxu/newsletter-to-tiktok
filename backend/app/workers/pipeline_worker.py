from __future__ import annotations
import asyncio
import uuid
from pathlib import Path

from ..config import settings
from ..models.pipeline import (
    Job, JobStatus, Section, MediaAsset, AudioAsset,
    Clip, Track, Timeline, SubtitleCue,
)
from ..services import job_store
from ..services.scraper import fetch_html, extract_sections
from ..services import claude_service, pexels_service
from ..services import stability_service as imagen_service
from ..services import elevenlabs_service


async def run_pipeline(job_id: str, url: str, voice_id: str = "Rachel") -> None:
    job = job_store.get_job(job_id)
    if not job:
        return

    async def update(status: JobStatus, progress: int, **kw):
        job.status = status
        job.progress = progress
        for k, v in kw.items():
            setattr(job, k, v)
        job_store.set_job(job)
        await job_store.publish(job_id, {
            "status": status.value,
            "progress": progress,
        })

    try:
        # ── 1. SCRAPING ──────────────────────────────────────────────
        await update(JobStatus.SCRAPING, 5)
        html = await fetch_html(url)
        sections = extract_sections(html)
        if not sections:
            raise ValueError("Could not extract any sections from the newsletter.")
        # Limit to 8 sections to keep processing time reasonable
        sections = sections[:8]
        job.sections = sections
        job_store.set_job(job)

        # ── 2. ANALYZING ─────────────────────────────────────────────
        await update(JobStatus.ANALYZING, 20)
        analyzed: list[Section] = []
        for sec in sections:
            try:
                result = await claude_service.analyze_section(sec.heading, sec.raw_text)
                sec.category = result["category"]
                sec.summary = result["summary"]
                sec.voice_script = result["voice_script"]
                sec.keywords = result["keywords"]
            except Exception:
                sec.voice_script = sec.raw_text[:200]
                sec.keywords = [sec.heading or "news"]
            analyzed.append(sec)
        job.sections = analyzed
        job_store.set_job(job)

        # ── 3. FETCHING MEDIA ─────────────────────────────────────────
        await update(JobStatus.FETCHING_MEDIA, 40)
        job_dir = settings.jobs_path / job_id
        media_dir = job_dir / "media"
        media_dir.mkdir(parents=True, exist_ok=True)

        media_assets: list[MediaAsset] = []
        for sec in job.sections:
            asset = await _fetch_media_for_section(sec, media_dir)
            if asset:
                media_assets.append(asset)
        job.media_assets = media_assets
        job_store.set_job(job)

        # ── 4. GENERATING AUDIO ───────────────────────────────────────
        await update(JobStatus.GENERATING_AUDIO, 65)
        audio_dir = job_dir / "audio"
        audio_dir.mkdir(parents=True, exist_ok=True)

        audio_assets: list[AudioAsset] = []
        section_word_timestamps: dict[str, list] = {}
        for sec in job.sections:
            audio_path = audio_dir / f"{sec.id}.mp3"
            ok, words, duration = await elevenlabs_service.generate_audio(
                sec.voice_script, voice_id, audio_path, settings.elevenlabs_api_key
            )
            if ok:
                audio_assets.append(AudioAsset(
                    id=str(uuid.uuid4()),
                    section_id=sec.id,
                    local_path=str(audio_path),
                    duration_s=duration,
                ))
                section_word_timestamps[sec.id] = words
            else:
                # Fallback: 5s placeholder
                audio_assets.append(AudioAsset(
                    id=str(uuid.uuid4()),
                    section_id=sec.id,
                    local_path="",
                    duration_s=5.0,
                ))
                section_word_timestamps[sec.id] = []
        job.audio_assets = audio_assets
        job_store.set_job(job)

        # ── 5. BUILD TIMELINE ─────────────────────────────────────────
        await update(JobStatus.BUILD_TIMELINE, 85)
        timeline = _build_initial_timeline(job, section_word_timestamps)
        job.timeline = timeline
        job_store.set_job(job)

        # ── 6. READY ──────────────────────────────────────────────────
        await update(JobStatus.READY, 100)
        await job_store.publish(job_id, {
            "status": JobStatus.READY.value,
            "progress": 100,
            "timeline": timeline.model_dump(),
        })

    except Exception as e:
        job.status = JobStatus.ERROR
        job.error = str(e)
        job_store.set_job(job)
        await job_store.publish(job_id, {
            "status": JobStatus.ERROR.value,
            "progress": job.progress,
            "error": str(e),
        })


async def _fetch_media_for_section(sec: Section, media_dir: Path) -> MediaAsset | None:
    pexels_key = settings.pexels_api_key

    for keyword in sec.keywords:
        # Try Pexels video first
        if pexels_key:
            videos = await pexels_service.search_videos(keyword, pexels_key, per_page=3)
            if videos:
                v = videos[0]
                ext = "mp4"
                dest = media_dir / f"{sec.id}_video.{ext}"
                ok = await pexels_service.download_asset(v["url"], dest)
                if ok:
                    return MediaAsset(
                        id=str(uuid.uuid4()),
                        section_id=sec.id,
                        media_type="video",
                        source="pexels",
                        local_path=str(dest),
                        url=v["url"],
                        duration_s=float(v.get("duration") or 10),
                    )

        # Try Pexels photo
        if pexels_key:
            photos = await pexels_service.search_photos(keyword, pexels_key, per_page=3)
            if photos:
                p = photos[0]
                dest = media_dir / f"{sec.id}_photo.jpg"
                ok = await pexels_service.download_asset(p["url"], dest)
                if ok:
                    return MediaAsset(
                        id=str(uuid.uuid4()),
                        section_id=sec.id,
                        media_type="image",
                        source="pexels",
                        local_path=str(dest),
                        url=p["url"],
                    )

    # Google Imagen fallback
    google_key = settings.google_api_key
    if google_key:
        prompt = f"{sec.heading}: {', '.join(sec.keywords[:3])}, cinematic, professional photography"
        dest = media_dir / f"{sec.id}_generated.jpg"
        ok = await imagen_service.generate_image(prompt, google_key, dest)
        if ok:
            return MediaAsset(
                id=str(uuid.uuid4()),
                section_id=sec.id,
                media_type="image",
                source="google",
                local_path=str(dest),
                url="",
            )

    return None


def _build_initial_timeline(job: Job, section_word_timestamps: dict[str, list] | None = None) -> Timeline:
    visual_clips: list[Clip] = []
    audio_clips: list[Clip] = []
    subtitle_clips: list[Clip] = []

    media_by_section = {a.section_id: a for a in job.media_assets}
    audio_by_section = {a.section_id: a for a in job.audio_assets}

    cursor = 0.0

    for sec in job.sections:
        audio = audio_by_section.get(sec.id)
        media = media_by_section.get(sec.id)
        duration = audio.duration_s if audio else 5.0

        if media:
            visual_clips.append(Clip(
                id=str(uuid.uuid4()),
                clip_type="visual",
                section_id=sec.id,
                start_s=cursor,
                duration_s=duration,
                media_type=media.media_type,
                local_path=media.local_path,
            ))

        if audio and audio.local_path:
            audio_clips.append(Clip(
                id=str(uuid.uuid4()),
                clip_type="audio",
                section_id=sec.id,
                start_s=cursor,
                duration_s=duration,
                audio_path=audio.local_path,
            ))

        # Subtitle cues: use word timestamps if available, else distribute evenly
        words = (section_word_timestamps or {}).get(sec.id, [])
        if words:
            cues = _build_subtitle_cues_from_words(words, cursor)
        else:
            cues = _build_subtitle_cues(sec.voice_script, cursor, duration)
        subtitle_clips.append(Clip(
            id=str(uuid.uuid4()),
            clip_type="subtitle",
            section_id=sec.id,
            start_s=cursor,
            duration_s=duration,
            subtitle_text=sec.voice_script,
            cues=cues,
        ))

        cursor += duration

    tracks = [
        Track(id="visual", track_type="visual", clips=visual_clips),
        Track(id="audio", track_type="audio", clips=audio_clips),
        Track(id="subtitle", track_type="subtitle", clips=subtitle_clips),
    ]

    return Timeline(
        job_id=job.id,
        tracks=tracks,
        total_duration_s=cursor,
    )


def _build_subtitle_cues_from_words(
    words: list[tuple[str, float, float]], section_start: float, words_per_cue: int = 7
) -> list[SubtitleCue]:
    """Build subtitle cues using ElevenLabs word-level timestamps."""
    cues: list[SubtitleCue] = []
    for i in range(0, len(words), words_per_cue):
        chunk = words[i : i + words_per_cue]
        if not chunk:
            continue
        cue_start = section_start + chunk[0][1]
        cue_end = section_start + chunk[-1][2]
        text = " ".join(w[0] for w in chunk)
        cues.append(SubtitleCue(start_s=cue_start, end_s=cue_end, text=text))
    return cues


def _build_subtitle_cues(text: str, start_s: float, total_dur: float) -> list[SubtitleCue]:
    words = text.split()
    if not words:
        return []
    words_per_cue = 7
    cues: list[SubtitleCue] = []
    chunks = [words[i : i + words_per_cue] for i in range(0, len(words), words_per_cue)]
    chunk_dur = total_dur / len(chunks)
    for i, chunk in enumerate(chunks):
        cue_start = start_s + i * chunk_dur
        cue_end = cue_start + chunk_dur
        cues.append(SubtitleCue(
            start_s=cue_start,
            end_s=cue_end,
            text=" ".join(chunk),
        ))
    return cues
