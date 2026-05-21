import { NextResponse, type NextRequest } from "next/server";
import { OneOffEventSchema } from "@/lib/host/event-validation";
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

  const parsed = OneOffEventSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("events")
    .insert({
      title: body.title,
      description: body.description ?? "",
      location: body.location ?? "",
      kind: body.kind ?? "tournament",
      featured: body.featured ?? false,
      signup_url: body.signupUrl ?? null,
      starts_at: body.startsAt,
      ends_at: body.endsAt,
      status: "scheduled",
    })
    .select("*")
    .single();

  if (error) throw postgrestError("insert event", error);
  return NextResponse.json({ event: data }, { status: 201 });
}
