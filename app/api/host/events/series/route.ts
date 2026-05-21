import { NextResponse, type NextRequest } from "next/server";
import { EventSeriesSchema } from "@/lib/host/event-validation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { postgrestError } from "@/lib/supabase/errors";

export async function POST(request: NextRequest) {
  await requireAdmin();

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = EventSeriesSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("event_series")
    .insert({
      title: body.title,
      description: body.description ?? "",
      location: body.location ?? "Buckeye Public Library",
      recurrence_weekdays: body.recurrenceWeekdays,
      start_time: body.startTime,
      end_time: body.endTime,
      active: body.active ?? true,
    })
    .select("*")
    .single();

  if (error) throw postgrestError("insert event_series", error);
  return NextResponse.json({ series: data }, { status: 201 });
}
