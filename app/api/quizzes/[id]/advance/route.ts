import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { callRpc } from "@/lib/supabase/rpc";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sb = await createSupabaseServerClient();
  const { data, error } = await callRpc(sb, "advance_quiz", { p_quiz_id: id });
  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json(data);
}
