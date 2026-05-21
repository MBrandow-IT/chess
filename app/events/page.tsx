import { fetchPublicEvents } from "@/lib/events/queries";
import { EventCard } from "@/components/events/EventCard";

export const metadata = {
  title: "Events",
  description: "Upcoming in-person workshops and featured chess events.",
};

export const revalidate = 3600;

export default async function EventsPage() {
  const events = await fetchPublicEvents();
  const featured = events.filter((event) => event.featured);
  const workshops = events.filter(
    (event) => event.kind === "workshop" && !event.featured,
  );

  return (
    <div className="container-page py-10">
      <p className="text-sm font-semibold uppercase tracking-wider text-buckeye-scarlet">
        Buckeye Public Library
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold">Events</h1>
      <p className="mt-2 max-w-2xl text-buckeye-gray">
        In-person workshops meet at the library. Featured tournaments link to
        external signup pages.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Featured</h2>
        {featured.length === 0 ? (
          <p className="mt-3 text-sm text-buckeye-gray">
            No featured events scheduled yet.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 lg:grid-cols-2">
            {featured.map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Workshops</h2>
        <p className="mt-1 text-sm text-buckeye-gray">
          Showing the next two weeks of in-person sessions.
        </p>
        {workshops.length === 0 ? (
          <p className="mt-3 text-sm text-buckeye-gray">
            No workshops in the next two weeks.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 lg:grid-cols-2">
            {workshops.map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
