import Link from "next/link";
import { notFound } from "next/navigation";
import { getLessonFile, getPlan } from "@/lib/content";
import { QuizQuestionEditorForm } from "@/components/host/QuizQuestionEditorForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ plan: string; lesson: string }>;
}) {
  const { plan, lesson } = await params;
  const file = await getLessonFile(plan, lesson);
  return {
    title: file?.meta.title
      ? `New quiz question — ${file.meta.title}`
      : "New quiz question",
  };
}

export default async function NewHostQuizQuestionPage({
  params,
}: {
  params: Promise<{ plan: string; lesson: string }>;
}) {
  const { plan: planSlug, lesson: lessonSlug } = await params;
  const plan = await getPlan(planSlug);
  if (!plan) notFound();

  const file = await getLessonFile(planSlug, lessonSlug);
  if (!file) notFound();

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
        <h1 className="font-display text-3xl font-bold">New quiz question</h1>
      </header>

      <QuizQuestionEditorForm
        planSlug={planSlug}
        lessonSlug={lessonSlug}
        lessonTitle={file.meta.title}
      />
    </div>
  );
}
