import { NextResponse, type NextRequest } from "next/server";
import { PatchEventSchema } from "@/lib/host/event-validation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { postgrestError } from "@/lib/supabase/errors";
import type { EventRow } from "@/lib/supabase/types";

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

  const parsed = PatchEventSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const patch: Partial<EventRow> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) patch.title = body.title;
  if (body.description !== undefined) patch.description = body.description;
  if (body.location !== undefined) patch.location = body.location;
  if (body.featured !== undefined) patch.featured = body.featured;
  if (body.signupUrl !== undefined) patch.signup_url = body.signupUrl;
  if (body.startsAt !== undefined) patch.starts_at = body.startsAt;
  if (body.endsAt !== undefined) patch.ends_at = body.endsAt;
  if (body.status !== undefined) patch.status = body.status;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("events")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw postgrestError("update event", error);
  return NextResponse.json({ event: data });
}
