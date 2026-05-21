import { loadChess } from "@/lib/chess/moves";
import { slugifyTitle } from "@/lib/chess/board-editor";

export type LessonPuzzlePayload = {
  planSlug: string;
  lessonSlug: string;
  slug: string;
  title: string;
  fen: string;
  solution: string[];
  hint?: string | null;
  themes?: string[];
  difficulty?: string | null;
  order_idx?: number;
  published?: boolean;
};

export function parseThemesInput(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function validateLessonPuzzlePayload(
  payload: Partial<LessonPuzzlePayload>,
): string | null {
  if (!payload.planSlug?.trim()) return "planSlug is required";
  if (!payload.lessonSlug?.trim()) return "lessonSlug is required";
  if (!payload.title?.trim()) return "Title is required";
  if (!payload.slug?.trim()) return "Slug is required";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug.trim())) {
    return "Slug must be lowercase letters, numbers, and hyphens";
  }
  if (!payload.fen?.trim()) return "FEN is required";
  if (!Array.isArray(payload.solution) || payload.solution.length === 0) {
    return "At least one solution move is required";
  }
  if (!payload.solution.every((move) => typeof move === "string" && move.trim())) {
    return "Solution moves must be non-empty strings";
  }

  try {
    const game = loadChess(payload.fen.trim());
    for (const san of payload.solution) {
      const result = game.move(san);
      if (!result) return `Illegal solution move: ${san}`;
    }
  } catch {
    return "Invalid FEN or solution line";
  }

  return null;
}

export function defaultSlugFromTitle(title: string): string {
  const base = slugifyTitle(title);
  return base || "puzzle";
}
