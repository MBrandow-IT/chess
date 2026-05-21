import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const EventSeriesSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().min(1).max(200).optional(),
  recurrenceWeekdays: z
    .array(z.number().int().min(1).max(7))
    .min(1, "Pick at least one weekday"),
  startTime: z.string().regex(timePattern, "Use HH:MM format"),
  endTime: z.string().regex(timePattern, "Use HH:MM format"),
  active: z.boolean().optional(),
});

export const GenerateInstancesSchema = z.object({
  weeksAhead: z.number().int().min(1).max(26).optional(),
});

export const OneOffEventSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(200).optional(),
  kind: z.enum(["workshop", "tournament", "other"]).optional(),
  featured: z.boolean().optional(),
  signupUrl: z.string().url().optional().nullable(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export const PatchEventSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(200).optional(),
  featured: z.boolean().optional(),
  signupUrl: z.string().url().nullable().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  status: z.enum(["scheduled", "canceled"]).optional(),
});

export const EventLessonsSchema = z.object({
  lessonIds: z.array(z.string().uuid()),
});

export type EventSeriesInput = z.infer<typeof EventSeriesSchema>;
export type OneOffEventInput = z.infer<typeof OneOffEventSchema>;
export type PatchEventInput = z.infer<typeof PatchEventSchema>;
