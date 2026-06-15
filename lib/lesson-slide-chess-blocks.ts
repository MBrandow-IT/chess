import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { resolveLessonId } from "@/lib/lesson-puzzles";
import type { LessonSlideChessBlockRow } from "@/lib/supabase/types";
import type { SlideChessPayload } from "@/lib/slide-chess/types";

export { resolveLessonId };

function mapRow(row: LessonSlideChessBlockRow): LessonSlideChessBlockRow {
  return {
    ...row,
    payload: row.payload as SlideChessPayload,
  };
}

export async function fetchLessonSlideChessBlocks(
  planSlug: string,
  lessonSlug: string,
  options?: { includeUnpublished?: boolean },
): Promise<LessonSlideChessBlockRow[]> {
  const lessonId = await resolveLessonId(planSlug, lessonSlug);
  if (!lessonId) return [];

  const sb = createSupabaseAdminClient();
  let query = sb
    .from("lesson_slide_chess_blocks")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("order_idx", { ascending: true });

  if (!options?.includeUnpublished) {
    query = query.eq("published", true);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => mapRow(row as LessonSlideChessBlockRow));
}

export async function fetchLessonSlideChessBlocksForAdmin(
  planSlug: string,
  lessonSlug: string,
): Promise<LessonSlideChessBlockRow[]> {
  return fetchLessonSlideChessBlocks(planSlug, lessonSlug, {
    includeUnpublished: true,
  });
}

export async function fetchLessonSlideChessBlockById(
  id: string,
): Promise<LessonSlideChessBlockRow | null> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("lesson_slide_chess_blocks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data as LessonSlideChessBlockRow);
}
