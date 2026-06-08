#!/usr/bin/env tsx
/**
 * scripts/condense-beginners-workshop-to-8-lessons.ts
 *
 * Consolidates beginners-workshop from legacy 16-lesson structures into the
 * current 8-week format while preserving existing lesson-linked data.
 *
 * What it does:
 * 1) Upserts the canonical 8 target lessons (title/summary/order/content path).
 * 2) Migrates lesson_puzzles, lesson_quiz_questions, quizzes.lesson_id, and
 *    event_lessons from merged source lessons to their target lessons.
 * 3) Removes merged source lessons once data has been migrated.
 *
 * Usage:
 *   npm run condense-workshop -- --plan beginners-workshop
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { createClient, type PostgrestError } from "@supabase/supabase-js";
import type { Database, LessonRow } from "@/lib/supabase/types";

loadEnv({ path: path.join(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const planFlagIdx = args.indexOf("--plan");
const planSlug =
  planFlagIdx >= 0 && args[planFlagIdx + 1]
    ? args[planFlagIdx + 1]
    : "beginners-workshop";

const sb = createClient<Database>(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type TargetLesson = {
  folder: string;
  slug: string;
  title: string;
  summary: string;
  order_idx: number;
};

const TARGET_LESSONS: TargetLesson[] = [
  {
    folder: "01-chess-basics",
    slug: "chess-basics",
    title: "Chess Basics: Board, Pieces, Check, and Special Rules",
    summary:
      "Learn the board, how every piece moves, check and checkmate, and castling, en passant, and pawn promotion.",
    order_idx: 1,
  },
  {
    folder: "03-opening-principles-fast-development",
    slug: "opening-principles-fast-development",
    title: "Opening Principles, Development, and Trap Awareness",
    summary:
      "Build a reliable opening process with center control, fast development, king safety, and practical trap prevention.",
    order_idx: 2,
  },
  {
    folder: "05-tactics-forks-and-double-attacks",
    slug: "tactics-forks-and-double-attacks",
    title: "Tactics I: Forks, Pins, Skewers, and Double Attacks",
    summary:
      "Win material by combining forks with line tactics and practical defensive habits.",
    order_idx: 3,
  },
  {
    folder: "07-tactics-removing-defenders-and-overloading",
    slug: "tactics-removing-defenders-and-overloading",
    title: "Tactics II: Remove Defenders, Overload, and Finish the Attack",
    summary:
      "Break defensive structures and convert tactical advantages into checkmate patterns.",
    order_idx: 4,
  },
  {
    folder: "09-endgame-king-and-pawn-fundamentals",
    slug: "endgame-king-and-pawn-fundamentals",
    title: "Endgame I: King and Pawn Fundamentals, Opposition, and Races",
    summary:
      "Build king-and-pawn technique with opposition, triangulation basics, and promotion-race calculation.",
    order_idx: 5,
  },
  {
    folder: "11-endgame-rook-endings-and-conversion",
    slug: "endgame-rook-endings-and-conversion",
    title: "Endgame II: Rook Endings, Piece Activity, and Conversion",
    summary:
      "Improve conversion with active pieces, practical rook-ending technique, and clearer plans.",
    order_idx: 6,
  },
  {
    folder: "13-pawn-structure-and-smart-trades",
    slug: "pawn-structure-and-smart-trades",
    title: "Pawn Structure and Smart Trades",
    summary:
      "Choose smart trades, read pawn structures, and use a practical post-game analysis routine.",
    order_idx: 7,
  },
  {
    folder: "15-time-management-and-tournament-readiness",
    slug: "time-management-and-tournament-readiness",
    title: "Capstone: Time Management, Tournament Readiness, and Mini Tournament",
    summary:
      "Prepare for real play with clock habits, practical routines, and a capstone mini-tournament format.",
    order_idx: 8,
  },
];

/**
 * Legacy/source lesson slugs that should be merged into one of TARGET_LESSONS.
 * Includes an old lesson-2 slug from earlier schema iterations.
 */
const SOURCE_TO_TARGET_SLUG: Record<string, string> = {
  "check-checkmate-and-special-rules": "chess-basics",
  "opening-traps-to-avoid": "opening-principles-fast-development",
  "tactics-pins-skewers-and-discovered-attacks": "tactics-forks-and-double-attacks",
  "basic-mating-patterns": "tactics-removing-defenders-and-overloading",
  "endgame-opposition-and-pawn-races": "endgame-king-and-pawn-fundamentals",
  "piece-activity-and-planning": "endgame-rook-endings-and-conversion",
  "how-to-analyze-your-games": "pawn-structure-and-smart-trades",
  "capstone-review-and-mini-tournament": "time-management-and-tournament-readiness",
};

