import type {
  BoardPosition,
  Piece,
  Square,
} from "react-chessboard/dist/chessboard/types";
import { loadChess } from "@/lib/chess/moves";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"] as const;

export const ALL_SQUARES: Square[] = RANKS.flatMap((rank) =>
  FILES.map((file) => `${file}${rank}` as Square),
);

export type BoardSetup = {
  position: BoardPosition;
  turn: "w" | "b";
};

export function emptyBoardSetup(): BoardSetup {
  return { position: {}, turn: "w" };
}

export function countKings(position: BoardPosition, color: "w" | "b"): number {
  const king = `${color}K` as Piece;
  return Object.values(position).filter((piece) => piece === king).length;
}

export function canPlaceSparePiece(
  position: BoardPosition,
  piece: Piece,
  square: Square,
): boolean {
  if (position[square]) return false;
  if (piece.endsWith("K") && countKings(position, piece[0] as "w" | "b") >= 1) {
    return false;
  }
  return true;
}

export function movePieceOnBoard(
  position: BoardPosition,
  sourceSquare: Square,
  targetSquare: Square,
  piece: Piece,
): BoardPosition | null {
  if (sourceSquare === targetSquare) return null;
  if (position[sourceSquare] !== piece) return null;

  const next: BoardPosition = { ...position };
  delete next[sourceSquare];
  if (next[targetSquare]) delete next[targetSquare];
  next[targetSquare] = piece;
  return next;
}

export function removeSquare(
  position: BoardPosition,
  square: Square,
): BoardPosition {
  const next = { ...position };
  delete next[square];
  return next;
}

export function boardSetupToFen({ position, turn }: BoardSetup): string {
  const game = loadChess("8/8/8/8/8/8/8/8 w - - 0 1");
  game.clear();

  for (const square of ALL_SQUARES) {
    const piece = position[square];
    if (!piece) continue;
    game.put(
      {
        type: piece[1]!.toLowerCase() as "p" | "n" | "b" | "r" | "q" | "k",
        color: piece[0] as "w" | "b",
      },
      square,
    );
  }

  const parts = game.fen().split(" ");
  parts[1] = turn;
  return parts.join(" ");
}

export function fenToBoardSetup(fen: string): BoardSetup {
  const game = loadChess(fen);
  const position: BoardPosition = {};

  for (const square of ALL_SQUARES) {
    const piece = game.get(square);
    if (!piece) continue;
    position[square] =
      `${piece.color}${piece.type.toUpperCase()}` as Piece;
  }

  return { position, turn: game.turn() };
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function solutionMoveLabel(index: number): string {
  if (index % 2 === 0) {
    return `Student move ${index / 2 + 1}`;
  }
  return `Opponent reply ${Math.floor(index / 2) + 1}`;
}

export function nextSolutionMoveLabel(solutionLength: number): string {
  return solutionMoveLabel(solutionLength);
}
