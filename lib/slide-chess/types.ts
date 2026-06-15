export type SlideChessBlockType =
  | "puzzle"
  | "display-board"
  | "analysis-board";

export type SlidePuzzlePayload = {
  fen: string;
  solution: string[];
  hint?: string;
  title?: string;
  allowReveal?: boolean;
};

export type SlideDisplayBoardPayload = {
  fen: string;
  highlights?: string[];
  selectedSquare?: string;
  flipped?: boolean;
  lastMove?: { from: string; to: string };
  interactive?: boolean;
};

export type SlideAnalysisBoardPayload = {
  fen: string;
  flipped?: boolean;
};

export type SlideChessPayload =
  | SlidePuzzlePayload
  | SlideDisplayBoardPayload
  | SlideAnalysisBoardPayload;