function postgrestError(stage: string, error: PostgrestError): Error {
  const details = [error.message, error.details, error.hint]
    .filter(Boolean)
    .join(" | ");
  return new Error(`${stage}: ${details || "unknown Postgrest error"}`);
}

function uniqueMergedSlug(
  originalSlug: string,
  sourceLessonSlug: string,
  used: Set<string>,
): string {
  if (!used.has(originalSlug)) {
    used.add(originalSlug);
    return originalSlug;
  }

  const base = `${sourceLessonSlug}-${originalSlug}`;
  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  let i = 2;
  while (used.has(`${base}-${i}`)) i += 1;
  const candidate = `${base}-${i}`;
  used.add(candidate);
  return candidate;
}

async function fetchLessons(planId: string): Promise<LessonRow[]> {
  const { data, error } = await sb
    .from("lessons")
    .select("*")
    .eq("plan_id", planId);
  if (error) throw postgrestError("fetch lessons", error);
  return data ?? [];
}

async function migrateLessonPuzzles(source: LessonRow, target: LessonRow) {
  const { data: sourceRows, error: sourceErr } = await sb
    .from("lesson_puzzles")
    .select("slug, title, fen, solution, hint, themes, difficulty, order_idx, published")
    .eq("lesson_id", source.id)
    .order("order_idx", { ascending: true });
  if (sourceErr) throw postgrestError(`fetch source puzzles (${source.slug})`, sourceErr);
  if (!sourceRows?.length) return 0;

  const { data: targetRows, error: targetErr } = await sb
    .from("lesson_puzzles")
    .select("slug, order_idx")
    .eq("lesson_id", target.id)
    .order("order_idx", { ascending: true });
  if (targetErr) throw postgrestError(`fetch target puzzles (${target.slug})`, targetErr);

  const usedSlugs = new Set((targetRows ?? []).map((row) => row.slug));
  let nextOrder = (targetRows ?? []).reduce(
    (max, row) => Math.max(max, row.order_idx),
    -1,
  ) + 1;

  const inserts = sourceRows.map((row) => ({
    lesson_id: target.id,
    slug: uniqueMergedSlug(row.slug, source.slug, usedSlugs),
    title: row.title,
    fen: row.fen,
    solution: row.solution,
    hint: row.hint,
    themes: row.themes,
    difficulty: row.difficulty,
    order_idx: nextOrder++,
    published: row.published,
  }));

  const { error: insertErr } = await sb.from("lesson_puzzles").insert(inserts);
  if (insertErr) throw postgrestError(`insert migrated puzzles (${source.slug})`, insertErr);

  const { error: deleteErr } = await sb
    .from("lesson_puzzles")
    .delete()
    .eq("lesson_id", source.id);
  if (deleteErr) throw postgrestError(`delete source puzzles (${source.slug})`, deleteErr);

  return inserts.length;
}

async function migrateLessonQuizQuestions(source: LessonRow, target: LessonRow) {
  const { data: sourceRows, error: sourceErr } = await sb
    .from("lesson_quiz_questions")
    .select("slug, type, prompt, payload, time_limit_seconds, base_points, order_idx, published")
    .eq("lesson_id", source.id)
    .order("order_idx", { ascending: true });
  if (sourceErr) {
    throw postgrestError(
      `fetch source lesson quiz questions (${source.slug})`,
      sourceErr,
    );
  }
  if (!sourceRows?.length) return 0;

  const { data: targetRows, error: targetErr } = await sb
    .from("lesson_quiz_questions")
    .select("slug, order_idx")
    .eq("lesson_id", target.id)
    .order("order_idx", { ascending: true });
  if (targetErr) {
    throw postgrestError(
      `fetch target lesson quiz questions (${target.slug})`,
      targetErr,
    );
  }

  const usedSlugs = new Set((targetRows ?? []).map((row) => row.slug));
  let nextOrder = (targetRows ?? []).reduce(
    (max, row) => Math.max(max, row.order_idx),
    -1,
  ) + 1;

  const inserts = sourceRows.map((row) => ({
    lesson_id: target.id,
    slug: uniqueMergedSlug(row.slug, source.slug, usedSlugs),
    type: row.type,
    prompt: row.prompt,
    payload: row.payload,
    time_limit_seconds: row.time_limit_seconds,
    base_points: row.base_points,
    order_idx: nextOrder++,
    published: row.published,
  }));

  const { error: insertErr } = await sb.from("lesson_quiz_questions").insert(inserts);
  if (insertErr) {
    throw postgrestError(
      `insert migrated lesson quiz questions (${source.slug})`,
      insertErr,
    );
  }

  const { error: deleteErr } = await sb
    .from("lesson_quiz_questions")
    .delete()
    .eq("lesson_id", source.id);
  if (deleteErr) {
    throw postgrestError(
      `delete source lesson quiz questions (${source.slug})`,
      deleteErr,
    );
  }

  return inserts.length;
}

