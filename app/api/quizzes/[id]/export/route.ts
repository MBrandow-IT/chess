import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const admin = createSupabaseAdminClient();
  const [{ data: players }, { data: questions }, { data: answers }] =
    await Promise.all([
      admin.from("quiz_players").select("*").eq("quiz_id", id),
      admin.from("quiz_questions").select("*").eq("quiz_id", id).order("idx"),
      admin.from("quiz_answers").select("*").eq("quiz_id", id),
    ]);

  const header = [
    "player",
    "question_idx",
    "question_type",
    "correct",
    "wrong_attempts",
    "time_ms",
    "points",
    "total_score",
  ];
  const lines = [header.join(",")];

  for (const p of players ?? []) {
    for (const q of questions ?? []) {
      const a = (answers ?? []).find(
        (x) => x.player_id === p.id && x.question_id === q.id,
      );
      lines.push(
        [
          csvEscape(p.display_name),
          q.idx,
          q.type,
          a ? a.correct : "",
          a ? a.wrong_attempts : "",
          a ? a.time_ms : "",
          a ? a.points_awarded : "",
          p.total_score,
        ].join(","),
      );
    }
  }

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="quiz-${id}.csv"`,
    },
  });
}

function csvEscape(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replaceAll('"', '""') + '"' : s;
}
