"use client";

import { secondsToPixels } from "@/lib/timelineUtils";
import { useTimelineStore } from "@/store/timelineStore";

export default function PlayheadMarker() {
  const currentTime = useTimelineStore((s) => s.currentTime);
  const x = secondsToPixels(currentTime);

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-20"
      style={{ left: x }}
    >
      <div className="w-3 h-3 bg-red-500 rounded-full -translate-x-1/2 -translate-y-0" />
    </div>
  );
}
