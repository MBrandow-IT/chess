import Link from "next/link";
import { formatEventDate, formatEventDateRange } from "@/lib/events/format";
import type { PublicEvent } from "@/lib/events/queries";

export function EventCard({ event }: { event: PublicEvent }) {
  const workshops = event.lessons;

  return (
    <article className="rounded-xl border border-black/5 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-buckeye-scarlet">
            {event.featured ? "Featured" : event.kind}
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold">{event.title}</h3>
          <p className="mt-1 text-sm text-buckeye-gray">
            {formatEventDateRange(event.starts_at, event.ends_at)}
          </p>
          {event.location ? (
            <p className="mt-1 text-sm text-buckeye-gray">{event.location}</p>
          ) : null}
        </div>
        {event.signup_url ? (
          <a
            href={event.signup_url}
            target="_blank"
            rel="noreferrer"
            className="focus-ring rounded-md bg-buckeye-scarlet px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Sign up
          </a>
        ) : null}
      </div>
      {event.description ? (
        <p className="mt-3 text-sm text-buckeye-gray">{event.description}</p>
      ) : null}
      {workshops.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {workshops.map((lesson) => {
            if (lesson.visibility.status === "hidden") return null;

            return lesson.visibility.status === "live" ? (
              <li key={lesson.lessonId}>
                <Link
                  href={`/plans/${lesson.planSlug}/${lesson.lessonSlug}`}
                  className="focus-ring rounded-full bg-buckeye-cream px-3 py-1 text-xs font-medium text-buckeye-ink hover:bg-buckeye-scarlet/10"
                >
                  {lesson.lessonTitle}
                </Link>
              </li>
            ) : (
              <li
                key={lesson.lessonId}
                className="rounded-full border border-dashed border-black/10 px-3 py-1 text-xs text-buckeye-gray"
              >
                {lesson.lessonTitle} · Unlocks{" "}
                {lesson.visibility.unlockAt
                  ? formatEventDate(lesson.visibility.unlockAt)
                  : "soon"}
              </li>
            );
          })}
        </ul>
      ) : null}
    </article>
  );
}
