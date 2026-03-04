"use client";

import { useRef } from "react";
import { pixelsToSeconds } from "@/lib/timelineUtils";
import { useTimelineStore } from "@/store/timelineStore";

interface Props {
  clipId: string;
  side: "left" | "right";
}

export default function ClipResizeHandle({ clipId, side }: Props) {
  const resizeClip = useTimelineStore((s) => s.resizeClip);
  const startXRef = useRef<number>(0);

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    startXRef.current = e.clientX;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!(e.buttons & 1)) return;
    const dx = e.clientX - startXRef.current;
    startXRef.current = e.clientX;
    const deltaSecs = pixelsToSeconds(dx);
    resizeClip(clipId, side, deltaSecs);
  };

  return (
    <div
      className={`absolute top-0 bottom-0 w-2 cursor-col-resize z-10 hover:bg-white/20 ${
        side === "left" ? "left-0" : "right-0"
      }`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    />
  );
}
