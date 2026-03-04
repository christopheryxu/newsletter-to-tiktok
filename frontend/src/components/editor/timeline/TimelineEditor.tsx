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
        className="flex flex-col overflow-auto bg-gray-950"
        ref={scrollRef}
        onClick={() => selectClip(null)}
      >
        {/* Ruler + Tracks — container is flipped so scrollbar appears on top */}
        <div data-timeline-scroll className="overflow-x-auto flex-1 [transform:scaleY(-1)]
          [&::-webkit-scrollbar]:h-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-gray-600
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb:hover]:bg-gray-400
        ">
          <div className="[transform:scaleY(-1)]">
            <TimelineRuler totalDuration={timeline.total_duration_s} />
            <div className="relative">
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
        </div>
      </div>
    </DndContext>
  );
}
