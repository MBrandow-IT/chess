import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { HostQuiz } from "@/components/host/HostQuiz";
import type {
  QuizQuestionRow,
  QuizRow,
} from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function HostQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const admin = createSupabaseAdminClient();
  const { data: quiz } = await admin
    .from("quizzes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!quiz) notFound();

  const { data: questions } = await admin
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", id)
    .order("idx");

  const joinUrl =
    (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "") +
    `/play/${quiz.pin}`;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link href="/host" className="text-sm text-buckeye-gray hover:underline">
          ← Back to dashboard
        </Link>
      </div>
      <HostQuiz
        initialQuiz={quiz as QuizRow}
        initialQuestions={(questions ?? []) as QuizQuestionRow[]}
        joinUrl={joinUrl}
      />
    </div>
  );
}
