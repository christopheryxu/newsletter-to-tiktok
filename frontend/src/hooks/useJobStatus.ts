"use client";

import { useEffect, useRef, useState } from "react";
import type { SSEEvent, JobStatus, Timeline } from "@/types/timeline";

export function useJobStatus(jobId: string | null) {
  const [status, setStatus] = useState<JobStatus>("pending");
  const [progress, setProgress] = useState(0);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const doneRef = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!jobId) return;
    doneRef.current = false;

    function connect() {
      if (doneRef.current) return;
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
            doneRef.current = true;
            es.close();
          }
        } catch {}
      };

      es.onerror = () => {
        es.close();
        if (!doneRef.current) {
          retryTimer.current = setTimeout(connect, 2000);
        }
      };
    }

    connect();

    return () => {
      doneRef.current = true;
      if (retryTimer.current) clearTimeout(retryTimer.current);
      esRef.current?.close();
    };
  }, [jobId]);

  return { status, progress, timeline, error };
}
