"use client";

import { useDroppable } from "@dnd-kit/core";
import { secondsToPixels } from "@/lib/timelineUtils";
import Clip from "./Clip";
import type { Track } from "@/types/timeline";

const TRACK_LABELS: Record<string, string> = {
  visual: "Visual",
  audio: "Audio",
  subtitle: "Subtitle",
};

interface Props {
  track: Track;
  totalDuration: number;
}

export default function TrackRow({ track, totalDuration }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: track.id });
  const totalWidth = secondsToPixels(totalDuration) + 200;

  return (
    <div className="flex items-stretch border-b border-gray-700 h-14">
      {/* Label */}
      <div className="w-20 flex-shrink-0 bg-gray-800 border-r border-gray-700 flex items-center justify-center">
        <span className="text-xs text-gray-400 font-medium">{TRACK_LABELS[track.track_type]}</span>
      </div>

      {/* Clip area */}
      <div
        ref={setNodeRef}
        className={`relative flex-1 overflow-hidden transition-colors ${isOver ? "bg-gray-700/50" : "bg-gray-800/30"}`}
        style={{ width: totalWidth, minWidth: "100%" }}
      >
        {track.clips.map((clip) => (
          <Clip key={clip.id} clip={clip} trackType={track.track_type} />
        ))}
      </div>
    </div>
  );
}
