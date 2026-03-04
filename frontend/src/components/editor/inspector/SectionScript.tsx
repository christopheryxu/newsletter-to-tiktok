"use client";

import { useState, useEffect } from "react";
import { useTimelineStore } from "@/store/timelineStore";

interface Props {
  sectionId: string;
  initialScript: string;
}

export default function SectionScript({ sectionId, initialScript }: Props) {
  const [script, setScript] = useState(initialScript);
  const timeline = useTimelineStore((s) => s.timeline);
  const syncToBackend = useTimelineStore((s) => s.syncToBackend);

  // Update subtitle text in timeline when script changes
  const handleChange = (val: string) => {
    setScript(val);
    // Sync is debounced via the store
    if (timeline) {
      const subtitleTrack = timeline.tracks.find((t) => t.track_type === "subtitle");
      if (subtitleTrack) {
        const clip = subtitleTrack.clips.find((c) => c.section_id === sectionId);
        if (clip) {
          clip.subtitle_text = val;
        }
      }
    }
    syncToBackend();
  };

  useEffect(() => {
    setScript(initialScript);
  }, [initialScript]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Voice Script
      </label>
      <textarea
        value={script}
        onChange={(e) => handleChange(e.target.value)}
        rows={6}
        className="w-full rounded bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-y"
      />
    </div>
  );
}
