import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import {
  validateLessonPuzzlePayload,
  type LessonPuzzlePayload,
} from "@/lib/host/lesson-puzzle-validation";
import { resolveLessonId } from "@/lib/lesson-puzzles";

function postgrestError(stage: string, e: unknown): Error {
  const obj = (e ?? {}) as { message?: string; code?: string; hint?: string };
  const parts = [
    `[${stage}]`,
    obj.message ?? "unknown supabase error",
    obj.code ? `(code: ${obj.code})` : "",
    obj.hint ? `— hint: ${obj.hint}` : "",
  ].filter(Boolean);
  return new Error(parts.join(" "));
}

export async function POST(request: NextRequest) {
  await requireAdmin();

  let body: Partial<LessonPuzzlePayload>;
  try {
    body = (await request.json()) as Partial<LessonPuzzlePayload>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validationError = validateLessonPuzzlePayload(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const lessonId = await resolveLessonId(body.planSlug!, body.lessonSlug!);
  if (!lessonId) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("lesson_puzzles")
    .insert({
      lesson_id: lessonId,
      slug: body.slug!.trim(),
      title: body.title!.trim(),
      fen: body.fen!.trim(),
      solution: body.solution!,
      hint: body.hint?.trim() || null,
      themes: body.themes ?? [],
      difficulty: body.difficulty?.trim() || null,
      order_idx: body.order_idx ?? 0,
      published: body.published ?? true,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A puzzle with this slug already exists for the lesson" },
        { status: 409 },
      );
    }
    throw postgrestError("insert lesson_puzzle", error);
  }

  return NextResponse.json({ puzzle: data }, { status: 201 });
}
