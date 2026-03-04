"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { secondsToPixels } from "@/lib/timelineUtils";
import { useTimelineStore } from "@/store/timelineStore";
import ClipResizeHandle from "./ClipResizeHandle";
import type { Clip as ClipType } from "@/types/timeline";

const TRACK_COLORS: Record<string, string> = {
  visual: "bg-blue-700 border-blue-500 hover:bg-blue-500",
  audio: "bg-green-700 border-green-500 hover:bg-green-500",
  subtitle: "bg-purple-700 border-purple-500 hover:bg-purple-500",
};

interface Props {
  clip: ClipType;
  trackType: string;
}

export default function Clip({ clip, trackType }: Props) {
  const selectedClipId = useTimelineStore((s) => s.selectedClipId);
  const selectClip = useTimelineStore((s) => s.selectClip);
  const isSelected = selectedClipId === clip.id;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: clip.id,
    data: { clip, trackType },
  });

  const style = {
    position: "absolute" as const,
    left: secondsToPixels(clip.start_s),
    width: Math.max(secondsToPixels(clip.duration_s), 20),
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : isSelected ? 10 : 1,
  };

  const colorClass = TRACK_COLORS[trackType] ?? "bg-gray-700 border-gray-500";

  const label =
    trackType === "visual"
      ? clip.media_type === "video" ? "Video" : "Image"
      : trackType === "audio"
      ? "Audio"
      : "Subtitle";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        absolute top-0 bottom-0 rounded-none ${colorClass}
        ${isSelected ? "border-2 border-white" : "border-0"}
        overflow-hidden select-none cursor-default
      `}
      onClick={(e) => { e.stopPropagation(); selectClip(clip.id); }}
      {...listeners}
      {...attributes}
    >
      <ClipResizeHandle clipId={clip.id} side="left" />
      <ClipResizeHandle clipId={clip.id} side="right" />
    </div>
  );
}
