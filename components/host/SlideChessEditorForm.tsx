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
  buildSlideAnalysisBoardPayload,
  buildSlideDisplayBoardPayload,
  buildSlidePuzzlePayload,
  defaultSlugFromSlideLabel,
} from "@/lib/host/slide-chess-validation";
import type { LessonSlideChessBlockRow } from "@/lib/supabase/types";
import type { SlideChessBlockType } from "@/lib/slide-chess/types";

export type SlideChessEditorFormProps = {
  planSlug: string;
  lessonSlug: string;
  lessonTitle: string;
  initial?: LessonSlideChessBlockRow;
};

function parseHighlightsInput(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function highlightsToInput(highlights: string[] | undefined): string {
  return highlights?.join(", ") ?? "";
}

export function SlideChessEditorForm({
  planSlug,
  lessonSlug,
  lessonTitle,
  initial,
}: SlideChessEditorFormProps) {
  const router = useRouter();
  const initialPayload = (initial?.payload ?? {}) as Record<string, unknown>;

  const [blockType, setBlockType] = useState<SlideChessBlockType>(
    initial?.type ?? "puzzle",
  );
  const [slideLabel, setSlideLabel] = useState(initial?.slide_label ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [orderIdx, setOrderIdx] = useState(initial?.order_idx ?? 0);
  const [published, setPublished] = useState(initial?.published ?? true);

  const [hint, setHint] = useState((initialPayload.hint as string) ?? "");
  const [puzzleTitle, setPuzzleTitle] = useState(
    (initialPayload.title as string) ?? "",
  );
  const [solution, setSolution] = useState<string[]>(
    (initialPayload.solution as string[] | undefined) ?? [],
  );

  const [highlightsInput, setHighlightsInput] = useState(
    highlightsToInput(initialPayload.highlights as string[] | undefined),
  );
  const [selectedSquare, setSelectedSquare] = useState(
    (initialPayload.selectedSquare as string) ?? "",
  );
  const [flipped, setFlipped] = useState(Boolean(initialPayload.flipped));
  const [interactive, setInteractive] = useState(
    Boolean(initialPayload.interactive),
  );

  const [setup, setSetup] = useState<BoardSetup>(() => {
    const fen = initialPayload.fen as string | undefined;
    return fen ? fenToBoardSetup(fen) : emptyBoardSetup();
  });

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const startFen = useMemo(() => boardSetupToFen(setup), [setup]);

  function handleSlideLabelChange(value: string) {
    setSlideLabel(value);
    if (!slugTouched) {
      setSlug(defaultSlugFromSlideLabel(value));
    }
  }

  function handleSetupChange(next: BoardSetup) {
    setSetup(next);
    if (blockType === "puzzle") {
      setSolution([]);
    }
  }

  function buildPayload(): Record<string, unknown> {
    switch (blockType) {
      case "puzzle":
        return buildSlidePuzzlePayload({
          fen: startFen,
          solution,
          hint,
          title: puzzleTitle,
        });
      case "display-board":
        return buildSlideDisplayBoardPayload({
          fen: startFen,
          highlights: parseHighlightsInput(highlightsInput),
          selectedSquare: selectedSquare.trim() || undefined,
          flipped,
          interactive,
        });
      case "analysis-board":
        return buildSlideAnalysisBoardPayload({
          fen: startFen,
          flipped,
        });
      default:
        return { fen: startFen };
    }
  }

  const canSave =
    blockType === "puzzle" ? solution.length > 0 : Boolean(startFen.trim());

  async function handleSave() {
    setError(null);
    setSaving(true);

    const body = {
      planSlug,
      lessonSlug,
      slug: slug.trim(),
      type: blockType,
      slide_label: slideLabel.trim(),
      payload: buildPayload(),
      order_idx: orderIdx,
      published,
    };

    try {
      const res = await fetch(
        initial
          ? `/api/host/lesson-slide-chess/${initial.id}`
          : "/api/host/lesson-slide-chess",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      router.push(`/host/lessons/${planSlug}/${lessonSlug}/slide-chess`);
      router.refresh();
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    if (
      !window.confirm(
        `Delete "${initial.slide_label || initial.slug}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    setError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/host/lesson-slide-chess/${initial.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Delete failed");
        return;
      }
      router.push(`/host/lessons/${planSlug}/${lessonSlug}/slide-chess`);
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
        <h2 className="font-display text-lg font-semibold">Block details</h2>
        <p className="mt-1 text-sm text-buckeye-gray">Lesson: {lessonTitle}</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium">Type</span>
            <select
              value={blockType}
              onChange={(e) =>
                setBlockType(e.target.value as SlideChessBlockType)
              }
              disabled={Boolean(initial)}
              className="focus-ring mt-1 w-full rounded-md border border-black/10 px-3 py-2"
            >
              <option value="puzzle">Puzzle (solve-a-line)</option>
              <option value="display-board">Display board (teaching)</option>
              <option value="analysis-board">Analysis board (free play)</option>
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium">Slide label</span>
            <input
              type="text"
              value={slideLabel}
              onChange={(e) => handleSlideLabelChange(e.target.value)}
              placeholder="Slide 6 — Knight fork puzzle"
              className="focus-ring mt-1 w-full rounded-md border border-black/10 px-3 py-2"
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
            <span className="mt-1 block text-xs text-buckeye-gray">
              Reference in MDX:{" "}
              <code className="rounded bg-black/5 px-1">
                {blockType === "puzzle"
                  ? `<SlidePuzzle slug="${slug || "your-slug"}" />`
                  : blockType === "display-board"
                    ? `<SlideBoard slug="${slug || "your-slug"}" />`
                    : `<SlideAnalysis slug="${slug || "your-slug"}" />`}
              </code>
            </span>
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
            <span className="font-medium">Published on lesson slides</span>
          </label>
        </div>
      </section>

      {blockType === "puzzle" ? (
        <section className="rounded-xl border border-black/5 bg-white p-5 shadow-card">
          <h2 className="font-display text-lg font-semibold">Puzzle text</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium">Title (optional)</span>
              <input
                type="text"
                value={puzzleTitle}
                onChange={(e) => setPuzzleTitle(e.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-black/10 px-3 py-2"
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
          </div>
        </section>
      ) : null}

      {blockType === "display-board" ? (
        <section className="rounded-xl border border-black/5 bg-white p-5 shadow-card">
          <h2 className="font-display text-lg font-semibold">Board display</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium">Highlight squares</span>
              <input
                type="text"
                value={highlightsInput}
                onChange={(e) => setHighlightsInput(e.target.value)}
                placeholder="d4, e4, d5, e5"
                className="focus-ring mt-1 w-full rounded-md border border-black/10 px-3 py-2 font-mono text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Selected square</span>
              <input
                type="text"
                value={selectedSquare}
                onChange={(e) => setSelectedSquare(e.target.value)}
                placeholder="e4"
                className="focus-ring mt-1 w-full rounded-md border border-black/10 px-3 py-2 font-mono text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={flipped}
                onChange={(e) => setFlipped(e.target.checked)}
                className="h-4 w-4 rounded border-black/20"
              />
              <span className="font-medium">Flipped (Black on bottom)</span>
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={interactive}
                onChange={(e) => setInteractive(e.target.checked)}
                className="h-4 w-4 rounded border-black/20"
              />
              <span className="font-medium">Interactive (allow dragging)</span>
            </label>
          </div>
        </section>
      ) : null}

      {blockType === "analysis-board" ? (
        <section className="rounded-xl border border-black/5 bg-white p-5 shadow-card">
          <h2 className="font-display text-lg font-semibold">Analysis board</h2>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={flipped}
              onChange={(e) => setFlipped(e.target.checked)}
              className="h-4 w-4 rounded border-black/20"
            />
            <span className="font-medium">Flipped (Black on bottom)</span>
          </label>
        </section>
      ) : null}

      <ChessboardDndShell className="space-y-8">
        <section className="rounded-xl border border-black/5 bg-white p-5 shadow-card">
          <h2 className="font-display text-lg font-semibold">
            {blockType === "puzzle"
              ? "Step 1 — Set up the position"
              : "Board position"}
          </h2>
          <div className="mt-4">
            <BoardEditor value={setup} onChange={handleSetupChange} />
          </div>
        </section>

        {blockType === "puzzle" ? (
          <section className="rounded-xl border border-black/5 bg-white p-5 shadow-card">
            <SolutionRecorder
              startFen={startFen}
              solution={solution}
              onChange={setSolution}
            />
          </section>
        ) : null}
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
          disabled={saving || !slug.trim() || !canSave}
          className="focus-ring rounded-md bg-buckeye-scarlet px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : initial ? "Save changes" : "Create block"}
        </button>
        {initial ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="focus-ring rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete block"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
