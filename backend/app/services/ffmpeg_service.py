from __future__ import annotations
import subprocess
import tempfile
from pathlib import Path

from ..models.pipeline import Timeline, Clip


def render_timeline(timeline: Timeline, output_path: Path) -> bool:
    """Render the timeline to an MP4 using ffmpeg CLI."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    visual_clips = _get_clips(timeline, "visual")
    audio_clips = _get_clips(timeline, "audio")
    subtitle_clips = _get_clips(timeline, "subtitle")

    if not visual_clips:
        return False

    # Build SRT file
    srt_path = output_path.parent / "subtitles.srt"
    _write_srt(subtitle_clips, srt_path)

    # Build video using ffmpeg concat
    success = _render_ffmpeg(
        visual_clips, audio_clips, srt_path, output_path, timeline
    )
    return success


def _get_clips(timeline: Timeline, clip_type: str) -> list[Clip]:
    for track in timeline.tracks:
        if track.track_type == clip_type:
            return sorted(track.clips, key=lambda c: c.start_s)
    return []


def _write_srt(subtitle_clips: list[Clip], srt_path: Path) -> None:
    lines = []
    idx = 1
    for clip in subtitle_clips:
        if not clip.cues:
            continue
        for cue in clip.cues:
            lines.append(str(idx))
            lines.append(f"{_ts(cue.start_s)} --> {_ts(cue.end_s)}")
            lines.append(cue.text)
            lines.append("")
            idx += 1
    srt_path.write_text("\n".join(lines), encoding="utf-8")


def _ts(s: float) -> str:
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sec = int(s % 60)
    ms = int((s - int(s)) * 1000)
    return f"{h:02d}:{m:02d}:{sec:02d},{ms:03d}"


def _render_ffmpeg(
    visual_clips: list[Clip],
    audio_clips: list[Clip],
    srt_path: Path,
    output_path: Path,
    timeline: Timeline,
) -> bool:
    """Build ffmpeg command with concat demuxer."""
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)

        # 1) Build per-clip video segments
        segment_paths: list[Path] = []
        for i, clip in enumerate(visual_clips):
            seg_path = tmp / f"seg_{i:04d}.mp4"
            ok = _encode_visual_clip(clip, seg_path, timeline)
            if ok:
                segment_paths.append(seg_path)

        if not segment_paths:
            return False

        # 2) Concat video segments
        concat_list = tmp / "concat.txt"
        lines = [f"file '{p.as_posix()}'\n" for p in segment_paths]
        concat_list.write_text("".join(lines))

        video_only = tmp / "video_only.mp4"
        cmd_concat = [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0",
            "-i", str(concat_list),
            "-c", "copy",
            str(video_only),
        ]
        if subprocess.run(cmd_concat, capture_output=True).returncode != 0:
            return False

        # 3) Build audio concat
        audio_paths = [c.audio_path for c in audio_clips if c.audio_path]
        if audio_paths:
            audio_concat_list = tmp / "audio_concat.txt"
            audio_lines = [f"file '{p}'\n" for p in audio_paths]
            audio_concat_list.write_text("".join(audio_lines))
            audio_only = tmp / "audio_only.aac"
            cmd_audio = [
                "ffmpeg", "-y",
                "-f", "concat", "-safe", "0",
                "-i", str(audio_concat_list),
                "-c:a", "aac", "-b:a", "192k",
                str(audio_only),
            ]
            subprocess.run(cmd_audio, capture_output=True)
        else:
            audio_only = None

        # 4) Mux video + audio + subtitles
        final_inputs = ["-i", str(video_only)]
        if audio_only and Path(audio_only).exists():
            final_inputs += ["-i", str(audio_only)]

        filter_complex = ""
        subtitle_filter = ""
        if srt_path.exists() and srt_path.stat().st_size > 10:
            # Escape Windows path
            srt_escaped = str(srt_path).replace("\\", "/").replace(":", "\\:")
            subtitle_filter = f"subtitles='{srt_escaped}':force_style='FontSize=18,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2'"

        video_filter = f"scale={timeline.canvas_width}:{timeline.canvas_height}:force_original_aspect_ratio=decrease,pad={timeline.canvas_width}:{timeline.canvas_height}:(ow-iw)/2:(oh-ih)/2"
        if subtitle_filter:
            video_filter += f",{subtitle_filter}"

        cmd_final = (
            ["ffmpeg", "-y"]
            + final_inputs
            + [
                "-vf", video_filter,
                "-c:v", "libx264", "-preset", "fast",
                "-b:v", "4000k", "-pix_fmt", "yuv420p",
                "-movflags", "+faststart",
                "-r", str(timeline.fps),
            ]
        )
        if audio_only and Path(audio_only).exists():
            cmd_final += ["-c:a", "aac", "-b:a", "192k", "-map", "0:v", "-map", "1:a"]
        cmd_final += [str(output_path)]

        result = subprocess.run(cmd_final, capture_output=True)
        return result.returncode == 0


def _encode_visual_clip(clip: Clip, output: Path, timeline: Timeline) -> bool:
    if not clip.local_path or not Path(clip.local_path).exists():
        return False

    w, h = timeline.canvas_width, timeline.canvas_height
    duration = clip.duration_s

    if clip.media_type == "video":
        cmd = [
            "ffmpeg", "-y",
            "-i", clip.local_path,
            "-t", str(duration),
            "-vf", f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}",
            "-c:v", "libx264", "-preset", "fast", "-an",
            "-r", str(timeline.fps),
            str(output),
        ]
    else:
        # Image: Ken Burns zoom
        frames = int(duration * timeline.fps)
        cmd = [
            "ffmpeg", "-y",
            "-loop", "1",
            "-i", clip.local_path,
            "-t", str(duration),
            "-vf", (
                f"scale={w*2}:{h*2},"
                f"zoompan=z='min(zoom+0.0015,1.5)':d={frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={w}x{h}:fps={timeline.fps}"
            ),
            "-c:v", "libx264", "-preset", "fast", "-an",
            "-r", str(timeline.fps),
            str(output),
        ]

    result = subprocess.run(cmd, capture_output=True, timeout=120)
    return result.returncode == 0
