"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CancelEventButton({
  eventId,
  canceled,
}: {
  eventId: string;
  canceled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onToggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/host/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: canceled ? "scheduled" : "canceled" }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Could not update event.");
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onToggle}
      className="focus-ring rounded-md border border-black/10 bg-white px-2 py-1 text-xs font-medium hover:bg-black/5 disabled:opacity-60"
    >
      {busy ? "..." : canceled ? "Restore" : "Cancel"}
    </button>
  );
}
