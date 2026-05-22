"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Puzzle } from "@/components/chess/Puzzle";
import type { LessonPuzzleRow } from "@/lib/supabase/types";

type PracticePuzzleDeckProps = {
  puzzles: LessonPuzzleRow[];
  lessonTitle: string;
  storageKey: string;
};

type PracticeProgress = {
  idx: number;
  mode: "ordered" | "random";
  order?: string[];
};

function shuffleIds(ids: string[]): string[] {
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function loadProgress(key: string): PracticeProgress | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as PracticeProgress;
  } catch {
    return null;
  }
}

function saveProgress(key: string, progress: PracticeProgress) {
  try {
    localStorage.setItem(key, JSON.stringify(progress));
  } catch {
    // ignore quota / private mode
  }
}

function resolveDeck(
  puzzles: LessonPuzzleRow[],
  progress: PracticeProgress | null,
): { deck: LessonPuzzleRow[]; idx: number; mode: "ordered" | "random" } {
  const ids = new Set(puzzles.map((puzzle) => puzzle.id));
  const byId = new Map(puzzles.map((puzzle) => [puzzle.id, puzzle]));

  if (
    progress?.mode === "random" &&
    progress.order &&
    progress.order.length === puzzles.length &&
    progress.order.every((id) => ids.has(id))
  ) {
    const deck = progress.order
      .map((id) => byId.get(id))
      .filter((puzzle): puzzle is LessonPuzzleRow => puzzle !== undefined);
    return {
      deck,
      idx: Math.min(Math.max(progress.idx, 0), deck.length - 1),
      mode: "random",
    };
  }

  if (
    progress?.mode === "ordered" &&
    progress.idx >= 0 &&
    progress.idx < puzzles.length
  ) {
    return { deck: puzzles, idx: progress.idx, mode: "ordered" };
  }

  return { deck: puzzles, idx: 0, mode: "ordered" };
}

export function PracticePuzzleDeck({
  puzzles,
  lessonTitle,
  storageKey,
}: PracticePuzzleDeckProps) {
  const [deck, setDeck] = useState<LessonPuzzleRow[]>(puzzles);
  const [idx, setIdx] = useState(0);
  const [mode, setMode] = useState<"ordered" | "random">("ordered");
  const [solved, setSolved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const resolved = resolveDeck(puzzles, loadProgress(storageKey));
    setDeck(resolved.deck);
    setIdx(resolved.idx);
    setMode(resolved.mode);
    setSolved(false);
    setHydrated(true);
  }, [puzzles, storageKey]);

  const persist = useCallback(
    (nextIdx: number, nextMode: "ordered" | "random", nextDeck: LessonPuzzleRow[]) => {
      saveProgress(storageKey, {
        idx: nextIdx,
        mode: nextMode,
        order: nextMode === "random" ? nextDeck.map((puzzle) => puzzle.id) : undefined,
      });
    },
    [storageKey],
  );

  useEffect(() => {
    if (!hydrated) return;
    persist(idx, mode, deck);
  }, [hydrated, idx, mode, deck, persist]);

  const current = deck[idx];
  const hasNext = idx < deck.length - 1;
  const allDone = solved && !hasNext;

  function goNext() {
    if (!hasNext) return;
    setIdx((i) => i + 1);
    setSolved(false);
  }

  function useLessonOrder() {
    setDeck(puzzles);
    setIdx(0);
    setMode("ordered");
    setSolved(false);
  }

  function randomize() {
    const nextDeck = shuffleIds(puzzles.map((puzzle) => puzzle.id))
      .map((id) => puzzles.find((puzzle) => puzzle.id === id))
      .filter((puzzle): puzzle is LessonPuzzleRow => puzzle !== undefined);
    setDeck(nextDeck);
    setIdx(0);
    setMode("random");
    setSolved(false);
  }

  function resetDeck() {
    if (mode === "random") {
      randomize();
      return;
    }
    setDeck(puzzles);
    setIdx(0);
    setSolved(false);
  }

  const orderLabel = useMemo(
    () => (mode === "ordered" ? "Lesson order" : "Random order"),
    [mode],
  );

  if (!hydrated || !current) return null;

  return (
    <div className="space-y-6">
      {!allDone ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-buckeye-gray">
              Puzzle {idx + 1} of {deck.length}
              <span className="text-buckeye-gray/70"> · {orderLabel}</span>
              {current.themes.length > 0 ? (
                <span className="text-buckeye-gray/70">
                  {" "}
                  · {current.themes.join(", ")}
                </span>
              ) : null}
            </p>
            <div className="flex flex-wrap gap-2">
              {mode === "random" ? (
                <button
                  type="button"
                  onClick={useLessonOrder}
                  className="focus-ring rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-medium hover:bg-black/5"
                >
                  Use lesson order
                </button>
              ) : null}
              <button
                type="button"
                onClick={randomize}
                className="focus-ring rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-medium hover:bg-black/5"
              >
                Randomize
              </button>
            </div>
          </div>

          <Puzzle
            key={`${mode}-${current.id}-${idx}`}
            fen={current.fen}
            solution={current.solution}
            hint={current.hint ?? undefined}
            title={current.title}
            onSolved={(_detail) => setSolved(true)}
          />

          {solved && hasNext ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={goNext}
                className="focus-ring rounded-md bg-buckeye-scarlet px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Next puzzle →
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-6">
          <p className="text-sm font-medium text-green-800">
            Nice work — you finished all {deck.length} practice puzzles for{" "}
            {lessonTitle}!
          </p>
          <button
            type="button"
            onClick={resetDeck}
            className="focus-ring mt-4 rounded-md bg-buckeye-scarlet px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Try all again
          </button>
        </div>
      )}
    </div>
  );
}
