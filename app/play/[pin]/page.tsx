import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { PlayerQuiz } from "@/components/play/PlayerQuiz";
import type { QuizQuestionRow, QuizRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function PlayQuizPage({
  params,
}: {
  params: Promise<{ pin: string }>;
}) {
  const { pin } = await params;
  const admin = createSupabaseAdminClient();
  const { data: quiz } = await admin
    .from("quizzes")
    .select("*")
    .eq("pin", pin)
    .neq("status", "ended")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!quiz) {
    return (
      <div className="container-page py-12 text-center">
        <h1 className="font-display text-2xl font-semibold">
          No live quiz with PIN {pin}
        </h1>
        <p className="mt-2 text-buckeye-gray">
          Double-check the PIN with your instructor, or{" "}
          <a className="text-buckeye-scarlet underline" href="/play">
            try again
          </a>
          .
        </p>
      </div>
    );
  }

  const { data: questions } = await admin
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", quiz.id)
    .order("idx");

  return (
    <div className="container-page py-6">
      <PlayerQuiz
        initialQuiz={quiz as QuizRow}
        initialQuestions={(questions ?? []) as QuizQuestionRow[]}
      />
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pin: string }>;
}) {
  const { pin } = await params;
  return { title: `Join quiz ${pin}` };
}
