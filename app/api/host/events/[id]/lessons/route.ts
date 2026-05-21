import { NextResponse, type NextRequest } from "next/server";
import { EventLessonsSchema } from "@/lib/host/event-validation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { postgrestError } from "@/lib/supabase/errors";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = EventLessonsSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  const { error: deleteErr } = await admin
    .from("event_lessons")
    .delete()
    .eq("event_id", id);
  if (deleteErr) throw postgrestError("clear event_lessons", deleteErr);

  const lessonIds = parsed.data.lessonIds;
  if (lessonIds.length === 0) {
    return NextResponse.json({ ok: true, lessonIds: [] });
  }

  const { error: insertErr } = await admin.from("event_lessons").insert(
    lessonIds.map((lessonId) => ({
      event_id: id,
      lesson_id: lessonId,
    })),
  );
  if (insertErr) throw postgrestError("insert event_lessons", insertErr);

  return NextResponse.json({ ok: true, lessonIds });
}
