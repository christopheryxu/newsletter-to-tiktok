"use client";

import { useEffect, useRef, useCallback } from "react";
import { Howl } from "howler";
import { useTimelineStore } from "@/store/timelineStore";
import { getMediaUrl } from "@/lib/api";

export function usePlayback(jobId: string) {
  const { timeline, isPlaying, currentTime, setCurrentTime, setPlaying } = useTimelineStore();
  const howlsRef = useRef<Howl[]>([]);
  const rafRef = useRef<number>(0);
  const startWallRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Build Howl instances when timeline changes
  useEffect(() => {
    howlsRef.current.forEach((h) => h.unload());
    howlsRef.current = [];
    if (!timeline) return;

    const audioTrack = timeline.tracks.find((t) => t.track_type === "audio");
    if (!audioTrack) return;

    for (const clip of audioTrack.clips) {
      if (!clip.audio_path) continue;
      const filename = clip.audio_path.split(/[\\/]/).pop()!;
      const url = getMediaUrl(jobId, "audio", filename);
      const howl = new Howl({ src: [url], preload: true });
      howlsRef.current.push(howl);
    }
  }, [timeline, jobId]);

  const play = useCallback(() => {
    if (!timeline) return;
    setPlaying(true);
    startWallRef.current = performance.now();
    startTimeRef.current = currentTime;

    // Play all audio clips
    const audioTrack = timeline.tracks.find((t) => t.track_type === "audio");
    if (audioTrack) {
      audioTrack.clips.forEach((clip, i) => {
        const howl = howlsRef.current[i];
        if (!howl) return;
        const delay = Math.max(0, clip.start_s - currentTime) * 1000;
        setTimeout(() => {
          if (currentTime <= clip.start_s + clip.duration_s) {
            const seek = Math.max(0, currentTime - clip.start_s);
            howl.seek(seek);
            howl.play();
          }
        }, delay);
      });
    }

    const tick = () => {
      const elapsed = (performance.now() - startWallRef.current) / 1000;
      const t = startTimeRef.current + elapsed;
      setCurrentTime(t);
      if (t >= (timeline.total_duration_s || 999)) {
        setPlaying(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [timeline, currentTime, setPlaying, setCurrentTime]);

  const pause = useCallback(() => {
    setPlaying(false);
    cancelAnimationFrame(rafRef.current);
    howlsRef.current.forEach((h) => h.pause());
  }, [setPlaying]);

  const seek = useCallback((t: number) => {
    setCurrentTime(t);
    startWallRef.current = performance.now();
    startTimeRef.current = t;
  }, [setCurrentTime]);

  useEffect(() => {
    if (!isPlaying) cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  return { play, pause, seek, isPlaying };
}
