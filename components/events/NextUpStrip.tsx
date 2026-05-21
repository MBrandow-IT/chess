import Link from "next/link";
import { fetchNextUp } from "@/lib/events/queries";
import { formatEventDateRange } from "@/lib/events/format";

export async function NextUpStrip() {
  const { nextWorkshop, nextFeatured } = await fetchNextUp();

  if (!nextWorkshop && !nextFeatured) return null;

  return (
    <section className="border-y border-black/5 bg-white/70">
      <div className="container-page py-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold">Next up</h2>
          <Link
            href="/events"
            className="text-sm font-medium text-buckeye-scarlet hover:underline"
          >
            All events →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {nextWorkshop ? (
            <div className="rounded-xl border border-black/5 bg-white p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-buckeye-scarlet">
                Next workshop
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold">
                {nextWorkshop.title}
              </h3>
              <p className="mt-1 text-sm text-buckeye-gray">
                {formatEventDateRange(
                  nextWorkshop.starts_at,
                  nextWorkshop.ends_at,
                )}
              </p>
              {nextWorkshop.location ? (
                <p className="mt-1 text-sm text-buckeye-gray">
                  {nextWorkshop.location}
                </p>
              ) : null}
            </div>
          ) : null}
          {nextFeatured ? (
            <div className="rounded-xl border border-black/5 bg-white p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-buckeye-scarlet">
                Featured
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold">
                {nextFeatured.title}
              </h3>
              <p className="mt-1 text-sm text-buckeye-gray">
                {formatEventDateRange(nextFeatured.starts_at, nextFeatured.ends_at)}
              </p>
              {nextFeatured.signup_url ? (
                <a
                  href={nextFeatured.signup_url}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring mt-3 inline-flex rounded-md bg-buckeye-scarlet px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Sign up
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
