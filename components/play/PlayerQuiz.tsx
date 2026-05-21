"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Square } from "chess.js";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { Puzzle, type PuzzleSolvedDetail } from "@/components/chess/Puzzle";
import { loadChess } from "@/lib/chess/moves";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { scoreAnswer } from "@/lib/chess/scoring";
import { sfx } from "@/lib/sound";
import { formatPin } from "@/lib/utils";
import type { QuizPlayerRow, QuizQuestionRow, QuizRow } from "@/lib/supabase/types";

type Props = {
  initialQuiz: QuizRow;
  initialQuestions: QuizQuestionRow[];
};

type Session = {
  quizId: string;
  playerId: string;
  sessionToken: string;
  displayName: string;
};

function storageKey(quizId: string) {
  return `bcw:session:${quizId}`;
}

export function PlayerQuiz({ initialQuiz, initialQuestions }: Props) {
  const sb = useMemo(() => createSupabaseBrowserClient(), []);
  const [quiz, setQuiz] = useState<QuizRow>(initialQuiz);
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<QuizPlayerRow | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(quiz.id));
      if (raw) setSession(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, [quiz.id]);

  // Subscribe to quiz status changes
  useEffect(() => {
    const channel = sb
      .channel(`quiz:${quiz.id}:player`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "quizzes",
          filter: `id=eq.${quiz.id}`,
        },
        (payload) => setQuiz(payload.new as QuizRow),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "quiz_players",
          filter: `quiz_id=eq.${quiz.id}`,
        },
        (payload) => {
          const row = payload.new as QuizPlayerRow;
          if (session && row.id === session.playerId) setMe(row);
        },
      )
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [sb, quiz.id, session]);

  // Pull my latest player row periodically (also handles missed events)
  useEffect(() => {
    if (!session) return;
    let canceled = false;
    (async () => {
      const { data } = await sb
        .from("quiz_players")
        .select("*")
        .eq("id", session.playerId)
        .maybeSingle();
      if (!canceled && data) setMe(data);
    })();
    return () => {
      canceled = true;
    };
  }, [sb, session]);

  async function onJoin(displayName: string) {
    setJoining(true);
    setJoinError(null);
    try {
      const res = await fetch("/api/quizzes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: quiz.pin, displayName }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as {
        quiz_id: string;
        player_id: string;
        session_token: string;
      };
      const next: Session = {
        quizId: json.quiz_id,
        playerId: json.player_id,
        sessionToken: json.session_token,
        displayName,
      };
      localStorage.setItem(storageKey(quiz.id), JSON.stringify(next));
      setSession(next);
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : "Could not join");
    } finally {
      setJoining(false);
    }
  }

  if (!session) {
    return (
      <NameEntry
        pin={quiz.pin}
        onJoin={onJoin}
        busy={joining}
        error={joinError}
      />
    );
  }

  const currentIdx = quiz.current_question_idx;
  const currentQuestion =
    currentIdx != null && currentIdx >= 0
      ? initialQuestions[currentIdx]
      : undefined;

  return (
    <div>
      <PlayerHeader displayName={session.displayName} score={me?.total_score ?? 0} />

      {quiz.status === "lobby" ? (
        <LobbyWaiting displayName={session.displayName} pin={quiz.pin} />
      ) : quiz.status === "question" && currentQuestion ? (
        <QuestionPlay
          question={currentQuestion}
          totalQuestions={initialQuestions.length}
          questionStartedAt={quiz.current_question_started_at}
          quiz={quiz}
          session={session}
        />
      ) : quiz.status === "reveal" && currentQuestion ? (
        <RevealScreen
          question={currentQuestion}
          totalScore={me?.total_score ?? 0}
        />
      ) : quiz.status === "ended" ? (
        <EndedScreen totalScore={me?.total_score ?? 0} />
      ) : (
        <WaitingScreen />
      )}
    </div>
  );
}

function PlayerHeader({
  displayName,
  score,
}: {
  displayName: string;
  score: number;
}) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-xl border border-black/5 bg-white px-4 py-3 shadow-card">
      <div>
        <p className="text-xs uppercase tracking-wider text-buckeye-gray">
          You
        </p>
        <p className="font-display text-base font-semibold">{displayName}</p>
      </div>
      <div className="text-right">
        <p className="text-xs uppercase tracking-wider text-buckeye-gray">
          Score
        </p>
        <p className="font-display text-2xl font-bold">{score}</p>
      </div>
    </div>
  );
}

function NameEntry({
  pin,
  onJoin,
  busy,
  error,
}: {
  pin: string;
  onJoin: (name: string) => void;
  busy: boolean;
  error: string | null;
}) {
  const [name, setName] = useState("");
  return (
    <div className="mx-auto max-w-md rounded-xl border border-black/5 bg-white p-6 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-widest text-buckeye-scarlet">
        PIN {formatPin(pin)}
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold">
        Pick your name
      </h1>
      <p className="mt-1 text-sm text-buckeye-gray">
        This is what your classmates will see.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim().length > 0) onJoin(name.trim());
        }}
        className="mt-4 space-y-3"
      >
        <input
          autoFocus
          maxLength={24}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="focus-ring w-full rounded-md border border-black/10 bg-white px-3 py-3 text-lg"
        />
        <button
          type="submit"
          disabled={busy || name.trim().length === 0}
          className="focus-ring w-full rounded-md bg-buckeye-scarlet px-4 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? "Joining..." : "Join quiz"}
        </button>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </form>
    </div>
  );
}

