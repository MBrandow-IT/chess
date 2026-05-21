"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteQuizQuestionButton({
  questionId,
  label,
}: {
  questionId: string;
  label: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/host/lesson-quiz-questions/${questionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Delete failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className="text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
      >
        {busy ? "Deleting…" : "Delete"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
