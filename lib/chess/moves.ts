import { Chess, type Square } from "chess.js";

/**
 * chess.js's `new Chess(fen)` validates FEN and rejects positions that omit
 * kings (e.g. teaching positions like "just a pawn and a knight"). We pass
 * `skipValidation: true` everywhere we load a user-authored or in-flight FEN
 * so move generation and SAN parsing still work.
 */
export function loadChess(fen: string): Chess {
  return new Chess(fen, { skipValidation: true });
}

export type LegalMoves = {
  /** Empty target squares the selected piece can move to (no capture). */
  targets: Square[];
  /** Squares the selected piece can capture on. */
  captures: Square[];
};

const EMPTY_MOVES: LegalMoves = { targets: [], captures: [] };

/**
 * Compute legal moves originating from a given square in a position. Returns
 * empty arrays if the FEN can't be parsed, the square is empty, or it's the
 * other side's piece. Cheap enough to call on every selection event.
 */
export function legalMovesFromFen(fen: string, from: Square): LegalMoves {
  try {
    const game = loadChess(fen);
    const moves = game.moves({ square: from, verbose: true }) as Array<{
      to: Square;
      captured?: string;
    }>;
    if (moves.length === 0) return EMPTY_MOVES;

    const targets: Square[] = [];
    const captures: Square[] = [];
    for (const m of moves) {
      if (m.captured) captures.push(m.to);
      else targets.push(m.to);
    }
    return { targets, captures };
  } catch {
    return EMPTY_MOVES;
  }
}
