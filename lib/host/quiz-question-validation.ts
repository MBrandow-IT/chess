import { loadChess } from "@/lib/chess/moves";
import { slugifyTitle } from "@/lib/chess/board-editor";
import type { QuestionType } from "@/lib/supabase/types";

export type LessonQuizQuestionPayload = {
  planSlug: string;
  lessonSlug: string;
  slug: string;
  type: QuestionType;
  prompt: string;
  payload: Record<string, unknown>;
  time_limit_seconds?: number;
  base_points?: number;
  order_idx?: number;
  published?: boolean;
};

export function defaultSlugFromPrompt(prompt: string): string {
  const base = slugifyTitle(prompt);
  return base || "question";
}

export function validateLessonQuizQuestionPayload(
  body: Partial<LessonQuizQuestionPayload>,
): string | null {
  if (!body.planSlug?.trim()) return "planSlug is required";
  if (!body.lessonSlug?.trim()) return "lessonSlug is required";
  if (!body.slug?.trim()) return "Slug is required";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug.trim())) {
    return "Slug must be lowercase letters, numbers, and hyphens";
  }
  if (!body.prompt?.trim()) return "Prompt is required";
  if (
    body.type !== "multiple-choice" &&
    body.type !== "best-move" &&
    body.type !== "best-sequence"
  ) {
    return "Type must be multiple-choice or best-move";
  }
  if (body.type === "best-sequence") {
    return "best-sequence is not supported in the editor";
  }

  const timeLimit = body.time_limit_seconds ?? 30;
  const basePoints = body.base_points ?? 100;
  if (timeLimit < 5 || timeLimit > 300) {
    return "Time limit must be between 5 and 300 seconds";
  }
  if (basePoints < 1 || basePoints > 1000) {
    return "Base points must be between 1 and 1000";
  }

  const payload = body.payload ?? {};

  if (body.type === "multiple-choice") {
    const choices = payload.choices;
    const correctChoice = payload.correctChoice;
    if (!Array.isArray(choices) || choices.length < 2) {
      return "Multiple choice needs at least 2 choices";
    }
    if (
      !choices.every((c) => typeof c === "string" && c.trim().length > 0)
    ) {
      return "Each choice must be non-empty text";
    }
    if (
      typeof correctChoice !== "number" ||
      correctChoice < 0 ||
      correctChoice >= choices.length
    ) {
      return "Pick a valid correct answer";
    }
    return null;
  }

  const fen = payload.fen;
  const solution = payload.solution;
  if (typeof fen !== "string" || !fen.trim()) return "FEN is required";
  if (!Array.isArray(solution) || solution.length === 0) {
    return "At least one solution move is required";
  }
  if (!solution.every((m) => typeof m === "string" && m.trim())) {
    return "Solution moves must be non-empty strings";
  }

  try {
    const game = loadChess(fen.trim());
    for (const san of solution) {
      const move = game.move(san);
      if (!move) return `Illegal solution move: ${san}`;
    }
  } catch {
    return "Invalid FEN or solution line";
  }

  return null;
}

export function buildQuizQuestionPayload(
  type: "multiple-choice" | "best-move",
  data: {
    choices?: string[];
    correctChoice?: number;
    fen?: string;
    solution?: string[];
  },
): Record<string, unknown> {
  if (type === "multiple-choice") {
    return {
      choices: data.choices ?? [],
      correctChoice: data.correctChoice ?? 0,
    };
  }
  return {
    fen: data.fen ?? "",
    solution: data.solution ?? [],
  };
}
