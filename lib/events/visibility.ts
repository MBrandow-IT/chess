import { LESSON_EARLY_ACCESS_MS } from "./constants";

export type AttachedEvent = {
  eventId: string;
  eventTitle: string;
  startsAt: string;
  status: "scheduled" | "canceled";
};

export type LessonVisibility = {
  status: "live" | "scheduled" | "hidden";
  unlockAt?: string;
  eventTitle?: string;
  eventId?: string;
};

export function lessonUnlockAt(startsAt: string): string {
  return new Date(new Date(startsAt).getTime() - LESSON_EARLY_ACCESS_MS).toISOString();
}

export function getLessonVisibility(
  attachedEvents: AttachedEvent[],
  now: Date,
  isAdmin: boolean,
): LessonVisibility {
  if (isAdmin) return { status: "live" };

  const active = attachedEvents.filter((event) => event.status !== "canceled");
  if (active.length === 0) return { status: "hidden" };

  const earliest = active.reduce((min, event) =>
    event.startsAt < min.startsAt ? event : min,
  );

  const unlockAt = lessonUnlockAt(earliest.startsAt);

  if (now >= new Date(unlockAt)) {
    return { status: "live" };
  }

  return {
    status: "scheduled",
    unlockAt,
    eventTitle: earliest.eventTitle,
    eventId: earliest.eventId,
  };
}
