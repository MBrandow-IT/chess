import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import {
  validateSlideChessBlockPayload,
  type SlideChessBlockPayload,
} from "@/lib/host/slide-chess-validation";
import type { SlideChessBlockType } from "@/lib/slide-chess/types";

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
  type?: SlideChessBlockType;
  slide_label?: string;
  payload?: Record<string, unknown>;
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
    .from("lesson_slide_chess_blocks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) throw postgrestError("fetch lesson_slide_chess_block", fetchErr);
  if (!existing) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
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

  const merged: SlideChessBlockPayload = {
    planSlug: planRow.slug,
    lessonSlug: lessonRow.slug,
    slug: body.slug ?? existing.slug,
    type: (body.type ?? existing.type) as SlideChessBlockType,
    slide_label: body.slide_label ?? existing.slide_label,
    payload: (body.payload ?? existing.payload) as Record<string, unknown>,
    order_idx: body.order_idx ?? existing.order_idx,
    published: body.published ?? existing.published,
  };

  const validationError = validateSlideChessBlockPayload(merged);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { data, error } = await admin
    .from("lesson_slide_chess_blocks")
    .update({
      slug: merged.slug.trim(),
      type: merged.type,
      slide_label: merged.slide_label.trim(),
      payload: merged.payload,
      order_idx: merged.order_idx,
      published: merged.published,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A block with this slug already exists for the lesson" },
        { status: 409 },
      );
    }
    throw postgrestError("update lesson_slide_chess_block", error);
  }

  return NextResponse.json({ block: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("lesson_slide_chess_blocks")
    .delete()
    .eq("id", id);

  if (error) throw postgrestError("delete lesson_slide_chess_block", error);

  return NextResponse.json({ ok: true });
}
