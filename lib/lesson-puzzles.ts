import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { LessonPuzzleRow } from "@/lib/supabase/types";

export async function resolveLessonId(
  planSlug: string,
  lessonSlug: string,
): Promise<string | null> {
  const sb = createSupabaseAdminClient();

  const { data: planRow, error: planErr } = await sb
    .from("lesson_plans")
    .select("id")
    .eq("slug", planSlug)
    .maybeSingle();
  if (planErr || !planRow) return null;

  const { data: lessonRow, error: lessonErr } = await sb
    .from("lessons")
    .select("id")
    .eq("plan_id", planRow.id)
    .eq("slug", lessonSlug)
    .maybeSingle();
  if (lessonErr || !lessonRow) return null;

  return lessonRow.id;
}

export async function fetchLessonPuzzles(
  planSlug: string,
  lessonSlug: string,
): Promise<LessonPuzzleRow[]> {
  const sb = createSupabaseAdminClient();

  const { data: planRow, error: planErr } = await sb
    .from("lesson_plans")
    .select("id")
    .eq("slug", planSlug)
    .maybeSingle();
  if (planErr || !planRow) return [];

  const { data: lessonRow, error: lessonErr } = await sb
    .from("lessons")
    .select("id")
    .eq("plan_id", planRow.id)
    .eq("slug", lessonSlug)
    .maybeSingle();
  if (lessonErr || !lessonRow) return [];

  const { data: puzzles, error } = await sb
    .from("lesson_puzzles")
    .select("*")
    .eq("lesson_id", lessonRow.id)
    .eq("published", true)
    .order("order_idx", { ascending: true });

  if (error || !puzzles) return [];

  return puzzles.map((row) => ({
    ...row,
    solution: row.solution as string[],
  }));
}

export async function fetchLessonPuzzlesForAdmin(
  planSlug: string,
  lessonSlug: string,
): Promise<LessonPuzzleRow[]> {
  const lessonId = await resolveLessonId(planSlug, lessonSlug);
  if (!lessonId) return [];

  const sb = createSupabaseAdminClient();
  const { data: puzzles, error } = await sb
    .from("lesson_puzzles")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("order_idx", { ascending: true });

  if (error || !puzzles) return [];

  return puzzles.map((row) => ({
    ...row,
    solution: row.solution as string[],
  }));
}

export async function fetchLessonPuzzleById(
  id: string,
): Promise<LessonPuzzleRow | null> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("lesson_puzzles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    ...data,
    solution: data.solution as string[],
  };
}
