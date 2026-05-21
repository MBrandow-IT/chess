"use client";

import { useMemo, useState } from "react";
import { Puzzle } from "@/components/chess/Puzzle";
import type { LessonPuzzleRow } from "@/lib/supabase/types";

type PracticePuzzleDeckProps = {
  puzzles: LessonPuzzleRow[];
  lessonTitle: string;
};

export function PracticePuzzleDeck({
  puzzles,
  lessonTitle,
}: PracticePuzzleDeckProps) {
  const [sessionKey, setSessionKey] = useState(0);
  const shuffled = useMemo(
    () => [...puzzles].sort(() => Math.random() - 0.5),
    [puzzles, sessionKey],
  );
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState(false);

  const current = shuffled[idx];
  const hasNext = idx < shuffled.length - 1;
  const allDone = solved && !hasNext;

  function goNext() {
    if (!hasNext) return;
    setIdx((i) => i + 1);
    setSolved(false);
  }

  function resetDeck() {
    setSessionKey((k) => k + 1);
    setIdx(0);
    setSolved(false);
  }

  if (!current) return null;

  return (
    <div className="space-y-6">
      {!allDone ? (
        <>
          <p className="text-sm text-buckeye-gray">
            Puzzle {idx + 1} of {shuffled.length}
            {current.themes.length > 0 ? (
              <span className="text-buckeye-gray/70">
                {" "}
                · {current.themes.join(", ")}
              </span>
            ) : null}
          </p>

          <Puzzle
            key={`${sessionKey}-${current.id}`}
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
            Nice work — you finished all {shuffled.length} practice puzzles for{" "}
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
