"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Chess, type Square } from "chess.js";
import { ChessBoard } from "./ChessBoard";
import { loadChess } from "@/lib/chess/moves";
import { sfx } from "@/lib/sound";

export type PuzzleSolvedDetail = {
  wrongAttempts: number;
  studentMoves: string[];
};

export type PuzzleProps = {
  /** Starting position. */
  fen: string;
  /** Solution as SAN moves (e.g. ["Nxe5", "Qh5", "Qxh7#"]). May be a single move or a multi-move line; even-indexed moves are the student's. */
  solution: string[];
  /** Whose move it is in the puzzle (defaults to whoever the FEN says it is). */
  /** Optional hint text. */
  hint?: string;
  /** Optional title. */
  title?: string;
  /** If true, after a wrong move the answer can be revealed; defaults to true. */
  allowReveal?: boolean;
  /** Whether to auto-flip the board for the side-to-move. */
  autoFlip?: boolean;
  /** Called once when the puzzle is solved. */
  onSolved?: (detail: PuzzleSolvedDetail) => void;
  /** Unique id when multiple boards share one ChessboardDnDProvider. */
  boardId?: string;
  /** When true, the board ignores input (e.g. after quiz answer submitted). */
  disabled?: boolean;
  /** Fired when wrong-attempt count changes (live quiz scoring preview). */
  onWrongAttemptsChange?: (count: number) => void;
};

type Status = "idle" | "wrong" | "almost" | "solved";

export function Puzzle({
  fen,
  solution,
  hint,
  title,
  allowReveal = true,
  autoFlip = true,
  onSolved,
  boardId,
  disabled = false,
  onWrongAttemptsChange,
}: PuzzleProps) {
  const startFen = fen;
  const [position, setPosition] = useState(startFen);
  const [stepIdx, setStepIdx] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null,
  );
  const [revealed, setRevealed] = useState(false);
  const studentMovesRef = useRef<string[]>([]);
  const gameRef = useRef<Chess>(loadChess(startFen));
  const onSolvedRef = useRef(onSolved);
  onSolvedRef.current = onSolved;

  const sideToMove = useMemo(() => {
    try {
      return loadChess(startFen).turn();
    } catch {
      return "w" as const;
    }
  }, [startFen]);

  const flipped = autoFlip && sideToMove === "b";

  useEffect(() => {
    if (status === "solved") {
      onSolvedRef.current?.({
        wrongAttempts,
        studentMoves: [...studentMovesRef.current],
      });
    }
  }, [status, wrongAttempts]);

  function reset() {
    gameRef.current = loadChess(startFen);
    setPosition(startFen);
    setStepIdx(0);
    setStatus("idle");
    setWrongAttempts(0);
    studentMovesRef.current = [];
    setShowHint(false);
    setLastMove(null);
    setRevealed(false);
  }

  useEffect(() => {
    onWrongAttemptsChange?.(wrongAttempts);
  }, [wrongAttempts, onWrongAttemptsChange]);

  function tryMove(from: Square, to: Square, piece: string): boolean {
    if (disabled || status === "solved" || revealed) return false;

    const promotion = piece[1] === "P" && (to[1] === "8" || to[1] === "1")
      ? "q"
      : undefined;

    const expected = solution[stepIdx];
    if (!expected) return false;

    const probe = loadChess(gameRef.current.fen());
    let attempted;
    try {
      attempted = probe.move({ from, to, promotion });
    } catch {
      attempted = null;
    }
    if (!attempted) {
      setStatus("wrong");
      setWrongAttempts((n) => n + 1);
      sfx.wrong();
      return false;
    }

    if (attempted.san !== expected) {
      setStatus("wrong");
      setWrongAttempts((n) => n + 1);
      sfx.wrong();
      return false;
    }

    gameRef.current.move({ from, to, promotion });
    if (stepIdx % 2 === 0) {
      studentMovesRef.current.push(attempted.san);
    }
    setPosition(gameRef.current.fen());
    setLastMove({ from, to });
    if (attempted.captured) sfx.capture();
    else sfx.move();

    const nextIdx = stepIdx + 1;
    if (nextIdx >= solution.length) {
      setStatus("solved");
      setStepIdx(nextIdx);
      sfx.correct();
      return true;
    }

    setStatus("almost");

    setTimeout(() => {
      const nextMove = solution[nextIdx];
      if (!nextMove) return;
      try {
        const replyMove = gameRef.current.move(nextMove);
        setPosition(gameRef.current.fen());
        setLastMove({ from: replyMove.from, to: replyMove.to });
        const afterReplyIdx = nextIdx + 1;
        setStepIdx(afterReplyIdx);
        if (afterReplyIdx >= solution.length) setStatus("solved");
        else setStatus("idle");
      } catch {
        setStepIdx(nextIdx);
        setStatus("idle");
      }
    }, 450);

    setStepIdx(nextIdx);
    return true;
  }

  function reveal() {
    const probe = loadChess(startFen);
    for (const san of solution) probe.move(san);
    gameRef.current = probe;
    setPosition(probe.fen());
    setStepIdx(solution.length);
    setRevealed(true);
    setStatus("solved");
  }

  return (
    <div className="my-6 rounded-xl border border-black/5 bg-white p-4 shadow-card sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          {title ? (
            <h4 className="font-display text-lg font-semibold">{title}</h4>
          ) : null}
          <p className="text-sm text-buckeye-gray">
            {sideToMove === "w" ? "White to move" : "Black to move"}
          </p>
        </div>
        <StatusBadge status={status} revealed={revealed} />
      </div>

      <ChessBoard
        boardId={boardId}
        fen={position}
        interactive={!disabled && status !== "solved" && !revealed}
        showLegalMoves
        flipped={flipped}
        lastMove={lastMove}
        onMove={tryMove}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="focus-ring rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm font-medium hover:bg-black/5"
        >
          Reset
        </button>
        {hint ? (
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className="focus-ring rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm font-medium hover:bg-black/5"
          >
            {showHint ? "Hide hint" : "Show hint"}
          </button>
        ) : null}
        {allowReveal ? (
          <button
            type="button"
            onClick={reveal}
            className="focus-ring rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-buckeye-scarlet hover:bg-black/5"
          >
            Show solution
          </button>
        ) : null}
        {wrongAttempts > 0 && status !== "solved" ? (
          <span className="text-xs text-buckeye-gray">
            {wrongAttempts} wrong {wrongAttempts === 1 ? "try" : "tries"}
          </span>
        ) : null}
      </div>

      {showHint && hint ? (
        <p className="mt-3 rounded-md bg-buckeye-cream/60 px-3 py-2 text-sm text-buckeye-ink">
          <span className="font-semibold">Hint:</span> {hint}
        </p>
      ) : null}
    </div>
  );
}

function StatusBadge({
  status,
  revealed,
}: {
  status: Status;
  revealed: boolean;
}) {
  if (revealed) {
    return (
      <span className="rounded-full bg-buckeye-gray/15 px-3 py-1 text-xs font-medium text-buckeye-gray">
        Revealed
      </span>
    );
  }
  const map: Record<Status, { label: string; className: string }> = {
    idle: {
      label: "Your move",
      className: "bg-black/5 text-buckeye-ink",
    },
    wrong: {
      label: "Try again",
      className: "bg-red-100 text-red-700",
    },
    almost: {
      label: "Good move!",
      className: "bg-amber-100 text-amber-800",
    },
    solved: {
      label: "Solved!",
      className: "bg-green-100 text-green-700",
    },
  };
  const { label, className } = map[status];
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
