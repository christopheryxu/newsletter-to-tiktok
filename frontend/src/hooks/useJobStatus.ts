"use client";

import { useEffect, useRef, useState } from "react";
import type { SSEEvent, JobStatus, Timeline } from "@/types/timeline";

export function useJobStatus(jobId: string | null) {
  const [status, setStatus] = useState<JobStatus>("pending");
  const [progress, setProgress] = useState(0);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!jobId) return;
    if (esRef.current) esRef.current.close();

    const es = new EventSource(`/api/pipeline/${jobId}/stream`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data: SSEEvent = JSON.parse(e.data);
        if (data.ping) return;
        setStatus(data.status);
        setProgress(data.progress ?? 0);
        if (data.timeline) setTimeline(data.timeline);
        if (data.error) setError(data.error);
        if (data.status === "ready" || data.status === "error") {
          es.close();
        }
      } catch {}
    };

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [jobId]);

  return { status, progress, timeline, error };
}
