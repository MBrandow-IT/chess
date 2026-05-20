import { describe, expect, it } from "vitest";
import { scoreAnswer } from "./scoring";

describe("scoreAnswer", () => {
  it("returns 0 when the answer is incorrect", () => {
    expect(
      scoreAnswer({
        basePoints: 100,
        elapsedMs: 0,
        wrongAttempts: 0,
        correct: false,
      }),
    ).toBe(0);
  });

  it("returns full base points at t=0 with no wrongs", () => {
    expect(
      scoreAnswer({
        basePoints: 100,
        elapsedMs: 0,
        wrongAttempts: 0,
        correct: true,
      }),
    ).toBe(100);
  });

  it("subtracts 1% of base per second", () => {
    expect(
      scoreAnswer({
        basePoints: 100,
        elapsedMs: 10_000,
        wrongAttempts: 0,
        correct: true,
      }),
    ).toBe(90);
  });

  it("halves remaining potential per wrong attempt", () => {
    expect(
      scoreAnswer({
        basePoints: 100,
        elapsedMs: 0,
        wrongAttempts: 1,
        correct: true,
      }),
    ).toBe(50);
    expect(
      scoreAnswer({
        basePoints: 100,
        elapsedMs: 0,
        wrongAttempts: 2,
        correct: true,
      }),
    ).toBe(25);
  });

  it("combines time decay and wrong attempts", () => {
    // base=100, 20s elapsed, 1 wrong: floor(100 * 0.8 * 0.5) = 40
    expect(
      scoreAnswer({
        basePoints: 100,
        elapsedMs: 20_000,
        wrongAttempts: 1,
        correct: true,
      }),
    ).toBe(40);
  });

  it("floors at 0 when elapsed > 100s", () => {
    expect(
      scoreAnswer({
        basePoints: 100,
        elapsedMs: 150_000,
        wrongAttempts: 0,
        correct: true,
      }),
    ).toBe(0);
  });

  it("respects optional time limit", () => {
    expect(
      scoreAnswer({
        basePoints: 100,
        elapsedMs: 31_000,
        wrongAttempts: 0,
        correct: true,
        timeLimitSeconds: 30,
      }),
    ).toBe(0);
  });

  // These cases must produce the SAME values as the Postgres submit_answer
  // function (floor(base * (1 - elapsedSec/100) * 0.5^wrongAttempts)). If you
  // change the SQL, mirror the change here.
  it("matches the server SQL formula across reference cases", () => {
    expect(
      scoreAnswer({
        basePoints: 100,
        elapsedMs: 33_000,
        wrongAttempts: 0,
        correct: true,
      }),
    ).toBe(67);
    expect(
      scoreAnswer({
        basePoints: 100,
        elapsedMs: 33_000,
        wrongAttempts: 1,
        correct: true,
      }),
    ).toBe(33);
    expect(
      scoreAnswer({
        basePoints: 200,
        elapsedMs: 50_000,
        wrongAttempts: 2,
        correct: true,
      }),
    ).toBe(25);
  });
});
