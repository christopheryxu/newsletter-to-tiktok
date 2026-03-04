"use client";

import { useTimelineStore } from "@/store/timelineStore";
import type { SubtitleCue } from "@/types/timeline";

interface Props {
  cues: SubtitleCue[];
}

export default function SubtitleTrack({ cues }: Props) {
  const currentTime = useTimelineStore((s) => s.currentTime);
  const active = cues.find((c) => currentTime >= c.start_s && currentTime < c.end_s);

  if (!active) return null;

  return (
    <div className="absolute bottom-6 left-0 right-0 px-3 text-center z-30 pointer-events-none">
      <div className="bg-black/70 text-white text-sm font-semibold px-3 py-1.5 rounded leading-snug">
        {active.text}
      </div>
    </div>
  );
}
