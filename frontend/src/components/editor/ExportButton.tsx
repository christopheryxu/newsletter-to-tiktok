"use client";

import { useExport } from "@/hooks/useExport";

interface Props {
  jobId: string;
}

export default function ExportButton({ jobId }: Props) {
  const { triggerExport, status, downloadUrl, error } = useExport(jobId);

  return (
    <div className="flex flex-col gap-2 items-center">
      {!downloadUrl && (
        <button
          onClick={triggerExport}
          disabled={status === "exporting"}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {status === "exporting" ? "Rendering..." : "Export MP4"}
        </button>
      )}

      {status === "exporting" && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          Rendering with ffmpeg...
        </div>
      )}

      {downloadUrl && (
        <a
          href={downloadUrl}
          download
          className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-colors"
        >
          Download MP4
        </a>
      )}

      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}
    </div>
  );
}