function LobbyWaiting({
  displayName,
  pin,
}: {
  displayName: string;
  pin: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-card">
      <p className="text-xs font-semibold uppercase tracking-widest text-buckeye-scarlet">
        You're in!
      </p>
      <h2 className="mt-1 font-display text-2xl font-semibold">
        Hi, {displayName} 👋
      </h2>
      <p className="mt-2 text-buckeye-gray">
        Hold tight — the instructor will start the quiz soon.
      </p>
      <p className="mt-6 text-xs text-buckeye-gray">PIN {formatPin(pin)}</p>
    </div>
  );
}

function WaitingScreen() {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-card">
      <p className="font-display text-xl font-semibold">Waiting...</p>
      <p className="mt-1 text-sm text-buckeye-gray">
        Look at the projector for the next question.
      </p>
    </div>
  );
}

function RevealScreen({
  question,
  totalScore,
}: {
  question: QuizQuestionRow;
  totalScore: number;
}) {
  const payload = question.payload as {
    correctChoice?: number | null;
    choices?: string[] | null;
    solution?: string[] | null;
  };
  const correctLabel =
    question.type === "multiple-choice" &&
    typeof payload.correctChoice === "number" &&
    payload.choices
      ? payload.choices[payload.correctChoice]
      : payload.solution?.join(", ") ?? "";
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 text-center shadow-card">
      <p className="text-xs font-semibold uppercase tracking-widest text-buckeye-scarlet">
        Answer
      </p>
      <p className="mt-1 font-display text-xl font-semibold">{correctLabel}</p>
      <p className="mt-3 text-sm text-buckeye-gray">Your score</p>
      <p className="font-display text-4xl font-bold">{totalScore}</p>
    </div>
  );
}

function EndedScreen({ totalScore }: { totalScore: number }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-card">
      <p className="font-display text-2xl font-bold">Quiz complete!</p>
      <p className="mt-1 text-sm text-buckeye-gray">Final score</p>
      <p className="font-display text-5xl font-bold">{totalScore}</p>
      <p className="mt-4 text-sm text-buckeye-gray">
        Check the projector for the leaderboard.
      </p>
    </div>
  );
}

// ---- the active question UI ----

function QuestionPlay({
  question,
  totalQuestions,
  questionStartedAt,
  quiz,
  session,
}: {
  question: QuizQuestionRow;
  totalQuestions: number;
  questionStartedAt: string | null;
  quiz: QuizRow;
  session: Session;
}) {
  const startMs = useMemo(() => {
    return questionStartedAt
      ? new Date(questionStartedAt).getTime()
      : Date.now();
  }, [questionStartedAt]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const elapsedMs = Math.max(0, now - startMs);
  const remaining = Math.max(0, question.time_limit_seconds * 1000 - elapsedMs);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    correct: boolean;
    points: number;
  } | null>(null);
  const wrongAttemptsRef = useRef(0);

  const previewScore = scoreAnswer({
    basePoints: question.base_points,
    elapsedMs,
    wrongAttempts: wrongAttemptsRef.current,
    correct: true,
    timeLimitSeconds: question.time_limit_seconds,
  });

  async function submit(
    payload: Record<string, unknown>,
    clientElapsedMs: number,
  ) {
    if (submitting || result) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: session.playerId,
          session_token: session.sessionToken,
          question_id: question.id,
          payload,
          client_elapsed_ms: clientElapsedMs,
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as {
          correct: boolean;
          points_awarded: number;
        };
        setResult({ correct: json.correct, points: json.points_awarded });
        if (json.correct) sfx.correct();
        else sfx.wrong();
      } else {
        const text = await res.text();
        setResult({ correct: false, points: 0 });
        console.error("answer failed", text);
        sfx.wrong();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const payload = question.payload as {
    prompt?: string | null;
    fen?: string | null;
    choices?: string[] | null;
    solution?: string[] | null;
  };

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold uppercase tracking-wider text-buckeye-scarlet">
          Question {question.idx + 1} of {totalQuestions}
        </span>
        <span className="font-mono">
          {(remaining / 1000).toFixed(1)}s
        </span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full bg-buckeye-scarlet transition-[width] duration-200"
          style={{
            width: `${Math.max(0, Math.min(100, (remaining / (question.time_limit_seconds * 1000)) * 100))}%`,
          }}
        />
      </div>

      <h2 className="mt-3 font-display text-xl font-semibold">
        {payload.prompt ?? "Find the best move"}
      </h2>

      {result ? (
        <ResultBanner correct={result.correct} points={result.points} />
      ) : (
        <p className="mt-1 text-sm text-buckeye-gray">
          Up to {previewScore} points if you answer now
        </p>
      )}

      <div className="mt-4">
        {question.type === "multiple-choice" ? (
          <MultipleChoice
            choices={payload.choices ?? []}
            disabled={!!result || submitting || remaining <= 0}
            onChoose={(choice) =>
              submit({ choice, wrong_attempts: 0 }, elapsedMs)
            }
          />
        ) : question.type === "best-move" ? (
          <QuizChessPuzzle
            fen={payload.fen ?? "start"}
            solution={payload.solution ?? []}
            disabled={!!result || submitting || remaining <= 0}
            wrongAttemptsRef={wrongAttemptsRef}
            onAnswer={(detail) =>
              submit(
                {
                  student_moves: detail.studentMoves,
                  san: detail.studentMoves[0],
                  wrong_attempts: detail.wrongAttempts,
                },
                elapsedMs,
              )
            }
          />
        ) : (
          <BestSequence
            fen={payload.fen ?? "start"}
            expectedLength={(payload.solution ?? []).length}
            disabled={!!result || submitting || remaining <= 0}
            wrongAttemptsRef={wrongAttemptsRef}
            onAnswer={(moves) =>
              submit(
                { moves, wrong_attempts: wrongAttemptsRef.current },
                elapsedMs,
              )
            }
          />
        )}
      </div>
    </div>
  );
}

