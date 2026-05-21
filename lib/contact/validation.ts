import { z } from "zod";

export const CONTACT_CATEGORIES = [
  "advice",
  "tutoring",
  "admin_access",
  "bug_report",
] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export const CONTACT_CATEGORY_LABELS: Record<ContactCategory, string> = {
  advice: "General advice or question",
  tutoring: "Chess tutoring request",
  admin_access: "Request admin access (host your own quizzes)",
  bug_report: "Report a bug",
};

export const ContactSubmissionSchema = z.object({
  category: z.enum(CONTACT_CATEGORIES),
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email address").max(254),
  message: z.string().trim().min(1, "Message is required").max(2000),
  pageUrl: z
    .string()
    .trim()
    .max(2048)
    .optional()
    .transform((value) => (value ? value : undefined)),
  company: z.string().optional(),
});

export type ContactSubmissionInput = z.infer<typeof ContactSubmissionSchema>;
