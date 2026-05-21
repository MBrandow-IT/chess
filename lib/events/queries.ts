import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { EventRow, EventSeriesRow } from "@/lib/supabase/types";
import { WORKSHOP_PUBLIC_HORIZON_DAYS } from "./constants";
import { getLessonVisibility, type AttachedEvent } from "./visibility";

export type EventLessonChip = {
  lessonId: string;
  lessonSlug: string;
  lessonTitle: string;
  planSlug: string;
  planTitle: string;
  visibility: ReturnType<typeof getLessonVisibility>;
};

export type PublicEvent = EventRow & {
  lessons: EventLessonChip[];
};

export type LessonScheduleInfo = {
  unlockAt: string;
  eventTitle: string;
  eventId: string;
};

function horizonEndIso(now = new Date()): string {
  const end = new Date(now.getTime() + WORKSHOP_PUBLIC_HORIZON_DAYS * 86400000);
  return end.toISOString();
}

async function attachLessonsToEvents(
  events: EventRow[],
  isAdmin: boolean,
  now = new Date(),
): Promise<PublicEvent[]> {
  if (events.length === 0) return [];

  const sb = createSupabaseAdminClient();
  const eventIds = events.map((event) => event.id);

  const { data: links } = await sb
    .from("event_lessons")
    .select("event_id, lesson_id")
    .in("event_id", eventIds);

  const lessonIds = [...new Set((links ?? []).map((link) => link.lesson_id))];
  if (lessonIds.length === 0) {
    return events.map((event) => ({ ...event, lessons: [] }));
  }

  const { data: lessons } = await sb
    .from("lessons")
    .select("id, slug, title, plan_id")
    .in("id", lessonIds);

  const planIds = [...new Set((lessons ?? []).map((lesson) => lesson.plan_id))];
  const { data: plans } = await sb
    .from("lesson_plans")
    .select("id, slug, title")
    .in("id", planIds);

  const planById = new Map((plans ?? []).map((plan) => [plan.id, plan]));
  const lessonById = new Map((lessons ?? []).map((lesson) => [lesson.id, lesson]));

  const { data: allLinksForLessons } = await sb
    .from("event_lessons")
    .select("event_id, lesson_id")
    .in("lesson_id", lessonIds);

  const eventIdsForLessons = [
    ...new Set((allLinksForLessons ?? []).map((link) => link.event_id)),
  ];

  const { data: linkedEvents } = await sb
    .from("events")
    .select("id, title, starts_at, status")
    .in("id", eventIdsForLessons);

  const eventsByLesson = new Map<string, AttachedEvent[]>();
  for (const link of allLinksForLessons ?? []) {
    const event = (linkedEvents ?? []).find((row) => row.id === link.event_id);
    if (!event) continue;
    const list = eventsByLesson.get(link.lesson_id) ?? [];
    list.push({
      eventId: event.id,
      eventTitle: event.title,
      startsAt: event.starts_at,
      status: event.status,
    });
    eventsByLesson.set(link.lesson_id, list);
  }

  const linksByEvent = new Map<string, string[]>();
  for (const link of links ?? []) {
    const list = linksByEvent.get(link.event_id) ?? [];
    list.push(link.lesson_id);
    linksByEvent.set(link.event_id, list);
  }

  return events.map((event) => {
    const chips: EventLessonChip[] = [];
    for (const lessonId of linksByEvent.get(event.id) ?? []) {
      const lesson = lessonById.get(lessonId);
      if (!lesson) continue;
      const plan = planById.get(lesson.plan_id);
      if (!plan) continue;
      chips.push({
        lessonId: lesson.id,
        lessonSlug: lesson.slug,
        lessonTitle: lesson.title,
        planSlug: plan.slug,
        planTitle: plan.title,
        visibility: getLessonVisibility(
          eventsByLesson.get(lessonId) ?? [],
          now,
          isAdmin,
        ),
      });
    }
    return { ...event, lessons: chips };
  });
}

export async function fetchPublicEvents(now = new Date()): Promise<PublicEvent[]> {
  const sb = createSupabaseAdminClient();
  const nowIso = now.toISOString();
  const horizonIso = horizonEndIso(now);

  const { data: workshops } = await sb
    .from("events")
    .select("*")
    .eq("kind", "workshop")
    .eq("status", "scheduled")
    .gte("starts_at", nowIso)
    .lte("starts_at", horizonIso)
    .order("starts_at");

  const { data: featured } = await sb
    .from("events")
    .select("*")
    .eq("featured", true)
    .eq("status", "scheduled")
    .gte("starts_at", nowIso)
    .order("starts_at");

  const merged = new Map<string, EventRow>();
  for (const event of [...(workshops ?? []), ...(featured ?? [])]) {
    merged.set(event.id, event as EventRow);
  }

  const sorted = [...merged.values()].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );

  return attachLessonsToEvents(sorted, false, now);
}

