import Link from "next/link";
import { notFound } from "next/navigation";
import { getLessonFile, getPlan } from "@/lib/content";
import { fetchLessonSlideChessBlockById } from "@/lib/lesson-slide-chess-blocks";
import { SlideChessEditorForm } from "@/components/host/SlideChessEditorForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ plan: string; lesson: string; id: string }>;
}) {
  const { plan, lesson } = await params;
  const file = await getLessonFile(plan, lesson);
  return {
    title: file?.meta.title
      ? `Edit slide chess — ${file.meta.title}`
      : "Edit slide chess",
  };
}

export default async function EditHostSlideChessPage({
  params,
}: {
  params: Promise<{ plan: string; lesson: string; id: string }>;
}) {
  const { plan: planSlug, lesson: lessonSlug, id } = await params;
  const plan = await getPlan(planSlug);
  if (!plan) notFound();

  const file = await getLessonFile(planSlug, lessonSlug);
  if (!file) notFound();

  const block = await fetchLessonSlideChessBlockById(id);
  if (!block) notFound();

  return (
    <div>
      <nav className="mb-4 text-sm text-buckeye-gray">
        <Link href="/host" className="hover:underline">
          Host dashboard
        </Link>
        <span aria-hidden> / </span>
        <Link
          href={`/host/lessons/${planSlug}/${lessonSlug}/slide-chess`}
          className="hover:underline"
        >
          {file.meta.title} slide chess
        </Link>
      </nav>

      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Edit slide chess block</h1>
      </header>

      <SlideChessEditorForm
        planSlug={planSlug}
        lessonSlug={lessonSlug}
        lessonTitle={file.meta.title}
        initial={block}
      />
    </div>
  );
}
