"use client";

import { useRef } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { useTimelineStore } from "@/store/timelineStore";
import { pixelsToSeconds } from "@/lib/timelineUtils";
import TrackRow from "./TrackRow";
import TimelineRuler from "./TimelineRuler";
import PlayheadMarker from "./PlayheadMarker";

export default function TimelineEditor() {
  const timeline = useTimelineStore((s) => s.timeline);
  const moveClip = useTimelineStore((s) => s.moveClip);
  const selectClip = useTimelineStore((s) => s.selectClip);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  if (!timeline) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    if (!active || !delta) return;
    const deltaSecs = pixelsToSeconds(delta.x);
    moveClip(String(active.id), deltaSecs);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div
        className="flex flex-col h-full overflow-auto bg-gray-900 rounded-lg border border-gray-700"
        ref={scrollRef}
        onClick={() => selectClip(null)}
      >
        {/* Ruler */}
        <div className="overflow-x-auto">
          <TimelineRuler totalDuration={timeline.total_duration_s} />
        </div>

        {/* Tracks */}
        <div className="relative overflow-x-auto">
          <PlayheadMarker />
          {timeline.tracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              totalDuration={timeline.total_duration_s}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
