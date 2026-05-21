"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BoardEditor } from "@/components/chess/BoardEditor";
import { ChessboardDndShell } from "@/components/chess/ChessboardDndShell";
import { SolutionRecorder } from "@/components/host/SolutionRecorder";
import {
  boardSetupToFen,
  emptyBoardSetup,
  fenToBoardSetup,
  type BoardSetup,
} from "@/lib/chess/board-editor";
import {
  defaultSlugFromTitle,
  parseThemesInput,
} from "@/lib/host/lesson-puzzle-validation";
import type { LessonPuzzleRow } from "@/lib/supabase/types";

export type PuzzleEditorFormProps = {
  planSlug: string;
  lessonSlug: string;
  lessonTitle: string;
  initial?: LessonPuzzleRow;
};

export function PuzzleEditorForm({
  planSlug,
  lessonSlug,
  lessonTitle,
  initial,
}: PuzzleEditorFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [hint, setHint] = useState(initial?.hint ?? "");
  const [themesInput, setThemesInput] = useState(
    initial?.themes?.join(", ") ?? "",
  );
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? "");
  const [orderIdx, setOrderIdx] = useState(initial?.order_idx ?? 0);
  const [published, setPublished] = useState(initial?.published ?? true);
  const [setup, setSetup] = useState<BoardSetup>(() =>
    initial?.fen ? fenToBoardSetup(initial.fen) : emptyBoardSetup(),
  );
  const [solution, setSolution] = useState<string[]>(
    initial?.solution ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const startFen = useMemo(() => boardSetupToFen(setup), [setup]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(defaultSlugFromTitle(value));
    }
  }

  function handleSetupChange(next: BoardSetup) {
    setSetup(next);
    setSolution([]);
  }

  async function handleSave() {
    setError(null);
    setSaving(true);

    const payload = {
      planSlug,
      lessonSlug,
      slug: slug.trim(),
      title: title.trim(),
      fen: startFen,
      solution,
      hint: hint.trim() || null,
      themes: parseThemesInput(themesInput),
      difficulty: difficulty.trim() || null,
      order_idx: orderIdx,
      published,
    };

    try {
      const res = await fetch(
        initial
          ? `/api/host/lesson-puzzles/${initial.id}`
          : "/api/host/lesson-puzzles",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      router.push(`/host/lessons/${planSlug}/${lessonSlug}/puzzles`);
      router.refresh();
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    if (!window.confirm(`Delete "${initial.title}"? This cannot be undone.`)) {
      return;
    }

    setError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/host/lesson-puzzles/${initial.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Delete failed");
        return;
      }
      router.push(`/host/lessons/${planSlug}/${lessonSlug}/puzzles`);
      router.refresh();
    } catch {
      setError("Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-black/5 bg-white p-5 shadow-card">
        <h2 className="font-display text-lg font-semibold">Puzzle details</h2>
        <p className="mt-1 text-sm text-buckeye-gray">
          Lesson: {lessonTitle}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="focus-ring mt-1 w-full rounded-md border border-black/10 px-3 py-2"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Slug</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              className="focus-ring mt-1 w-full rounded-md border border-black/10 px-3 py-2 font-mono text-sm"
              required
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium">Hint</span>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              className="focus-ring mt-1 w-full rounded-md border border-black/10 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Themes</span>
            <input
              type="text"
              value={themesInput}
              onChange={(e) => setThemesInput(e.target.value)}
              placeholder="pawn, capture"
              className="focus-ring mt-1 w-full rounded-md border border-black/10 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Difficulty</span>
            <input
              type="text"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              placeholder="beginner"
              className="focus-ring mt-1 w-full rounded-md border border-black/10 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Order</span>
            <input
              type="number"
              value={orderIdx}
              onChange={(e) => setOrderIdx(Number(e.target.value) || 0)}
              className="focus-ring mt-1 w-full rounded-md border border-black/10 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 rounded border-black/20"
            />
            <span className="font-medium">Published on practice page</span>
          </label>
        </div>
      </section>

      <ChessboardDndShell className="space-y-8">
        <section className="rounded-xl border border-black/5 bg-white p-5 shadow-card">
          <h2 className="font-display text-lg font-semibold">
            Step 1 — Set up the position
          </h2>
          <div className="mt-4">
            <BoardEditor value={setup} onChange={handleSetupChange} />
          </div>
        </section>

        <section className="rounded-xl border border-black/5 bg-white p-5 shadow-card">
          <SolutionRecorder
            startFen={startFen}
            solution={solution}
            onChange={setSolution}
          />
        </section>
      </ChessboardDndShell>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !title.trim() || !slug.trim() || solution.length === 0}
          className="focus-ring rounded-md bg-buckeye-scarlet px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : initial ? "Save changes" : "Create puzzle"}
        </button>
        {initial ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="focus-ring rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete puzzle"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
