import { NextResponse, type NextRequest } from "next/server";
import { EventSeriesSchema } from "@/lib/host/event-validation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { postgrestError } from "@/lib/supabase/errors";
import type { EventSeriesRow } from "@/lib/supabase/types";

export async function PATCH(
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

  const parsed = EventSeriesSchema.partial().safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const patch: Partial<EventSeriesRow> = {
    updated_at: new Date().toISOString(),
  };
  if (body.title !== undefined) patch.title = body.title;
  if (body.description !== undefined) patch.description = body.description;
  if (body.location !== undefined) patch.location = body.location;
  if (body.recurrenceWeekdays !== undefined) {
    patch.recurrence_weekdays = body.recurrenceWeekdays;
  }
  if (body.startTime !== undefined) patch.start_time = body.startTime;
  if (body.endTime !== undefined) patch.end_time = body.endTime;
  if (body.active !== undefined) patch.active = body.active;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("event_series")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw postgrestError("update event_series", error);
  return NextResponse.json({ series: data });
}
