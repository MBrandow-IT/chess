"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GenerateSeriesButton({ seriesId }: { seriesId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onGenerate() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/host/events/series/${seriesId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeksAhead: 4 }),
      });
      const data = (await res.json().catch(() => null)) as {
        created?: number;
        error?: string;
      } | null;
      if (!res.ok) throw new Error(data?.error ?? "Could not generate sessions.");
      setMessage(`Created ${data?.created ?? 0} sessions.`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not generate sessions.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={onGenerate}
        className="focus-ring rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-medium hover:bg-black/5 disabled:opacity-60"
      >
        {busy ? "Generating..." : "Generate next 4 weeks"}
      </button>
      {message ? <span className="text-xs text-buckeye-gray">{message}</span> : null}
    </div>
  );
}
