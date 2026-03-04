"use client";

import { secondsToPixels, formatTime, PIXELS_PER_SECOND } from "@/lib/timelineUtils";

interface Props {
  totalDuration: number;
}

export default function TimelineRuler({ totalDuration }: Props) {
  const totalWidth = secondsToPixels(totalDuration) + 24;
  const tickInterval = PIXELS_PER_SECOND >= 60 ? 1 : 5; // every 1s or 5s
  const ticks: number[] = [];
  for (let s = 0; s <= totalDuration; s += tickInterval) {
    ticks.push(s);
  }

  const LABEL_WIDTH = 60; // matches w-[60px] in TrackRow

  return (
    <div
      className="relative h-7 bg-gray-900 border-b border-gray-700 select-none flex-shrink-0"
      style={{ width: totalWidth + LABEL_WIDTH, minWidth: "100%" }}
    >
      {/* Spacer matching the track label width */}
      <div style={{ width: LABEL_WIDTH }} className="absolute left-0 top-0 h-full bg-gray-800 border-r border-gray-700" />
      <div style={{ position: "absolute", left: LABEL_WIDTH, top: 0, right: 0, bottom: 0 }}>
        {ticks.map((s) => (
          <div
            key={s}
            className="absolute top-0 flex flex-col items-center -translate-x-1/2"
            style={{ left: secondsToPixels(s) }}
          >
            <div className="w-px h-3 bg-gray-500" />
            <span className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">
              {formatTime(s)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