function ResultBanner({ correct, points }: { correct: boolean; points: number }) {
  return (
    <p
      className={
        "mt-2 rounded-md px-3 py-2 text-sm font-semibold " +
        (correct
          ? "bg-green-50 text-green-800"
          : "bg-red-50 text-red-700")
      }
    >
      {correct ? `Correct! +${points} pts` : "Not this time — keep going!"}
    </p>
  );
}

function MultipleChoice({
  choices,
  disabled,
  onChoose,
}: {
  choices: string[];
  disabled: boolean;
  onChoose: (idx: number) => void;
}) {
  const colors = [
    "bg-red-100 hover:bg-red-200 text-red-900",
    "bg-blue-100 hover:bg-blue-200 text-blue-900",
    "bg-yellow-100 hover:bg-yellow-200 text-yellow-900",
    "bg-green-100 hover:bg-green-200 text-green-900",
  ];
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {choices.map((c, idx) => (
        <li key={idx}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChoose(idx)}
            className={`focus-ring w-full rounded-lg px-4 py-4 text-left text-base font-medium transition disabled:opacity-50 ${colors[idx % colors.length]}`}
          >
            {String.fromCharCode(65 + idx)}. {c}
          </button>
        </li>
      ))}
    </ul>
  );
}

function QuizChessPuzzle({
  fen,
  solution,
  disabled,
  wrongAttemptsRef,
  onAnswer,
}: {
  fen: string;
  solution: string[];
  disabled: boolean;
  wrongAttemptsRef: React.MutableRefObject<number>;
  onAnswer: (detail: PuzzleSolvedDetail) => void;
}) {
  if (solution.length === 0) {
    return (
      <p className="text-sm text-red-600">This question has no solution configured.</p>
    );
  }

  return (
    <Puzzle
      key={`${fen}-${solution.join(",")}`}
      boardId="quiz-play"
      fen={fen}
      solution={solution}
      allowReveal={false}
      disabled={disabled}
      onWrongAttemptsChange={(count) => {
        wrongAttemptsRef.current = count;
      }}
      onSolved={onAnswer}
    />
  );
}

function BestSequence({
  fen,
  expectedLength,
  disabled,
  wrongAttemptsRef,
  onAnswer,
}: {
  fen: string;
  expectedLength: number;
  disabled: boolean;
  wrongAttemptsRef: React.MutableRefObject<number>;
  onAnswer: (moves: string[]) => void;
}) {
  const game = useRef(loadChess(fen));
  const [position, setPosition] = useState(fen);
  const [moves, setMoves] = useState<string[]>([]);

  function onMove(from: Square, to: Square, piece: string): boolean {
    if (disabled) return false;
    const promotion =
      piece[1] === "P" && (to[1] === "8" || to[1] === "1") ? "q" : undefined;
    try {
      const m = game.current.move({ from, to, promotion });
      const nextMoves = [...moves, m.san];
      setMoves(nextMoves);
      setPosition(game.current.fen());
      if (nextMoves.length >= expectedLength) {
        onAnswer(nextMoves);
      }
      return true;
    } catch {
      wrongAttemptsRef.current += 1;
      return false;
    }
  }

  return (
    <div>
      <ChessBoard
        fen={position}
        interactive={!disabled}
        showLegalMoves
        onMove={onMove}
        maxWidth={420}
      />
      <p className="mt-2 text-center text-xs text-buckeye-gray">
        Move {moves.length} of {expectedLength}: {moves.join(" ") || "—"}
      </p>
    </div>
  );
}
