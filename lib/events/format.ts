import { EVENT_TIMEZONE } from "./constants";

export function jsDateToIsoWeekday(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

export function formatEventDateRange(
  startsAt: string,
  endsAt: string,
  timeZone = EVENT_TIMEZONE,
): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const dateFmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });
  return `${dateFmt.format(start)} · ${timeFmt.format(start)}–${timeFmt.format(end)}`;
}

export function formatEventDate(startsAt: string, timeZone = EVENT_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(startsAt));
}

/** Build UTC instants from a local calendar date + wall-clock times in Arizona. */
export function phoenixLocalToUtc(
  dateYmd: string,
  startTime: string,
  endTime: string,
): { startsAt: Date; endsAt: Date } {
  const normalize = (time: string) => (time.length === 5 ? `${time}:00` : time);
  return {
    startsAt: new Date(`${dateYmd}T${normalize(startTime)}-07:00`),
    endsAt: new Date(`${dateYmd}T${normalize(endTime)}-07:00`),
  };
}

export function addDaysYmd(dateYmd: string, days: number): string {
  const [y, m, d] = dateYmd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function todayYmdInPhoenix(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: EVENT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function ymdInPhoenixFromIso(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: EVENT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}
