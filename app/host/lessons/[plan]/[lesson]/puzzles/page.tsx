import Link from "next/link";
import { notFound } from "next/navigation";
import { getLessonFile, getPlan } from "@/lib/content";
import { fetchLessonPuzzlesForAdmin } from "@/lib/lesson-puzzles";
import { DeletePuzzleButton } from "@/components/host/DeletePuzzleButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ plan: string; lesson: string }>;
}) {
  const { plan, lesson } = await params;
  const file = await getLessonFile(plan, lesson);
  return {
    title: file?.meta.title
      ? `Practice puzzles — ${file.meta.title}`
      : "Practice puzzles",
  };
}

export default async function HostLessonPuzzlesPage({
  params,
}: {
  params: Promise<{ plan: string; lesson: string }>;
}) {
  const { plan: planSlug, lesson: lessonSlug } = await params;
  const plan = await getPlan(planSlug);
  if (!plan) notFound();

  const file = await getLessonFile(planSlug, lessonSlug);
  if (!file) notFound();

  const puzzles = await fetchLessonPuzzlesForAdmin(planSlug, lessonSlug);

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
          <h1 className="font-display text-3xl font-bold">Practice puzzles</h1>
          <p className="mt-1 text-sm text-buckeye-gray">
            {file.meta.title} · drag-and-drop editor
          </p>
        </div>
        <Link
          href={`/host/lessons/${planSlug}/${lessonSlug}/puzzles/new`}
          className="focus-ring rounded-md bg-buckeye-scarlet px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          New puzzle
        </Link>
      </header>

      {puzzles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/10 bg-white/60 p-6 text-sm text-buckeye-gray">
          No puzzles yet. Create one with the board editor.
        </p>
      ) : (
        <ul className="space-y-3">
          {puzzles.map((puzzle) => (
            <li
              key={puzzle.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/5 bg-white p-4 shadow-card"
            >
              <div>
                <p className="font-display text-sm font-semibold">
                  {puzzle.title}
                </p>
                <p className="mt-0.5 font-mono text-xs text-buckeye-gray">
                  {puzzle.slug} · {puzzle.solution.length} move
                  {puzzle.solution.length === 1 ? "" : "s"}
                  {puzzle.published ? "" : " · draft"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/host/lessons/${planSlug}/${lessonSlug}/puzzles/${puzzle.id}`}
                  className="focus-ring rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-medium hover:bg-black/5"
                >
                  Edit
                </Link>
                <DeletePuzzleButton puzzleId={puzzle.id} title={puzzle.title} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/plans/${planSlug}/${lessonSlug}/practice`}
          className="text-sm text-buckeye-gray hover:underline"
        >
          Preview practice page →
        </Link>
        <Link href="/host" className="text-sm text-buckeye-gray hover:underline">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
