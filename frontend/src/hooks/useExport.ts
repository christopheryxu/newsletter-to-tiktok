"use client";

import { useState, useCallback, useRef } from "react";
import { startExport, getExportStatus, getDownloadUrl } from "@/lib/api";
import type { JobStatus } from "@/types/timeline";

export function useExport(jobId: string) {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerExport = useCallback(async () => {
    setError(null);
    setDownloadUrl(null);
    try {
      await startExport(jobId);
      setStatus("exporting");

      pollRef.current = setInterval(async () => {
        try {
          const res = await getExportStatus(jobId);
          setStatus(res.status);
          if (res.status === "export_done") {
            clearInterval(pollRef.current!);
            setDownloadUrl(getDownloadUrl(jobId));
          } else if (res.status === "error") {
            clearInterval(pollRef.current!);
            setError("Export failed");
          }
        } catch (e) {
          clearInterval(pollRef.current!);
          setError(String(e));
        }
      }, 2000);
    } catch (e) {
      setError(String(e));
    }
  }, [jobId]);

  return { triggerExport, status, downloadUrl, error };
}
