import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLessonFile,
  getPlan,
  listLessons,
  listPlans,
} from "@/lib/content";
import { fetchLessonPuzzles } from "@/lib/lesson-puzzles";
import { PracticePuzzleDeck } from "@/components/lesson/PracticePuzzleDeck";
import { getLessonAccess } from "@/lib/events/lesson-access";

export const revalidate = 3600;

export async function generateStaticParams() {
  const plans = await listPlans();
  const params: { plan: string; lesson: string }[] = [];
  for (const plan of plans) {
    const lessons = await listLessons(plan.slug);
    for (const lesson of lessons) {
      params.push({ plan: plan.slug, lesson: lesson.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ plan: string; lesson: string }>;
}) {
  const { plan: planSlug, lesson: lessonSlug } = await params;
  const file = await getLessonFile(planSlug, lessonSlug);
  return {
    title: file?.meta.title
      ? `Practice — ${file.meta.title}`
      : "Practice puzzles",
  };
}

export default async function PracticePage({
  params,
}: {
  params: Promise<{ plan: string; lesson: string }>;
}) {
  const { plan: planSlug, lesson: lessonSlug } = await params;
  const plan = await getPlan(planSlug);
  if (!plan) notFound();

  const file = await getLessonFile(planSlug, lessonSlug);
  if (!file) notFound();

  const { blocked } = await getLessonAccess(planSlug, lessonSlug);
  if (blocked) notFound();

  const puzzles = await fetchLessonPuzzles(planSlug, lessonSlug);

  return (
    <article className="container-page py-8">
      <nav className="mb-4 text-sm text-buckeye-gray">
        <Link href="/plans" className="hover:underline">
          Lesson plans
        </Link>
        <span aria-hidden> / </span>
        <Link href={`/plans/${planSlug}`} className="hover:underline">
          {plan.title}
        </Link>
        <span aria-hidden> / </span>
        <Link
          href={`/plans/${planSlug}/${lessonSlug}`}
          className="hover:underline"
        >
          {file.meta.title}
        </Link>
      </nav>

      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-buckeye-scarlet">
          Practice
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">
          {file.meta.title} puzzles
        </h1>
        <p className="mt-2 max-w-2xl text-buckeye-gray">
          Work through extra positions at your own pace. These are separate from
          the puzzles in the lesson slides.
        </p>
      </header>

      {puzzles.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
          <p className="font-medium">No practice puzzles yet.</p>
          <p className="mt-2">
            Instructors can create puzzles from the host dashboard at{" "}
            <code className="rounded bg-white/80 px-1">
              /host/lessons/{planSlug}/{lessonSlug}/puzzles
            </code>
            .
          </p>
        </div>
      ) : (
        <PracticePuzzleDeck
          puzzles={puzzles}
          lessonTitle={file.meta.title}
          storageKey={`bcw:practice:${planSlug}:${lessonSlug}`}
        />
      )}

      <nav className="mt-10 border-t border-black/5 pt-6">
        <Link
          href={`/plans/${planSlug}/${lessonSlug}`}
          className="focus-ring inline-flex rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-black/5"
        >
          ← Back to lesson
        </Link>
      </nav>
    </article>
  );
}
