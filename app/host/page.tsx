import Link from "next/link";
import { listPlans, listLessons } from "@/lib/content";
import { fetchLessonScheduleMap } from "@/lib/events/queries";
import { formatEventDate } from "@/lib/events/format";

export const metadata = { title: "Host dashboard" };

export default async function HostDashboardPage() {
  const plans = await listPlans();

  const planSections = await Promise.all(
    plans.map(async (plan) => {
      const lessons = await listLessons(plan.slug);
      const scheduleMap = await fetchLessonScheduleMap(plan.slug);
      return { plan, lessons, scheduleMap };
    }),
  );

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Start a live quiz</h1>
        <p className="mt-1 text-sm text-buckeye-gray">
          Pick a lesson to launch a Kahoot-style quiz for your students.
        </p>
      </header>

      {planSections.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/10 bg-white/60 p-6 text-buckeye-gray">
          No lesson plans found. Add a folder under{" "}
          <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">
            content/plans/
          </code>{" "}
          to publish a plan.
        </p>
      ) : (
        <div className="space-y-8">
          {planSections.map(({ plan, lessons, scheduleMap }) => (
            <section key={plan.slug}>
              <h2 className="font-display text-xl font-semibold">
                {plan.title}
              </h2>
              <p className="text-sm text-buckeye-gray">
                {plan.age_group ?? "All ages"} · {lessons.length} lessons
              </p>
              {lessons.length === 0 ? (
                <p className="mt-3 text-sm text-buckeye-gray">
                  No lessons in this plan yet.
                </p>
              ) : (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {lessons.map((lesson) => {
                    const state = scheduleMap.get(lesson.slug);
                    const statusLabel =
                      state?.status === "scheduled"
                        ? `Scheduled · ${formatEventDate(state.unlockAt)} (${state.eventTitle})`
                        : state?.status === "live"
                          ? "Live for students"
                          : "Hidden from students (no event attached)";
                    return (
                    <li
                      key={lesson.slug}
                      className="flex items-center justify-between gap-3 rounded-xl border border-black/5 bg-white p-4 shadow-card"
                    >
                      <div>
                        <p className="font-display text-sm font-semibold">
                          {lesson.title}
                        </p>
                        <p className="mt-0.5 text-xs text-buckeye-gray">
                          {lesson.summary}
                        </p>
                        <p className="mt-1 text-xs font-medium text-buckeye-scarlet">
                          {statusLabel}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <Link
                          href={`/host/quizzes/new?plan=${plan.slug}&lesson=${lesson.slug}`}
                          className="focus-ring rounded-md bg-buckeye-scarlet px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Start quiz
                        </Link>
                        <Link
                          href={`/host/lessons/${plan.slug}/${lesson.slug}/quiz`}
                          className="focus-ring rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-medium hover:bg-black/5"
                        >
                          Edit quiz
                        </Link>
                        <Link
                          href={`/host/lessons/${plan.slug}/${lesson.slug}/puzzles`}
                          className="focus-ring rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-medium hover:bg-black/5"
                        >
                          Edit puzzles
                        </Link>
                        <Link
                          href={`/plans/${plan.slug}/${lesson.slug}`}
                          className="text-xs text-buckeye-gray hover:underline"
                        >
                          Preview lesson →
                        </Link>
                      </div>
                    </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
