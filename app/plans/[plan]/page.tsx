import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlan, listLessons, listPlans } from "@/lib/content";

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

  return (
    <div className="container-page py-10">
      <p className="text-sm font-semibold uppercase tracking-wider text-buckeye-scarlet">
        {plan.age_group ?? "All ages"} · {lessons.length} lessons
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold">{plan.title}</h1>
      <p className="mt-2 max-w-2xl text-buckeye-gray">{plan.description}</p>

      <ol className="mt-8 space-y-3">
        {lessons.map((lesson, idx) => (
          <li key={lesson.slug}>
            <Link
              href={`/plans/${planSlug}/${lesson.slug}`}
              className="focus-ring flex items-center gap-4 rounded-xl border border-black/5 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
            >
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
              </span>
              <span aria-hidden className="text-buckeye-gray">
                →
              </span>
            </Link>
          </li>
        ))}
        {lessons.length === 0 ? (
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
