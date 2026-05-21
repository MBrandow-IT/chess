import { describe, expect, it } from "vitest";
import { buildSeriesInstances } from "./generate-instances";
import { getLessonVisibility } from "./visibility";

describe("buildSeriesInstances", () => {
  const series = {
    id: "series-1",
    title: "Library Workshop",
    description: "",
    location: "Buckeye Public Library",
    recurrence_weekdays: [1, 4],
    start_time: "16:00",
    end_time: "17:30",
  };

  it("generates Mon and Thu instances within the horizon", () => {
    const now = new Date("2026-06-01T12:00:00-07:00");
    const instances = buildSeriesInstances(series, 2, new Set(), now);
    expect(instances.length).toBeGreaterThan(0);
    expect(instances.every((row) => row.kind === "workshop")).toBe(true);
    expect(new Set(instances.map((row) => row.starts_at)).size).toBe(
      instances.length,
    );
  });

  it("skips existing starts_at values", () => {
    const now = new Date("2026-06-01T12:00:00-07:00");
    const first = buildSeriesInstances(series, 1, new Set(), now);
    const existing = new Set(first.map((row) => row.starts_at));
    const second = buildSeriesInstances(series, 1, existing, now);
    expect(second).toHaveLength(0);
  });
});

describe("getLessonVisibility", () => {
  it("returns live when no events are attached", () => {
    expect(getLessonVisibility([], new Date(), false)).toEqual({ status: "live" });
  });

  it("returns scheduled before two hours ahead of the attached event", () => {
    const eventStart = "2026-06-15T23:00:00Z";
    const now = new Date("2026-06-15T20:59:59Z");
    const result = getLessonVisibility(
      [
        {
          eventId: "e1",
          eventTitle: "Workshop A",
          startsAt: eventStart,
          status: "scheduled",
        },
      ],
      now,
      false,
    );
    expect(result.status).toBe("scheduled");
    expect(result.unlockAt).toBe("2026-06-15T21:00:00.000Z");
    expect(result.eventTitle).toBe("Workshop A");
  });

  it("returns live two hours before the event starts", () => {
    const eventStart = "2026-06-15T23:00:00Z";
    const now = new Date("2026-06-15T21:00:00Z");
    const result = getLessonVisibility(
      [
        {
          eventId: "e1",
          eventTitle: "Workshop A",
          startsAt: eventStart,
          status: "scheduled",
        },
      ],
      now,
      false,
    );
    expect(result.status).toBe("live");
  });

  it("returns live after the event starts", () => {
    const now = new Date("2026-06-16T12:00:00Z");
    const result = getLessonVisibility(
      [
        {
          eventId: "e1",
          eventTitle: "Workshop A",
          startsAt: "2026-06-15T23:00:00Z",
          status: "scheduled",
        },
      ],
      now,
      false,
    );
    expect(result.status).toBe("live");
  });

  it("admins always see live", () => {
    const now = new Date("2026-06-01T12:00:00Z");
    expect(
      getLessonVisibility(
        [
          {
            eventId: "e1",
            eventTitle: "Workshop A",
            startsAt: "2026-12-01T23:00:00Z",
            status: "scheduled",
          },
        ],
        now,
        true,
      ).status,
    ).toBe("live");
  });
});
