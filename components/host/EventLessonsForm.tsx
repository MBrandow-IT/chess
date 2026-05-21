"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type LessonOption = {
  id: string;
  slug: string;
  title: string;
};

type PlanSection = {
  planSlug: string;
  planTitle: string;
  lessons: LessonOption[];
};

export function EventLessonsForm({
  eventId,
  sections,
  initialLessonIds,
}: {
  eventId: string;
  sections: PlanSection[];
  initialLessonIds: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(initialLessonIds));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const allLessons = useMemo(
    () => sections.flatMap((section) => section.lessons),
    [sections],
  );

  function toggleLesson(lessonId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/host/events/${eventId}/lessons`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonIds: [...selected] }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Could not save lessons.");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save lessons.");
    } finally {
      setSubmitting(false);
    }
  }

  if (allLessons.length === 0) {
    return (
      <p className="text-sm text-buckeye-gray">
        Sync lesson plans first with <code className="rounded bg-black/5 px-1">npm run sync</code>.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {sections.map((section) =>
        section.lessons.length === 0 ? null : (
          <fieldset key={section.planSlug} className="rounded-lg border border-black/5 p-4">
            <legend className="px-1 text-sm font-semibold">{section.planTitle}</legend>
            <ul className="mt-2 space-y-2">
              {section.lessons.map((lesson) => (
                <li key={lesson.id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.has(lesson.id)}
                      onChange={() => toggleLesson(lesson.id)}
                    />
                    {lesson.title}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ),
      )}
      <button
        type="submit"
        disabled={submitting}
        className="focus-ring rounded-md bg-buckeye-scarlet px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Save attached lessons"}
      </button>
      {saved ? (
        <p className="text-sm text-green-700">Lesson attachments saved.</p>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
