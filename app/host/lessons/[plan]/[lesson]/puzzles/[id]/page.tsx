import Link from "next/link";
import { notFound } from "next/navigation";
import { getLessonFile, getPlan } from "@/lib/content";
import { fetchLessonPuzzleById, resolveLessonId } from "@/lib/lesson-puzzles";
import { PuzzleEditorForm } from "@/components/host/PuzzleEditorForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ plan: string; lesson: string; id: string }>;
}) {
  const { plan, lesson, id } = await params;
  const file = await getLessonFile(plan, lesson);
  const puzzle = await fetchLessonPuzzleById(id);
  return {
    title:
      puzzle?.title && file?.meta.title
        ? `Edit ${puzzle.title} — ${file.meta.title}`
        : "Edit puzzle",
  };
}

export default async function EditHostPuzzlePage({
  params,
}: {
  params: Promise<{ plan: string; lesson: string; id: string }>;
}) {
  const { plan: planSlug, lesson: lessonSlug, id } = await params;
  const plan = await getPlan(planSlug);
  if (!plan) notFound();

  const file = await getLessonFile(planSlug, lessonSlug);
  if (!file) notFound();

  const puzzle = await fetchLessonPuzzleById(id);
  if (!puzzle) notFound();

  const lessonId = await resolveLessonId(planSlug, lessonSlug);
  if (!lessonId || puzzle.lesson_id !== lessonId) notFound();

  return (
    <div>
      <nav className="mb-4 text-sm text-buckeye-gray">
        <Link href="/host" className="hover:underline">
          Host dashboard
        </Link>
        <span aria-hidden> / </span>
        <Link
          href={`/host/lessons/${planSlug}/${lessonSlug}/puzzles`}
          className="hover:underline"
        >
          {file.meta.title} puzzles
        </Link>
      </nav>

      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Edit puzzle</h1>
      </header>

      <PuzzleEditorForm
        planSlug={planSlug}
        lessonSlug={lessonSlug}
        lessonTitle={file.meta.title}
        initial={puzzle}
      />
    </div>
  );
}
