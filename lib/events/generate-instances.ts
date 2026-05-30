import type { EventSeriesRow } from "@/lib/supabase/types";
import {
  addDaysYmd,
  jsDateToIsoWeekday,
  phoenixLocalToUtc,
  todayYmdInPhoenix,
} from "./format";

export type GeneratedEventInstance = {
  series_id: string;
  title: string;
  description: string;
  location: string;
  kind: "workshop";
  featured: false;
  signup_url: null;
  starts_at: string;
  ends_at: string;
  status: "scheduled";
};

export function buildSeriesInstances(
  series: Pick<
    EventSeriesRow,
    | "id"
    | "title"
    | "description"
    | "location"
    | "recurrence_weekdays"
    | "start_time"
    | "end_time"
  >,
  weeksAhead: number,
  existingStartsAt: Set<string> = new Set(),
  now = new Date(),
  startYmd?: string,
): GeneratedEventInstance[] {
  const weekdaySet = new Set(series.recurrence_weekdays);
  const rangeStart = startYmd ?? todayYmdInPhoenix(now);
  const endYmd = addDaysYmd(rangeStart, weeksAhead * 7);
  const out: GeneratedEventInstance[] = [];

  let cursor = rangeStart;
  while (cursor <= endYmd) {
    const probe = new Date(`${cursor}T12:00:00-07:00`);
    const isoWeekday = jsDateToIsoWeekday(probe);

    if (weekdaySet.has(isoWeekday)) {
      const { startsAt, endsAt } = phoenixLocalToUtc(
        cursor,
        series.start_time,
        series.end_time,
      );
      const startsAtIso = startsAt.toISOString();
      if (!existingStartsAt.has(startsAtIso)) {
        out.push({
          series_id: series.id,
          title: series.title,
          description: series.description,
          location: series.location,
          kind: "workshop",
          featured: false,
          signup_url: null,
          starts_at: startsAtIso,
          ends_at: endsAt.toISOString(),
          status: "scheduled",
        });
      }
    }

    cursor = addDaysYmd(cursor, 1);
  }

  return out;
}
