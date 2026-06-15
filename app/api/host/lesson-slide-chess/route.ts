import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import {
  validateSlideChessBlockPayload,
  type SlideChessBlockPayload,
} from "@/lib/host/slide-chess-validation";
import { resolveLessonId } from "@/lib/lesson-slide-chess-blocks";

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

  let body: Partial<SlideChessBlockPayload>;
  try {
    body = (await request.json()) as Partial<SlideChessBlockPayload>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validationError = validateSlideChessBlockPayload(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const lessonId = await resolveLessonId(body.planSlug!, body.lessonSlug!);
  if (!lessonId) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("lesson_slide_chess_blocks")
    .insert({
      lesson_id: lessonId,
      slug: body.slug!.trim(),
      type: body.type!,
      slide_label: body.slide_label!.trim(),
      payload: body.payload!,
      order_idx: body.order_idx ?? 0,
      published: body.published ?? true,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A block with this slug already exists for the lesson" },
        { status: 409 },
      );
    }
    throw postgrestError("insert lesson_slide_chess_block", error);
  }

  return NextResponse.json({ block: data }, { status: 201 });
}
