import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchAllLessonsGroupedByPlan,
  fetchEventWithLessons,
} from "@/lib/events/queries";
import { formatEventDateRange } from "@/lib/events/format";
import { EventLessonsForm } from "@/components/host/EventLessonsForm";
import { CancelEventButton } from "@/components/host/CancelEventButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await fetchEventWithLessons(id);
  return { title: data?.event.title ?? "Event" };
}

export default async function HostEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, lessonSections] = await Promise.all([
    fetchEventWithLessons(id),
    fetchAllLessonsGroupedByPlan(),
  ]);
  if (!data) notFound();

  const { event, lessons } = data;

  return (
    <div className="max-w-2xl">
      <Link
        href="/host/events"
        className="text-sm font-medium text-buckeye-scarlet hover:underline"
      >
        ← Events
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-buckeye-scarlet">
            {event.kind}
            {event.featured ? " · Featured" : ""}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold">{event.title}</h1>
          <p className="mt-1 text-sm text-buckeye-gray">
            {formatEventDateRange(event.starts_at, event.ends_at)}
          </p>
          {event.location ? (
            <p className="mt-1 text-sm text-buckeye-gray">{event.location}</p>
          ) : null}
          {event.signup_url ? (
            <a
              href={event.signup_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-medium text-buckeye-scarlet hover:underline"
            >
              Signup link →
            </a>
          ) : null}
        </div>
        <CancelEventButton
          eventId={event.id}
          canceled={event.status === "canceled"}
        />
      </header>

      {event.description ? (
        <p className="mt-4 text-sm text-buckeye-gray">{event.description}</p>
      ) : null}

      <section className="mt-8 rounded-xl border border-black/5 bg-white p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold">Attached lessons</h2>
        <p className="mt-1 text-sm text-buckeye-gray">
          Lessons go live for the public when this event starts.
        </p>
        <div className="mt-4">
          <EventLessonsForm
            eventId={event.id}
            sections={lessonSections}
            initialLessonIds={lessons.map((lesson) => lesson.id)}
          />
        </div>
      </section>
    </div>
  );
}
