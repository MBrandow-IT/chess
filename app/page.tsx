import Link from "next/link";
import { listPlans } from "@/lib/content";
import { NextUpStrip } from "@/components/events/NextUpStrip";

export const revalidate = 3600;

export default async function HomePage() {
  const plans = await listPlans();

  return (
    <div>
      <section className="bg-gradient-to-b from-buckeye-cream to-transparent">
        <div className="container-page py-16 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-wider text-buckeye-scarlet">
            Buckeye Public Library
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-buckeye-ink sm:text-5xl">
            Free chess workshops <br className="hidden sm:block" />
            for curious minds.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-buckeye-gray">
            Pick a lesson plan, work through interactive slides and puzzles,
            then test your skills in a live, Kahoot-style classroom quiz.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/plans"
              className="focus-ring inline-flex items-center rounded-md bg-buckeye-scarlet px-5 py-3 font-medium text-white shadow-card hover:bg-red-700"
            >
              Browse lesson plans
            </Link>
            <Link
              href="/play"
              className="focus-ring inline-flex items-center rounded-md border border-buckeye-ink/10 bg-white px-5 py-3 font-medium text-buckeye-ink hover:bg-black/5"
            >
              Join a live quiz
            </Link>
          </div>
        </div>
      </section>

      <NextUpStrip />

      <section className="container-page py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold">Lesson plans</h2>
          <Link
            href="/plans"
            className="text-sm font-medium text-buckeye-scarlet hover:underline"
          >
            See all →
          </Link>
        </div>

        {plans.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.slice(0, 6).map((plan) => (
              <li key={plan.slug}>
                <Link
                  href={`/plans/${plan.slug}`}
                  className="focus-ring block h-full rounded-xl border border-black/5 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-buckeye-scarlet">
                    {plan.age_group ?? "All ages"}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-semibold">
                    {plan.title}
                  </h3>
                  <p className="mt-1 text-sm text-buckeye-gray">
                    {plan.description}
                  </p>
                  <p className="mt-4 text-xs text-buckeye-gray">
                    {plan.lessonCount} lessons
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-black/10 bg-white/60 p-10 text-center">
      <p className="font-display text-lg font-semibold">No lesson plans yet</p>
      <p className="mt-1 text-sm text-buckeye-gray">
        Lesson plans live under <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">content/plans/</code> and
        are loaded automatically once authored.
      </p>
    </div>
  );
}