export async function fetchNextUp(now = new Date()) {
  const events = await fetchPublicEvents(now);
  const nextWorkshop = events.find((event) => event.kind === "workshop");
  const nextFeatured = events.find((event) => event.featured);
  return { nextWorkshop, nextFeatured };
}

export async function fetchLessonScheduleMap(
  planSlug: string,
  now = new Date(),
): Promise<Map<string, LessonScheduleInfo | null>> {
  const sb = createSupabaseAdminClient();
  const map = new Map<string, LessonScheduleInfo | null>();

  const { data: plan } = await sb
    .from("lesson_plans")
    .select("id")
    .eq("slug", planSlug)
    .maybeSingle();
  if (!plan) return map;

  const { data: lessons } = await sb
    .from("lessons")
    .select("id, slug")
    .eq("plan_id", plan.id);
  if (!lessons?.length) return map;

  const lessonIds = lessons.map((lesson) => lesson.id);
  const { data: links } = await sb
    .from("event_lessons")
    .select("event_id, lesson_id")
    .in("lesson_id", lessonIds);

  const eventIds = [...new Set((links ?? []).map((link) => link.event_id))];
  const { data: events } = eventIds.length
    ? await sb
        .from("events")
        .select("id, title, starts_at, status")
        .in("id", eventIds)
    : { data: [] };

  for (const lesson of lessons) {
    const attached: AttachedEvent[] = (links ?? [])
      .filter((link) => link.lesson_id === lesson.id)
      .map((link) => {
        const event = (events ?? []).find((row) => row.id === link.event_id);
        if (!event) return null;
        return {
          eventId: event.id,
          eventTitle: event.title,
          startsAt: event.starts_at,
          status: event.status as "scheduled" | "canceled",
        };
      })
      .filter((event): event is AttachedEvent => event !== null);

    const visibility = getLessonVisibility(attached, now, false);
    if (visibility.status === "scheduled" && visibility.unlockAt) {
      map.set(lesson.slug, {
        unlockAt: visibility.unlockAt,
        eventTitle: visibility.eventTitle ?? "Workshop",
        eventId: visibility.eventId ?? "",
      });
    } else {
      map.set(lesson.slug, null);
    }
  }

  return map;
}

export async function fetchEventsForAdmin() {
  const sb = createSupabaseAdminClient();
  const now = new Date();
  const pastCutoff = new Date(now.getTime() - 7 * 86400000).toISOString();

  const [{ data: series }, { data: events }] = await Promise.all([
    sb.from("event_series").select("*").order("created_at", { ascending: false }),
    sb
      .from("events")
      .select("*")
      .gte("starts_at", pastCutoff)
      .order("starts_at"),
  ]);

  return {
    series: (series ?? []) as EventSeriesRow[],
    events: (events ?? []) as EventRow[],
  };
}

export async function fetchEventWithLessons(eventId: string) {
  const sb = createSupabaseAdminClient();
  const { data: event } = await sb
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) return null;

  const { data: links } = await sb
    .from("event_lessons")
    .select("lesson_id")
    .eq("event_id", eventId);

  const lessonIds = (links ?? []).map((link) => link.lesson_id);
  if (lessonIds.length === 0) {
    return { event: event as EventRow, lessons: [] };
  }

  const { data: lessons } = await sb
    .from("lessons")
    .select("id, slug, title, plan_id")
    .in("id", lessonIds);

  const planIds = [...new Set((lessons ?? []).map((lesson) => lesson.plan_id))];
  const { data: plans } = await sb
    .from("lesson_plans")
    .select("id, slug, title")
    .in("id", planIds);

  const planById = new Map((plans ?? []).map((plan) => [plan.id, plan]));

  return {
    event: event as EventRow,
    lessons: (lessons ?? []).map((lesson) => ({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      planSlug: planById.get(lesson.plan_id)?.slug ?? "",
      planTitle: planById.get(lesson.plan_id)?.title ?? "",
    })),
  };
}

export async function fetchAllLessonsGroupedByPlan() {
  const sb = createSupabaseAdminClient();
  const { data: plans } = await sb
    .from("lesson_plans")
    .select("id, slug, title")
    .order("order_idx");

  const sections = [];
  for (const plan of plans ?? []) {
    const { data: lessons } = await sb
      .from("lessons")
      .select("id, slug, title")
      .eq("plan_id", plan.id)
      .order("order_idx");
    sections.push({
      planSlug: plan.slug,
      planTitle: plan.title,
      lessons: lessons ?? [],
    });
  }
  return sections;
}
