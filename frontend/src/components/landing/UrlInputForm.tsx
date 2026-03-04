"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startPipeline } from "@/lib/api";

export default function UrlInputForm() {
  const [url, setUrl] = useState("");
  const [voiceId, setVoiceId] = useState("Rachel");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!url.trim()) return;
    setLoading(true);
    try {
      const { job_id } = await startPipeline(url.trim(), voiceId);
      router.push(`/editor/${job_id}`);
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="url" className="text-sm font-medium text-gray-300">
          Newsletter URL
        </label>
        <input
          id="url"
          type="url"
          required
          placeholder="https://example.substack.com/p/your-post"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-lg bg-gray-800 border border-gray-600 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="voice" className="text-sm font-medium text-gray-300">
          Voice
        </label>
        <select
          id="voice"
          value={voiceId}
          onChange={(e) => setVoiceId(e.target.value)}
          className="rounded-lg bg-gray-800 border border-gray-600 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="Rachel">Rachel (Female)</option>
          <option value="Adam">Adam (Male)</option>
          <option value="Antoni">Antoni (Male)</option>
          <option value="Josh">Josh (Male)</option>
        </select>
      </div>

      {error && (
        <p className="text-red-400 text-sm rounded bg-red-900/30 px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? "Starting pipeline..." : "Generate TikTok Video"}
      </button>
    </form>
  );
}
