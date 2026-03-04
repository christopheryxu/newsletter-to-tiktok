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
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[90%] text-center z-30 pointer-events-none">
      <span className="bg-black/70 text-white text-lg font-semibold px-3 py-1 rounded">
        {active.text}
      </span>
    </div>
  );
}
