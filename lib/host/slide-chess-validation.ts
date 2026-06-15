import { loadChess } from "@/lib/chess/moves";
import { slugifyTitle } from "@/lib/chess/board-editor";
import type {
  SlideAnalysisBoardPayload,
  SlideChessBlockType,
  SlideDisplayBoardPayload,
  SlidePuzzlePayload,
} from "@/lib/slide-chess/types";

export type SlideChessBlockPayload = {
  planSlug: string;
  lessonSlug: string;
  slug: string;
  type: SlideChessBlockType;
  slide_label: string;
  payload: Record<string, unknown>;
  order_idx?: number;
  published?: boolean;
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SQUARE_RE = /^[a-h][1-8]$/;

function validateSlug(slug: string | undefined): string | null {
  if (!slug?.trim()) return "Slug is required";
  if (!SLUG_RE.test(slug.trim())) {
    return "Slug must be lowercase letters, numbers, and hyphens";
  }
  return null;
}

function validateFen(fen: string | undefined): string | null {
  if (!fen?.trim()) return "FEN is required";
  try {
    loadChess(fen.trim());
  } catch {
    return "Invalid FEN";
  }
  return null;
}

function validatePuzzlePayload(payload: Record<string, unknown>): string | null {
  const fen = payload.fen as string | undefined;
  const fenErr = validateFen(fen);
  if (fenErr) return fenErr;

  const solution = payload.solution;
  if (!Array.isArray(solution) || solution.length === 0) {
    return "At least one solution move is required";
  }
  if (!solution.every((move) => typeof move === "string" && move.trim())) {
    return "Solution moves must be non-empty strings";
  }

  try {
    const game = loadChess(fen!.trim());
    for (const san of solution as string[]) {
      const result = game.move(san);
      if (!result) return `Illegal solution move: ${san}`;
    }
  } catch {
    return "Invalid FEN or solution line";
  }

  return null;
}

function validateDisplayBoardPayload(
  payload: Record<string, unknown>,
): string | null {
  const fenErr = validateFen(payload.fen as string | undefined);
  if (fenErr) return fenErr;

  const highlights = payload.highlights;
  if (highlights !== undefined) {
    if (!Array.isArray(highlights)) return "highlights must be an array";
    for (const sq of highlights) {
      if (typeof sq !== "string" || !SQUARE_RE.test(sq)) {
        return `Invalid highlight square: ${String(sq)}`;
      }
    }
  }

  const selectedSquare = payload.selectedSquare;
  if (
    selectedSquare !== undefined &&
    selectedSquare !== null &&
    selectedSquare !== "" &&
    (typeof selectedSquare !== "string" || !SQUARE_RE.test(selectedSquare))
  ) {
    return "selectedSquare must be a valid square like e4";
  }

  const lastMove = payload.lastMove;
  if (lastMove !== undefined && lastMove !== null) {
    if (typeof lastMove !== "object") return "lastMove must be an object";
    const { from, to } = lastMove as { from?: string; to?: string };
    if (!from || !to || !SQUARE_RE.test(from) || !SQUARE_RE.test(to)) {
      return "lastMove requires valid from and to squares";
    }
  }

  return null;
}

function validateAnalysisBoardPayload(
  payload: Record<string, unknown>,
): string | null {
  return validateFen(payload.fen as string | undefined);
}

export function validateSlideChessBlockPayload(
  body: Partial<SlideChessBlockPayload>,
): string | null {
  if (!body.planSlug?.trim()) return "planSlug is required";
  if (!body.lessonSlug?.trim()) return "lessonSlug is required";

  const slugErr = validateSlug(body.slug);
  if (slugErr) return slugErr;

  if (!body.type) return "type is required";
  if (
    body.type !== "puzzle" &&
    body.type !== "display-board" &&
    body.type !== "analysis-board"
  ) {
    return "Invalid block type";
  }

  if (body.slide_label === undefined || body.slide_label === null) {
    return "slide_label is required";
  }

  if (!body.payload || typeof body.payload !== "object") {
    return "payload is required";
  }

  switch (body.type) {
    case "puzzle":
      return validatePuzzlePayload(body.payload);
    case "display-board":
      return validateDisplayBoardPayload(body.payload);
    case "analysis-board":
      return validateAnalysisBoardPayload(body.payload);
    default:
      return "Invalid block type";
  }
}

export function defaultSlugFromSlideLabel(label: string): string {
  const base = slugifyTitle(label);
  return base || "slide-chess";
}

export function buildSlidePuzzlePayload(input: {
  fen: string;
  solution: string[];
  hint?: string;
  title?: string;
  allowReveal?: boolean;
}): SlidePuzzlePayload {
  return {
    fen: input.fen.trim(),
    solution: input.solution,
    hint: input.hint?.trim() || undefined,
    title: input.title?.trim() || undefined,
    allowReveal: input.allowReveal,
  };
}

export function buildSlideDisplayBoardPayload(input: {
  fen: string;
  highlights?: string[];
  selectedSquare?: string;
  flipped?: boolean;
  lastMove?: { from: string; to: string } | null;
  interactive?: boolean;
}): SlideDisplayBoardPayload {
  return {
    fen: input.fen.trim(),
    highlights: input.highlights?.length ? input.highlights : undefined,
    selectedSquare: input.selectedSquare?.trim() || undefined,
    flipped: input.flipped || undefined,
    lastMove: input.lastMove ?? undefined,
    interactive: input.interactive || undefined,
  };
}

export function buildSlideAnalysisBoardPayload(input: {
  fen: string;
  flipped?: boolean;
}): SlideAnalysisBoardPayload {
  return {
    fen: input.fen.trim(),
    flipped: input.flipped || undefined,
  };
}
