import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { validateLessonPuzzlePayload } from "@/lib/host/lesson-puzzle-validation";

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

type PatchBody = {
  slug?: string;
  title?: string;
  fen?: string;
  solution?: string[];
  hint?: string | null;
  themes?: string[];
  difficulty?: string | null;
  order_idx?: number;
  published?: boolean;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const admin = createSupabaseAdminClient();
  const { data: existing, error: fetchErr } = await admin
    .from("lesson_puzzles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) throw postgrestError("fetch lesson_puzzle", fetchErr);
  if (!existing) {
    return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
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
    title: body.title ?? existing.title,
    fen: body.fen ?? existing.fen,
    solution: (body.solution ?? existing.solution) as string[],
    hint: body.hint !== undefined ? body.hint : existing.hint,
    themes: body.themes ?? existing.themes,
    difficulty:
      body.difficulty !== undefined ? body.difficulty : existing.difficulty,
    order_idx: body.order_idx ?? existing.order_idx,
    published: body.published ?? existing.published,
  };

  const validationError = validateLessonPuzzlePayload(merged);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { data, error } = await admin
    .from("lesson_puzzles")
    .update({
      slug: merged.slug.trim(),
      title: merged.title.trim(),
      fen: merged.fen.trim(),
      solution: merged.solution,
      hint: merged.hint?.trim() || null,
      themes: merged.themes,
      difficulty: merged.difficulty?.trim() || null,
      order_idx: merged.order_idx,
      published: merged.published,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A puzzle with this slug already exists for the lesson" },
        { status: 409 },
      );
    }
    throw postgrestError("update lesson_puzzle", error);
  }

  return NextResponse.json({ puzzle: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("lesson_puzzles").delete().eq("id", id);

  if (error) throw postgrestError("delete lesson_puzzle", error);

  return NextResponse.json({ ok: true });
}
