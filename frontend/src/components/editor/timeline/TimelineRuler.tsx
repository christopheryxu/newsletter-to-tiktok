"use client";

import { secondsToPixels, formatTime, PIXELS_PER_SECOND } from "@/lib/timelineUtils";

interface Props {
  totalDuration: number;
}

export default function TimelineRuler({ totalDuration }: Props) {
  const totalWidth = secondsToPixels(totalDuration) + 200;
  const tickInterval = PIXELS_PER_SECOND >= 60 ? 1 : 5; // every 1s or 5s
  const ticks: number[] = [];
  for (let s = 0; s <= totalDuration + tickInterval; s += tickInterval) {
    ticks.push(s);
  }

  return (
    <div
      className="relative h-7 bg-gray-900 border-b border-gray-700 select-none flex-shrink-0"
      style={{ width: totalWidth, minWidth: "100%" }}
    >
      {ticks.map((s) => (
        <div
          key={s}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: secondsToPixels(s) }}
        >
          <div className="w-px h-3 bg-gray-500" />
          <span className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">
            {formatTime(s)}
          </span>
        </div>
      ))}
    </div>
  );
}
