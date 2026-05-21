import Link from "next/link";
import { OneOffEventForm } from "@/components/host/OneOffEventForm";

export const metadata = { title: "New featured event" };

export default function NewEventPage() {
  return (
    <div className="max-w-xl">
      <Link
        href="/host/events"
        className="text-sm font-medium text-buckeye-scarlet hover:underline"
      >
        ← Events
      </Link>
      <h1 className="mt-4 font-display text-2xl font-bold">New featured event</h1>
      <p className="mt-1 text-sm text-buckeye-gray">
        Tournaments and special events can include an external signup link.
      </p>
      <div className="mt-6 rounded-xl border border-black/5 bg-white p-6 shadow-card">
        <OneOffEventForm />
      </div>
    </div>
  );
}
