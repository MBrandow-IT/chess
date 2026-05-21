"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WEEKDAY_LABELS } from "@/lib/events/constants";

const inputClassName =
  "focus-ring w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm";

export function EventSeriesForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Buckeye Public Library");
  const [weekdays, setWeekdays] = useState<number[]>([1, 4]);
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("17:30");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleWeekday(day: number) {
    setWeekdays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/host/events/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          location,
          recurrenceWeekdays: weekdays,
          startTime,
          endTime,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) throw new Error(data?.error ?? "Could not create series.");
      router.push("/host/events");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create series.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Title</span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClassName}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Description</span>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClassName}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Location</span>
        <input
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={inputClassName}
        />
      </label>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Repeats on</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(WEEKDAY_LABELS).map(([value, label]) => {
            const day = Number(value);
            const active = weekdays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleWeekday(day)}
                className={
                  "focus-ring rounded-md border px-3 py-1.5 text-sm " +
                  (active
                    ? "border-buckeye-scarlet bg-buckeye-scarlet/10 text-buckeye-scarlet"
                    : "border-black/10 bg-white text-buckeye-gray")
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Start time</span>
          <input
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={inputClassName}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">End time</span>
          <input
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={inputClassName}
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={submitting || weekdays.length === 0}
        className="focus-ring rounded-md bg-buckeye-scarlet px-5 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Create series"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
