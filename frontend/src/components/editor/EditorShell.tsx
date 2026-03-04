"use client";

import { useEffect } from "react";
import { useJobStatus } from "@/hooks/useJobStatus";
import { useTimelineStore } from "@/store/timelineStore";
import TimelineEditor from "./timeline/TimelineEditor";
import PreviewPanel from "./PreviewPanel";
import ClipInspector from "./inspector/ClipInspector";
import ExportButton from "./ExportButton";

const STATUS_LABELS: Record<string, string> = {
  pending: "Waiting to start...",
  scraping: "Scraping newsletter...",
  analyzing: "Analyzing with Claude...",
  fetching_media: "Fetching stock media...",
  generating_audio: "Generating voiceover...",
  build_timeline: "Building timeline...",
  ready: "Ready!",
  error: "Error",
};

interface Props {
  jobId: string;
}

export default function EditorShell({ jobId }: Props) {
  const { status, progress, timeline, error } = useJobStatus(jobId);
  const setTimeline = useTimelineStore((s) => s.setTimeline);
  const storedTimeline = useTimelineStore((s) => s.timeline);

  useEffect(() => {
    if (timeline) setTimeline(timeline);
  }, [timeline, setTimeline]);

  const isReady = status === "ready" || storedTimeline !== null;

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            NewsletterToTikTok
          </span>
          <span className="text-xs text-gray-400 font-mono">{jobId.slice(0, 8)}</span>
        </div>

        {!isReady && (
          <div className="flex items-center gap-3">
            <div className="w-40 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-500 transition-[width] duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">
              {STATUS_LABELS[status] ?? status} ({progress}%)
            </span>
          </div>
        )}

        {isReady && <ExportButton jobId={jobId} />}
      </div>

      {error && (
        <div className="mx-4 mt-3 p-3 rounded bg-red-900/40 text-red-300 text-sm">
          Error: {error}
        </div>
      )}

      {!isReady ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">{STATUS_LABELS[status] ?? status}</p>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Preview */}
          <div className="w-64 flex-shrink-0 border-r border-gray-700 bg-gray-900 overflow-y-auto p-3">
            <PreviewPanel jobId={jobId} />
          </div>

          {/* Center: Timeline */}
          <div className="flex-1 overflow-hidden p-2">
            <TimelineEditor />
          </div>

          {/* Right: Inspector */}
          <div className="w-64 flex-shrink-0 border-l border-gray-700 bg-gray-900 overflow-y-auto">
            <ClipInspector />
          </div>
        </div>
      )}
    </div>
  );
}
