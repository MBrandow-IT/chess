export const WORKSHOP_PUBLIC_HORIZON_DAYS = 14;
export const DEFAULT_GENERATE_WEEKS_AHEAD = 4;
export const EVENT_TIMEZONE = "America/Phoenix";
/** Lessons unlock this many ms before the attached event starts. */
export const LESSON_EARLY_ACCESS_MS = 2 * 60 * 60 * 1000;

/** ISO weekday: Mon=1 … Sun=7 */
export const WEEKDAY_LABELS: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};
