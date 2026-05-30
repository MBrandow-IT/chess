import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlan, listLessons, listPlans } from "@/lib/content";
import { fetchLessonScheduleMap } from "@/lib/events/queries";
import { isLessonListedForStudents } from "@/lib/events/lesson-access";
import { formatEventDate } from "@/lib/events/format";
import { getCurrentUser } from "@/lib/supabase/auth";

export const revalidate = 3600;

export async function generateStaticParams() {
  const plans = await listPlans();
  return plans.map((p) => ({ plan: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ plan: string }>;
}) {
  const { plan: planSlug } = await params;
  const plan = await getPlan(planSlug);
  return { title: plan?.title ?? "Lesson plan" };
}

export default async function PlanPage({
  params,
}: {
  params: Promise<{ plan: string }>;
}) {
  const { plan: planSlug } = await params;
  const plan = await getPlan(planSlug);
  if (!plan) notFound();

  const lessons = await listLessons(planSlug);
  const user = await getCurrentUser();
  const isAdmin = user?.isAdmin ?? false;
  const scheduleMap = await fetchLessonScheduleMap(planSlug);
  const listedLessons = isAdmin
    ? lessons
    : lessons.filter((lesson) =>
        isLessonListedForStudents(scheduleMap.get(lesson.slug)),
      );

  return (
    <div className="container-page py-10">
      <p className="text-sm font-semibold uppercase tracking-wider text-buckeye-scarlet">
        {plan.age_group ?? "All ages"} · {listedLessons.length} lessons
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold">{plan.title}</h1>
      <p className="mt-2 max-w-2xl text-buckeye-gray">{plan.description}</p>

      <ol className="mt-8 space-y-3">
        {listedLessons.map((lesson, idx) => {
          const state = isAdmin ? null : scheduleMap.get(lesson.slug);
          const scheduled = state?.status === "scheduled" ? state : null;
          const cardClassName =
            "flex items-center gap-4 rounded-xl border border-black/5 bg-white p-4 shadow-card " +
            (scheduled
              ? "opacity-90"
              : "focus-ring transition hover:-translate-y-0.5 hover:shadow-lg");

          const inner = (
            <>
              <span className="grid h-10 w-10 flex-none place-items-center rounded-md bg-buckeye-cream font-display text-sm font-semibold text-buckeye-scarlet">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="flex-1">
                <span className="block font-display text-base font-semibold text-buckeye-ink">
                  {lesson.title}
                </span>
                <span className="mt-0.5 block text-sm text-buckeye-gray">
                  {lesson.summary}
                </span>
                {scheduled ? (
                  <span className="mt-2 inline-block rounded-full bg-buckeye-cream px-2.5 py-0.5 text-xs font-medium text-buckeye-scarlet">
                    Coming soon · {formatEventDate(scheduled.unlockAt)}
                  </span>
                ) : null}
              </span>
              {!scheduled ? (
                <span aria-hidden className="text-buckeye-gray">
                  →
                </span>
              ) : null}
            </>
          );

          return (
            <li key={lesson.slug}>
              {scheduled ? (
                <div className={cardClassName} aria-disabled="true">
                  {inner}
                </div>
              ) : (
                <Link href={`/plans/${planSlug}/${lesson.slug}`} className={cardClassName}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
        {listedLessons.length === 0 ? (
          <li className="rounded-xl border border-dashed border-black/10 bg-white/60 p-8 text-center text-buckeye-gray">
            No lessons in this plan yet.
          </li>
        ) : null}
      </ol>

      <div className="mt-10">
        <Link
          href="/plans"
          className="text-sm font-medium text-buckeye-scarlet hover:underline"
        >
          ← All lesson plans
        </Link>
      </div>
    </div>
  );
}
