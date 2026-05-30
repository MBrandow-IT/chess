import { NextResponse, type NextRequest } from "next/server";
import { buildSeriesInstances } from "@/lib/events/generate-instances";
import { DEFAULT_GENERATE_WEEKS_AHEAD } from "@/lib/events/constants";
import { addDaysYmd, ymdInPhoenixFromIso } from "@/lib/events/format";
import { GenerateInstancesSchema } from "@/lib/host/event-validation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { postgrestError } from "@/lib/supabase/errors";
import type { EventSeriesRow } from "@/lib/supabase/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  let weeksAhead = DEFAULT_GENERATE_WEEKS_AHEAD;
  try {
    const raw = await request.json();
    const parsed = GenerateInstancesSchema.safeParse(raw);
    if (parsed.success && parsed.data.weeksAhead) {
      weeksAhead = parsed.data.weeksAhead;
    }
  } catch {
    // empty body is fine
  }

  const admin = createSupabaseAdminClient();
  const { data: series, error: seriesErr } = await admin
    .from("event_series")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (seriesErr) throw postgrestError("fetch event_series", seriesErr);
  if (!series) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  const { data: existing } = await admin
    .from("events")
    .select("starts_at")
    .eq("series_id", id);

  const existingStartsAt = new Set(
    (existing ?? []).map((row) => row.starts_at as string),
  );

  let startYmd: string | undefined;
  if (existingStartsAt.size > 0) {
    const latestStartsAt = [...existingStartsAt].sort().at(-1)!;
    startYmd = addDaysYmd(ymdInPhoenixFromIso(latestStartsAt), 1);
  }

  const instances = buildSeriesInstances(
    series as EventSeriesRow,
    weeksAhead,
    existingStartsAt,
    new Date(),
    startYmd,
  );

  if (instances.length === 0) {
    return NextResponse.json({ created: 0, events: [] });
  }

  const { data, error } = await admin
    .from("events")
    .insert(instances)
    .select("*");

  if (error) throw postgrestError("insert generated events", error);
  return NextResponse.json({ created: data?.length ?? 0, events: data });
}
