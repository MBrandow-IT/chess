import { NextResponse, type NextRequest } from "next/server";
import { ContactSubmissionSchema } from "@/lib/contact/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

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

const RATE_LIMIT_MS = 5 * 60 * 1000;

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ContactSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { category, name, email, message, pageUrl, company } = parsed.data;

  if (company?.trim()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createSupabaseAdminClient();
  const since = new Date(Date.now() - RATE_LIMIT_MS).toISOString();
  const normalizedEmail = email.toLowerCase();

  const { data: recent, error: rateError } = await admin
    .from("contact_submissions")
    .select("id")
    .ilike("email", normalizedEmail)
    .gte("created_at", since)
    .limit(1);

  if (rateError) {
    throw postgrestError("contact rate check", rateError);
  }
  if (recent && recent.length > 0) {
    return NextResponse.json(
      { error: "Please wait a few minutes before sending another message." },
      { status: 429 },
    );
  }

  const { error } = await admin.from("contact_submissions").insert({
    category,
    name,
    email: normalizedEmail,
    message,
    page_url: pageUrl ?? null,
  });

  if (error) {
    throw postgrestError("contact insert", error);
  }

  return NextResponse.json({ ok: true });
}
