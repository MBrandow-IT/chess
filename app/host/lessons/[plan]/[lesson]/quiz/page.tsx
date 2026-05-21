import Link from "next/link";
import { notFound } from "next/navigation";
import { getLessonFile, getPlan } from "@/lib/content";
import { fetchLessonQuizQuestionsForAdmin } from "@/lib/lesson-quiz-questions";
import { DeleteQuizQuestionButton } from "@/components/host/DeleteQuizQuestionButton";

function typeLabel(type: string): string {
  if (type === "multiple-choice") return "Multiple choice";
  if (type === "best-move") return "Chess puzzle";
  return type;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ plan: string; lesson: string }>;
}) {
  const { plan, lesson } = await params;
  const file = await getLessonFile(plan, lesson);
  return {
    title: file?.meta.title
      ? `Live quiz — ${file.meta.title}`
      : "Live quiz questions",
  };
}

export default async function HostLessonQuizPage({
  params,
}: {
  params: Promise<{ plan: string; lesson: string }>;
}) {
  const { plan: planSlug, lesson: lessonSlug } = await params;
  const plan = await getPlan(planSlug);
  if (!plan) notFound();

  const file = await getLessonFile(planSlug, lessonSlug);
  if (!file) notFound();

  const questions = await fetchLessonQuizQuestionsForAdmin(planSlug, lessonSlug);

  return (
    <div>
      <nav className="mb-4 text-sm text-buckeye-gray">
        <Link href="/host" className="hover:underline">
          Host dashboard
        </Link>
        <span aria-hidden> / </span>
        <span>{plan.title}</span>
        <span aria-hidden> / </span>
        <span>{file.meta.title}</span>
      </nav>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Live quiz questions</h1>
          <p className="mt-1 text-sm text-buckeye-gray">
            {file.meta.title} · snapshotted when you start a quiz
          </p>
        </div>
        <Link
          href={`/host/lessons/${planSlug}/${lessonSlug}/quiz/new`}
          className="focus-ring rounded-md bg-buckeye-scarlet px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          New question
        </Link>
      </header>

      {questions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/10 bg-white/60 p-6 text-sm text-buckeye-gray">
          No quiz questions yet. Add multiple-choice or chess puzzle questions
          before starting a live quiz.
        </p>
      ) : (
        <ul className="space-y-3">
          {questions.map((question) => (
            <li
              key={question.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/5 bg-white p-4 shadow-card"
            >
              <div>
                <p className="font-display text-sm font-semibold">
                  {question.prompt}
                </p>
                <p className="mt-0.5 font-mono text-xs text-buckeye-gray">
                  {question.slug} · {typeLabel(question.type)} ·{" "}
                  {question.time_limit_seconds}s · {question.base_points} pts
                  {question.published ? "" : " · draft"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/host/lessons/${planSlug}/${lessonSlug}/quiz/${question.id}`}
                  className="focus-ring rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-medium hover:bg-black/5"
                >
                  Edit
                </Link>
                <DeleteQuizQuestionButton
                  questionId={question.id}
                  label={question.prompt}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <Link
          href={`/host/quizzes/new?plan=${planSlug}&lesson=${lessonSlug}`}
          className="text-sm text-buckeye-gray hover:underline"
        >
          Start a live quiz for this lesson →
        </Link>
      </div>
    </div>
  );
}
