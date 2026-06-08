"use client";

import { useState } from "react";
import { ChessBoard } from "./ChessBoard";
import { loadChess } from "@/lib/chess/moves";
import type { Square } from "react-chessboard/dist/chessboard/types";

export type AnalysisBoardProps = {
  fen?: string;
  flipped?: boolean;
};

/**
 * A freely-draggable board for "analysis" slides. Any legal move is accepted
 * and the position updates in place. Both sides can move (no turn enforcement
 * beyond chess.js legality).
 */
export function AnalysisBoard({
  fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  flipped = false,
}: AnalysisBoardProps) {
  const [position, setPosition] = useState(fen);

  function handleMove(from: Square, to: Square): boolean {
    try {
      const game = loadChess(position);
      const promotion =
        game.get(from)?.type === "p" && (to[1] === "8" || to[1] === "1")
          ? "q"
          : undefined;
      const move = game.move({ from, to, promotion });
      if (!move) return false;
      setPosition(game.fen());
      return true;
    } catch {
      return false;
    }
  }

  function reset() {
    setPosition(fen);
  }

  return (
    <div>
      <ChessBoard
        fen={position}
        interactive={true}
        showLegalMoves={true}
        flipped={flipped}
        onMove={handleMove}
      />
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-black/10 bg-white px-2.5 py-1 text-xs font-medium text-buckeye-gray hover:bg-black/5"
        >
          Reset position
        </button>
      </div>
    </div>
  );
}
