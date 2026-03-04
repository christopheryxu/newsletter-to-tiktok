import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { putTimeline } from "@/lib/api";
import type { Timeline, Clip } from "@/types/timeline";
import { clamp } from "@/lib/timelineUtils";

interface TimelineState {
  timeline: Timeline | null;
  selectedClipId: string | null;
  currentTime: number;
  isPlaying: boolean;

  setTimeline: (t: Timeline) => void;
  selectClip: (id: string | null) => void;
  setCurrentTime: (t: number) => void;
  setPlaying: (p: boolean) => void;

  moveClip: (clipId: string, deltaSecs: number) => void;
  resizeClip: (clipId: string, side: "left" | "right", deltaSecs: number) => void;

  syncToBackend: () => Promise<void>;
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export const useTimelineStore = create<TimelineState>()(
  immer((set, get) => ({
    timeline: null,
    selectedClipId: null,
    currentTime: 0,
    isPlaying: false,

    setTimeline: (t) => set((s) => { s.timeline = t; }),
    selectClip: (id) => set((s) => { s.selectedClipId = id; }),
    setCurrentTime: (t) => set((s) => { s.currentTime = t; }),
    setPlaying: (p) => set((s) => { s.isPlaying = p; }),

    moveClip: (clipId, deltaSecs) => {
      set((s) => {
        if (!s.timeline) return;
        for (const track of s.timeline.tracks) {
          const clip = track.clips.find((c) => c.id === clipId);
          if (clip) {
            clip.start_s = clamp(clip.start_s + deltaSecs, 0, 3600);
            break;
          }
        }
        _recalcDuration(s.timeline);
      });
      _scheduleSyncToBackend(get);
    },

    resizeClip: (clipId, side, deltaSecs) => {
      set((s) => {
        if (!s.timeline) return;
        for (const track of s.timeline.tracks) {
          const clip = track.clips.find((c) => c.id === clipId);
          if (clip) {
            if (side === "right") {
              clip.duration_s = Math.max(0.5, clip.duration_s + deltaSecs);
            } else {
              const newStart = clamp(clip.start_s + deltaSecs, 0, clip.start_s + clip.duration_s - 0.5);
              const diff = newStart - clip.start_s;
              clip.start_s = newStart;
              clip.duration_s = Math.max(0.5, clip.duration_s - diff);
            }
            break;
          }
        }
        _recalcDuration(s.timeline);
      });
      _scheduleSyncToBackend(get);
    },

    syncToBackend: async () => {
      const { timeline } = get();
      if (!timeline) return;
      try {
        await putTimeline(timeline.job_id, timeline);
      } catch (e) {
        console.error("Failed to sync timeline:", e);
      }
    },
  }))
);

function _recalcDuration(timeline: Timeline) {
  let max = 0;
  for (const track of timeline.tracks) {
    for (const clip of track.clips) {
      max = Math.max(max, clip.start_s + clip.duration_s);
    }
  }
  timeline.total_duration_s = max;
}

function _scheduleSyncToBackend(get: () => TimelineState) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    get().syncToBackend();
  }, 800);
}
