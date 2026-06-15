import Link from "next/link";
import { notFound } from "next/navigation";
import { getLessonFile, getPlan } from "@/lib/content";
import { fetchLessonSlideChessBlocksForAdmin } from "@/lib/lesson-slide-chess-blocks";
import { DeleteSlideChessButton } from "@/components/host/DeleteSlideChessButton";

function typeLabel(type: string): string {
  if (type === "puzzle") return "Puzzle";
  if (type === "display-board") return "Display board";
  if (type === "analysis-board") return "Analysis board";
  return type;
}

function mdxSnippet(type: string, slug: string): string {
  if (type === "puzzle") return `<SlidePuzzle slug="${slug}" />`;
  if (type === "display-board") return `<SlideBoard slug="${slug}" />`;
  if (type === "analysis-board") return `<SlideAnalysis slug="${slug}" />`;
  return slug;
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
      ? `Slide chess — ${file.meta.title}`
      : "Slide chess",
  };
}

export default async function HostLessonSlideChessPage({
  params,
}: {
  params: Promise<{ plan: string; lesson: string }>;
}) {
  const { plan: planSlug, lesson: lessonSlug } = await params;
  const plan = await getPlan(planSlug);
  if (!plan) notFound();

  const file = await getLessonFile(planSlug, lessonSlug);
  if (!file) notFound();

  const blocks = await fetchLessonSlideChessBlocksForAdmin(
    planSlug,
    lessonSlug,
  );

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
          <h1 className="font-display text-3xl font-bold">Slide chess blocks</h1>
          <p className="mt-1 text-sm text-buckeye-gray">
            {file.meta.title} · in-lesson boards and puzzles referenced from MDX
          </p>
        </div>
        <Link
          href={`/host/lessons/${planSlug}/${lessonSlug}/slide-chess/new`}
          className="focus-ring rounded-md bg-buckeye-scarlet px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          New block
        </Link>
      </header>

      {blocks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/10 bg-white/60 p-6 text-sm text-buckeye-gray">
          No slide chess blocks yet. Create one, then reference it in{" "}
          <code className="rounded bg-black/5 px-1">lesson.mdx</code> with a
          slug.
        </p>
      ) : (
        <ul className="space-y-3">
          {blocks.map((block) => (
            <li
              key={block.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/5 bg-white p-4 shadow-card"
            >
              <div>
                <p className="font-display text-sm font-semibold">
                  {block.slide_label || block.slug}
                </p>
                <p className="mt-0.5 font-mono text-xs text-buckeye-gray">
                  {typeLabel(block.type)} · {block.slug}
                  {block.published ? "" : " · draft"}
                </p>
                <p className="mt-1 font-mono text-xs text-buckeye-gray">
                  {mdxSnippet(block.type, block.slug)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/host/lessons/${planSlug}/${lessonSlug}/slide-chess/${block.id}`}
                  className="focus-ring rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-medium hover:bg-black/5"
                >
                  Edit
                </Link>
                <DeleteSlideChessButton
                  blockId={block.id}
                  label={block.slide_label || block.slug}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/plans/${planSlug}/${lessonSlug}`}
          className="text-sm text-buckeye-gray hover:underline"
        >
          Preview lesson →
        </Link>
        <Link href="/host" className="text-sm text-buckeye-gray hover:underline">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
