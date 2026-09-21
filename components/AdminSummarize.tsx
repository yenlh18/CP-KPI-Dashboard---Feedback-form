"use client";

import { useState } from "react";

export default function AdminSummarize({ kind }: { kind: "feedback" | "bug" | "training" }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const res = await fetch(`/api/summarize?kind=${kind}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to summarize.");
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to summarize.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={run}
        disabled={loading}
        className="rounded-lg bg-[#F05A22] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Summarizing…" : "✨ Summarize with AI"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {summary && (
        <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-800">
          {summary}
        </pre>
      )}
    </div>
  );
}
