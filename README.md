# Newsletter → TikTok Video Pipeline

Transform any newsletter URL into a TikTok-formatted 9:16 MP4 with AI voiceover, stock footage, and subtitles.

## Prerequisites

- Python 3.11+
- Node.js 18+
- **ffmpeg** installed and in PATH (`winget install ffmpeg` / `brew install ffmpeg` / `apt install ffmpeg`)

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Fill in your API keys in .env
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Keys Required

| Key | Where to get |
|-----|-------------|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `ELEVENLABS_API_KEY` | [elevenlabs.io](https://elevenlabs.io) |
| `PEXELS_API_KEY` | [pexels.com/api](https://www.pexels.com/api/) |
| `STABILITY_API_KEY` | [platform.stability.ai](https://platform.stability.ai) (optional) |

## Architecture

```
Browser → Next.js (port 3000)
           ├── /api/* proxy routes → FastAPI (port 8000)
           └── SSE stream for pipeline progress

FastAPI pipeline stages:
  SCRAPING → ANALYZING (Claude) → FETCHING_MEDIA (Pexels/Stability)
  → GENERATING_AUDIO (ElevenLabs) → BUILD_TIMELINE → READY

Export: ffmpeg renders timeline → 1080×1920 MP4
```

## Pipeline Flow

1. Paste a newsletter URL on the landing page
2. Watch the SSE progress bar through 6 stages
3. Timeline editor opens with 3 tracks: Visual / Audio / Subtitle
4. Drag clips to reorder, resize handles to trim
5. Click a clip to edit its voice script in the inspector
6. Click **Export MP4** → renders with ffmpeg → download link appears

## Directory Structure

```
backend/
  app/
    main.py          # FastAPI app + CORS
    config.py        # pydantic-settings
    models/          # Pydantic data models
    routers/         # pipeline, timeline, media, export
    services/        # scraper, claude, pexels, stability, elevenlabs, ffmpeg, job_store
    workers/         # pipeline_worker (async orchestrator)
  storage/jobs/      # runtime-generated, gitignored

frontend/
  src/
    app/             # Next.js App Router pages + API proxy routes
    components/      # EditorShell, PreviewPanel, TimelineEditor, ClipInspector...
    hooks/           # useJobStatus (SSE), usePlayback (Howler), useExport
    store/           # Zustand + Immer timeline state
    lib/             # api.ts, timelineUtils.ts
    types/           # timeline.ts (mirrors Python models)
```
