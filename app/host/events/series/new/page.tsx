import Link from "next/link";
import { EventSeriesForm } from "@/components/host/EventSeriesForm";

export const metadata = { title: "New workshop series" };

export default function NewEventSeriesPage() {
  return (
    <div className="max-w-xl">
      <Link
        href="/host/events"
        className="text-sm font-medium text-buckeye-scarlet hover:underline"
      >
        ← Events
      </Link>
      <h1 className="mt-4 font-display text-2xl font-bold">New workshop series</h1>
      <p className="mt-1 text-sm text-buckeye-gray">
        Define a recurring in-person schedule, then generate individual sessions.
      </p>
      <div className="mt-6 rounded-xl border border-black/5 bg-white p-6 shadow-card">
        <EventSeriesForm />
      </div>
    </div>
  );
}
