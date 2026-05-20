import Link from "next/link";
import { listPlans } from "@/lib/content";

export const metadata = {
  title: "Lesson Plans",
};

export default async function PlansIndexPage() {
  const plans = await listPlans();
  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold">Lesson plans</h1>
        <p className="mt-2 text-buckeye-gray">
          Pick a plan and work through its lessons in order, or jump around as
          you like.
        </p>
      </header>

      {plans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/10 bg-white/60 p-10 text-center">
          <p className="font-display text-lg font-semibold">
            No lesson plans yet
          </p>
          <p className="mt-1 text-sm text-buckeye-gray">
            Add a folder under{" "}
            <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">
              content/plans/
            </code>{" "}
            to publish a plan.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <li key={plan.slug}>
              <Link
                href={`/plans/${plan.slug}`}
                className="focus-ring block h-full rounded-xl border border-black/5 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-buckeye-scarlet">
                  {plan.age_group ?? "All ages"}
                </p>
                <h2 className="mt-2 font-display text-lg font-semibold">
                  {plan.title}
                </h2>
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
    </div>
  );
}
