import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLessonFile,
  getPlan,
  listLessons,
  listPlans,
} from "@/lib/content";
import { renderLessonMDX } from "@/lib/mdx/compile";
import { fetchLessonQuizQuestions } from "@/lib/lesson-quiz-questions";
import { fetchLessonSlideChessBlocks } from "@/lib/lesson-slide-chess-blocks";
import { PrintButton } from "@/components/lesson/PrintButton";
import { LessonQuizPreview } from "@/components/lesson/LessonQuizPreview";
import { LessonSlideChessShell } from "@/components/lesson/LessonSlideChessShell";
import { SoundToggle } from "@/components/lesson/SoundToggle";
import { getLessonAccess, isLessonLiveForStudents } from "@/lib/events/lesson-access";
import { fetchLessonScheduleMap, type LessonScheduleState } from "@/lib/events/queries";
import { formatEventDate } from "@/lib/events/format";

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
  return { title: file?.meta.title ?? "Lesson" };
}

function findAdjacentLesson(
  lessons: { slug: string; title: string }[],
  currentSlug: string,
  scheduleMap: Map<string, LessonScheduleState>,
  direction: "prev" | "next",
  isAdmin: boolean,
) {
  const idx = lessons.findIndex((lesson) => lesson.slug === currentSlug);
  if (idx < 0) return null;

  const isNavigable = (slug: string) =>
    isAdmin || isLessonLiveForStudents(scheduleMap.get(slug));

  if (direction === "prev") {
    for (let i = idx - 1; i >= 0; i -= 1) {
      if (isNavigable(lessons[i].slug)) return lessons[i];
    }
    return null;
  }

  for (let i = idx + 1; i < lessons.length; i += 1) {
    if (isNavigable(lessons[i].slug)) return lessons[i];
  }
  return null;
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ plan: string; lesson: string }>;
}) {
  const { plan: planSlug, lesson: lessonSlug } = await params;
  const plan = await getPlan(planSlug);
  if (!plan) notFound();

  const file = await getLessonFile(planSlug, lessonSlug);
  if (!file) notFound();

  const { isAdmin, schedule, blocked } = await getLessonAccess(
    planSlug,
    lessonSlug,
  );
  if (blocked) notFound();

  const lessons = await listLessons(planSlug);
  const scheduleMap = await fetchLessonScheduleMap(planSlug);
  const currentIdx = lessons.findIndex((l) => l.slug === lessonSlug);
  const prev = findAdjacentLesson(lessons, lessonSlug, scheduleMap, "prev", isAdmin);
  const next = findAdjacentLesson(lessons, lessonSlug, scheduleMap, "next", isAdmin);

  const content = await renderLessonMDX(file.content);
  const quizQuestions = await fetchLessonQuizQuestions(planSlug, lessonSlug);
  const slideChessBlocks = await fetchLessonSlideChessBlocks(
    planSlug,
    lessonSlug,
    { includeUnpublished: isAdmin },
  );

  return (
    <article className="container-page py-8">
      <nav className="no-print mb-4 text-sm text-buckeye-gray">
        <Link href="/plans" className="hover:underline">
          Lesson plans
        </Link>
        <span aria-hidden> / </span>
        <Link href={`/plans/${planSlug}`} className="hover:underline">
          {plan.title}
        </Link>
      </nav>

      {isAdmin ? (
        <div className="no-print mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Admin preview —{" "}
          <Link
            href={`/host/lessons/${planSlug}/${lessonSlug}/slide-chess`}
            className="font-medium underline"
          >
            Edit slide chess blocks
          </Link>
          {schedule ? (
            <>
              {" "}
              · scheduled to go live on {formatEventDate(schedule.unlockAt)} (
              {schedule.eventTitle})
            </>
          ) : null}
        </div>
      ) : null}

      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-buckeye-scarlet">
            Lesson {currentIdx + 1} of {lessons.length}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold">
            {file.meta.title}
          </h1>
          {file.meta.summary ? (
            <p className="mt-2 max-w-2xl text-buckeye-gray">
              {file.meta.summary}
            </p>
          ) : null}
        </div>
        <div className="no-print flex items-center gap-2">
          <Link
            href={`/plans/${planSlug}/${lessonSlug}/practice`}
            className="focus-ring rounded-md border border-buckeye-scarlet/30 bg-buckeye-scarlet/5 px-3 py-1.5 text-sm font-medium text-buckeye-scarlet hover:bg-buckeye-scarlet/10"
          >
            Practice puzzles
          </Link>
          <SoundToggle />
          <PrintButton />
        </div>
      </header>

      <LessonSlideChessShell
        blocks={slideChessBlocks}
        planSlug={planSlug}
        lessonSlug={lessonSlug}
        isAdmin={isAdmin}
      >
        <div className="lesson-content">{content}</div>
      </LessonSlideChessShell>

      <div className="no-print mt-8">
        <LessonQuizPreview questions={quizQuestions} />
      </div>

      <nav className="no-print mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-6">
        {prev ? (
          <Link
            href={`/plans/${planSlug}/${prev.slug}`}
            className="focus-ring rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-black/5"
          >
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/plans/${planSlug}/${next.slug}`}
            className="focus-ring rounded-md bg-buckeye-scarlet px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Next: {next.title} →
          </Link>
        ) : (
          <Link
            href={`/plans/${planSlug}`}
            className="focus-ring rounded-md bg-buckeye-scarlet px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Back to plan ↺
          </Link>
        )}
      </nav>
    </article>
  );
}
