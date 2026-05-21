import Link from "next/link";
import { notFound } from "next/navigation";
import { getLessonFile, getPlan } from "@/lib/content";
import {
  fetchLessonQuizQuestionById,
  resolveLessonId,
} from "@/lib/lesson-quiz-questions";
import { QuizQuestionEditorForm } from "@/components/host/QuizQuestionEditorForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ plan: string; lesson: string; id: string }>;
}) {
  const { plan, lesson, id } = await params;
  const file = await getLessonFile(plan, lesson);
  const question = await fetchLessonQuizQuestionById(id);
  return {
    title:
      question?.prompt && file?.meta.title
        ? `Edit question — ${file.meta.title}`
        : "Edit quiz question",
  };
}

export default async function EditHostQuizQuestionPage({
  params,
}: {
  params: Promise<{ plan: string; lesson: string; id: string }>;
}) {
  const { plan: planSlug, lesson: lessonSlug, id } = await params;
  const plan = await getPlan(planSlug);
  if (!plan) notFound();

  const file = await getLessonFile(planSlug, lessonSlug);
  if (!file) notFound();

  const question = await fetchLessonQuizQuestionById(id);
  if (!question) notFound();

  const lessonId = await resolveLessonId(planSlug, lessonSlug);
  if (!lessonId || question.lesson_id !== lessonId) notFound();

  return (
    <div>
      <nav className="mb-4 text-sm text-buckeye-gray">
        <Link href="/host" className="hover:underline">
          Host dashboard
        </Link>
        <span aria-hidden> / </span>
        <Link
          href={`/host/lessons/${planSlug}/${lessonSlug}/quiz`}
          className="hover:underline"
        >
          {file.meta.title} quiz
        </Link>
      </nav>

      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Edit quiz question</h1>
      </header>

      <QuizQuestionEditorForm
        planSlug={planSlug}
        lessonSlug={lessonSlug}
        lessonTitle={file.meta.title}
        initial={question}
      />
    </div>
  );
}