async function migrateEventLessons(source: LessonRow, target: LessonRow) {
  const { data: sourceRows, error: sourceErr } = await sb
    .from("event_lessons")
    .select("event_id")
    .eq("lesson_id", source.id);
  if (sourceErr) throw postgrestError(`fetch event_lessons (${source.slug})`, sourceErr);
  if (!sourceRows?.length) return 0;

  const inserts = sourceRows.map((row) => ({
    event_id: row.event_id,
    lesson_id: target.id,
  }));

  const { error: upsertErr } = await sb
    .from("event_lessons")
    .upsert(inserts, { onConflict: "event_id,lesson_id", ignoreDuplicates: true });
  if (upsertErr) throw postgrestError(`upsert event_lessons (${source.slug})`, upsertErr);

  const { error: deleteErr } = await sb
    .from("event_lessons")
    .delete()
    .eq("lesson_id", source.id);
  if (deleteErr) throw postgrestError(`delete source event_lessons (${source.slug})`, deleteErr);

  return inserts.length;
}

async function moveQuizLessonReferences(source: LessonRow, target: LessonRow) {
  const { error } = await sb
    .from("quizzes")
    .update({ lesson_id: target.id })
    .eq("lesson_id", source.id);
  if (error) throw postgrestError(`update quizzes.lesson_id (${source.slug})`, error);
}

async function main() {
  const { data: plan, error: planErr } = await sb
    .from("lesson_plans")
    .select("id")
    .eq("slug", planSlug)
    .maybeSingle();
  if (planErr) throw postgrestError("load plan", planErr);
  if (!plan) {
    throw new Error(
      `No lesson plan found for slug '${planSlug}'. Run npm run sync first.`,
    );
  }

  const { error: planUpdateErr } = await sb
    .from("lesson_plans")
    .update({
      description:
        "An 8-week beginner chess workshop with one focused lesson each week, moving from rules to practical game play.",
    })
    .eq("id", plan.id);
  if (planUpdateErr) throw postgrestError("update plan description", planUpdateErr);

  const upsertLessons = TARGET_LESSONS.map((lesson) => ({
    plan_id: plan.id,
    slug: lesson.slug,
    title: lesson.title,
    summary: lesson.summary,
    order_idx: lesson.order_idx,
    content_path: `content/plans/${planSlug}/${lesson.folder}/lesson.mdx`,
  }));
  const { error: upsertErr } = await sb
    .from("lessons")
    .upsert(upsertLessons, { onConflict: "plan_id,slug" });
  if (upsertErr) throw postgrestError("upsert target lessons", upsertErr);

  let lessons = await fetchLessons(plan.id);
  let lessonBySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]));

  for (const [sourceSlug, targetSlug] of Object.entries(SOURCE_TO_TARGET_SLUG)) {
    const source = lessonBySlug.get(sourceSlug);
    const target = lessonBySlug.get(targetSlug);
    if (!source || !target) continue;
    if (source.id === target.id) continue;

    const movedPuzzles = await migrateLessonPuzzles(source, target);
    const movedQuestions = await migrateLessonQuizQuestions(source, target);
    const movedEventLinks = await migrateEventLessons(source, target);
    await moveQuizLessonReferences(source, target);

    const { error: deleteLessonErr } = await sb
      .from("lessons")
      .delete()
      .eq("id", source.id);
    if (deleteLessonErr) {
      throw postgrestError(`delete merged lesson (${source.slug})`, deleteLessonErr);
    }

    console.log(
      `Merged ${source.slug} -> ${target.slug} (puzzles: ${movedPuzzles}, quiz questions: ${movedQuestions}, event links: ${movedEventLinks})`,
    );

    lessons = await fetchLessons(plan.id);
    lessonBySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]));
  }

  const keepSlugs = new Set(TARGET_LESSONS.map((lesson) => lesson.slug));
  const staleLessons = lessons.filter((lesson) => !keepSlugs.has(lesson.slug));

  if (staleLessons.length > 0) {
    const staleIds = staleLessons.map((lesson) => lesson.id);
    const { error: staleDeleteErr } = await sb
      .from("lessons")
      .delete()
      .in("id", staleIds);
    if (staleDeleteErr) throw postgrestError("delete stale lessons", staleDeleteErr);
    console.log(`Removed ${staleLessons.length} stale lessons.`);
  }

  console.log("Beginners workshop is now condensed to 8 lessons.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
