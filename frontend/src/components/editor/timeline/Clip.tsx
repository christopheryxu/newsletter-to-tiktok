"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { secondsToPixels } from "@/lib/timelineUtils";
import { useTimelineStore } from "@/store/timelineStore";
import ClipResizeHandle from "./ClipResizeHandle";
import type { Clip as ClipType } from "@/types/timeline";

const TRACK_COLORS: Record<string, string> = {
  visual: "bg-blue-700 border-blue-500",
  audio: "bg-green-700 border-green-500",
  subtitle: "bg-purple-700 border-purple-500",
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
      : "Sub";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        absolute top-1 bottom-1 rounded border ${colorClass}
        ${isSelected ? "ring-2 ring-yellow-400" : ""}
        overflow-hidden select-none cursor-grab active:cursor-grabbing
      `}
      onClick={(e) => { e.stopPropagation(); selectClip(clip.id); }}
      {...listeners}
      {...attributes}
    >
      <ClipResizeHandle clipId={clip.id} side="left" />
      <div className="px-2 py-0.5 text-xs text-white font-medium truncate pointer-events-none">
        {label}
      </div>
      <ClipResizeHandle clipId={clip.id} side="right" />
    </div>
  );
}
