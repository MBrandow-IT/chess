import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { callRpc } from "@/lib/supabase/rpc";

const Body = z.object({
  pin: z.string().regex(/^\d{6}$/),
  displayName: z.string().trim().min(1).max(24),
});

export async function POST(request: NextRequest) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch (err) {
    return new NextResponse(
      err instanceof Error ? err.message : "bad request",
      { status: 400 },
    );
  }

  const sb = createSupabaseAdminClient();
  const { data, error } = await callRpc(sb, "join_quiz", {
    p_pin: body.pin,
    p_display_name: body.displayName,
  });
  if (error) return new NextResponse(error.message, { status: 400 });
  if (!data || data.length === 0) {
    return new NextResponse("no quiz returned", { status: 400 });
  }
  return NextResponse.json(data[0]);
}
