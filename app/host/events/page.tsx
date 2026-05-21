import Link from "next/link";
import { fetchEventsForAdmin } from "@/lib/events/queries";
import { formatEventDateRange } from "@/lib/events/format";
import { WEEKDAY_LABELS } from "@/lib/events/constants";
import { GenerateSeriesButton } from "@/components/host/GenerateSeriesButton";
import { CancelEventButton } from "@/components/host/CancelEventButton";

export const metadata = { title: "Events" };

export default async function HostEventsPage() {
  const { series, events } = await fetchEventsForAdmin();
  const now = new Date();
  const upcoming = events.filter((event) => new Date(event.starts_at) >= now);
  const featured = events.filter((event) => event.featured);

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Events</h1>
          <p className="mt-1 text-sm text-buckeye-gray">
            Manage workshop sessions, featured tournaments, and lesson go-live
            dates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/host/events/series/new"
            className="focus-ring rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium hover:bg-black/5"
          >
            New workshop series
          </Link>
          <Link
            href="/host/events/new"
            className="focus-ring rounded-md bg-buckeye-scarlet px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            New featured event
          </Link>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="font-display text-xl font-semibold">Workshop series</h2>
        {series.length === 0 ? (
          <p className="mt-3 text-sm text-buckeye-gray">
            No recurring series yet. Create one for Mon/Thu library workshops.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {series.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-black/5 bg-white p-4 shadow-card"
              >
                <div>
                  <p className="font-display text-sm font-semibold">{row.title}</p>
                  <p className="mt-1 text-xs text-buckeye-gray">
                    {row.recurrence_weekdays
                      .map((day) => WEEKDAY_LABELS[day])
                      .join(", ")}{" "}
                    · {row.start_time.slice(0, 5)}–{row.end_time.slice(0, 5)} ·{" "}
                    {row.location}
                  </p>
                </div>
                <GenerateSeriesButton seriesId={row.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <h2 className="font-display text-xl font-semibold">Upcoming sessions</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-buckeye-gray">
            Generate sessions from a workshop series to populate this list.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-buckeye-gray">
                <tr>
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Kind</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((event) => (
                  <tr key={event.id} className="border-t border-black/5">
                    <td className="px-3 py-3 whitespace-nowrap">
                      {formatEventDateRange(event.starts_at, event.ends_at)}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/host/events/${event.id}`}
                        className="font-medium hover:underline"
                      >
                        {event.title}
                      </Link>
                    </td>
                    <td className="px-3 py-3 capitalize">{event.kind}</td>
                    <td className="px-3 py-3 capitalize">
                      <span
                        className={
                          event.status === "canceled"
                            ? "text-red-700 line-through"
                            : ""
                        }
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <CancelEventButton
                        eventId={event.id}
                        canceled={event.status === "canceled"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">Featured events</h2>
        {featured.length === 0 ? (
          <p className="mt-3 text-sm text-buckeye-gray">
            Featured tournaments and special events appear on the home page.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {featured.map((event) => (
              <li key={event.id} className="text-sm">
                <Link href={`/host/events/${event.id}`} className="hover:underline">
                  {event.title}
                </Link>
                <span className="text-buckeye-gray">
                  {" "}
                  — {formatEventDateRange(event.starts_at, event.ends_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
