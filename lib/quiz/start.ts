import "server-only";
import { getLessonFile } from "@/lib/content";
import { extractKahootQuestions } from "@/lib/mdx/extract-questions";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { generatePin } from "./pin";

export type StartQuizParams = {
  planSlug: string;
  lessonSlug: string;
};

export type StartedQuiz = {
  id: string;
  pin: string;
};

/**
 * Supabase JS rejects with `PostgrestError` (plain object, NOT an Error
 * subclass), so a bare `throw error` loses its message once it crosses the
 * catch boundary in `app/host/quizzes/new/page.tsx`. Wrap it in a real Error
 * with as much context as we can get.
 */
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
 * Reads the lesson MDX, extracts every <KahootQuestion /> node, creates a new
 * `quizzes` row owned by the current admin, and snapshots the questions into
 * `quiz_questions`. Returns the new quiz id + PIN.
 */
export async function startQuizFromLesson({
  planSlug,
  lessonSlug,
}: StartQuizParams): Promise<StartedQuiz> {
  // 1. authenticate
  const userClient = await createSupabaseServerClient();
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not signed in");
  const role =
    (userData.user.app_metadata as { role?: string } | null)?.role ?? null;
  if (role !== "admin") throw new Error("Not authorized");
  const hostId = userData.user.id;

  // 2. read MDX + extract questions
  const lessonFile = await getLessonFile(planSlug, lessonSlug);
  if (!lessonFile) throw new Error(`Lesson not found: ${planSlug}/${lessonSlug}`);
  const questions = extractKahootQuestions(lessonFile.content);
  if (questions.length === 0) {
    throw new Error(
      "This lesson has no <KahootQuestion /> blocks. Add some before starting a quiz.",
    );
  }

  // 3. resolve lesson_id (may be null if sync-plans hasn't been run; that's okay)
  const admin = createSupabaseAdminClient();
  const { data: planRow, error: planLookupErr } = await admin
    .from("lesson_plans")
    .select("id")
    .eq("slug", planSlug)
    .maybeSingle();
  if (planLookupErr) throw postgrestError("lookup lesson_plans", planLookupErr);
  let lessonId: string | null = null;
  if (planRow) {
    const { data: lessonRow, error: lessonLookupErr } = await admin
      .from("lessons")
      .select("id")
      .eq("plan_id", planRow.id)
      .eq("slug", lessonSlug)
      .maybeSingle();
    if (lessonLookupErr) throw postgrestError("lookup lessons", lessonLookupErr);
    lessonId = lessonRow?.id ?? null;
  }

  // 4. create the quiz with a unique PIN (retry a few times on collision)
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

  // 5. snapshot the questions
  const rows = questions.map((q, idx) => ({
    quiz_id: quizId!,
    idx,
    type: q.type,
    payload: {
      prompt: q.prompt ?? null,
      fen: q.fen ?? null,
      choices: q.choices ?? null,
      correctChoice: q.correctChoice ?? null,
      solution: q.solution ?? null,
    },
    time_limit_seconds: q.timeLimitSeconds ?? 30,
    base_points: q.basePoints ?? 100,
  }));
  const { error: qErr } = await admin.from("quiz_questions").insert(rows);
  if (qErr) {
    // roll back the quiz so we don't leave orphans
    await admin.from("quizzes").delete().eq("id", quizId);
    throw postgrestError("insert quiz_questions", qErr);
  }

  return { id: quizId, pin };
}
