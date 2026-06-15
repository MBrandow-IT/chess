import Link from "next/link";
import { notFound } from "next/navigation";
import { getLessonFile, getPlan } from "@/lib/content";
import { SlideChessEditorForm } from "@/components/host/SlideChessEditorForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ plan: string; lesson: string }>;
}) {
  const { plan, lesson } = await params;
  const file = await getLessonFile(plan, lesson);
  return {
    title: file?.meta.title
      ? `New slide chess — ${file.meta.title}`
      : "New slide chess",
  };
}

export default async function NewHostSlideChessPage({
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
          href={`/host/lessons/${planSlug}/${lessonSlug}/slide-chess`}
          className="hover:underline"
        >
          {file.meta.title} slide chess
        </Link>
      </nav>

      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">New slide chess block</h1>
      </header>

      <SlideChessEditorForm
        planSlug={planSlug}
        lessonSlug={lessonSlug}
        lessonTitle={file.meta.title}
      />
    </div>
  );
}
