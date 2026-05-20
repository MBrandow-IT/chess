import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { callRpc } from "@/lib/supabase/rpc";

const Body = z.object({
  player_id: z.string().uuid(),
  session_token: z.string().uuid(),
  question_id: z.string().uuid(),
  payload: z.record(z.unknown()),
  client_elapsed_ms: z.number().int().nonnegative(),
});

export async function POST(
  request: NextRequest,
  _ctx: { params: Promise<{ id: string }> },
) {
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
  const { data, error } = await callRpc(sb, "submit_answer", {
    p_player_id: body.player_id,
    p_session_token: body.session_token,
    p_question_id: body.question_id,
    p_payload: body.payload,
    p_client_elapsed_ms: body.client_elapsed_ms,
  });
  if (error) return new NextResponse(error.message, { status: 400 });
  if (!data || data.length === 0) {
    return new NextResponse("no result returned", { status: 500 });
  }
  return NextResponse.json(data[0]);
}
