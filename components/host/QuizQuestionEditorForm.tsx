"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BoardEditor } from "@/components/chess/BoardEditor";
import { ChessboardDndShell } from "@/components/chess/ChessboardDndShell";
import { MultipleChoiceFields } from "@/components/host/MultipleChoiceFields";
import { SolutionRecorder } from "@/components/host/SolutionRecorder";
import {
  boardSetupToFen,
  emptyBoardSetup,
  fenToBoardSetup,
  type BoardSetup,
} from "@/lib/chess/board-editor";
import {
  buildQuizQuestionPayload,
  defaultSlugFromPrompt,
} from "@/lib/host/quiz-question-validation";
import type { LessonQuizQuestionRow, QuestionType } from "@/lib/supabase/types";

export type QuizQuestionEditorFormProps = {
  planSlug: string;
  lessonSlug: string;
  lessonTitle: string;
  initial?: LessonQuizQuestionRow;
};

type EditorType = "multiple-choice" | "best-move";

function initialType(row?: LessonQuizQuestionRow): EditorType {
  if (!row) return "multiple-choice";
  return row.type === "best-move" ? "best-move" : "multiple-choice";
}

export function QuizQuestionEditorForm({
  planSlug,
  lessonSlug,
  lessonTitle,
  initial,
}: QuizQuestionEditorFormProps) {
  const router = useRouter();
  const initialPayload = initial?.payload ?? {};

  const [questionType, setQuestionType] = useState<EditorType>(
    initialType(initial),
  );
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [timeLimit, setTimeLimit] = useState(initial?.time_limit_seconds ?? 30);
  const [basePoints, setBasePoints] = useState(initial?.base_points ?? 100);
  const [orderIdx, setOrderIdx] = useState(initial?.order_idx ?? 0);
  const [published, setPublished] = useState(initial?.published ?? true);
  const [choices, setChoices] = useState<string[]>(
    (initialPayload.choices as string[] | undefined) ?? ["", "", "", ""],
  );
  const [correctChoice, setCorrectChoice] = useState(
    (initialPayload.correctChoice as number | undefined) ?? 0,
  );
  const [setup, setSetup] = useState<BoardSetup>(() => {
    const fen = initialPayload.fen as string | undefined;
    return fen ? fenToBoardSetup(fen) : emptyBoardSetup();
  });
  const [solution, setSolution] = useState<string[]>(
    (initialPayload.solution as string[] | undefined) ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const startFen = useMemo(() => boardSetupToFen(setup), [setup]);

  function handlePromptChange(value: string) {
    setPrompt(value);
    if (!slugTouched) setSlug(defaultSlugFromPrompt(value));
  }

  function handleSetupChange(next: BoardSetup) {
    setSetup(next);
    setSolution([]);
  }

  const canSave =
    questionType === "multiple-choice"
      ? choices.filter((c) => c.trim()).length >= 2
      : solution.length > 0;

  async function handleSave() {
    setError(null);
    setSaving(true);

    const payload =
      questionType === "multiple-choice"
        ? buildQuizQuestionPayload("multiple-choice", {
            choices: choices.map((c) => c.trim()).filter(Boolean),
            correctChoice,
          })
        : buildQuizQuestionPayload("best-move", { fen: startFen, solution });

    const body = {
      planSlug,
      lessonSlug,
      slug: slug.trim(),
      type: questionType as QuestionType,
      prompt: prompt.trim(),
      payload,
      time_limit_seconds: timeLimit,
      base_points: basePoints,
      order_idx: orderIdx,
      published,
    };

    try {
      const res = await fetch(
        initial
          ? `/api/host/lesson-quiz-questions/${initial.id}`
          : "/api/host/lesson-quiz-questions",
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
      router.push(`/host/lessons/${planSlug}/${lessonSlug}/quiz`);
      router.refresh();
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    if (!window.confirm(`Delete this question? This cannot be undone.`)) return;

    setError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/host/lesson-quiz-questions/${initial.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Delete failed");
        return;
      }
      router.push(`/host/lessons/${planSlug}/${lessonSlug}/quiz`);
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
        <h2 className="font-display text-lg font-semibold">Question details</h2>
        <p className="mt-1 text-sm text-buckeye-gray">Lesson: {lessonTitle}</p>

        <div className="mt-4 space-y-4">
          <div>
            <span className="text-sm font-medium">Question type</span>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setQuestionType("multiple-choice")}
                className={`focus-ring rounded-md px-3 py-1.5 text-sm font-medium ${
                  questionType === "multiple-choice"
                    ? "bg-buckeye-scarlet text-white"
                    : "border border-black/10 bg-white hover:bg-black/5"
                }`}
              >
                Multiple choice
              </button>
              <button
                type="button"
                onClick={() => setQuestionType("best-move")}
                className={`focus-ring rounded-md px-3 py-1.5 text-sm font-medium ${
                  questionType === "best-move"
                    ? "bg-buckeye-scarlet text-white"
                    : "border border-black/10 bg-white hover:bg-black/5"
                }`}
              >
                Chess puzzle
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium">Prompt</span>
              <input
                type="text"
                value={prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
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
            <label className="block text-sm">
              <span className="font-medium">Order</span>
              <input
                type="number"
                value={orderIdx}
                onChange={(e) => setOrderIdx(Number(e.target.value) || 0)}
                className="focus-ring mt-1 w-full rounded-md border border-black/10 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Time limit (seconds)</span>
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value) || 30)}
                className="focus-ring mt-1 w-full rounded-md border border-black/10 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Base points</span>
              <input
                type="number"
                value={basePoints}
                onChange={(e) => setBasePoints(Number(e.target.value) || 100)}
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
              <span className="font-medium">Published for live quizzes</span>
            </label>
          </div>
        </div>
      </section>

      {questionType === "multiple-choice" ? (
        <section className="rounded-xl border border-black/5 bg-white p-5 shadow-card">
          <MultipleChoiceFields
            choices={choices}
            correctChoice={correctChoice}
            onChange={({ choices: nextChoices, correctChoice: nextCorrect }) => {
              setChoices(nextChoices);
              setCorrectChoice(nextCorrect);
            }}
          />
        </section>
      ) : (
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
      )}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !prompt.trim() || !slug.trim() || !canSave}
          className="focus-ring rounded-md bg-buckeye-scarlet px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : initial ? "Save changes" : "Create question"}
        </button>
        {initial ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="focus-ring rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete question"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
