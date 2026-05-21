import "server-only";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import type { QuestionType } from "@/lib/supabase/types";
import { generatePin } from "./pin";

export type StartQuizParams = {
  planSlug: string;
  lessonSlug: string;
};

export type StartedQuiz = {
  id: string;
  pin: string;
};

function postgrestError(stage: string, e: unknown): Error {
  const obj = (e ?? {}) as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };
  const parts = [
    `[${stage}]`,
    obj.message ?? "unknown supabase error",
    obj.code ? `(code: ${obj.code})` : "",
    obj.hint ? `— hint: ${obj.hint}` : "",
  ].filter(Boolean);
  const err = new Error(parts.join(" "));
  console.error("[startQuizFromLesson]", stage, e);
  return err;
}

/**
 * Loads published lesson quiz questions from Supabase, creates a new `quizzes`
 * row owned by the current admin, and snapshots the questions into
 * `quiz_questions`. Returns the new quiz id + PIN.
 */
export async function startQuizFromLesson({
  planSlug,
  lessonSlug,
}: StartQuizParams): Promise<StartedQuiz> {
  const userClient = await createSupabaseServerClient();
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not signed in");
  const role =
    (userData.user.app_metadata as { role?: string } | null)?.role ?? null;
  if (role !== "admin") throw new Error("Not authorized");
  const hostId = userData.user.id;

  const admin = createSupabaseAdminClient();
  const { data: planRow, error: planLookupErr } = await admin
    .from("lesson_plans")
    .select("id")
    .eq("slug", planSlug)
    .maybeSingle();
  if (planLookupErr) throw postgrestError("lookup lesson_plans", planLookupErr);

  let lessonId: string | null = null;
  let questions: {
    type: QuestionType;
    prompt: string;
    payload: Record<string, unknown>;
    time_limit_seconds: number;
    base_points: number;
  }[] = [];

  if (planRow) {
    const { data: lessonRow, error: lessonLookupErr } = await admin
      .from("lessons")
      .select("id")
      .eq("plan_id", planRow.id)
      .eq("slug", lessonSlug)
      .maybeSingle();
    if (lessonLookupErr) throw postgrestError("lookup lessons", lessonLookupErr);
    lessonId = lessonRow?.id ?? null;

    if (lessonId) {
      const { data: catalog, error: catalogErr } = await admin
        .from("lesson_quiz_questions")
        .select("type, prompt, payload, time_limit_seconds, base_points")
        .eq("lesson_id", lessonId)
        .eq("published", true)
        .order("order_idx", { ascending: true });
      if (catalogErr) {
        throw postgrestError("lookup lesson_quiz_questions", catalogErr);
      }
      questions = catalog ?? [];
    }
  }

  if (questions.length === 0) {
    throw new Error(
      "No quiz questions for this lesson. Add them in the host editor under Edit quiz.",
    );
  }

  let pin = generatePin();
  let quizId: string | null = null;
  let lastInsertError: unknown = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await admin
      .from("quizzes")
      .insert({
        host_id: hostId,
        lesson_id: lessonId,
        pin,
        status: "lobby",
        current_question_idx: -1,
      })
      .select("id, pin")
      .single();
    if (!error && data) {
      quizId = data.id;
      pin = data.pin;
      break;
    }
    lastInsertError = error;
    if (error && !/duplicate key/i.test(error.message)) {
      throw postgrestError("insert quizzes", error);
    }
    pin = generatePin();
  }
  if (!quizId) {
    throw postgrestError(
      "allocate unique PIN",
      lastInsertError ?? { message: "5 collisions in a row — try again." },
    );
  }

  const rows = questions.map((q, idx) => {
    const payload = q.payload as {
      fen?: string | null;
      choices?: string[] | null;
      correctChoice?: number | null;
      solution?: string[] | null;
    };
    return {
      quiz_id: quizId!,
      idx,
      type: q.type,
      payload: {
        prompt: q.prompt ?? null,
        fen: payload.fen ?? null,
        choices: payload.choices ?? null,
        correctChoice: payload.correctChoice ?? null,
        solution: payload.solution ?? null,
      },
      time_limit_seconds: q.time_limit_seconds ?? 30,
      base_points: q.base_points ?? 100,
    };
  });

  const { error: qErr } = await admin.from("quiz_questions").insert(rows);
  if (qErr) {
    await admin.from("quizzes").delete().eq("id", quizId);
    throw postgrestError("insert quiz_questions", qErr);
  }

  return { id: quizId, pin };
}
