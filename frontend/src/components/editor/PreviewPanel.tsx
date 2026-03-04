"use client";

import { useEffect, useRef, useState } from "react";
import { useTimelineStore } from "@/store/timelineStore";
import { usePlayback } from "@/hooks/usePlayback";
import { getMediaUrl } from "@/lib/api";
import SubtitleTrack from "./timeline/SubtitleTrack";
import type { SubtitleCue } from "@/types/timeline";

interface Props {
  jobId: string;
}

export default function PreviewPanel({ jobId }: Props) {
  const timeline = useTimelineStore((s) => s.timeline);
  const currentTime = useTimelineStore((s) => s.currentTime);
  const { play, pause, seek, isPlaying } = usePlayback(jobId);

  const [activeSrc, setActiveSrc] = useState<string | null>(null);
  const [activeMediaType, setActiveMediaType] = useState<string>("image");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Collect all subtitle cues
  const allCues: SubtitleCue[] = [];
  if (timeline) {
    const subTrack = timeline.tracks.find((t) => t.track_type === "subtitle");
    if (subTrack) {
      for (const clip of subTrack.clips) {
        if (clip.cues) allCues.push(...clip.cues);
      }
    }
  }

  // Find active visual clip
  useEffect(() => {
    if (!timeline) return;
    const visualTrack = timeline.tracks.find((t) => t.track_type === "visual");
    if (!visualTrack) return;
    const activeClip = visualTrack.clips.find(
      (c) => currentTime >= c.start_s && currentTime < c.start_s + c.duration_s
    );
    if (activeClip?.local_path) {
      const filename = activeClip.local_path.split(/[\\/]/).pop()!;
      const url = getMediaUrl(jobId, "media", filename);
      setActiveSrc(url);
      setActiveMediaType(activeClip.media_type ?? "image");
    }
  }, [currentTime, timeline, jobId]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timeline) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(ratio * timeline.total_duration_s);
  };

  const progress =
    timeline && timeline.total_duration_s > 0
      ? (currentTime / timeline.total_duration_s) * 100
      : 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Phone frame */}
      <div className="relative mx-auto bg-black rounded-2xl overflow-hidden border border-gray-600"
        style={{ width: 216, height: 384 }}>
        {activeSrc && activeMediaType === "video" ? (
          <video
            ref={videoRef}
            src={activeSrc}
            className="w-full h-full object-cover"
            muted
            loop
            autoPlay
          />
        ) : activeSrc ? (
          <img
            src={activeSrc}
            alt="preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
            No clip
          </div>
        )}
        <SubtitleTrack cues={allCues} />
      </div>

      {/* Progress bar / scrubber */}
      <div
        className="relative h-2 bg-gray-700 rounded cursor-pointer mx-2"
        onClick={handleSeek}
      >
        <div
          className="absolute top-0 left-0 h-full bg-pink-500 rounded transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        <button
          onClick={() => seek(0)}
          className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-800"
        >
          |&lt;
        </button>
        <button
          onClick={isPlaying ? pause : play}
          className="text-sm font-semibold text-white px-4 py-1.5 rounded bg-pink-600 hover:bg-pink-500"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => seek(timeline?.total_duration_s ?? 0)}
          className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-800"
        >
          &gt;|
        </button>
      </div>
    </div>
  );
}
