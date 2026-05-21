"use client";

import { useEffect, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { Puzzle } from "@/components/chess/Puzzle";
import { loadChess } from "@/lib/chess/moves";
import {
  nextSolutionMoveLabel,
  solutionMoveLabel,
} from "@/lib/chess/board-editor";

export type SolutionRecorderProps = {
  startFen: string;
  solution: string[];
  onChange: (solution: string[]) => void;
};

export function SolutionRecorder({
  startFen,
  solution,
  onChange,
}: SolutionRecorderProps) {
  const gameRef = useRef<Chess>(loadChess(startFen));
  const [position, setPosition] = useState(startFen);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null,
  );

  useEffect(() => {
    replaySolution(solution);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- replay when setup FEN changes; solution captured from that render
  }, [startFen]);

  function replaySolution(moves: string[]) {
    gameRef.current = loadChess(startFen);
    let trail: { from: Square; to: Square } | null = null;
    for (const san of moves) {
      const move = gameRef.current.move(san);
      if (!move) break;
      trail = { from: move.from, to: move.to };
    }
    setPosition(gameRef.current.fen());
    setLastMove(trail);
  }

  function handleMove(from: Square, to: Square, piece: string): boolean {
    const promotion =
      piece[1] === "P" && (to[1] === "8" || to[1] === "1") ? "q" : undefined;

    const probe = loadChess(gameRef.current.fen());
    let move;
    try {
      move = probe.move({ from, to, promotion });
    } catch {
      move = null;
    }
    if (!move) return false;

    gameRef.current.move({ from, to, promotion });
    const nextSolution = [...solution, move.san];
    onChange(nextSolution);
    setPosition(gameRef.current.fen());
    setLastMove({ from, to });
    return true;
  }

  function undoLastMove() {
    if (solution.length === 0) return;
    const trimmed = solution.slice(0, -1);
    onChange(trimmed);
    replaySolution(trimmed);
  }

  function resetLine() {
    onChange([]);
    gameRef.current = loadChess(startFen);
    setPosition(startFen);
    setLastMove(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-semibold">Record solution</h3>
        <p className="mt-1 text-sm text-buckeye-gray">
          Play the full line on the board. Even moves are what the student must
          find; odd moves are opponent replies that auto-play during practice.
        </p>
        <p className="mt-2 text-sm font-medium text-buckeye-scarlet">
          Next: {nextSolutionMoveLabel(solution.length)}
        </p>
      </div>

      <ChessBoard
        boardId="solution-recorder"
        fen={position}
        interactive
        showLegalMoves
        lastMove={lastMove}
        onMove={handleMove}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={undoLastMove}
          disabled={solution.length === 0}
          className="focus-ring rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm font-medium hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Undo last move
        </button>
        <button
          type="button"
          onClick={resetLine}
          disabled={solution.length === 0}
          className="focus-ring rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm font-medium hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset line
        </button>
      </div>

      {solution.length > 0 ? (
        <ol className="space-y-1 rounded-lg border border-black/5 bg-white p-4 text-sm">
          {solution.map((san, index) => (
            <li key={`${index}-${san}`}>
              <span className="font-medium text-buckeye-gray">
                {solutionMoveLabel(index)}:
              </span>{" "}
              {san}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-buckeye-gray">
          No moves recorded yet. Make the first move on the board.
        </p>
      )}

      {solution.length > 0 ? (
        <div>
          <h4 className="mb-3 font-display text-base font-semibold">Preview</h4>
          <Puzzle
            key={`${startFen}-${solution.join(",")}`}
            boardId="puzzle-preview"
            fen={startFen}
            solution={solution}
            allowReveal={false}
            autoFlip={false}
          />
        </div>
      ) : null}
    </div>
  );
}
