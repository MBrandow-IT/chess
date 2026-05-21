import { describe, expect, it } from "vitest";
import {
  studentMovesFromSolution,
  validateBestMoveAnswer,
} from "./quiz-answer";

describe("studentMovesFromSolution", () => {
  it("returns even-index moves", () => {
    expect(studentMovesFromSolution(["Nxe5", "Qd4", "Nxf7"])).toEqual([
      "Nxe5",
      "Nxf7",
    ]);
  });
});

describe("validateBestMoveAnswer", () => {
  it("accepts single-move san payload", () => {
    expect(validateBestMoveAnswer(["exd5"], { san: "exd5" })).toBe(true);
  });

  it("accepts single-move student_moves payload", () => {
    expect(
      validateBestMoveAnswer(["exd5"], { student_moves: ["exd5"] }),
    ).toBe(true);
  });

  it("validates alternating multi-move lines", () => {
    expect(
      validateBestMoveAnswer(["Nxe5", "Qd4", "Nxf7"], {
        student_moves: ["Nxe5", "Nxf7"],
      }),
    ).toBe(true);
  });

  it("rejects wrong student move count", () => {
    expect(
      validateBestMoveAnswer(["Nxe5", "Qd4", "Nxf7"], {
        student_moves: ["Nxe5"],
      }),
    ).toBe(false);
  });
});
