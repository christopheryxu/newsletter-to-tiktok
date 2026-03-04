"use client";

import { useTimelineStore } from "@/store/timelineStore";
import { formatTime } from "@/lib/timelineUtils";
import SectionScript from "./SectionScript";
import type { Clip } from "@/types/timeline";

export default function ClipInspector() {
  const selectedClipId = useTimelineStore((s) => s.selectedClipId);
  const timeline = useTimelineStore((s) => s.timeline);

  if (!selectedClipId || !timeline) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Select a clip to inspect
      </div>
    );
  }

  let selectedClip: Clip | undefined;
  let trackType = "";
  for (const track of timeline.tracks) {
    const found = track.clips.find((c) => c.id === selectedClipId);
    if (found) {
      selectedClip = found;
      trackType = track.track_type;
      break;
    }
  }

  if (!selectedClip) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Clip not found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-sm text-white">
      <div className="flex flex-col gap-4 p-4 flex-shrink-0">
        <h3 className="font-semibold text-base capitalize">{trackType} Clip</h3>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-400">Start</span>
            <span className="font-mono">{formatTime(selectedClip.start_s)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-400">Duration</span>
            <span className="font-mono">{formatTime(selectedClip.duration_s)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-400">End</span>
            <span className="font-mono">
              {formatTime(selectedClip.start_s + selectedClip.duration_s)}
            </span>
          </div>
          {selectedClip.media_type && (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-400">Media Type</span>
              <span className="capitalize">{selectedClip.media_type}</span>
            </div>
          )}
        </div>

        {trackType === "visual" && selectedClip.local_path && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">File</span>
            <span className="font-mono text-xs text-gray-300 break-all">
              {selectedClip.local_path.split(/[\\/]/).pop()}
            </span>
          </div>
        )}
      </div>

      {trackType === "subtitle" && selectedClip.subtitle_text !== undefined && (
        <SectionScript
          sectionId={selectedClip.section_id}
          initialScript={selectedClip.subtitle_text}
        />
      )}
    </div>
  );
}
