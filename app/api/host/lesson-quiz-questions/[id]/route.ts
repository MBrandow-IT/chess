import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { validateLessonQuizQuestionPayload } from "@/lib/host/quiz-question-validation";

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

type PatchBody = Partial<{
  slug: string;
  type: "multiple-choice" | "best-move";
  prompt: string;
  payload: Record<string, unknown>;
  time_limit_seconds: number;
  base_points: number;
  order_idx: number;
  published: boolean;
}>;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const admin = createSupabaseAdminClient();
  const { data: existing, error: fetchErr } = await admin
    .from("lesson_quiz_questions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) throw postgrestError("fetch lesson_quiz_question", fetchErr);
  if (!existing) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const { data: lessonRow, error: lessonErr } = await admin
    .from("lessons")
    .select("slug, plan_id")
    .eq("id", existing.lesson_id)
    .maybeSingle();
  if (lessonErr || !lessonRow) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const { data: planRow, error: planErr } = await admin
    .from("lesson_plans")
    .select("slug")
    .eq("id", lessonRow.plan_id)
    .maybeSingle();
  if (planErr || !planRow) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const merged = {
    planSlug: planRow.slug,
    lessonSlug: lessonRow.slug,
    slug: body.slug ?? existing.slug,
    type: body.type ?? existing.type,
    prompt: body.prompt ?? existing.prompt,
    payload: body.payload ?? existing.payload,
    time_limit_seconds: body.time_limit_seconds ?? existing.time_limit_seconds,
    base_points: body.base_points ?? existing.base_points,
    order_idx: body.order_idx ?? existing.order_idx,
    published: body.published ?? existing.published,
  };

  const validationError = validateLessonQuizQuestionPayload(merged);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { data, error } = await admin
    .from("lesson_quiz_questions")
    .update({
      slug: merged.slug.trim(),
      type: merged.type,
      prompt: merged.prompt.trim(),
      payload: merged.payload,
      time_limit_seconds: merged.time_limit_seconds,
      base_points: merged.base_points,
      order_idx: merged.order_idx,
      published: merged.published,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A question with this slug already exists for the lesson" },
        { status: 409 },
      );
    }
    throw postgrestError("update lesson_quiz_question", error);
  }

  return NextResponse.json({ question: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("lesson_quiz_questions")
    .delete()
    .eq("id", id);

  if (error) throw postgrestError("delete lesson_quiz_question", error);

  return NextResponse.json({ ok: true });
}
