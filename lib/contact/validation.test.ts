import { describe, expect, it } from "vitest";
import { ContactSubmissionSchema } from "./validation";

describe("ContactSubmissionSchema", () => {
  const valid = {
    category: "advice" as const,
    name: "Alex Morgan",
    email: "alex@example.com",
    message: "Hello there.",
  };

  it("accepts a minimal valid payload", () => {
    const result = ContactSubmissionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects an empty message", () => {
    const result = ContactSubmissionSchema.safeParse({ ...valid, message: "  " });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = ContactSubmissionSchema.safeParse({
      ...valid,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("normalizes blank pageUrl to undefined", () => {
    const result = ContactSubmissionSchema.safeParse({ ...valid, pageUrl: "   " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pageUrl).toBeUndefined();
    }
  });

  it("rejects messages over 2000 characters", () => {
    const result = ContactSubmissionSchema.safeParse({
      ...valid,
      message: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});
