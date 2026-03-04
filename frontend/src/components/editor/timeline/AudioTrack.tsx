"use client";

import { useEffect, useRef } from "react";

interface Props {
  audioUrl: string;
}

export default function AudioTrack({ audioUrl }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    (async () => {
      const WaveSurfer = (await import("wavesurfer.js")).default;
      if (cancelled || !containerRef.current) return;
      if (wsRef.current) {
        wsRef.current.destroy();
      }
      wsRef.current = WaveSurfer.create({
        container: containerRef.current,
        waveColor: "#4ade80",
        progressColor: "#16a34a",
        height: 48,
        interact: false,
        normalize: true,
        url: audioUrl,
      });
    })();

    return () => {
      cancelled = true;
      if (wsRef.current) {
        wsRef.current.destroy();
        wsRef.current = null;
      }
    };
  }, [audioUrl]);

  return <div ref={containerRef} className="w-full" />;
}
