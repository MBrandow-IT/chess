import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { LessonQuizQuestionRow } from "@/lib/supabase/types";
import { resolveLessonId } from "@/lib/lesson-puzzles";

export { resolveLessonId };

export async function fetchLessonQuizQuestions(
  planSlug: string,
  lessonSlug: string,
): Promise<LessonQuizQuestionRow[]> {
  const lessonId = await resolveLessonId(planSlug, lessonSlug);
  if (!lessonId) return [];

  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("lesson_quiz_questions")
    .select("*")
    .eq("lesson_id", lessonId)
    .eq("published", true)
    .order("order_idx", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function fetchLessonQuizQuestionsForAdmin(
  planSlug: string,
  lessonSlug: string,
): Promise<LessonQuizQuestionRow[]> {
  const lessonId = await resolveLessonId(planSlug, lessonSlug);
  if (!lessonId) return [];

  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("lesson_quiz_questions")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("order_idx", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function fetchLessonQuizQuestionById(
  id: string,
): Promise<LessonQuizQuestionRow | null> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("lesson_quiz_questions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}
