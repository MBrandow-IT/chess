import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import {
  validateLessonQuizQuestionPayload,
  type LessonQuizQuestionPayload,
} from "@/lib/host/quiz-question-validation";
import { resolveLessonId } from "@/lib/lesson-quiz-questions";

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

  let body: Partial<LessonQuizQuestionPayload>;
  try {
    body = (await request.json()) as Partial<LessonQuizQuestionPayload>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validationError = validateLessonQuizQuestionPayload(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const lessonId = await resolveLessonId(body.planSlug!, body.lessonSlug!);
  if (!lessonId) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("lesson_quiz_questions")
    .insert({
      lesson_id: lessonId,
      slug: body.slug!.trim(),
      type: body.type!,
      prompt: body.prompt!.trim(),
      payload: body.payload!,
      time_limit_seconds: body.time_limit_seconds ?? 30,
      base_points: body.base_points ?? 100,
      order_idx: body.order_idx ?? 0,
      published: body.published ?? true,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A question with this slug already exists for the lesson" },
        { status: 409 },
      );
    }
    throw postgrestError("insert lesson_quiz_question", error);
  }

  return NextResponse.json({ question: data }, { status: 201 });
}
