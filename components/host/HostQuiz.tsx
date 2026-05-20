"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Maximize2, Minimize2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatPin, cn } from "@/lib/utils";
import { ChessBoard } from "@/components/chess/ChessBoard";
import type {
  QuizAnswerRow,
  QuizPlayerRow,
  QuizQuestionRow,
  QuizRow,
} from "@/lib/supabase/types";

type Props = {
  initialQuiz: QuizRow;
  initialQuestions: QuizQuestionRow[];
  joinUrl: string;
};

type Leaderboard = { id: string; display_name: string; total_score: number }[];

export function HostQuiz({ initialQuiz, initialQuestions, joinUrl }: Props) {
  const sb = useMemo(() => createSupabaseBrowserClient(), []);
  const [quiz, setQuiz] = useState<QuizRow>(initialQuiz);
  const [players, setPlayers] = useState<QuizPlayerRow[]>([]);
  const [answers, setAnswers] = useState<QuizAnswerRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bigScreen, setBigScreen] = useState(false);

  const currentQuestion: QuizQuestionRow | undefined =
    initialQuestions[quiz.current_question_idx ?? -1];

  // ---- realtime subscriptions ----
  useEffect(() => {
    const channel = sb
      .channel(`quiz:${quiz.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quizzes",
          filter: `id=eq.${quiz.id}`,
        },
        (payload) => {
          if (payload.new) setQuiz(payload.new as QuizRow);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_players",
          filter: `quiz_id=eq.${quiz.id}`,
        },
        () => {
          void refetchPlayers();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_answers",
          filter: `quiz_id=eq.${quiz.id}`,
        },
        () => {
          void refetchAnswers();
        },
      )
      .subscribe();

    void refetchPlayers();
    void refetchAnswers();
    return () => {
      void sb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.id]);

  const refetchPlayers = useCallback(async () => {
    const { data } = await sb
      .from("quiz_players")
      .select("*")
      .eq("quiz_id", quiz.id)
      .order("joined_at");
    if (data) setPlayers(data);
  }, [quiz.id, sb]);

  const refetchAnswers = useCallback(async () => {
    const { data } = await sb
      .from("quiz_answers")
      .select("*")
      .eq("quiz_id", quiz.id);
    if (data) setAnswers(data);
  }, [quiz.id, sb]);

  // ---- host actions ----
  async function doAction(path: "advance" | "reveal" | "end") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/${path}`, {
        method: "POST",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const leaderboard: Leaderboard = [...players]
    .sort((a, b) => b.total_score - a.total_score)
    .map((p) => ({
      id: p.id,
      display_name: p.display_name,
      total_score: p.total_score,
    }));

  const answersForCurrent = currentQuestion
    ? answers.filter((a) => a.question_id === currentQuestion.id)
    : [];

  return (
    <div
      className={cn(
        "grid gap-6 lg:grid-cols-[2fr_1fr]",
        bigScreen &&
          "fixed inset-0 z-50 overflow-auto bg-buckeye-cream/40 p-6 text-lg lg:grid-cols-[2fr_1fr]",
      )}
    >
      <div className="col-span-full -mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => setBigScreen((v) => !v)}
          aria-pressed={bigScreen}
          className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-medium hover:bg-black/5"
        >
          {bigScreen ? (
            <Minimize2 aria-hidden className="h-4 w-4" />
          ) : (
            <Maximize2 aria-hidden className="h-4 w-4" />
          )}
          {bigScreen ? "Exit big screen" : "Big-screen mode"}
        </button>
      </div>
      <main className="space-y-4">
        {quiz.status === "lobby" ? (
          <Lobby
            pin={quiz.pin}
            joinUrl={joinUrl}
            playerCount={players.length}
            onStart={() => doAction("advance")}
            busy={busy}
          />
        ) : quiz.status === "question" && currentQuestion ? (
          <QuestionView
            question={currentQuestion}
            total={initialQuestions.length}
            answeredCount={answersForCurrent.length}
            playerCount={players.length}
            onReveal={() => doAction("reveal")}
            busy={busy}
          />
        ) : quiz.status === "reveal" && currentQuestion ? (
          <RevealView
            question={currentQuestion}
            answers={answersForCurrent}
            players={players}
            onNext={() => doAction("advance")}
            busy={busy}
            isLast={
              (quiz.current_question_idx ?? -1) >=
              initialQuestions.length - 1
            }
          />
        ) : quiz.status === "ended" ? (
          <EndedView quizId={quiz.id} leaderboard={leaderboard} />
        ) : (
          <div className="rounded-xl border border-dashed border-black/10 bg-white p-8 text-center text-buckeye-gray">
            No current question.
          </div>
        )}
        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </main>

      <aside className="space-y-4">
        <PlayerList players={players} />
        <Leaderboard rows={leaderboard} />
      </aside>
    </div>
  );
}

// ---- subcomponents ----

function Lobby({
  pin,
  joinUrl,
  playerCount,
  onStart,
  busy,
}: {
  pin: string;
  joinUrl: string;
  playerCount: number;
  onStart: () => void;
  busy: boolean;
}) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-8 shadow-card text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-buckeye-scarlet">
        Join at
      </p>
      <p className="mt-1 font-display text-2xl font-semibold">
        {joinUrl.replace(/^https?:\/\//, "")}
      </p>
      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-buckeye-gray">
        Game PIN
      </p>
      <p
        className="mt-2 font-display text-7xl font-extrabold tracking-[0.2em] text-buckeye-ink sm:text-8xl"
        aria-label={`PIN ${pin.split("").join(" ")}`}
      >
        {formatPin(pin)}
      </p>
      <div className="mt-8 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
        <div className="rounded-lg bg-white p-3 shadow-card">
          <QRCodeSVG value={joinUrl} size={160} includeMargin />
        </div>
        <div className="text-left">
          <p className="text-sm text-buckeye-gray">Players in lobby</p>
          <p className="font-display text-4xl font-bold">{playerCount}</p>
          <button
            type="button"
            onClick={onStart}
            disabled={busy || playerCount === 0}
            className="focus-ring mt-4 rounded-md bg-buckeye-scarlet px-5 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? "Starting..." : "Start the quiz →"}
          </button>
        </div>
      </div>
    </section>
  );
}

function QuestionView({
  question,
  total,
  answeredCount,
  playerCount,
  onReveal,
  busy,
}: {
  question: QuizQuestionRow;
  total: number;
  answeredCount: number;
  playerCount: number;
  onReveal: () => void;
  busy: boolean;
}) {
  const payload = question.payload as {
    prompt?: string | null;
    fen?: string | null;
    choices?: string[] | null;
  };
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-buckeye-scarlet">
          Question {question.idx + 1} of {total}
        </p>
        <p className="text-sm text-buckeye-gray">
          {answeredCount}/{playerCount} answered
        </p>
      </div>
      <h2 className="mt-2 font-display text-2xl font-semibold">
        {payload.prompt ?? "Find the best move"}
      </h2>

      {payload.fen ? (
        <div className="mt-4">
          <ChessBoard fen={payload.fen} maxWidth={420} interactive={false} />
        </div>
      ) : null}

      {payload.choices && payload.choices.length > 0 ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {payload.choices.map((choice, idx) => (
            <li
              key={idx}
              className="rounded-lg border border-black/10 bg-buckeye-cream/40 px-4 py-3 font-medium"
            >
              {String.fromCharCode(65 + idx)}. {choice}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onReveal}
          disabled={busy}
          className="focus-ring rounded-md bg-buckeye-scarlet px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? "..." : "Reveal answer"}
        </button>
      </div>
    </section>
  );
}

function RevealView({
  question,
  answers,
  players,
  onNext,
  busy,
  isLast,
}: {
  question: QuizQuestionRow;
  answers: QuizAnswerRow[];
  players: QuizPlayerRow[];
  onNext: () => void;
  busy: boolean;
  isLast: boolean;
}) {
  const payload = question.payload as {
    prompt?: string | null;
    fen?: string | null;
    choices?: string[] | null;
    correctChoice?: number | null;
    solution?: string[] | null;
  };
  const correctLabel =
    question.type === "multiple-choice" &&
    typeof payload.correctChoice === "number" &&
    payload.choices
      ? `${String.fromCharCode(65 + payload.correctChoice)}. ${payload.choices[payload.correctChoice]}`
      : payload.solution?.join(", ") ?? "";

  const correctPct = players.length === 0
    ? 0
    : Math.round(
        (answers.filter((a) => a.correct).length / players.length) * 100,
      );

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-widest text-buckeye-scarlet">
        Answer
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold">
        {payload.prompt ?? "Result"}
      </h2>
      <p className="mt-3 rounded-md bg-green-50 px-4 py-3 text-green-800">
        <span className="font-semibold">Correct answer:</span> {correctLabel}
      </p>
      <p className="mt-2 text-sm text-buckeye-gray">
        {answers.filter((a) => a.correct).length}/{players.length} players got
        it right ({correctPct}%).
      </p>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={busy}
          className="focus-ring rounded-md bg-buckeye-scarlet px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? "..." : isLast ? "Finish quiz" : "Next question →"}
        </button>
      </div>
    </section>
  );
}

function EndedView({
  quizId,
  leaderboard,
}: {
  quizId: string;
  leaderboard: Leaderboard;
}) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-card text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-buckeye-scarlet">
        Quiz complete
      </p>
      <h2 className="mt-2 font-display text-3xl font-bold">Great job!</h2>
      {leaderboard[0] ? (
        <p className="mt-3 font-display text-2xl">
          🏆 {leaderboard[0].display_name} — {leaderboard[0].total_score} pts
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <a
          href={`/api/quizzes/${quizId}/export`}
          className="focus-ring rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-black/5"
        >
          Download CSV
        </a>
      </div>
    </section>
  );
}

function PlayerList({ players }: { players: QuizPlayerRow[] }) {
  return (
    <section className="rounded-xl border border-black/5 bg-white p-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-widest text-buckeye-gray">
        Players ({players.length})
      </p>
      {players.length === 0 ? (
        <p className="mt-2 text-sm text-buckeye-gray">
          Waiting for the first player...
        </p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {players.map((p) => (
            <li
              key={p.id}
              className="rounded-full bg-buckeye-cream/60 px-3 py-1 text-sm font-medium"
            >
              {p.display_name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Leaderboard({ rows }: { rows: Leaderboard }) {
  if (rows.length === 0) return null;
  return (
    <section className="rounded-xl border border-black/5 bg-white p-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-widest text-buckeye-gray">
        Leaderboard
      </p>
      <ol className="mt-2 space-y-1">
        {rows.slice(0, 10).map((r, i) => (
          <li
            key={r.id}
            className="flex items-center justify-between rounded-md px-2 py-1 text-sm odd:bg-black/[0.02]"
          >
            <span className="flex items-center gap-2">
              <span className="font-display w-6 text-buckeye-gray">
                {i + 1}.
              </span>
              <span className="font-medium">{r.display_name}</span>
            </span>
            <span className="font-mono">{r.total_score}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
